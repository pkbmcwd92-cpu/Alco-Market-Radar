/**
 * ALCO MARKET RADAR V1.1.1 — Automated Verification Test Suite
 * Tests epistemic hardening, classifier fallback, confidence rules, and Bahasa Indonesia output.
 */

import { classifyCreativeV1_1, buildCreativeIntelligenceV1_1 } from '../services/classificationEngine';
import { evaluateSignalsV1_1, calculateMarketOpportunities } from '../services/signalEngine';
import { generateTemporalTrendReport, createSlidingWindow } from '../services/trendEngine';
import { INITIAL_WORKSPACES, INITIAL_COMPETITORS, INITIAL_AD_OBSERVATIONS } from '../data/mockData';
import {
  SIGNAL_LABELS,
  CONFIDENCE_LABELS,
  SEVERITY_LABELS,
  formatDateIndonesian,
  formatDeltaPercentagePoints,
} from '../utils/labels';
import { AdObservation } from '../types/radar';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
    process.exitCode = 1;
  }
}

console.log('\n--- ALCO MARKET RADAR V1.1.1 TEST SUITE ---\n');

// 1. CLASSIFIER HARDENING TESTS
console.log('1. Testing Classifier Hardening & Fallback to UNKNOWN:');

// Test: Empty / neutral copy without taxonomy match must return 'unknown'
const dummyNeutralAd: AdObservation = {
  id: 'test_neutral',
  workspaceId: 'ws_test',
  competitorId: 'comp_test',
  externalAdId: 'ext_test',
  platform: 'meta',
  advertiserName: 'Test Brand',
  pageName: 'Test Page',
  adStatus: 'active',
  firstSeen: '2026-09-01T00:00:00Z',
  lastSeen: '2026-09-05T00:00:00Z',
  detectedAt: '2026-09-01T00:00:00Z',
  format: 'static image',
  headline: 'Lorem ipsum dolor sit amet',
  primaryText: 'consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
  description: 'Test description',
  CTA: 'shop now',
  destinationUrl: 'https://example.com',
  landingPageId: 'lp_test',
  mediaUrl: 'https://example.com/img.jpg',
  thumbnailUrl: 'https://example.com/img.jpg',
  creativeId: 'cr_test',
  observedDays: 4,
  observationSource: 'PUBLIC_OBSERVATION',
};

const unclassifiedResult = classifyCreativeV1_1(dummyNeutralAd);
assert(
  unclassifiedResult.primaryHook === 'unknown',
  'No hook keywords -> primaryHook should be "unknown"',
  `Got: ${unclassifiedResult.primaryHook}`
);
assert(
  unclassifiedResult.primaryAngle === 'unknown',
  'No angle keywords -> primaryAngle should be "unknown"',
  `Got: ${unclassifiedResult.primaryAngle}`
);
assert(
  unclassifiedResult.hookConfidence === 'LOW',
  'Unknown hook confidence must be LOW',
  `Got: ${unclassifiedResult.hookConfidence}`
);
assert(
  unclassifiedResult.angleConfidence === 'LOW',
  'Unknown angle confidence must be LOW',
  `Got: ${unclassifiedResult.angleConfidence}`
);
assert(
  unclassifiedResult.confidenceAssessment.hypothesis === 'LOW',
  'Classification hypothesis confidence defaults to LOW',
  `Got: ${unclassifiedResult.confidenceAssessment.hypothesis}`
);

// Test: Legitimate matches work
const dummyProblemAd: AdObservation = {
  ...dummyNeutralAd,
  id: 'test_problem',
  headline: 'Wajah Kusam dan Berjerawat?',
  primaryText: 'Atasi jerawat meradang dan kemerahan dengan formula lembut kami.',
};

const problemResult = classifyCreativeV1_1(dummyProblemAd);
assert(
  problemResult.primaryHook === 'problem',
  'Problem-oriented copy correctly detects problem hook',
  `Got: ${problemResult.primaryHook}`
);
assert(
  problemResult.primaryAngle === 'pain point',
  'Pain point keywords correctly detect pain point angle',
  `Got: ${problemResult.primaryAngle}`
);

// 2. SIGNAL HARDENING TESTS
console.log('\n2. Testing Signal Engine Language & Epistemic Hardening:');

const signals = evaluateSignalsV1_1(
  INITIAL_WORKSPACES[0].id,
  INITIAL_AD_OBSERVATIONS,
  INITIAL_COMPETITORS
);

assert(signals.length > 0, 'Signal engine generates market signals');

