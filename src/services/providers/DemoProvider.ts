import {
  MarketDataProvider,
  MarketSearchInput,
  ProviderCapabilities,
  ProviderHealthStatus,
  ProviderSearchResult,
} from '../../types/provider';
import { INITIAL_AD_OBSERVATIONS } from '../../data/mockData';

export class DemoProvider implements MarketDataProvider {
  id = 'demo_synthetic_provider';
  name = 'Demo Provider (Sintetis)';
  sourceType = 'SYNTHETIC_DEMO' as const;

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
    let filtered = INITIAL_AD_OBSERVATIONS.filter((ad) => {
      if (input.workspaceId && ad.workspaceId !== input.workspaceId) return false;
      if (input.competitorId && ad.competitorId !== input.competitorId) return false;
      if (input.advertiserName && !ad.advertiserName.toLowerCase().includes(input.advertiserName.toLowerCase())) return false;
      if (input.keyword) {
        const kw = input.keyword.toLowerCase();
        const matchesCopy = (ad.headline || '').toLowerCase().includes(kw) || (ad.primaryText || '').toLowerCase().includes(kw);
        if (!matchesCopy) return false;
      }
      return true;
    });

    if (input.limit && input.limit > 0) {
      filtered = filtered.slice(0, input.limit);
    }

    const items = filtered.map((ad) => ({
      providerId: this.id,
      externalId: ad.externalAdId,
      advertiserId: ad.pageName,
      advertiserName: ad.advertiserName,
      rawPayload: { ...ad },
      fetchedAt,
      sourceUrl: ad.destinationUrl,
      verificationLevel: 'SYNTHETIC' as const,
    }));

    return {
      providerId: this.id,
      items,
      totalFound: items.length,
      fetchedAt,
      hasMore: false,
      warning: 'MODE DEMO — Data yang ditampilkan bersifat sintetis untuk evaluasi.',
    };
  }

  async healthCheck(): Promise<{ status: ProviderHealthStatus; message: string }> {
    return {
      status: 'READY',
      message: 'Demo Provider siap digunakan dalam mode simulasi sintetis.',
    };
  }
}
