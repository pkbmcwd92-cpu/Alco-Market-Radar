import { AdObservation, CtaType, FormatType, ObservationProvenance, ObservationSource, VerificationLevel } from '../../types/radar';
import { ProviderRawAd, RawAdRecord } from '../../types/provider';

/**
 * Normalization Service
 * Converts raw provider payloads into standardized internal AdObservation domain models.
 * 
 * CRITICAL EPISTEMIC RULE:
 * Never convert missing performance data (spend, ROAS, targeting, conversions) into synthetic numbers or 0.
 * They must remain undefined/null.
 */
export function normalizeRawAd(
  rawAd: ProviderRawAd | RawAdRecord | Record<string, any>,
  workspaceId: string,
  competitorIdOverride?: string
): AdObservation {
  const payload = (rawAd.rawPayload ? { ...rawAd, ...(rawAd.rawPayload as Record<string, any>) } : (rawAd as Record<string, any>));
  const nowIso = new Date().toISOString();

  // 1. External identity & IDs
  const externalAdId = String(
    rawAd.externalId || 
    payload.externalAdId || 
    payload.adArchiveID || 
    payload.id || 
    payload.adId || 
    `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  const competitorId = competitorIdOverride || payload.competitorId || `comp_${slugify(rawAd.advertiserName || rawAd.page_name || payload.page_name || 'unknown')}`;
  const advertiserName = sanitizeText(rawAd.advertiserName || rawAd.page_name || payload.advertiserName || payload.pageName || payload.page_name || 'Competitor');
  const pageName = sanitizeText(payload.pageName || payload.page_name || rawAd.page_name || advertiserName);

  // 2. Dates
  const firstSeen = normalizeIsoDate(payload.firstSeen || payload.ad_delivery_start_time || payload.startDate || rawAd.fetchedAt);
  const lastSeen = normalizeIsoDate(payload.lastSeen || payload.ad_delivery_stop_time || payload.endDate || rawAd.fetchedAt);
  const detectedAt = normalizeIsoDate(payload.detectedAt || rawAd.fetchedAt);

  // Compute observed days
  const startMs = new Date(firstSeen).getTime();
  const lastMs = new Date(lastSeen).getTime();
  const diffDays = Math.max(1, Math.round((lastMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
  const observedDays = payload.observedDays ? Number(payload.observedDays) : diffDays;

  // 3. Status
  const rawStatus = String(payload.adStatus || payload.status || payload.activeStatus || 'active').toLowerCase();
  let adStatus: 'active' | 'inactive' | 'unknown' = 'active';
  if (rawStatus.includes('inact') || rawStatus === 'false' || rawStatus === '0' || rawStatus === 'stopped') {
    adStatus = 'inactive';
  } else if (rawStatus.includes('unk') || rawStatus === 'null') {
    adStatus = 'unknown';
  }

  // 4. Format
  const format = normalizeFormat(payload.format || payload.ad_format || payload.mediaType || payload.media_type || rawAd.media_type);

  // 5. Text content (sanitized for display, treated as untrusted data)
  const rawBody = payload.primaryText || 
    payload.body || 
    payload.ad_creative_body || 
    (Array.isArray(payload.ad_creative_bodies) ? payload.ad_creative_bodies[0] : '') || 
    payload.text || 
    '';
  const primaryText = sanitizeText(rawBody);

  const rawHeadline = payload.headline || 
    payload.title || 
    payload.ad_creative_link_title || 
    (Array.isArray(payload.ad_creative_link_titles) ? payload.ad_creative_link_titles[0] : '') || 
    '';
  const headline = sanitizeText(rawHeadline);
  const description = payload.description ? sanitizeText(payload.description) : null;

  // 6. CTA
  const CTA = normalizeCta(payload.CTA || payload.cta || payload.cta_type || payload.call_to_action || payload.callToAction);

  // 7. URLs and Media
  const rawDest = payload.destinationUrl || 
    payload.link_url || 
    payload.targetUrl || 
    payload.website || 
    (Array.isArray(payload.ad_creative_link_captions) ? payload.ad_creative_link_captions[0] : '') || 
    '';
  const destinationUrl = sanitizeUrl(rawDest);
  const mediaUrl = sanitizeUrl(
    payload.mediaUrl || 
    payload.imageUrl || 
    payload.videoUrl || 
    payload.ad_creative_thumbnail_url || 
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
  );
  const thumbnailUrl = sanitizeUrl(payload.thumbnailUrl || payload.thumbUrl || mediaUrl);

  // 8. Provenance
  const providerId = rawAd.providerId || 'external_provider';
  const source: ObservationSource = (rawAd.verificationLevel === 'SYNTHETIC') 
    ? 'SYNTHETIC_DEMO' 
    : (providerId.includes('manual') ? 'MANUAL_IMPORT' : 'EXTERNAL_PROVIDER');

  const provenance: ObservationProvenance = {
    source,
    providerId,
    externalId: externalAdId,
    sourceUrl: rawAd.sourceUrl || destinationUrl,
    fetchedAt: rawAd.fetchedAt || nowIso,
    importedAt: nowIso,
    verificationLevel: rawAd.verificationLevel || (providerId.includes('direct') ? 'DIRECT_PUBLIC' : 'PROVIDER_REPORTED'),
  };

  const id = `ad_${slugify(providerId)}_${slugify(externalAdId)}`;
  const creativeId = `cr_${slugify(externalAdId)}`;

  return {
    id,
    workspaceId,
    competitorId,
    externalAdId,
    platform: 'meta',
    advertiserName,
    pageName,
    adStatus,
    firstSeen,
    lastSeen,
    detectedAt,
    format,
    primaryText,
    headline,
    description,
    CTA,
    destinationUrl,
    landingPageId: payload.landingPageId || null,
    mediaUrl,
    thumbnailUrl,
    creativeId,
    observationSource: source,
    provenance,
    rawSourceMetadata: {
      providerId: rawAd.providerId,
      fetchedAt: rawAd.fetchedAt,
      rawKeys: Object.keys(payload),
    },
    observedDays,
  };
}

export function normalizeIsoDate(dateVal?: any): string {
  if (!dateVal) return new Date().toISOString();
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // fallback
  }
  return new Date().toISOString();
}

export function normalizeFormat(rawFormat?: any): FormatType {
  if (!rawFormat) return 'static image';
  const str = String(rawFormat).toLowerCase().trim();
  if (str.includes('video') || str === 'reels' || str === 'mp4') return 'video';
  if (str.includes('carousel') || str.includes('slideshow')) return 'carousel';
  if (str.includes('collection') || str.includes('catalog')) return 'collection';
  if (str.includes('image') || str.includes('photo') || str.includes('banner') || str.includes('static')) return 'static image';
  return 'other';
}

export function normalizeCta(rawCta?: any): CtaType {
  if (!rawCta) return 'learn more';
  const str = String(rawCta).toLowerCase().trim().replace(/_/g, ' ');
  if (str.includes('shop') || str.includes('beli') || str.includes('order')) return 'shop now';
  if (str.includes('sign') || str.includes('daftar')) return 'sign up';
  if (str.includes('contact') || str.includes('hubungi') || str.includes('wa') || str.includes('whatsapp')) return 'contact';
  if (str.includes('offer') || str.includes('promo') || str.includes('diskon')) return 'get offer';
  if (str.includes('learn') || str.includes('pelajari') || str.includes('detail') || str.includes('lihat')) return 'learn more';
  return 'learn more';
}

export function sanitizeText(text: any): string {
  if (typeof text !== 'string') {
    if (text === null || text === undefined) return '';
    return String(text);
  }
  // Trim and remove any control characters
  return text.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '').trim();
}

export function sanitizeUrl(url: any): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (trimmed.startsWith('www.')) {
    trimmed = `https://${trimmed}`;
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const trackingParams = [
      'fbclid', 'gclid', 'ttclid', 'dclid', 'msclkid',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
      '_ga', '_gl'
    ];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 30) || 'item';
}
