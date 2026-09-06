# ALCO Market Radar V1.2.1a — Verification Integrity

ALCO Market Radar adalah platform intelijen periklanan dan radar kompetitor berbasis data observasi publik. Versi V1.2.1a memperketat standar verifikasi data (**Verification Integrity Fix**) sehingga status **VERIFIED** hanya diberikan jika sistem telah berhasil menerima, menormalisasi, dan memvalidasi setidaknya satu record iklan publik nyata melalui pipeline domain Radar.

---

## 🛡️ Matriks Status Verifikasi Provider (V1.2.1a)

| Status | Arti Semantik | Kondisi Teknis |
| :--- | :--- | :--- |
| **`CONFIGURED`** | Token Tersedia | `EXTERNAL_PROVIDER_API_TOKEN` terisi pada environment server. |
| **`REACHABLE`** | Gateway Terhubung | Server provider merespons request probe HTTP dengan status valid. |
| **`AUTHENTICATED`** | Kredensial Diterima | Token otentikasi diterima oleh provider tanpa error HTTP 401/403. |
| **`VERIFIED`** | Terverifikasi Penuh | `reachable && authenticated && rawItemsReceived > 0 && normalizedItems > 0 && validItems > 0`. |
| **`UNVERIFIED`** | Belum Terverifikasi | Provider dapat dihubungi dan otentikasi valid, namun mengembalikan 0 record iklan publik. |
| **`FAILED_VERIFICATION`** | Verifikasi Gagal | Gagal otentikasi, format schema tidak kompatibel (*schema drift*), atau record ditolak validator domain. |
| **`DEGRADED`** | Terbatas (Timeout / Rate Limit) | Permintaan melebihi batas waktu (504/timeout) atau terkena pembatasan kuota (HTTP 429). |
| **`NOT_CONFIGURED`** | Belum Dikonfigurasi | Variabel `EXTERNAL_PROVIDER_API_TOKEN` belum diset. Mode Demo & Import Manual tetap aktif. |

---

## 🌟 Prinsip Verifikasi & Keandalan Data

1. **Strict Data Pipeline Verification**:
   - Kata **VERIFIED** menuntut eksekusi *canary probe* nyata yang diproses langsung oleh `normalizationService` dan `validationService`.
   - Menguji kelengkapan atribut wajib: `externalAdId`, `advertiserName`, timestamps valid, dan URL yang aman.
   - Diagnostik transparan mencatat rincian `rawItemsReceived`, `normalizedItems`, `validItems`, dan `rejectedItems`.

2. **Zero Fake Samples & Non-Persisted Probes**:
   - Pratinjau sampel hanya ditampilkan jika observasi nyata lolos validasi.
   - Tidak ada placeholder buatan seperti `sample_ad_id` atau `Sample Advertiser`.
   - Probe verifikasi bersifat diagnostik murni dan tidak mencemari database `Market Memory`.

3. **Server-Side Security & Secret Protection**:
   - Seluruh token API diisolasi di server-side (`serverExternalProvider.ts`).
   - Pesan error provider disanitasi agar tidak mengekspos token, URL internal, atau raw error payload ke browser.

---

## ⚙️ Konfigurasi Environment (`.env`)

Lihat `.env.example` untuk daftar lengkap variabel konfigurasi:

```bash
# Gemini AI Key (Server-side)
GEMINI_API_KEY=your_gemini_api_key_here

# External Provider Config (Server-side)
EXTERNAL_PROVIDER_API_TOKEN=your_apify_or_external_provider_token
EXTERNAL_PROVIDER_ACTOR_ID=curious_coder~facebook-ads-library-scraper
PROVIDER_VERIFY_QUERY=skincare
PROVIDER_VERIFY_COUNTRY=ID
```

---

## 🧪 Menjalankan Verifikasi & Unit Test

```bash
# Menjalankan unit test ingestion & verification integrity
npm test

# Menjalankan linter TypeScript
npm run lint

# Membangun bundle produksi
npm run build
```

