import { AdObservation } from '../../types/radar';
import { IngestionError } from '../../types/provider';

export interface ValidationResult {
  valid: boolean;
  errors: IngestionError[];
}

export function validateObservation(ad: AdObservation, index?: number): ValidationResult {
  const errors: IngestionError[] = [];

  // 1. Workspace ID
  if (!ad.workspaceId || typeof ad.workspaceId !== 'string' || ad.workspaceId.trim().length === 0) {
    errors.push({
      index,
      externalId: ad.externalAdId,
      field: 'workspaceId',
      code: 'INVALID_WORKSPACE',
      message: 'Workspace ID wajib diisi untuk mengaitkan observasi.',
    });
  }

  // 2. Advertiser Name
  if (!ad.advertiserName || typeof ad.advertiserName !== 'string' || ad.advertiserName.trim().length === 0) {
    errors.push({
      index,
      externalId: ad.externalAdId,
      field: 'advertiserName',
      code: 'INVALID_ADVERTISER',
      message: 'Nama advertiser atau brand kompetitor wajib ada.',
    });
  }

  // 3. Timestamps
  if (!ad.firstSeen || isNaN(new Date(ad.firstSeen).getTime())) {
    errors.push({
      index,
      externalId: ad.externalAdId,
      field: 'firstSeen',
      code: 'INVALID_DATE',
      message: 'Format timestamp firstSeen tidak valid.',
    });
  }

  // 4. URL Safety check (prevent javascript: or data: exploit schemes)
  if (ad.destinationUrl) {
    const lowerUrl = ad.destinationUrl.toLowerCase();
    if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:text/html') || lowerUrl.startsWith('vbscript:')) {
      errors.push({
        index,
        externalId: ad.externalAdId,
        field: 'destinationUrl',
        code: 'MALFORMED_ROW',
        message: 'Skema URL tujuan tidak aman atau berpotensi membahayakan.',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateBatchObservations(
  ads: AdObservation[]
): {
  accepted: AdObservation[];
  rejected: { ad: AdObservation; errors: IngestionError[] }[];
  allErrors: IngestionError[];
} {
  const accepted: AdObservation[] = [];
  const rejected: { ad: AdObservation; errors: IngestionError[] }[] = [];
  const allErrors: IngestionError[] = [];

  ads.forEach((ad, idx) => {
    const res = validateObservation(ad, idx);
    if (res.valid) {
      accepted.push(ad);
    } else {
      rejected.push({ ad, errors: res.errors });
      allErrors.push(...res.errors);
    }
  });

  return { accepted, rejected, allErrors };
}
