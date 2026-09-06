import {
  AdObservation,
  ConfidenceAssessment,
  ConfidenceLevel,
  CtaType,
  FormatType,
  HookType,
  LongevityTier,
  MessagingAngle,
  OfferType,
  CreativeIntelligence,
} from '../types/radar';

interface ClassificationScore<T> {
  type: T;
  score: number;
  matchedKeywords: string[];
}

/**
 * Weighted dictionary of keywords and patterns for Hook detection.
 * Avoids simplistic single-keyword triggers by tallying weighted evidence.
 */
const HOOK_RULES: Record<HookType, { keywords: string[]; weight: number }[]> = {
  problem: [
    { keywords: ['masalah', 'kemerahan', 'breakout', 'jerawat', 'rusak', 'sensitif', 'perih', 'rusaknya'], weight: 3 },
    { keywords: ['stop', 'capek', 'lelah', 'susah', 'gagal', 'frustasi', 'rugi'], weight: 2 },
    { keywords: ['kenapa wajah', 'kulit kering ketarik', 'mengapa'], weight: 2 },
  ],
  authority: [
    { keywords: ['dokter', 'spkk', 'dermatologist', 'spesialis kulit', 'formulator'], weight: 3 },
    { keywords: ['bpom', 'uji lab', 'uji klinis', 'clinical trial', 'sertifikasi halal', 'laboratorium'], weight: 3 },
    { keywords: ['rekomendasi medis', 'menurut penelitian', 'jurnal', 'ahli'], weight: 2 },
  ],
  result: [
    { keywords: ['before after', 'sebelum sesudah', 'hasil 14 hari', 'dalam 7 hari', 'terbukti nyata'], weight: 3 },
    { keywords: ['progress', 'transformasi', 'pudar', 'sembuh', 'mulus kembali'], weight: 2 },
  ],
  testimonial: [
    { keywords: ['kata mereka', 'review jujur', 'testimoni', 'pengalaman aku', 'cerita kak'], weight: 3 },
    { keywords: ['awalnya ragu', 'bintang 5', 'viral di tiktok', 'banyak yang cocok'], weight: 2 },
  ],
  comparison: [
    { keywords: ['vs', 'bandingkan', 'daripada', 'bedanya', 'jangan salah pilih'], weight: 3 },
    { keywords: ['alternatif', 'dibanding brand lain', 'lebih efektif', 'head to head'], weight: 2 },
  ],
  urgency: [
    { keywords: ['flash sale', 'terbatas', 'hanya hari ini', 'tinggal sedikit', 'cepetan'], weight: 3 },
    { keywords: ['sekarang', 'jangan sampai kehabisan', 'periode promo'], weight: 2 },
  ],
  educational: [
    { keywords: ['cara pakai', 'step by step', 'urutan skincare', 'edukasi', 'tahapan'], weight: 3 },
    { keywords: ['kandungan aktif', 'ph balance', 'fungsi ceramide', 'kenapa butuh sunscreen'], weight: 2 },
  ],
  emotional: [
    { keywords: ['insecure', 'percaya diri', 'tampil cantik', 'peduli', 'sayangi kulit'], weight: 2 },
  ],
  'offer-led': [
    { keywords: ['promo 9.9', 'promo gajian', 'diskon 50%', 'cuma 30rb', 'beli 1 gratis 1', 'buy 2 get 1'], weight: 3 },
    { keywords: ['gratis ongkir', 'voucher belanja', 'paket hemat', 'spesial deal'], weight: 2 },
  ],
  curiosity: [
    { keywords: ['rahasia', 'ternyata', 'siapa sangka', 'bocoran', 'kamu belum tahu'], weight: 2 },
  ],
  unknown: [],
};

const ANGLE_RULES: Record<MessagingAngle, { keywords: string[]; weight: number }[]> = {
  'pain point': [
    { keywords: ['perih', 'gatal', 'radang', 'parah', 'kemerahan', 'iritasi', 'sensitif parah'], weight: 3 },
    { keywords: ['rusak parah', 'susah sembuh', 'bekas jerawat menahun'], weight: 2 },
  ],
  transformation: [
    { keywords: ['glowing', 'cerah merata', 'mulus', 'kenyal', 'pudar seketika', 'perbaiki barrier'], weight: 3 },
    { keywords: ['kembali sehat', 'skin barrier kuat', 'tampak lebih muda'], weight: 2 },
  ],
  trust: [
    { keywords: ['uji klinis', 'bpom resmi', 'halal mui', 'dermatologically tested', 'hypoallergenic'], weight: 3 },
    { keywords: ['formula aman', 'tanpa alkohol', 'bebas paraben', 'lab teruji'], weight: 2 },
  ],
  'price/value': [
    { keywords: ['cuma 30rb', 'murah banget', 'hemat', 'terjangkau', 'ramah kantong', 'harga mahasiswa'], weight: 3 },
    { keywords: ['worth it', 'dapat 2 botol', 'kualitas sultan harga merakyat'], weight: 2 },
  ],
  'social proof': [
    { keywords: ['terjual 100rb+', 'rating 4.9', 'viral tiktok', 'review 5000+', 'favorit seleb'], weight: 3 },
    { keywords: ['dipakai jutaan orang', 'best seller no 1'], weight: 2 },
  ],
  quality: [
    { keywords: ['bahan organik', 'vegan', 'grade medis', 'centella murni', 'niacinamide jepang'], weight: 3 },
    { keywords: ['kualitas premium', 'sumber berkelanjutan'], weight: 2 },
  ],
  convenience: [
    { keywords: ['praktis', 'gampang dibawa', 'anti ribet', '3 detik meresap', 'all in one'], weight: 2 },
  ],
  differentiation: [
    { keywords: ['satu-satunya', 'inovasi pertama', 'formula unik', 'beda dari yang lain'], weight: 2 },
  ],
  'fear/risk reduction': [
    { keywords: ['garansi uang kembali', 'tidak bikin ketergantungan', 'aman bumil busui'], weight: 3 },
  ],
  education: [
    { keywords: ['tahapan rutin', 'pemahaman bahan', 'tips dokter'], weight: 2 },
  ],
  status: [
    { keywords: ['elegan', 'mewah', 'prestige', 'kelas tinggi'], weight: 2 },
  ],
  other: [],
  unknown: [],
};

