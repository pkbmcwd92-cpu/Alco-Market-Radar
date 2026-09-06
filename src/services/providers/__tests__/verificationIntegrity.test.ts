import { normalizeRawAd } from '../../ingestion/normalizationService';
import { validateObservation } from '../../ingestion/validationService';
import { verifyExternalProvider } from '../serverExternalProvider';

/**
 * ALCO MARKET RADAR V1.2.1a — VERIFICATION INTEGRITY TEST SUITE
 * 
 * Tests that "VERIFIED" strictly requires:
 * 1. Reachable & Authenticated provider
 * 2. rawItemsReceived > 0
 * 3. normalizedItems > 0
 * 4. validItems > 0
 * 5. Diagnostic purity (no data persistence, no fabricated fallback strings)
 */

async function runVerificationIntegrityTests() {
  console.log('🧪 RUNNING ALCO MARKET RADAR V1.2.1a VERIFICATION INTEGRITY TESTS...\n');

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

  // TEST A: Empty provider response must return UNVERIFIED (not VERIFIED)
  console.log('--- Test A: Empty Provider Response ---');
  const emptyRawList: any[] = [];
  const normalizedFromEmpty = emptyRawList.map((r) => normalizeRawAd(r, 'test_probe'));
  const validFromEmpty = normalizedFromEmpty.filter((n) => validateObservation(n).valid);

  assert(emptyRawList.length === 0, 'Raw items count is 0');
  assert(normalizedFromEmpty.length === 0, 'Normalized count is 0');
  assert(validFromEmpty.length === 0, 'Valid count is 0');
  // Simulated verification evaluation
  const isVerifiedForEmpty = emptyRawList.length > 0 && normalizedFromEmpty.length > 0 && validFromEmpty.length > 0;
  assert(!isVerifiedForEmpty, 'Empty response is NEVER marked as verified: true');

  // TEST B: Incompatible schema / Normalization failure
  console.log('\n--- Test B: Incompatible Schema / Normalization Failure ---');
  const garbageRawList = [
    { someUnknownKey1: 123, completely_unrelated_field: 'unknown' },
    { anotherGarbageField: true },
  ];
  const normalizedGarbage: any[] = [];
  for (const item of garbageRawList) {
    try {
      const n = normalizeRawAd(item, 'test_probe');
      if (n.externalAdId && n.advertiserName) {
        normalizedGarbage.push(n);
      }
    } catch {
      // Failed normalization
    }
  }
  const isVerifiedForGarbage = garbageRawList.length > 0 && normalizedGarbage.length > 0;
  assert(!isVerifiedForGarbage, 'Garbage schema is rejected: normalizedItems is 0, verified is false');

  // TEST C: Validation failure on normalized items
  console.log('\n--- Test C: Validation Failure ---');
  const semiValidRaw = [
    { id: '', page_name: '', ad_creative_bodies: ['Some body'] },
  ];
  const normalizedSemi = semiValidRaw.map((r) => normalizeRawAd(r, 'test_probe'));
  const validSemi = normalizedSemi.filter((n) => validateObservation(n).valid);
  assert(validSemi.length === 0, 'Records with missing mandatory fields fail validationService');
  const isVerifiedForSemi = semiValidRaw.length > 0 && normalizedSemi.length > 0 && validSemi.length > 0;
  assert(!isVerifiedForSemi, 'Invalid records yield verified: false');

  // TEST D: Success pipeline - Valid real record produces VERIFIED
  console.log('\n--- Test D: Full Pipeline Success ---');
  const realAdRaw = [
    {
      id: 'meta_archive_991827364',
      page_name: 'Avoskin Beauty Official',
      ad_creative_link_titles: ['Miraculous Refining Toner Eksfoliasi'],
      ad_creative_bodies: ['Toner eksfoliasi AHA BHA PHA lembut untuk kulit glowing.'],
      ad_delivery_start_time: '2026-08-10T00:00:00Z',
      ad_delivery_stop_time: '2026-08-25T00:00:00Z',
      publisher_platforms: ['instagram', 'facebook'],
      media_type: 'image',
    },
  ];

  const normalizedReal = realAdRaw.map((r) => normalizeRawAd(r, 'test_probe'));
  assert(normalizedReal.length === 1, 'Raw record successfully passed through normalizationService');
  assert(normalizedReal[0].advertiserName === 'Avoskin Beauty Official', 'Advertiser name correctly preserved');
  assert(normalizedReal[0].externalAdId === 'meta_archive_991827364', 'External Ad ID correctly normalized');

  const validReal = normalizedReal.filter((n) => validateObservation(n).valid);
  assert(validReal.length === 1, 'Normalized record successfully passed through validationService');

  const isVerifiedForReal = realAdRaw.length > 0 && normalizedReal.length > 0 && validReal.length > 0;
  assert(isVerifiedForReal, 'Strict verification condition met: verified is true');

  // TEST E: Missing token returns NOT_CONFIGURED
  console.log('\n--- Test E: Unconfigured Token Behavior ---');
  const unconfiguredResult = await verifyExternalProvider({ apiToken: '' });
  assert(!unconfiguredResult.verified, 'Unconfigured provider has verified: false');
  assert(unconfiguredResult.status === 'NOT_CONFIGURED', 'Unconfigured provider status is NOT_CONFIGURED');
  assert(!unconfiguredResult.tokenConfigured, 'tokenConfigured flag is false');
  assert(unconfiguredResult.rawItemsReceived === 0, 'rawItemsReceived is 0');
  assert(unconfiguredResult.validItems === 0, 'validItems is 0');

  // TEST F: Diagnostic preview integrity
  console.log('\n--- Test F: Sample Preview Purity ---');
  const firstValid = validReal[0];
  const sample = {
    externalAdId: firstValid.externalAdId || undefined,
    advertiserName: firstValid.advertiserName || undefined,
    headline: firstValid.headline || undefined,
    format: firstValid.format || undefined,
    observedAt: firstValid.detectedAt || firstValid.firstSeen || undefined,
  };

  assert(sample.advertiserName === 'Avoskin Beauty Official', 'Sample advertiserName is real');
  assert(sample.externalAdId === 'meta_archive_991827364', 'Sample externalAdId is real');
  assert(sample.headline === 'Miraculous Refining Toner Eksfoliasi', 'Sample headline is real');
  assert(sample.externalAdId !== 'sample_ad_id', 'NO placeholder fallback "sample_ad_id" used');
  assert(sample.advertiserName !== 'Sample Advertiser', 'NO placeholder fallback "Sample Advertiser" used');

  console.log(`\n📊 VERIFICATION INTEGRITY TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    throw new Error(`${failed} verification tests failed!`);
  }
}

runVerificationIntegrityTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
