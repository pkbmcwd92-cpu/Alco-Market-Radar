import { AdObservation, ObservationProvenance, ObservationSource, ObservationSnapshot, VerificationLevel } from './radar';

export type ProviderHealthStatus = 'READY' | 'NOT_CONFIGURED' | 'DEGRADED' | 'UNAVAILABLE';

export interface ProviderCapabilities {
  searchByAdvertiser: boolean;
  searchByKeyword: boolean;
  searchByCountry: boolean;
  fetchMedia: boolean;
  fetchLandingPageUrl: boolean;
  supportsHistoricalData: boolean;
  supportsManualUpload?: boolean;
}

export interface MarketSearchInput {
  workspaceId: string;
  competitorId?: string;
  advertiserName?: string;
  advertiserId?: string;
  keyword?: string;
  country?: string;
  activeStatus?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}

export interface RawAdRecord {
  id?: string;
  providerId?: string;
  verificationLevel?: VerificationLevel;
  platform?: string;
  page_name?: string;
  page_id?: string;
  ad_snapshot_url?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_titles?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  publisher_platforms?: string[];
  media_type?: string;
  media_url?: string;
  [key: string]: unknown;
}

export interface ProviderRawAd {
  providerId: string;
  externalId?: string;
  advertiserId?: string;
  advertiserName?: string;
  rawPayload: unknown;
  fetchedAt: string;
  sourceUrl?: string;
  verificationLevel: VerificationLevel;
  page_name?: string;
  media_type?: string;
  [key: string]: unknown;
}

export interface ProviderSearchResult {
  providerId: string;
  items: ProviderRawAd[];
  nextCursor?: string;
  totalFound?: number;
  fetchedAt: string;
  hasMore?: boolean;
  warning?: string;
}

export interface ProviderVerificationResult {
  verified: boolean;
  status: ProviderHealthStatus;
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

export interface MarketDataProvider {
  id: string;
  name: string;
  sourceType: ObservationSource;
  capabilities(): ProviderCapabilities;
  searchAds(input: MarketSearchInput): Promise<ProviderSearchResult>;
  healthCheck(): Promise<{ status: ProviderHealthStatus; message: string; details?: Record<string, unknown> }>;
  verifyConnection?(): Promise<ProviderVerificationResult>;
}

export interface IngestionError {
  index?: number;
  externalId?: string;
  field?: string;
  message: string;
  rawItem?: unknown;
  code: 'INVALID_WORKSPACE' | 'INVALID_ADVERTISER' | 'INVALID_DATE' | 'INVALID_FORMAT' | 'MALFORMED_ROW' | 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'UNKNOWN';
}

export interface IngestionResult {
  jobId: string;
  providerId: string;
  workspaceId: string;
  startedAt: string;
  completedAt: string;
  fetched: number;
  accepted: number;
  rejected: number;
  created: number;
  updated: number;
  duplicates: number;
  snapshotsCreated: number;
  errors: IngestionError[];
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
}

export interface IngestionJob {
  id: string;
  workspaceId: string;
  providerId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  targetCompetitorName?: string;
  result?: IngestionResult;
}

export interface DataSourceStatus {
  providerId: string;
  name: string;
  sourceType: ObservationSource;
  status: ProviderHealthStatus;
  statusLabelIndonesian: string;
  capabilities: ProviderCapabilities;
  lastSuccessfulSync?: string | null;
  lastFailedSync?: string | null;
  totalObservationsCount: number;
  isConfigured: boolean;
  description: string;
}
