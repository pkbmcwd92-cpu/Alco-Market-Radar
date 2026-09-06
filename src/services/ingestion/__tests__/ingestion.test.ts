import { normalizeRawAd } from '../normalizationService';
import { validateObservation } from '../validationService';
import { deduplicateAndPrepareStorage, generateAdFingerprint } from '../deduplicationService';
import { InMemoryObservationRepository } from '../../storage/observationRepository';
import { RawAdRecord } from '../../../types/provider';

async function runVerificationTests() {
  console.log('🧪 RUNNING ALCO MARKET RADAR V1.2 INGESTION TESTS...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // TEST 1: Normalization purity - never fabricate private data
  const raw1: RawAdRecord = {
    id: 'meta_raw_12345',
    providerId: 'direct_public_library',
    verificationLevel: 'DIRECT_PUBLIC',
    platform: 'meta',
    page_name: 'Somethinc Official',
    page_id: 'page_somethinc_id',
    ad_snapshot_url: 'https://www.facebook.com/ads/archive/render_ad/?id=12345&utm_source=test',
    ad_creative_bodies: ['Diskon 30% untuk serum niacinamide terbaik!'],
    ad_creative_link_captions: ['https://somethinc.com/serum?fbclid=12345'],
    ad_creative_link_titles: ['Serum Niacinamide Glowing'],
    ad_delivery_start_time: '2026-08-01T00:00:00Z',
    ad_delivery_stop_time: '2026-08-20T00:00:00Z',
    publisher_platforms: ['facebook', 'instagram'],
    media_type: 'video',
    media_url: 'https://cdn.example.com/video.mp4',
  };

  const norm1 = normalizeRawAd(raw1, 'ws_id_skincare', 'comp_somethinc');

  assert(norm1.id !== '', 'Normalized ad has non-empty ID');
  assert(norm1.advertiserName === 'Somethinc Official', 'Normalized advertiserName matches');
  assert(norm1.format === 'video', 'Normalized format mapped to video');
  assert(norm1.headline === 'Serum Niacinamide Glowing', 'Normalized headline matches link title');
  assert(norm1.observedDays >= 19, 'Observed days computed from start/stop');
  assert(!norm1.destinationUrl.includes('fbclid'), 'Sanitizer stripped tracking params from destinationUrl');
  assert(norm1.provenance.verificationLevel === 'DIRECT_PUBLIC', 'Verification level is DIRECT_PUBLIC');

  // TEST 2: Validation rejection of invalid records
  const invalidRaw: RawAdRecord = {
    id: '', // Missing ID
    platform: 'meta',
    page_name: '', // Missing advertiser
    ad_creative_bodies: [],
  };
  const normInvalid = normalizeRawAd(invalidRaw, '');
  const validationResult = validateObservation(normInvalid);
  assert(!validationResult.valid, 'Validation correctly rejects missing required fields (ID & advertiserName)');
  assert(validationResult.errors.length > 0, 'Validation returned descriptive rejection reasons');

  // TEST 3: Deduplication Multi-Level Identity Matching
  const repo = new InMemoryObservationRepository();
  await repo.saveObservation(norm1);

  // Incoming duplicate with same external ID
  const dupLevel1 = { ...norm1, id: 'ad_obs_new_temp_id' };
  const dedupResult1 = await deduplicateAndPrepareStorage([dupLevel1], repo);
  assert(dedupResult1.duplicateCount === 1, 'Level 1: Detected duplicate by externalAdId');
  assert(dedupResult1.createdAds.length === 0, 'Level 1: No new ad created for exact duplicate');
  assert(dedupResult1.snapshotsToSave.length === 1, 'Level 1: Generated observation snapshot for historical timeline');

  // Content fingerprint generation test
  const fp1 = generateAdFingerprint({ advertiserName: 'Brand A', headline: 'Promo diskon 20%', primaryText: 'Beli sekarang' });
  const fp2 = generateAdFingerprint({ advertiserName: 'Brand A', headline: 'Promo diskon 20%', primaryText: 'Beli sekarang' });
  const fp3 = generateAdFingerprint({ advertiserName: 'Brand B', headline: 'Promo diskon 20%', primaryText: 'Beli sekarang' });
  assert(fp1 === fp2, 'Fingerprint is deterministic for identical content');
  assert(fp1 !== fp3, 'Fingerprint distinguishes between different brands');

  console.log(`\n📊 TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }
}

runVerificationTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
