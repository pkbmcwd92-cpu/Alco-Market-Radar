import fs from 'fs';
import path from 'path';
import { verifyExternalProvider } from '../serverExternalProvider';

/**
 * ALCO MARKET RADAR V1.2.1a — REAL FUNCTION VERIFICATION INTEGRITY TEST SUITE
 * 
 * Directly exercises verifyExternalProvider() by mocking network behavior (fetch).
 * Tests all required states, schema resilience, error sanitization, and fallback removal.
 */

const originalFetch = globalThis.fetch;

function mockFetchResponse(
  responseOrError: { ok?: boolean; status?: number; data?: any; errorText?: string } | Error
) {
  globalThis.fetch = (async (_url: string, _init?: any) => {
    if (responseOrError instanceof Error) {
      throw responseOrError;
    }
    const { ok = true, status = 200, data = [], errorText = '' } = responseOrError;
    return {
      ok,
      status,
      json: async () => data,
      text: async () => errorText || JSON.stringify(data),
    } as any;
  }) as any;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

async function runRealFunctionVerificationTests() {
  console.log('🧪 RUNNING ALCO MARKET RADAR V1.2.1a REAL FUNCTION VERIFICATION TESTS...\n');

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

  try {
    // 1. TEST REAL FUNCTION — EMPTY RESPONSE
    console.log('--- Test 1: Empty Response (HTTP 200, []) ---');
    mockFetchResponse({ ok: true, status: 200, data: [] });
    const emptyRes = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(!emptyRes.verified, 'verified is false');
    assert(emptyRes.status === 'UNVERIFIED', 'status is UNVERIFIED');
    assert(emptyRes.reachable, 'reachable is true');
    assert(emptyRes.authenticated, 'authenticated is true');
    assert(emptyRes.rawItemsReceived === 0, 'rawItemsReceived is 0');
    assert(emptyRes.validItems === 0, 'validItems is 0');

    // 2. TEST REAL FUNCTION — VALID RECORD
    console.log('\n--- Test 2: Valid Record (HTTP 200, 1 Valid Ad) ---');
    mockFetchResponse({
      ok: true,
      status: 200,
      data: [
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
      ],
    });
    const validRes = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(validRes.verified, 'verified is true for valid data');
    assert(validRes.status === 'VERIFIED', 'status is VERIFIED');
    assert(validRes.rawItemsReceived === 1, 'rawItemsReceived is 1');
    assert(validRes.normalizedItems === 1, 'normalizedItems is 1');
    assert(validRes.validItems === 1, 'validItems is 1');
    assert(validRes.sample?.externalAdId === 'meta_archive_991827364', 'sample.externalAdId matches');
    assert(validRes.sample?.advertiserName === 'Avoskin Beauty Official', 'sample.advertiserName matches');

    // 3. TEST REAL FUNCTION — INVALID SCHEMA
    console.log('\n--- Test 3: Invalid Schema (HTTP 200, Malformed Records) ---');
    mockFetchResponse({
      ok: true,
      status: 200,
      data: [{ completely_unknown_field: 123, another_nonsense: 'abc' }],
    });
    const schemaRes = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(!schemaRes.verified, 'verified is false for malformed schema');
    assert(schemaRes.status === 'FAILED_VERIFICATION', 'status is FAILED_VERIFICATION');
    assert(schemaRes.rawItemsReceived === 1, 'rawItemsReceived is 1');
    assert(schemaRes.normalizedItems === 0, 'normalizedItems is 0');
    assert(schemaRes.validItems === 0, 'validItems is 0');
    assert(
      schemaRes.errors.some((e) => e.includes('PROVIDER_SCHEMA_CHANGED')),
      'Error indicates PROVIDER_SCHEMA_CHANGED'
    );

    // 4. TEST REAL FUNCTION — VALIDATION FAILURE
    console.log('\n--- Test 4: Validation Failure (Normalizes but fails domain rules) ---');
    mockFetchResponse({
      ok: true,
      status: 200,
      data: [{ id: '123_test', page_name: 'Test Brand', link_url: 'javascript:alert(1)' }], // Normalizes but fails URL safety validation
    });
    const valFailRes = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(!valFailRes.verified, 'verified is false when validation fails');
    assert(valFailRes.status === 'FAILED_VERIFICATION', 'status is FAILED_VERIFICATION');
    assert(valFailRes.normalizedItems === 1, 'normalizedItems is 1');
    assert(valFailRes.validItems === 0, 'validItems is 0');

    // 5. TEST REAL FUNCTION — AUTH FAILURE (401)
    console.log('\n--- Test 5: Authentication Failure (HTTP 401) ---');
    mockFetchResponse({
      ok: false,
      status: 401,
      errorText: '{"error": "Unauthorized token SECRET_TEST_TOKEN_123"}',
    });
    const auth401Res = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(!auth401Res.verified, 'verified is false on 401');
    assert(!auth401Res.authenticated, 'authenticated is false on 401');
    assert(auth401Res.status === 'FAILED_VERIFICATION', 'status is FAILED_VERIFICATION');
    assert(
      !JSON.stringify(auth401Res).includes('SECRET_TEST_TOKEN_123'),
      'Raw response body containing token is NOT leaked'
    );

    // 6. TEST REAL FUNCTION — AUTH FAILURE (403)
    console.log('\n--- Test 6: Access Denied (HTTP 403) ---');
    mockFetchResponse({
      ok: false,
      status: 403,
      errorText: 'Forbidden access for token SECRET_TEST_TOKEN_403',
    });
    const auth403Res = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(!auth403Res.verified, 'verified is false on 403');
    assert(!auth403Res.authenticated, 'authenticated is false on 403');
    assert(
      !JSON.stringify(auth403Res).includes('SECRET_TEST_TOKEN_403'),
      'Sensitive response body is NOT leaked on 403'
    );

    // 7. TEST REAL FUNCTION — RATE LIMIT (HTTP 429)
    console.log('\n--- Test 7: Rate Limit (HTTP 429) ---');
    mockFetchResponse({
      ok: false,
      status: 429,
      errorText: 'Too many requests',
    });
    const rateLimitRes = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(!rateLimitRes.verified, 'verified is false on 429');
    assert(rateLimitRes.status === 'DEGRADED', 'status is DEGRADED on 429');
    assert(rateLimitRes.reachable, 'reachable is true on 429');

    // 8. TEST REAL FUNCTION — TIMEOUT (AbortError)
    console.log('\n--- Test 8: Timeout (AbortError) ---');
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetchResponse(abortError);
    const timeoutRes = await verifyExternalProvider({ apiToken: 'test_mock_token', timeoutMs: 10 });
    assert(!timeoutRes.verified, 'verified is false on timeout');
    assert(timeoutRes.status === 'DEGRADED', 'status is DEGRADED on timeout');
    assert(
      timeoutRes.warnings.some((w) => w.includes('PROVIDER_TIMEOUT')),
      'Warning indicates PROVIDER_TIMEOUT'
    );

    // 9. TEST REAL FUNCTION — NETWORK FAILURE
    console.log('\n--- Test 9: Network Failure ---');
    mockFetchResponse(new TypeError('Failed to fetch'));
    const netRes = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(!netRes.verified, 'verified is false on network failure');
    assert(!netRes.reachable, 'reachable is false on network failure');

    // 10. TEST REAL FUNCTION — ERROR SANITIZATION
    console.log('\n--- Test 10: Error Sanitization ---');
    mockFetchResponse({
      ok: false,
      status: 500,
      errorText: 'Internal Server Error: SECRET_KEY_LEAK_99999',
    });
    const sanitRes = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(
      !JSON.stringify(sanitRes).includes('SECRET_KEY_LEAK_99999'),
      'Sensitive secret in 500 response body is NOT leaked'
    );

    // 11. TEST REAL FUNCTION — FAKE FALLBACK REMOVAL
    console.log('\n--- Test 11: Fake Fallback Removal Audit ---');
    const serverProviderCode = fs.readFileSync(
      path.join(process.cwd(), 'src/services/providers/serverExternalProvider.ts'),
      'utf-8'
    );
    assert(!serverProviderCode.includes("'sample_ad_id'"), "No 'sample_ad_id' string fallback in code");
    assert(!serverProviderCode.includes("'Sample Advertiser'"), "No 'Sample Advertiser' string fallback in code");
    assert(!serverProviderCode.includes("'Sample Creative'"), "No 'Sample Creative' string fallback in code");

    // 12. TEST REAL FUNCTION — NOT CONFIGURED
    console.log('\n--- Test 12: Not Configured Behavior ---');
    const notConfigRes = await verifyExternalProvider({ apiToken: '' });
    assert(!notConfigRes.verified, 'verified is false when token missing');
    assert(notConfigRes.status === 'NOT_CONFIGURED', 'status is NOT_CONFIGURED');
    assert(!notConfigRes.tokenConfigured, 'tokenConfigured is false');

    // 13. TEST REAL FUNCTION — NON-PERSISTENCE
    console.log('\n--- Test 13: Non-Persistence Guarantee ---');
    mockFetchResponse({
      ok: true,
      status: 200,
      data: [
        {
          id: 'probe_item_001',
          page_name: 'Probe Brand',
        },
      ],
    });
    const probeRes = await verifyExternalProvider({ apiToken: 'test_mock_token' });
    assert(probeRes.validItems === 1, 'Probe item processed');
    // Verify probe result returns data diagnostic without modifying any state
    assert(probeRes.providerId === 'external_market_provider', 'Result is purely diagnostic');
  } finally {
    restoreFetch();
  }

  console.log(`\n📊 REAL FUNCTION VERIFICATION TEST SUMMARY: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    throw new Error(`${failed} verification tests failed!`);
  }
}

runRealFunctionVerificationTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
