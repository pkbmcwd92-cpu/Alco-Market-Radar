import { AdObservation, ObservationSnapshot } from '../../types/radar';
import { ObservationRepository } from '../storage/observationRepository';

/**
 * Computes a deterministic content fingerprint string.
 * Used for Level 3 identity matching when external IDs are absent or inconsistent.
 */
export function generateAdFingerprint(ad: Partial<AdObservation>): string {
  const normAdv = (ad.advertiserName || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normHeadline = (ad.headline || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normPrimary = (ad.primaryText || '').toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 150);
  const normFormat = (ad.format || 'static image').toLowerCase();
  const normUrl = (ad.destinationUrl || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Simple deterministic hash
  const rawKey = `${normAdv}|${normHeadline}|${normPrimary}|${normFormat}|${normUrl}`;
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    const char = rawKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

export interface DeduplicationResult {
  createdAds: AdObservation[];
  updatedAds: AdObservation[];
  snapshotsToSave: ObservationSnapshot[];
  duplicateCount: number;
}

/**
 * Deduplicates and matches incoming observations against the existing Market Memory repository.
 * 
 * Rules:
 * Level 1: provider + externalAdId
 * Level 2: advertiserId + creativeId
 * Level 3: content fingerprint
 * 
 * If matched:
 * - Update existing logical ad (update lastSeen, observedDays, activeStatus).
 * - Generate a new ObservationSnapshot (tracks state over time).
 * 
 * If new:
 * - Create new AdObservation with fingerprint.
 * - Generate initial ObservationSnapshot.
 */
export async function deduplicateAndPrepareStorage(
  incomingAds: AdObservation[],
  repository: ObservationRepository
): Promise<DeduplicationResult> {
  const createdAds: AdObservation[] = [];
  const updatedAds: AdObservation[] = [];
  const snapshotsToSave: ObservationSnapshot[] = [];
  let duplicateCount = 0;

  for (const ad of incomingAds) {
    const fingerprint = generateAdFingerprint(ad);
    ad.fingerprint = fingerprint;

    let existingAd: AdObservation | null = null;

    // 1. Level 1 check: Provider + External ID
    if (ad.externalAdId) {
      const providerKey = ad.provenance?.providerId || ad.observationSource;
      existingAd = await repository.findByExternalIdentity(providerKey, ad.externalAdId);
    }

    // 2. Level 3 check: Content Fingerprint (only match within same workspace & same advertiser)
    if (!existingAd && fingerprint) {
      const fpMatch = await repository.findByFingerprint(fingerprint);
      if (
        fpMatch &&
        fpMatch.workspaceId === ad.workspaceId &&
        fpMatch.advertiserName.toLowerCase() === ad.advertiserName.toLowerCase()
      ) {
        existingAd = fpMatch;
      }
    }

    const nowIso = new Date().toISOString();

    if (existingAd) {
      duplicateCount++;

      // Update existing AdObservation
      const updatedFirstSeen = existingAd.firstSeen || ad.firstSeen;
      const updatedLastSeen = ad.lastSeen || nowIso;
      const startMs = new Date(updatedFirstSeen).getTime();
      const lastMs = new Date(updatedLastSeen).getTime();
      const observedDays = Math.max(existingAd.observedDays || 1, Math.round((lastMs - startMs) / (1000 * 60 * 60 * 24)) + 1);

      const mergedAd: AdObservation = {
        ...existingAd,
        lastSeen: updatedLastSeen,
        adStatus: ad.adStatus || existingAd.adStatus,
        observedDays,
        // Preserve or update rich fields if new observation has more details
        headline: ad.headline || existingAd.headline,
        primaryText: ad.primaryText || existingAd.primaryText,
        CTA: ad.CTA !== 'unknown' ? ad.CTA : existingAd.CTA,
        format: ad.format !== 'unknown' ? ad.format : existingAd.format,
        mediaUrl: ad.mediaUrl || existingAd.mediaUrl,
        thumbnailUrl: ad.thumbnailUrl || existingAd.thumbnailUrl,
        rawSourceMetadata: {
          ...existingAd.rawSourceMetadata,
          lastSyncMetadata: ad.rawSourceMetadata,
          syncCount: ((existingAd.rawSourceMetadata?.syncCount as number) || 1) + 1,
        },
      };

      updatedAds.push(mergedAd);

      // Create new observation snapshot representing this point in time
      const snapshot: ObservationSnapshot = {
        id: `snap_${existingAd.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        workspaceId: existingAd.workspaceId,
        entityType: 'AD',
        entityId: existingAd.id,
        observedAt: nowIso,
        status: mergedAd.adStatus,
        format: mergedAd.format,
        active: mergedAd.adStatus === 'active',
        headline: mergedAd.headline,
        metadata: {
          source: ad.observationSource,
          verificationLevel: ad.provenance?.verificationLevel,
          observedDays: mergedAd.observedDays,
        },
      };
      snapshotsToSave.push(snapshot);
    } else {
      // New logical advertisement
      createdAds.push(ad);

      const snapshot: ObservationSnapshot = {
        id: `snap_${ad.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        workspaceId: ad.workspaceId,
        entityType: 'AD',
        entityId: ad.id,
        observedAt: ad.detectedAt || nowIso,
        status: ad.adStatus,
        format: ad.format,
        active: ad.adStatus === 'active',
        headline: ad.headline,
        metadata: {
          source: ad.observationSource,
          verificationLevel: ad.provenance?.verificationLevel,
          isNewCreative: true,
          observedDays: ad.observedDays,
        },
      };
      snapshotsToSave.push(snapshot);
    }
  }

  return {
    createdAds,
    updatedAds,
    snapshotsToSave,
    duplicateCount,
  };
}
