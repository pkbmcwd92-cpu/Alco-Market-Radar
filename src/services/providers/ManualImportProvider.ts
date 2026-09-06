import {
  MarketDataProvider,
  MarketSearchInput,
  ProviderCapabilities,
  ProviderHealthStatus,
  ProviderRawAd,
  ProviderSearchResult,
} from '../../types/provider';

export interface ManualImportPayload {
  data: string | object[] | object;
  format: 'json' | 'csv' | 'auto';
  sourceTag?: string;
  sourceUrl?: string;
}

/**
 * ManualImportProvider allows users to ingest public ad observations
 * via JSON or CSV files or text input without requiring third-party API tokens.
 */
export class ManualImportProvider implements MarketDataProvider {
  id = 'manual_import_provider';
  name = 'Manual Import Provider (JSON / CSV)';
  sourceType = 'MANUAL_IMPORT' as const;

  private stagedItems: ProviderRawAd[] = [];

  capabilities(): ProviderCapabilities {
    return {
      searchByAdvertiser: true,
      searchByKeyword: true,
      searchByCountry: false,
      fetchMedia: true,
      fetchLandingPageUrl: true,
      supportsHistoricalData: true,
      supportsManualUpload: true,
    };
  }

  /**
   * Stage raw input data (JSON string/array or CSV text) before running search/ingestion
   */
  stageImport(payload: ManualImportPayload): { count: number; errors: string[] } {
    const fetchedAt = new Date().toISOString();
    const errors: string[] = [];
    let rows: Record<string, any>[] = [];

    try {
      if (typeof payload.data === 'string') {
        const trimmed = payload.data.trim();
        if (!trimmed) {
          return { count: 0, errors: ['Input data kosong.'] };
        }

        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          const parsed = JSON.parse(trimmed);
          rows = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          // Assume CSV
          rows = this.parseCsv(trimmed);
        }
      } else if (Array.isArray(payload.data)) {
        rows = payload.data as Record<string, any>[];
      } else if (typeof payload.data === 'object' && payload.data !== null) {
        rows = [payload.data as Record<string, any>];
      }
    } catch (err: any) {
      return { count: 0, errors: [`Gagal mem-parsing format input: ${err?.message || 'Format tidak valid'}`] };
    }

    this.stagedItems = rows.map((row, idx) => {
      const extId = row.externalAdId || row.externalId || row.id || row.ad_id || `manual_row_${idx + 1}_${Date.now()}`;
      const advName = row.advertiserName || row.pageName || row.brand || row.advertiser || 'Competitor Tidak Diketahui';

      return {
        providerId: this.id,
        externalId: String(extId),
        advertiserId: row.advertiserId || row.metaPageId || undefined,
        advertiserName: String(advName),
        rawPayload: row,
        fetchedAt,
        sourceUrl: payload.sourceUrl || row.destinationUrl || row.sourceUrl,
        verificationLevel: 'USER_PROVIDED',
      };
    });

    return { count: this.stagedItems.length, errors };
  }

  private parseCsv(csvText: string): Record<string, any>[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Parse header row
    const headers = this.parseCsvLine(lines[0]);
    const results: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length === 0) continue;
      const obj: Record<string, any> = {};
      headers.forEach((header, idx) => {
        const cleanHeader = header.trim();
        obj[cleanHeader] = values[idx] !== undefined ? values[idx].trim() : '';
      });
      results.push(obj);
    }
    return results;
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  }

  async searchAds(input: MarketSearchInput): Promise<ProviderSearchResult> {
    const fetchedAt = new Date().toISOString();
    let items = [...this.stagedItems];

    if (input.advertiserName) {
      const q = input.advertiserName.toLowerCase();
      items = items.filter((it) => (it.advertiserName || '').toLowerCase().includes(q));
    }

    if (input.limit && input.limit > 0) {
      items = items.slice(0, input.limit);
    }

    return {
      providerId: this.id,
      items,
      totalFound: items.length,
      fetchedAt,
      hasMore: false,
    };
  }

  async healthCheck(): Promise<{ status: ProviderHealthStatus; message: string }> {
    return {
      status: 'READY',
      message: 'Manual Import Provider siap menerima data JSON / CSV dari pengguna.',
    };
  }
}
