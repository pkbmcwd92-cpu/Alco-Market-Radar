import {
  MarketDataProvider,
  MarketSearchInput,
  ProviderCapabilities,
  ProviderHealthStatus,
  ProviderRawAd,
  ProviderSearchResult,
  ProviderVerificationResult,
} from '../../types/provider';

/**
 * ExternalProviderAdapter
 * Communicates with compliant external public data providers (such as Apify Meta Ads Library Actor or public endpoints)
 * via secure server-side proxy to protect API credentials.
 */
export class ExternalProviderAdapter implements MarketDataProvider {
  id = 'external_market_provider';
  name = 'External Provider (Meta Ads Library)';
  sourceType = 'EXTERNAL_PROVIDER' as const;

  capabilities(): ProviderCapabilities {
    return {
      searchByAdvertiser: true,
      searchByKeyword: true,
      searchByCountry: true,
      fetchMedia: true,
      fetchLandingPageUrl: true,
      supportsHistoricalData: true,
      supportsManualUpload: false,
    };
  }

  async searchAds(input: MarketSearchInput): Promise<ProviderSearchResult> {
    const fetchedAt = new Date().toISOString();

    try {
      const response = await fetch('/api/providers/external/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403 || errorData.code === 'NOT_CONFIGURED') {
          throw new Error(errorData.message || 'Provider belum dikonfigurasi dengan API token yang valid.');
        }
        throw new Error(errorData.message || `Gagal mengambil data dari provider eksternal (HTTP ${response.status})`);
      }

      const data = await response.json();
      const rawAds: ProviderRawAd[] = (data.items || []).map((item: any) => ({
        providerId: this.id,
        externalId: String(item.externalId || item.id || item.adArchiveID || item.adId || ''),
        advertiserId: item.advertiserId || item.pageId || item.page_id,
        advertiserName: item.advertiserName || item.pageName || item.page_name || input.advertiserName || 'Competitor',
        rawPayload: item,
        fetchedAt,
        sourceUrl: item.sourceUrl || item.adSnapshotUrl || item.snapshotUrl || item.destinationUrl,
        verificationLevel: 'PROVIDER_REPORTED',
      }));

      return {
        providerId: this.id,
        items: rawAds,
        nextCursor: data.nextCursor,
        totalFound: data.totalFound ?? rawAds.length,
        fetchedAt,
        hasMore: Boolean(data.hasMore),
        warning: data.warning,
      };
    } catch (err: any) {
      // Re-throw with clear message
      throw new Error(err?.message || 'Koneksi ke provider eksternal terputus.');
    }
  }

  async verifyConnection(): Promise<ProviderVerificationResult> {
    try {
      const response = await fetch('/api/providers/external/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          verified: false,
          status: 'UNAVAILABLE',
          latencyMs: 0,
          actorId: 'curious_coder~facebook-ads-library-scraper',
          tokenConfigured: false,
          message: errorData.message || `Pemeriksaan verifikasi provider gagal (HTTP ${response.status}).`,
          sampleItemCount: 0,
        };
      }

      const diagnostic: ProviderVerificationResult = await response.json();
      return diagnostic;
    } catch (err: any) {
      return {
        verified: false,
        status: 'UNAVAILABLE',
        latencyMs: 0,
        actorId: 'curious_coder~facebook-ads-library-scraper',
        tokenConfigured: false,
        message: `Gagal memverifikasi koneksi provider: ${err?.message || 'Koneksi jaringan terputus'}.`,
        sampleItemCount: 0,
      };
    }
  }

  async healthCheck(): Promise<{ status: ProviderHealthStatus; message: string; details?: Record<string, unknown> }> {
    try {
      const response = await fetch('/api/providers/health');
      if (!response.ok) {
        return {
          status: 'UNAVAILABLE',
          message: 'Server proxy provider tidak dapat dihubungi.',
        };
      }
      const data = await response.json();
      return {
        status: data.externalProviderStatus || (data.isConfigured ? 'READY' : 'NOT_CONFIGURED'),
        message: data.message || (data.isConfigured ? 'Provider eksternal siap dan terhubung.' : 'Provider eksternal belum dikonfigurasi (token belum diset).'),
        details: data,
      };
    } catch {
      return {
        status: 'UNAVAILABLE',
        message: 'Tidak dapat menghubungi layanan pemeriksaan status provider.',
      };
    }
  }
}
