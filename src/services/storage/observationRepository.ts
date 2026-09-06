import { AdObservation, ObservationSnapshot } from '../../types/radar';
import { IngestionJob } from '../../types/provider';
import { INITIAL_AD_OBSERVATIONS } from '../../data/mockData';

export interface ObservationRepository {
  findAdById(id: string): Promise<AdObservation | null>;
  findByExternalIdentity(provider: string, externalId: string): Promise<AdObservation | null>;
  findByFingerprint(fingerprint: string): Promise<AdObservation | null>;
  saveObservation(ad: AdObservation): Promise<AdObservation>;
  listObservations(workspaceId: string): Promise<AdObservation[]>;
  getAllObservations(): Promise<AdObservation[]>;
  saveSnapshot(snapshot: ObservationSnapshot): Promise<ObservationSnapshot>;
  listSnapshots(workspaceId: string, entityId?: string): Promise<ObservationSnapshot[]>;
  saveIngestionJob(job: IngestionJob): Promise<IngestionJob>;
  listIngestionJobs(workspaceId?: string): Promise<IngestionJob[]>;
  resetToDefault(): Promise<void>;
}

const STORAGE_KEY_ADS = 'alco_radar_ads_v1_2';
const STORAGE_KEY_SNAPSHOTS = 'alco_radar_snapshots_v1_2';
const STORAGE_KEY_JOBS = 'alco_radar_jobs_v1_2';

/**
 * In-Memory & LocalStorage backed Observation Repository.
 * Decouples Radar intelligence engines from any specific backend (Firestore, PostgreSQL, etc.)
 */
export class InMemoryObservationRepository implements ObservationRepository {
  private ads: Map<string, AdObservation> = new Map();
  private snapshots: ObservationSnapshot[] = [];
  private jobs: IngestionJob[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    // Check if localStorage has stored data in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedAds = window.localStorage.getItem(STORAGE_KEY_ADS);
        if (storedAds) {
          const parsed: AdObservation[] = JSON.parse(storedAds);
          parsed.forEach((ad) => this.ads.set(ad.id, ad));
        } else {
          INITIAL_AD_OBSERVATIONS.forEach((ad) => this.ads.set(ad.id, ad));
          this.persistAds();
        }

        const storedSnapshots = window.localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
        if (storedSnapshots) {
          this.snapshots = JSON.parse(storedSnapshots);
        } else {
          // Generate initial baseline snapshots for seed ads
          this.snapshots = INITIAL_AD_OBSERVATIONS.map((ad) => ({
            id: `snap_${ad.id}_init`,
            workspaceId: ad.workspaceId,
            entityType: 'AD',
            entityId: ad.id,
            observedAt: ad.detectedAt || ad.firstSeen,
            status: ad.adStatus,
            format: ad.format,
            headline: ad.headline,
            metadata: {
              source: ad.observationSource,
              observedDays: ad.observedDays,
            },
          }));
          this.persistSnapshots();
        }

        const storedJobs = window.localStorage.getItem(STORAGE_KEY_JOBS);
        if (storedJobs) {
          this.jobs = JSON.parse(storedJobs);
        }
      } catch (e) {
        console.warn('[ObservationRepository] Local storage parsing error, falling back to seed memory', e);
        INITIAL_AD_OBSERVATIONS.forEach((ad) => this.ads.set(ad.id, ad));
      }
    } else {
      INITIAL_AD_OBSERVATIONS.forEach((ad) => this.ads.set(ad.id, ad));
    }

    this.initialized = true;
  }

  private persistAds() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(Array.from(this.ads.values())));
      } catch (e) {
        console.warn('[ObservationRepository] Failed to persist ads to localStorage', e);
      }
    }
  }

  private persistSnapshots() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(this.snapshots));
      } catch (e) {
        console.warn('[ObservationRepository] Failed to persist snapshots to localStorage', e);
      }
    }
  }

  private persistJobs() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(this.jobs));
      } catch (e) {
        console.warn('[ObservationRepository] Failed to persist jobs to localStorage', e);
      }
    }
  }

  async findAdById(id: string): Promise<AdObservation | null> {
    return this.ads.get(id) || null;
  }

  async findByExternalIdentity(provider: string, externalId: string): Promise<AdObservation | null> {
    if (!externalId) return null;
    for (const ad of this.ads.values()) {
      if (
        (ad.externalAdId === externalId || ad.provenance?.externalId === externalId) &&
        (ad.provenance?.providerId === provider || ad.observationSource === provider)
      ) {
        return ad;
      }
    }
    return null;
  }

  async findByFingerprint(fingerprint: string): Promise<AdObservation | null> {
    if (!fingerprint) return null;
    for (const ad of this.ads.values()) {
      if (ad.fingerprint === fingerprint) {
        return ad;
      }
    }
    return null;
  }

  async saveObservation(ad: AdObservation): Promise<AdObservation> {
    this.ads.set(ad.id, ad);
    this.persistAds();
    return ad;
  }

  async listObservations(workspaceId: string): Promise<AdObservation[]> {
    return Array.from(this.ads.values()).filter((ad) => ad.workspaceId === workspaceId);
  }

  async getAllObservations(): Promise<AdObservation[]> {
    return Array.from(this.ads.values());
  }

  async saveSnapshot(snapshot: ObservationSnapshot): Promise<ObservationSnapshot> {
    this.snapshots.push(snapshot);
    this.persistSnapshots();
    return snapshot;
  }

  async listSnapshots(workspaceId: string, entityId?: string): Promise<ObservationSnapshot[]> {
    return this.snapshots.filter((s) => {
      if (s.workspaceId !== workspaceId) return false;
      if (entityId && s.entityId !== entityId) return false;
      return true;
    });
  }

  async saveIngestionJob(job: IngestionJob): Promise<IngestionJob> {
    const idx = this.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.jobs[idx] = job;
    } else {
      this.jobs.unshift(job);
    }
    this.persistJobs();
    return job;
  }

  async listIngestionJobs(workspaceId?: string): Promise<IngestionJob[]> {
    if (!workspaceId) return [...this.jobs];
    return this.jobs.filter((j) => j.workspaceId === workspaceId);
  }

  async resetToDefault(): Promise<void> {
    this.ads.clear();
    INITIAL_AD_OBSERVATIONS.forEach((ad) => this.ads.set(ad.id, ad));
    this.snapshots = INITIAL_AD_OBSERVATIONS.map((ad) => ({
      id: `snap_${ad.id}_init`,
      workspaceId: ad.workspaceId,
      entityType: 'AD',
      entityId: ad.id,
      observedAt: ad.detectedAt || ad.firstSeen,
      status: ad.adStatus,
      format: ad.format,
      headline: ad.headline,
      metadata: {
        source: ad.observationSource,
        observedDays: ad.observedDays,
      },
    }));
    this.jobs = [];
    this.persistAds();
    this.persistSnapshots();
    this.persistJobs();
  }
}

export const defaultObservationRepository = new InMemoryObservationRepository();