signals.forEach((signal) => {
  const allText = `${signal.title} ${signal.description} ${signal.triad.observed} ${signal.triad.inferred} ${signal.triad.hypothesis || ''} ${signal.hypothesis || ''} ${signal.whyItMatters || ''} ${(signal.nextActions || []).join(' ')}`.toLowerCase();

  // Unsupported claims check
  const forbiddenPhrases = [
    'to counter creative fatigue',
    'counter fatigue',
    'aggressive testing',
    'major promotional push',
    'consumer skepticism is increasing',
    'static ads may have rising cpm',
    'lower thumb-stop efficiency',
    'underperforming hooks were removed',
    'the ads failed',
    'winning creative',
    'competitor increased spend',
    'positive concept retention',
    'pasti berhasil',
    'naikkan budget',
  ];

  forbiddenPhrases.forEach((phrase) => {
    assert(
      !allText.includes(phrase),
      `Signal [${signal.type}] must not contain unsupported phrase "${phrase}"`,
      `Found forbidden phrase in signal: ${signal.id}`
    );
  });

  // Confidence check: Strategic hypothesis must be LOW unless explicitly proven
  assert(
    signal.confidenceAssessment?.hypothesis === 'LOW' ||
    signal.confidenceAssessment?.hypothesis === 'MEDIUM',
    `Signal [${signal.type}] hypothesis confidence should be LOW or MEDIUM (cautious)`,
    `Got: ${signal.confidenceAssessment?.hypothesis}`
  );
});

// 3. LONGEVITY & SURVIVAL HARDENING
console.log('\n3. Testing Longevity Hypotheses:');
const longRunningAdObservation: AdObservation = {
  ...dummyNeutralAd,
  observedDays: 52,
};
const longIntelligence = buildCreativeIntelligenceV1_1(longRunningAdObservation);
assert(
  longIntelligence.strategicImportanceHypothesis.includes('durasi observasi tinggi') &&
  longIntelligence.strategicImportanceHypothesis.includes('profitabilitas tidak dapat dikonfirmasi'),
  'Long longevity hypothesis explicitly states profitability cannot be confirmed from public data',
  `Got: ${longIntelligence.strategicImportanceHypothesis}`
);

const newAdObservation: AdObservation = {
  ...dummyNeutralAd,
  observedDays: 3,
};
const newIntelligence = buildCreativeIntelligenceV1_1(newAdObservation);
assert(
  newIntelligence.strategicImportanceHypothesis.includes('observasi awal'),
  'New creative longevity hypothesis notes early observation period',
  `Got: ${newIntelligence.strategicImportanceHypothesis}`
);

// 4. TREND ENGINE TESTS
console.log('\n4. Testing Trend Engine Percentage Points & Mathematics:');
const compMap = new Map<string, string>(INITIAL_COMPETITORS.map((c) => [c.id, c.name]));
const trendReport = generateTemporalTrendReport(INITIAL_WORKSPACES[0].id, INITIAL_AD_OBSERVATIONS, compMap, 7);
assert(trendReport.totalActiveCreatives > 0, 'Temporal trend engine computes active creatives cohort');
assert(trendReport.formatShifts.length > 0, 'Temporal trend engine computes format shifts');

const deltaFormattedPositive = formatDeltaPercentagePoints(18.5);
assert(
  deltaFormattedPositive.includes('naik 18.5 poin persentase'),
  'formatDeltaPercentagePoints formats positive delta with poin persentase',
  `Got: ${deltaFormattedPositive}`
);

const deltaFormattedNegative = formatDeltaPercentagePoints(-4.2);
assert(
  deltaFormattedNegative.includes('turun 4.2 poin persentase'),
  'formatDeltaPercentagePoints formats negative delta with poin persentase',
  `Got: ${deltaFormattedNegative}`
);

// 5. LOCALIZATION & DISPLAY LABELS
console.log('\n5. Testing Centralized Indonesian Localization & Labels:');
assert(SIGNAL_LABELS.CREATIVE_SURGE === 'Lonjakan Creative', 'CREATIVE_SURGE mapped to Indonesian');
assert(SIGNAL_LABELS.CREATIVE_DISAPPEARANCE === 'Creative Tidak Lagi Aktif', 'CREATIVE_DISAPPEARANCE mapped to Indonesian');
assert(SIGNAL_LABELS.FORMAT_SHIFT === 'Pergeseran Format', 'FORMAT_SHIFT mapped to Indonesian');
assert(CONFIDENCE_LABELS.HIGH === 'TINGGI', 'HIGH mapped to TINGGI');
assert(CONFIDENCE_LABELS.MEDIUM === 'SEDANG', 'MEDIUM mapped to SEDANG');
assert(CONFIDENCE_LABELS.LOW === 'RENDAH', 'LOW mapped to RENDAH');
assert(SEVERITY_LABELS.critical === 'KRITIS', 'critical mapped to KRITIS');

const indonesianDate = formatDateIndonesian('2026-09-06T00:00:00Z');
assert(
  indonesianDate.includes('September') || indonesianDate.includes('2026'),
  'Date formatted with Indonesian month/year',
  `Got: ${indonesianDate}`
);

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
console.log(`========================================\n`);
