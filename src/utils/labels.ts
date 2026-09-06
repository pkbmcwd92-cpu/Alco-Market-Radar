import {
  ConfidenceLevel,
  CtaType,
  FormatType,
  HookType,
  LongevityTier,
  MessagingAngle,
  OfferType,
  ObservationSource,
  SignalSeverity,
  SignalType,
} from '../types/radar';

/**
 * ALCO MARKET RADAR V1.1.1
 * Centralized Indonesian Localization and Epistemic Display Mappings
 */

export const SIGNAL_LABELS: Record<SignalType, string> = {
  NEW_COMPETITOR: 'Competitor Baru',
  NEW_CREATIVE: 'Creative Baru',
  CREATIVE_SURGE: 'Lonjakan Creative',
  CREATIVE_DISAPPEARANCE: 'Creative Tidak Lagi Aktif',
  NEW_OFFER: 'Offer Baru',
  OFFER_SHIFT: 'Pergeseran Offer',
  NEW_MESSAGING_ANGLE: 'Angle Baru',
  CREATIVE_PATTERN_SHIFT: 'Pergeseran Pola Creative',
  FORMAT_SHIFT: 'Pergeseran Format',
  COMPETITOR_ACTIVITY_CHANGE: 'Perubahan Aktivitas Competitor',
  MARKET_TREND: 'Tren Pasar',
  POTENTIAL_MARKET_GAP: 'Potensi Celah Pasar',
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  HIGH: 'TINGGI',
  MEDIUM: 'SEDANG',
  LOW: 'RENDAH',
};

export const SEVERITY_LABELS: Record<SignalSeverity, string> = {
  critical: 'KRITIS',
  high: 'TINGGI',
  medium: 'SEDANG',
  low: 'RENDAH',
  info: 'INFORMASI',
};

export const FORMAT_LABELS: Record<FormatType, string> = {
  'static image': 'Gambar Statis',
  video: 'Video',
  carousel: 'Carousel',
  collection: 'Koleksi Produk',
  other: 'Format Lainnya',
  unknown: 'Format Tidak Dikenal',
};

export const HOOK_LABELS: Record<HookType, string> = {
  problem: 'Problem / Keluhan Kulit',
  authority: 'Otoritas Medis & Uji Klinis',
  result: 'Hasil & Transformasi',
  testimonial: 'Ulasan & Testimoni Konsumen',
  comparison: 'Perbandingan Produk',
  urgency: 'Urgensi Waktu / Flash Sale',
  educational: 'Edukasi & Urutan Pakai',
  emotional: 'Emosional & Kepercayaan Diri',
  'offer-led': 'Berbasis Promo & Harga',
  curiosity: 'Rasa Penasaran & Fakta Tersembunyi',
  unknown: 'Belum Terklasifikasi',
};

export const ANGLE_LABELS: Record<MessagingAngle, string> = {
  'pain point': 'Solusi Masalah Kulit Spesifik',
  transformation: 'Transformasi & Hasil Nyata',
  trust: 'Kredibilitas BPOM & Uji Lab',
  'price/value': 'Nilai Ekonomis & Terjangkau',
  'social proof': 'Popularitas & Jumlah Terjual',
  quality: 'Kualitas Bahan Aktif Formula',
  convenience: 'Kepraktisan Penggunaan',
  differentiation: 'Keunikan Formulasi',
  'fear/risk reduction': 'Pengurangan Risiko & Jaminan',
  education: 'Pemahaman Edukatif Formula',
  status: 'Citra Eksklusif & Elegan',
  other: 'Lainnya',
  unknown: 'Belum Terklasifikasi',
};

export const OFFER_LABELS: Record<OfferType, string> = {
  bundle: 'Paket Bundling / Set Lengkap',
  bonus: 'Bonus Produk / Hadiah Gratis',
  'free shipping': 'Bebas Biaya Kirim',
  discount: 'Potongan Harga / Diskon Langsung',
  guarantee: 'Garansi Uang Kembali 100%',
  'limited time': 'Periode Terbatas / Flash Sale',
  trial: 'Paket Uji Coba / Travel Size',
  informational: 'Konsultasi Gratis',
  'no explicit offer': 'Tanpa Penawaran Khusus',
  unknown: 'Belum Terklasifikasi',
};

export const LONGEVITY_LABELS: Record<LongevityTier, string> = {
  new_detected: 'Baru Terdeteksi (≤7 hari)',
  testing: 'Pengujian Awal (8–21 hari)',
  established: 'Aktif Berkelanjutan (22–60 hari)',
  high_longevity: 'Durasi Tinggi (>60 hari)',
};

export const OBSERVATION_SOURCE_LABELS: Record<ObservationSource, string> = {
  META_ADS_LIBRARY: 'Meta Ads Library',
  PUBLIC_OBSERVATION: 'Observasi Publik',
  USER_PROVIDED: 'Data dari Pengguna',
  SYNTHETIC_DEMO: 'Data Demo Sintetis',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  investigating: 'Sedang Ditinjau',
  acknowledged: 'Telah Dikonfirmasi',
  inactive: 'Tidak Aktif',
};

export const CTA_LABELS: Record<CtaType, string> = {
  'shop now': 'Beli Sekarang',
  'learn more': 'Pelajari Lebih Lanjut',
  'sign up': 'Daftar Sekarang',
  'get offer': 'Ambil Promo',
  'order now': 'Pesan Sekarang',
  contact: 'Hubungi Kami',
  unknown: 'Tidak Ada CTA',
};

/**
 * Formats a date string to Indonesian locale standard: e.g. "6 September 2026"
 */
export function formatDateIndonesian(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Returns formatted delta percentage points according to V1.1.1 rules:
 * e.g. "naik 18 poin persentase" or "turun 5 poin persentase"
 */
export function formatDeltaPercentagePoints(delta: number): string {
  if (delta === 0) return 'tetap sama';
  const abs = Math.abs(delta);
  return delta > 0 ? `naik ${abs} poin persentase` : `turun ${abs} poin persentase`;
}

/**
 * Helper to get Indonesian confidence label
 */
export function getConfidenceLabel(level?: ConfidenceLevel): string {
  if (!level) return CONFIDENCE_LABELS.LOW;
  return CONFIDENCE_LABELS[level] || CONFIDENCE_LABELS.LOW;
}

/**
 * Helper to get Indonesian signal label
 */
export function getSignalTypeLabel(type: SignalType): string {
  return SIGNAL_LABELS[type] || type.replace(/_/g, ' ');
}
