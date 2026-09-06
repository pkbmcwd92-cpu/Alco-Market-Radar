# ALCO Market Radar V1.2 — Real Data Foundation

ALCO Market Radar adalah platform intelijen periklanan dan radar kompetitor berbasis data observasi publik. Versi V1.2 memperkenalkan **Real Data Foundation**, memungkinkan sistem mengonsumsi dan menganalisis data observasi pasar nyata secara aman, deterministik, dan dapat ditelusuri (*traceable*).

---

## 🌟 Fitur Utama V1.2

1. **Provider Abstraction Layer**:
   - `MarketDataProvider` interface yang memisahkan logika intelijen pasar dari detail API provider.
   - Provider bawaan:
     - **Direct Meta Ads Library Public Search** (`direct_meta_public`)
     - **Apify / External Aggregator Adapter** (`apify_meta_ads_scraper` via server-side secure proxy)
     - **Synthetic Demo Provider** (`synthetic_demo_provider`)
     - **Manual Batch File Ingestion** (`manual_import`) untuk JSON/CSV

2. **Ingestion & Data Pipeline**:
   - **Normalization Service**: Menormalisasi payload eksternal menjadi `AdObservation` kanonikal tanpa memalsukan metrik privat (ROAS, revenue, exact ad spend tidak pernah dipalsukan).
   - **Validation Service**: Memvalidasi integritas data, format tanggal, dan sanitasi URL (menghapus parameter tracking seperti `fbclid`, `utm_*`).
   - **Multi-Level Deduplication Service**:
     - *Level 1*: `providerId` + `externalAdId`
     - *Level 2*: `advertiserId` + `creativeId`
     - *Level 3*: Deterministic Content Fingerprint
   - **Market Memory & Observation Snapshots**: Mencatat rekaman observasi historis berkala untuk analisis temporal dan pergeseran pesan.

3. **Indonesian Localization & Epistemic Separation**:
   - Seluruh output intelijen, klasifikasi, alert sinyal, dan rekomendasi langkah berikutnya menggunakan Bahasa Indonesia profesional.
   - Rantai bukti terverifikasi memisahkan: **TERAMATI** $\rightarrow$ **POLA** $\rightarrow$ **INTERPRETASI** $\rightarrow$ **HIPOTESIS** $\rightarrow$ **LANGKAH BERIKUTNYA**.

4. **UI Integrations**:
   - **Sumber Data & Sync (`DataSourcesView`)**: Manajemen status kesehatan provider, sinkronisasi on-demand, dan log riwayat job sinkronisasi.
   - **SourceBadge**: Menampilkan asal sumber data (`Observasi Publik`, `Provider Eksternal`, `Import Manual`, `Data Demo`) dan tingkat verifikasi data pada setiap kartu iklan dan modal bukti.
   - **Manual Import Modal**: Drag-and-drop file JSON atau CSV dengan validasi skema langsung.
   - **Sync Modal & Add Competitor Modal**: Sinkronisasi terarah per brand/kompetitor.

---

## ⚙️ Konfigurasi Environment (`.env`)

Lihat `.env.example` untuk daftar lengkap variabel konfigurasi:

```bash
# Gemini API Key (Server-side)
GEMINI_API_KEY=your_gemini_api_key_here

# Provider Konfigurasi (Server-side)
MARKET_DATA_PROVIDER=direct_meta_public
EXTERNAL_PROVIDER_API_TOKEN=your_token_if_using_external_aggregator
EXTERNAL_PROVIDER_BASE_URL=https://api.apify.com/v2
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
