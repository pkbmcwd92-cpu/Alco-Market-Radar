/**
 * Server-Side External Provider Service
 * 
 * Centralizes all external HTTP communication, authentication, error mapping,
 * and verification diagnostics for Apify and Meta Ads Library public scrapers.
 * 
 * Keeps all API tokens securely on the server-side.
 */

export interface ExternalProviderConfig {
  apiToken?: string;
  actorId?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface VerificationDiagnostic {
  verified: boolean;
  status: 'READY' | 'NOT_CONFIGURED' | 'DEGRADED' | 'UNAVAILABLE';
  latencyMs: number;
  actorId: string;
  tokenConfigured: boolean;
  message: string;
  sampleItemCount: number;
  sampleItemPreview?: {
    id?: string;
    pageName?: string;
    headline?: string;
    fetchedAt?: string;
  };
  details?: Record<string, unknown>;
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
      const errorBody = await response.text().catch(() => '');
      const err: any = new Error(mapHttpErrorToIndonesian(response.status, errorBody, config.actorId));
      err.status = response.status;
      err.code = response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' : 'PROVIDER_ERROR';
      err.details = errorBody.substring(0, 400);
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
      timeoutErr.code = 'TIMEOUT';
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
 * Runs a canary verification check on the external provider connection
 */
export async function verifyExternalProvider(
  customConfig?: ExternalProviderConfig
): Promise<VerificationDiagnostic> {
  const config = { ...getProviderConfig(), ...customConfig };
  const startTime = Date.now();

  if (!config.apiToken) {
    return {
      verified: false,
      status: 'NOT_CONFIGURED',
      latencyMs: 0,
      actorId: config.actorId,
      tokenConfigured: false,
      message: 'Token API belum dikonfigurasi. Atur variabel EXTERNAL_PROVIDER_API_TOKEN di Secrets/Environment untuk menghubungkan scraper publik.',
      sampleItemCount: 0,
      details: {
        actorId: config.actorId,
        baseUrl: config.baseUrl,
        instruction: 'Buka panel Settings atau .env untuk mengatur token Apify / Meta Ads scraper.',
      },
    };
  }

  try {
    // Canary run with limit 1
    const result = await searchExternalAds(
      {
        keyword: 'skincare',
        country: 'ID',
        limit: 1,
      },
      config
    );

    const latencyMs = Date.now() - startTime;
    const sampleItem = result.items[0];

    return {
      verified: true,
      status: 'READY',
      latencyMs,
      actorId: config.actorId,
      tokenConfigured: true,
      message: `Provider eksternal berhasil diverifikasi (${latencyMs}ms). Jalur ingesti siap menerima observasi publik nyata.`,
      sampleItemCount: result.totalFound,
      sampleItemPreview: sampleItem
        ? {
            id: sampleItem.id || sampleItem.adArchiveID || sampleItem.externalId || 'sample_ad_id',
            pageName: sampleItem.page_name || sampleItem.pageName || sampleItem.advertiserName || 'Sample Advertiser',
            headline: sampleItem.ad_creative_link_titles?.[0] || sampleItem.headline || sampleItem.title || 'Sample Creative',
            fetchedAt: result.fetchedAt,
          }
        : undefined,
      details: {
        actorId: config.actorId,
        baseUrl: config.baseUrl,
        latencyMs,
        fetchedAt: result.fetchedAt,
      },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const isUnauthorized = err.status === 401 || err.status === 403;
    const isDegraded = err.status === 429 || err.code === 'TIMEOUT';

    return {
      verified: false,
      status: isUnauthorized ? 'NOT_CONFIGURED' : isDegraded ? 'DEGRADED' : 'UNAVAILABLE',
      latencyMs,
      actorId: config.actorId,
      tokenConfigured: true,
      message: err.message || 'Verifikasi provider eksternal gagal dilakukan.',
      sampleItemCount: 0,
      details: {
        errorCode: err.code,
        httpStatus: err.status,
        errorDetails: err.details,
      },
    };
  }
}

/**
 * Translates HTTP status and error codes into clear Indonesian explanations
 */
function mapHttpErrorToIndonesian(status: number, body: string, actorId: string): string {
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
  return `Provider eksternal merespons dengan kesalahan (HTTP ${status}): ${body.substring(0, 150)}`;
}