const OFFER_RULES: Record<OfferType, { keywords: string[]; weight: number }[]> = {
  bundle: [
    { keywords: ['paket', 'bundle', 'bundling', 'buy 2 get 1', 'b2g1', 'beli 1 gratis 1', '3-in-1', 'set lengkap'], weight: 3 },
  ],
  bonus: [
    { keywords: ['free gift', 'gratis pouch', 'bonus travel size', 'free sample', 'hadiah gratis'], weight: 3 },
  ],
  'free shipping': [
    { keywords: ['gratis ongkir', 'free shipping', 'bebas ongkir se-indonesia'], weight: 3 },
  ],
  discount: [
    { keywords: ['diskon', 'potongan harga', '% off', 'cashback', 'turun harga'], weight: 3 },
  ],
  guarantee: [
    { keywords: ['garansi 100%', 'jaminan uang kembali', 'money back guarantee', '100% original'], weight: 3 },
  ],
  'limited time': [
    { keywords: ['flash sale', 'hanya 24 jam', 'promo terbatas', 'spesial 9.9', 'minggu ini saja'], weight: 3 },
  ],
  trial: [
    { keywords: ['starter kit', 'travel size mini', 'coba gratis', 'trial pack'], weight: 2 },
  ],
  informational: [
    { keywords: ['konsultasi gratis', 'cek jenis kulit', 'panduan gratis'], weight: 2 },
  ],
  'no explicit offer': [],
  unknown: [],
};

/**
 * Score text against taxonomy rules and return sorted candidate matches
 */
