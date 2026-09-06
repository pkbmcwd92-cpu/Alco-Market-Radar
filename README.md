# ALCO Market Radar V1.2.1 — Provider Verification & Real-World Hardening

ALCO Market Radar adalah platform intelijen periklanan dan radar kompetitor berbasis data observasi publik. Versi V1.2.1 memperkuat fondasi data nyata (**Real Data Foundation**) dengan verifikasi provider otomatis, pengujian diagnostik latensi *end-to-end*, normalisasi data tahan-perubahan (*schema-drift resilient*), dan pemisahan arsitektur adapter server-side yang aman.

---

## 🌟 Fitur & Peningkatan V1.2.1

1. **Provider Verification & Diagnostics ("Uji Provider")**:
   - Pengujian koneksi canary *end-to-end* untuk provider eksternal via `/api/providers/external/verify`.
   - Menguji otentikasi token (`EXTERNAL_PROVIDER_API_TOKEN`), latensi jaringan (ms), dan ketersediaan dataset publik.
   - Menyediakan pratinjau sampel observasi nyata langsung di UI tanpa merusak state Market Memory.

2. **Server-Side Provider Adapter**:
   - Seluruh pemanggilan eksternal diisolasi dalam `src/services/providers/serverExternalProvider.ts`.
   - Token API tidak pernah dibocorkan ke browser client.
   - Endpoint proxy bersih `/api/providers/external/*` yang menangani timeout, retry, dan penanganan error standar.

3. **Ingestion & Data Pipeline**:
   - **Normalization Service**: Menormalisasi payload eksternal menjadi `AdObservation` kanonikal tanpa memalsukan metrik privat (ROAS, revenue, exact ad spend tidak pernah dipalsukan).
   - **Validation Service**: Memvalidasi integritas data, format tanggal ISO, dan sanitasi URL (menghapus parameter tracking seperti `fbclid`, `utm_*`).
   - **Multi-Level Deduplication Service**:
     - *Level 1*: `providerId` + `externalAdId`
     - *Level 2*: `advertiserId` + `creativeId`
     - *Level 3*: Deterministic Content Fingerprint
   - **Market Memory & Observation Snapshots**: Mencatat rekaman observasi historis berkala untuk analisis temporal dan pergeseran pesan.

4. **Multi-Source Ingestion Modes**:
   - **External Provider Adapter** (Apify / Meta Ads Scraper via secure server proxy).
   - **Manual Batch File Ingestion** (JSON / CSV upload dengan pemetaan otomatis).
   - **Synthetic Demo Provider** (Simulasi observasi terstruktur untuk onboarding & pengujian tanpa token).

5. **Indonesian Localization & Epistemic Separation**:
   - Rantai bukti terverifikasi memisahkan: **TERAMATI** $\rightarrow$ **POLA** $\rightarrow$ **INTERPRETASI** $\rightarrow$ **HIPOTESIS** $\rightarrow$ **LANGKAH BERIKUTNYA**.

---

## ⚙️ Konfigurasi Environment (`.env`)

Lihat `.env.example` untuk daftar lengkap variabel konfigurasi:

```bash
# Gemini AI Key (Server-side)
GEMINI_API_KEY=your_gemini_api_key_here

# External Provider Config (Server-side)
EXTERNAL_PROVIDER_API_TOKEN=your_apify_or_external_provider_token
EXTERNAL_PROVIDER_BASE_URL=https://api.apify.com/v2
EXTERNAL_PROVIDER_ACTOR_ID=curious_coder~facebook-ads-library-scraper
```

---

## 🧪 Menjalankan Verifikasi & Unit Test

```bash
# Menjalankan unit test ingestion & deduplikasi
npm test

# Menjalankan linter TypeScript
npm run lint

# Membangun bundle produksi
npm run build
```

---

## 🛡️ Prinsip Keandalan Data

- **Zero Mock Metrics**: Tidak ada metrik privat yang diestimasi sebagai angka pasti jika tidak tersedia dari sumber publik.
- **Traceable Provenance**: Setiap observasi menyimpan metadata asal provider, URL sumber, dan timestamp deteksi.
- **Safe Execution**: Tidak ada bypass proteksi agresif; semua interaksi eksternal melalui proxy server-side yang aman.

