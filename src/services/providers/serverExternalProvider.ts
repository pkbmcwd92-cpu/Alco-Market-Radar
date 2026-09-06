import { ProviderVerificationResult, VerificationStatus, ProviderErrorCode } from '../../types/provider';
import { normalizeRawAd } from '../ingestion/normalizationService';
import { validateObservation } from '../ingestion/validationService';
import { AdObservation } from '../../types/radar';

/**
 * Server-Side External Provider Service (V1.2.1a)
 * 
 * Centralizes all external HTTP communication, authentication, error mapping,
 * and verification diagnostics for Apify and Meta Ads Library public scrapers.
 * 
 * Implements strict verification integrity:
 * verified = reachable && authenticated && rawItemsReceived > 0 && normalizedItems > 0 && validItems > 0
 * 
 * Keeps all API tokens securely on the server-side without leaking secrets.
 */

export interface ExternalProviderConfig {
  apiToken?: string;
  actorId?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface ExternalFetchResult {
  success: boolean;
  items: any[];
  totalFound: number;
  fetchedAt: string;
  actorId: string;
  latencyMs: number;
  warning?: string;
}

const DEFAULT_ACTOR_ID = 'curious_coder~facebook-ads-library-scraper';
const DEFAULT_BASE_URL = 'https://api.apify.com/v2';
const DEFAULT_TIMEOUT_MS = 25000;

export function getProviderConfig(): ExternalProviderConfig {
  const apiToken = process.env.EXTERNAL_PROVIDER_API_TOKEN || process.env.APIFY_API_TOKEN || '';
  const actorId = process.env.EXTERNAL_PROVIDER_ACTOR_ID || process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR_ID;
  const baseUrl = process.env.EXTERNAL_PROVIDER_BASE_URL || DEFAULT_BASE_URL;

  return {
    apiToken,
    actorId,
    baseUrl,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Executes a verified external search against compliant public ad aggregators (Apify Actor)
 */
export async function searchExternalAds(
  params: {
    advertiserName?: string;
    keyword?: string;
    country?: string;
    limit?: number;
    activeStatus?: string;
  },
  customConfig?: ExternalProviderConfig
): Promise<ExternalFetchResult> {
  const config = { ...getProviderConfig(), ...customConfig };
  const startTime = Date.now();
  const fetchedAt = new Date().toISOString();

  if (!config.apiToken) {
    const err: any = new Error('Token API provider eksternal belum dikonfigurasi pada environment server (EXTERNAL_PROVIDER_API_TOKEN).');
    err.code = 'NOT_CONFIGURED';
    err.status = 401;
    throw err;
  }

  const queryTerms = params.keyword 
    ? [params.keyword] 
    : params.advertiserName 
    ? [params.advertiserName] 
    : ['skincare'];

  const inputPayload = {
    searchTerms: queryTerms,
    country: params.country || 'ID',
    adStatus: params.activeStatus || 'ACTIVE',
    maxItems: Math.min(params.limit || 20, 50),
  };

  const endpoint = `${config.baseUrl}/acts/${config.actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(config.apiToken)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(inputPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const err: any = new Error(mapHttpErrorToIndonesian(response.status, config.actorId));
      err.status = response.status;
      err.code = response.status === 401 || response.status === 403 
        ? 'INVALID_CREDENTIALS' 
        : response.status === 429 
        ? 'RATE_LIMITED' 
        : 'PROVIDER_UNAVAILABLE';
      throw err;
    }

    const items = await response.json();
    const rawList = Array.isArray(items) ? items : [];

    return {
      success: true,
      items: rawList,
      totalFound: rawList.length,
      fetchedAt,
      actorId: config.actorId,
      latencyMs,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (err.name === 'AbortError') {
      const timeoutErr: any = new Error(`Permintaan ke provider eksternal melebihi batas waktu (${config.timeoutMs}ms).`);
      timeoutErr.code = 'PROVIDER_TIMEOUT';
      timeoutErr.status = 504;
      timeoutErr.latencyMs = latencyMs;
      throw timeoutErr;
    }

    if (!err.status) {
      err.code = 'NETWORK_ERROR';
      err.status = 502;
    }
    err.latencyMs = latencyMs;
    throw err;
  }
}

/**
 * Runs a rigorous canary verification check on the external provider connection (V1.2.1a)
 * 
 * Follows the strict standard:
 * API Reachable -> Authentication Valid -> Real Records Received -> Normalized by Radar -> Validated by Radar -> VERIFIED
 */
export async function verifyExternalProvider(
  customConfig?: ExternalProviderConfig
): Promise<ProviderVerificationResult> {
  const config = { ...getProviderConfig(), ...customConfig };
  const startTime = Date.now();
  const checkedAt = new Date().toISOString();
  const isActorConfigured = Boolean(process.env.EXTERNAL_PROVIDER_ACTOR_ID);

  if (!config.apiToken) {
    return {
      providerId: 'external_market_provider',
      verified: false,
      status: 'NOT_CONFIGURED',
      checkedAt,
      latencyMs: 0,
      reachable: false,
      authenticated: false,
      rawItemsReceived: 0,
      normalizedItems: 0,
      validItems: 0,
      rejectedItems: 0,
      actorId: config.actorId,
      isActorConfigured,
      tokenConfigured: false,
      message: 'Token API provider eksternal belum dikonfigurasi (EXTERNAL_PROVIDER_API_TOKEN). Atur token pada Secrets / .env untuk menghubungkan scraper publik.',
      warnings: ['Token API belum dikonfigurasi.'],
      errors: ['NOT_CONFIGURED: EXTERNAL_PROVIDER_API_TOKEN is missing'],
    };
  }

  const verifyQuery = process.env.PROVIDER_VERIFY_QUERY || 'skincare';
  const verifyCountry = process.env.PROVIDER_VERIFY_COUNTRY || 'ID';

  try {
    // Canary run with limit 3 (bounded test)
    const result = await searchExternalAds(
      {
        keyword: verifyQuery,
        country: verifyCountry,
        limit: 3,
      },
      config
    );

    const latencyMs = Date.now() - startTime;
    const rawItems = result.items || [];
    const rawItemsReceived = rawItems.length;

    // Condition 1: Empty response check
    if (rawItemsReceived === 0) {
      return {
        providerId: 'external_market_provider',
        verified: false,
        status: 'UNVERIFIED',
        checkedAt,
        latencyMs,
        reachable: true,
        authenticated: true,
        rawItemsReceived: 0,
        normalizedItems: 0,
        validItems: 0,
        rejectedItems: 0,
        actorId: config.actorId,
        isActorConfigured,
        tokenConfigured: true,
        message: 'Provider dapat dihubungi, tetapi belum ada record yang dapat digunakan untuk memverifikasi jalur data.',
        warnings: ['Provider mengembalikan 0 record iklan publik untuk kueri verifikasi canary.'],
        errors: [],
      };
    }

    // Condition 2: Run EXISTING Normalization Pipeline (diagnostic probe, non-persisted)
    const normalizedList: AdObservation[] = [];
    for (const rawItem of rawItems) {
      try {
        const norm = normalizeRawAd(rawItem, 'verification_probe_workspace');
        if (norm && norm.externalAdId && norm.advertiserName) {
          normalizedList.push(norm);
        }
      } catch {
        // Record failed normalization
      }
    }
    const normalizedItems = normalizedList.length;

    if (normalizedItems === 0) {
      return {
        providerId: 'external_market_provider',
        verified: false,
        status: 'FAILED_VERIFICATION',
        checkedAt,
        latencyMs,
        reachable: true,
        authenticated: true,
        rawItemsReceived,
        normalizedItems: 0,
        validItems: 0,
        rejectedItems: rawItemsReceived,
        actorId: config.actorId,
        isActorConfigured,
        tokenConfigured: true,
        message: 'Provider merespons, tetapi struktur data tidak sesuai dengan format yang dapat diproses Radar.',
        warnings: [],
        errors: ['PROVIDER_SCHEMA_CHANGED: Gagal menormalisasi raw payload menjadi domain model AdObservation'],
      };
    }

    // Condition 3: Run EXISTING Validation Pipeline
    const validList: AdObservation[] = [];
    const validationErrors: string[] = [];
    for (const normAd of normalizedList) {
      const vRes = validateObservation(normAd);
      if (vRes.valid) {
        validList.push(normAd);
      } else {
        vRes.errors.forEach(e => validationErrors.push(`${e.field}: ${e.message}`));
      }
    }
    const validItems = validList.length;
    const rejectedItems = rawItemsReceived - validItems;

    if (validItems === 0) {
      return {
        providerId: 'external_market_provider',
        verified: false,
        status: 'FAILED_VERIFICATION',
        checkedAt,
        latencyMs,
        reachable: true,
        authenticated: true,
        rawItemsReceived,
        normalizedItems,
        validItems: 0,
        rejectedItems,
        actorId: config.actorId,
        isActorConfigured,
        tokenConfigured: true,
        message: 'Data provider berhasil dinormalisasi, tetapi belum ada record yang lolos validasi.',
        warnings: [],
        errors: validationErrors.length > 0 
          ? validationErrors.slice(0, 5) 
          : ['VALIDATION_FAILED: Record gagal memenuhi syarat integritas domain Radar'],
      };
    }

    // Condition 4: All criteria met -> VERIFIED
    const firstValid = validList[0];
    return {
      providerId: 'external_market_provider',
      verified: true,
      status: 'VERIFIED',
      checkedAt,
      latencyMs,
      reachable: true,
      authenticated: true,
      rawItemsReceived,
      normalizedItems,
      validItems,
      rejectedItems,
      actorId: config.actorId,
      isActorConfigured,
      tokenConfigured: true,
      message: `Provider telah berhasil melewati jalur verifikasi data Radar (${validItems} record valid, latensi ${latencyMs}ms).`,
      warnings: rejectedItems > 0 ? [`${rejectedItems} record diabaikan selama proses validasi.`] : [],
      errors: [],
      sample: {
        externalAdId: firstValid.externalAdId || undefined,
        advertiserName: firstValid.advertiserName || undefined,
        headline: firstValid.headline || undefined,
        format: firstValid.format || undefined,
        observedAt: firstValid.detectedAt || firstValid.firstSeen || undefined,
      },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const isAuth = err.status === 401 || err.status === 403 || err.code === 'INVALID_CREDENTIALS';
    const isTimeout = err.status === 504 || err.code === 'PROVIDER_TIMEOUT' || err.code === 'TIMEOUT';
    const isNetwork = err.code === 'NETWORK_ERROR' || err.status === 502 || (!err.status && !isTimeout);

    if (isAuth) {
      return {
        providerId: 'external_market_provider',
        verified: false,
        status: 'FAILED_VERIFICATION',
        checkedAt,
        latencyMs,
        reachable: true,
        authenticated: false,
        rawItemsReceived: 0,
        normalizedItems: 0,
        validItems: 0,
        rejectedItems: 0,
        actorId: config.actorId,
        isActorConfigured,
        tokenConfigured: true,
        message: 'Provider dapat dihubungi, tetapi autentikasi gagal. Periksa token API.',
        warnings: [],
        errors: ['INVALID_CREDENTIALS: Token API eksternal ditolak oleh provider.'],
      };
    }

    if (isTimeout) {
      return {
        providerId: 'external_market_provider',
        verified: false,
        status: 'DEGRADED',
        checkedAt,
        latencyMs,
        reachable: false,
        authenticated: false,
        rawItemsReceived: 0,
        normalizedItems: 0,
        validItems: 0,
        rejectedItems: 0,
        actorId: config.actorId,
        isActorConfigured,
        tokenConfigured: true,
        message: 'Provider tidak merespons dalam batas waktu yang ditentukan.',
        warnings: ['PROVIDER_TIMEOUT: Koneksi ke server provider melebihi batas waktu (timeout).'],
        errors: ['PROVIDER_TIMEOUT'],
      };
    }

    if (isNetwork) {
      return {
        providerId: 'external_market_provider',
        verified: false,
        status: 'FAILED_VERIFICATION',
        checkedAt,
        latencyMs,
        reachable: false,
        authenticated: false,
        rawItemsReceived: 0,
        normalizedItems: 0,
        validItems: 0,
        rejectedItems: 0,
        actorId: config.actorId,
        isActorConfigured,
        tokenConfigured: true,
        message: 'Provider tidak dapat dihubungi.',
        warnings: [],
        errors: ['NETWORK_ERROR: Gagal menghubungi gateway provider eksternal.'],
      };
    }

    return {
      providerId: 'external_market_provider',
      verified: false,
      status: 'FAILED_VERIFICATION',
      checkedAt,
      latencyMs,
      reachable: false,
      authenticated: false,
      rawItemsReceived: 0,
      normalizedItems: 0,
      validItems: 0,
      rejectedItems: 0,
      actorId: config.actorId,
      isActorConfigured,
      tokenConfigured: true,
      message: err.message || 'Verifikasi provider eksternal gagal dilakukan.',
      warnings: [],
      errors: [err.code || 'UNKNOWN'],
    };
  }
}

/**
 * Translates HTTP status and error codes into clear Indonesian explanations
 * Sanitized to never expose raw response bodies, URL tokens, or sensitive data.
 */
function mapHttpErrorToIndonesian(status: number, actorId: string): string {
  if (status === 401) {
    return 'Token API eksternal tidak valid atau telah kedaluwarsa. Silakan periksa kembali EXTERNAL_PROVIDER_API_TOKEN.';
  }
  if (status === 403) {
    return 'Akses ditolak oleh provider. Token mungkin tidak memiliki izin untuk menjalankan actor scraper ini.';
  }
  if (status === 404) {
    return `Actor provider "${actorId}" tidak ditemukan pada repositori Apify. Periksa EXTERNAL_PROVIDER_ACTOR_ID.`;
  }
  if (status === 429) {
    return 'Batas kuota / rate limit provider eksternal tercapai. Silakan coba kembali dalam beberapa menit.';
  }
  if (status >= 500) {
    return `Server provider eksternal mengalami kendala internal (HTTP ${status}). Silakan coba beberapa saat lagi.`;
  }
  return `Provider eksternal merespons dengan kesalahan status HTTP ${status}.`;
}