function scoreTaxonomy<T extends string>(
  text: string,
  rules: Record<T, { keywords: string[]; weight: number }[]>
): ClassificationScore<T>[] {
  const scores: ClassificationScore<T>[] = [];

  for (const [key, ruleList] of Object.entries(rules) as [T, { keywords: string[]; weight: number }[]][]) {
    let totalScore = 0;
    const matched: string[] = [];

    for (const rule of ruleList) {
      for (const kw of rule.keywords) {
        if (text.includes(kw)) {
          totalScore += rule.weight;
          matched.push(kw);
        }
      }
    }

    if (totalScore > 0) {
      scores.push({
        type: key,
        score: totalScore,
        matchedKeywords: matched,
      });
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

export interface AdvancedCreativeClassification {
  primaryHook: HookType;
  secondaryHooks: HookType[];
  primaryAngle: MessagingAngle;
  secondaryAngles: MessagingAngle[];
  offerType: OfferType;
  cta: CtaType;
  hookConfidence: ConfidenceLevel;
  angleConfidence: ConfidenceLevel;
  offerConfidence: ConfidenceLevel;
  confidenceAssessment: ConfidenceAssessment;
}

/**
 * V1.1 Deterministic multi-hook & multi-angle classification
 * Adheres to:
 * - High evidence = observed tokens present
 * - Ambiguity = fallback to UNKNOWN or low confidence
 * - Supports primary and secondary hooks/angles
 */
export function classifyCreativeV1_1(ad: AdObservation): AdvancedCreativeClassification {
  const text = `${ad.headline || ''} ${ad.primaryText || ''} ${ad.description || ''}`.toLowerCase();

  // 1. Hooks
  const hookScores = scoreTaxonomy(text, HOOK_RULES);
  let primaryHook: HookType = 'unknown';
  let secondaryHooks: HookType[] = [];
  let hookConfidence: ConfidenceLevel = 'LOW';

  if (hookScores.length > 0) {
    primaryHook = hookScores[0].type;
    secondaryHooks = hookScores.slice(1, 3).map((s) => s.type);
    hookConfidence = hookScores[0].score >= 4 ? 'HIGH' : hookScores[0].score >= 2 ? 'MEDIUM' : 'LOW';
  } else {
    // If no sufficient deterministic evidence exists, return unknown
    primaryHook = 'unknown';
    hookConfidence = 'LOW';
  }

  // 2. Messaging Angles
  const angleScores = scoreTaxonomy(text, ANGLE_RULES);
  let primaryAngle: MessagingAngle = 'unknown';
  let secondaryAngles: MessagingAngle[] = [];
  let angleConfidence: ConfidenceLevel = 'LOW';

  if (angleScores.length > 0) {
    primaryAngle = angleScores[0].type;
    secondaryAngles = angleScores.slice(1, 3).map((s) => s.type);
    angleConfidence = angleScores[0].score >= 4 ? 'HIGH' : angleScores[0].score >= 2 ? 'MEDIUM' : 'LOW';
  } else {
    // If no sufficient deterministic evidence exists, return unknown
    primaryAngle = 'unknown';
    angleConfidence = 'LOW';
  }

  // 3. Offers
  const offerScores = scoreTaxonomy(text, OFFER_RULES);
  let offerType: OfferType = 'no explicit offer';
  let offerConfidence: ConfidenceLevel = 'LOW';

  if (offerScores.length > 0) {
    offerType = offerScores[0].type;
    offerConfidence = offerScores[0].score >= 3 ? 'HIGH' : 'MEDIUM';
  } else {
    offerType = 'no explicit offer';
    offerConfidence = 'MEDIUM'; // confident that no explicit offer was mentioned
  }

  // Evidence Confidence: How complete and verifiable is the public creative observation?
  const hasMedia = Boolean(ad.mediaUrl || ad.thumbnailUrl);
  const hasCopy = Boolean(ad.headline && ad.primaryText);
  const evidenceConfidence: ConfidenceLevel = (hasMedia && hasCopy && (ad.observedDays || 1) >= 2) ? 'HIGH' : hasCopy ? 'MEDIUM' : 'LOW';

  // Interpretation Confidence: How unambiguous are the matched hooks and angles?
  const interpretationConfidence: ConfidenceLevel = (hookConfidence === 'HIGH' && angleConfidence === 'HIGH') 
    ? 'HIGH' 
    : (hookConfidence === 'LOW' && angleConfidence === 'LOW') 
    ? 'LOW' 
    : 'MEDIUM';

  const confidenceAssessment: ConfidenceAssessment = {
    evidence: evidenceConfidence,
    interpretation: interpretationConfidence,
    hypothesis: 'LOW',
    rationale: `Bukti dinilai dari materi teks dan aset publik yang dapat diobservasi (${hasCopy ? 'teks lengkap' : 'teks sebagian'}). Interpretasi leksikal: Hook Utama=${primaryHook}, Angle Utama=${primaryAngle}.`,
  };

  return {
    primaryHook,
    secondaryHooks,
    primaryAngle,
    secondaryAngles,
    offerType,
    cta: ad.CTA || 'learn more',
    hookConfidence,
    angleConfidence,
    offerConfidence,
    confidenceAssessment,
  };
}

/**
 * Builds standard CreativeIntelligence object with full V1.1 compatibility
 */
export function buildCreativeIntelligenceV1_1(ad: AdObservation): CreativeIntelligence {
  const classification = classifyCreativeV1_1(ad);
  const days = ad.observedDays || 1;

  let longevityTier: LongevityTier = 'testing';
  if (days <= 7) longevityTier = 'new_detected';
  else if (days <= 21) longevityTier = 'testing';
  else if (days <= 60) longevityTier = 'established';
  else longevityTier = 'high_longevity';

  const strategicImportanceHypothesis = days > 45 
    ? 'Creative memiliki durasi observasi tinggi. Hal ini menunjukkan creative tetap digunakan dalam periode yang relatif panjang, tetapi performa conversion dan profitabilitas tidak dapat dikonfirmasi dari data publik.'
    : days <= 7 
    ? 'Creative baru terdeteksi dan masih berada dalam periode observasi awal.'
    : 'Creative masih aktif dalam periode observasi menengah.';

  // Backward-compat overall confidence
  const overallConfidence: ConfidenceLevel = classification.confidenceAssessment.evidence;

  return {
    id: `ci_${ad.id}`,
    adObservationId: ad.id,
    creativeFamilyId: undefined,
    format: ad.format,
    hookType: classification.primaryHook,
    messagingAngle: classification.primaryAngle,
    offerType: classification.offerType,
    cta: classification.cta,
    primaryHook: classification.primaryHook,
    secondaryHooks: classification.secondaryHooks,
    primaryAngle: classification.primaryAngle,
    secondaryAngles: classification.secondaryAngles,
    observedDurationDays: days,
    longevityTier,
    strategicImportanceHypothesis,
    confidence: overallConfidence,
    confidenceAssessment: classification.confidenceAssessment,
    hookConfidence: classification.hookConfidence,
    angleConfidence: classification.angleConfidence,
    offerConfidence: classification.offerConfidence,
  };
}
