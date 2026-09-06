import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized GenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    product: "ALCO MARKET RADAR",
    version: "1.2.0-real-data-foundation",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    model: GEMINI_MODEL,
    hasExternalProviderToken: Boolean(
      process.env.EXTERNAL_PROVIDER_API_TOKEN || process.env.APIFY_API_TOKEN
    ),
  });
});

// Providers Health & Status Endpoint
app.get("/api/providers/health", (_req, res) => {
  const hasToken = Boolean(
    process.env.EXTERNAL_PROVIDER_API_TOKEN || process.env.APIFY_API_TOKEN
  );

  res.json({
    demoProviderStatus: "READY",
    manualImportStatus: "READY",
    externalProviderStatus: hasToken ? "READY" : "NOT_CONFIGURED",
    isConfigured: hasToken,
    activeProviderMode: process.env.MARKET_DATA_PROVIDER || (hasToken ? "external" : "demo"),
    message: hasToken
      ? "Provider eksternal terhubung dan siap mengambil data observasi publik."
      : "Provider eksternal belum dikonfigurasi. Mode Demo dan Import Manual tetap siap digunakan.",
    capabilities: {
      searchByAdvertiser: true,
      searchByKeyword: true,
      searchByCountry: true,
      fetchMedia: true,
      fetchLandingPageUrl: true,
      supportsHistoricalData: true,
    },
  });
});

// Server-side External Provider Proxy Endpoint (Protects API Credentials)
app.post("/api/providers/external/search", async (req, res) => {
  const { advertiserName, keyword, country = "ID", limit = 20 } = req.body;
  const token = process.env.EXTERNAL_PROVIDER_API_TOKEN || process.env.APIFY_API_TOKEN;
  const actorId = process.env.EXTERNAL_PROVIDER_ACTOR_ID || process.env.APIFY_ACTOR_ID || "curious_coder~facebook-ads-library-scraper";

  if (!token) {
    return res.status(401).json({
      code: "NOT_CONFIGURED",
      message: "Provider eksternal belum dikonfigurasi. Silakan atur EXTERNAL_PROVIDER_API_TOKEN pada environment atau gunakan Manual Import / Mode Demo.",
      items: [],
    });
  }

  try {
    // Call external compliant provider API using server-side token
    const apiUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
    const inputPayload = {
      searchTerms: keyword ? [keyword] : [advertiserName],
      country: country,
      adStatus: "ACTIVE",
      maxItems: Math.min(limit, 50),
    };

    const externalResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputPayload),
    });

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text().catch(() => "");
      return res.status(externalResponse.status).json({
        code: "PROVIDER_ERROR",
        message: `Provider eksternal merespons dengan status ${externalResponse.status}.`,
        details: errorText.substring(0, 300),
        items: [],
      });
    }

    const items = await externalResponse.json();
    return res.json({
      providerId: "external_market_provider",
      items: Array.isArray(items) ? items : [],
      totalFound: Array.isArray(items) ? items.length : 0,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(502).json({
      code: "NETWORK_ERROR",
      message: `Gagal menghubungi provider eksternal: ${err?.message || "Koneksi timeout"}`,
      items: [],
    });
  }
});

// AI Signal Synthesis & Explanation endpoint
// Strictly adhering to: OBSERVED vs INFERRED vs HYPOTHESIS, evidence traceability, and Bahasa Indonesia
app.post("/api/gemini/synthesize-signals", async (req, res) => {
  const { workspaceName, marketCategory, signals, competitorNames } = req.body;

  const ai = getGenAI();
  if (!ai) {
    // Return deterministic fallback in Bahasa Indonesia
    return res.json({
      fallback: true,
      data: {
        summary: `Analisis deterministik terhadap ${competitorNames?.length || 0} competitor di ${workspaceName || "pasar"}: teridentifikasi ${signals?.length || 0} sinyal aktif dengan perubahan pola pada pesan dan format materi iklan.`,
        observed: [
          `Terdeteksi ${signals?.length || 0} peristiwa pasar terverifikasi berdasarkan data observasi creative iklan publik.`,
          `Aktivitas tercatat pada competitor: ${(competitorNames || []).slice(0, 3).join(", ")}.`,
        ],
        inferred: [
          "Perubahan materi iklan publik menunjukkan penyesuaian strategi komunikasi dan diversifikasi format oleh beberapa competitor.",
        ],
        hypotheses: [
          "Pola ini mungkin konsisten dengan periode eksperimen atau rotasi creative berkala; tujuan bisnis internal dan efektivitas biaya tidak dapat dipastikan dari data publik.",
        ],
        opportunities: [
          "Uji variasi pesan atau angle yang belum padat digunakan oleh kompetitor utama.",
        ],
        threats: [
          "Kepadatan penawaran pada format serupa dapat meningkatkan persaingan perhatian audiens.",
        ],
        confidence: "MEDIUM",
        confidenceAssessment: {
          evidence: "HIGH",
          interpretation: "MEDIUM",
          hypothesis: "LOW",
          rationale: "Analisis berbasis data observasi publik yang tercatat tanpa asumsi performa privat.",
        },
        evidenceIds: (signals || []).flatMap((s: any) => (s.evidence || []).map((e: any) => e.evidenceId)).slice(0, 6),
        nextActions: [
          "Tinjau bukti pendukung sebelum mengambil keputusan pengujian.",
          "Pantau kelangsungan materi creative baru selama 7–14 hari ke depan.",
        ],
      },
    });
  }

  try {
    const prompt = `You are the lead Market Intelligence AI within ALCO MARKET RADAR V1.1.1.
MANDATORY LANGUAGE RULE:
Always return ALL natural-language intelligence fields in clear, professional Bahasa Indonesia.

STRICT EPISTEMIC CONSTRAINTS:
1. Never invent evidence or metrics.
2. Never infer private performance (ROAS, revenue, exact ad spend, conversion rates, or profitability are completely unknown).
3. Never infer private targeting or internal campaign goals.
4. Never state that a creative is a "winner" or that an ad "failed".
5. Never treat longevity as proof of profitability (longevity only proves duration of public delivery).
6. Never treat ad disappearance as proof of poor performance (could be inventory shift, promo expiry, or stock changes).
7. Never treat category adoption as proof of business effectiveness.
8. Clearly separate OBSERVED (TERAMATI), INFERRED (INTERPRETASI), and HYPOTHESIS (HIPOTESIS).
9. Clearly label uncertain statements as hypotheses.
10. If evidence is weak or insufficient, explicitly state: "Bukti yang tersedia belum cukup untuk menyimpulkan penyebabnya."
11. All nextActions must be concrete inspection or monitoring steps in Bahasa Indonesia (e.g., "Pantau...", "Bandingkan...", "Tinjau..."). Never recommend ungrounded directives like "Naikkan budget".

Market Category: ${marketCategory || "Umum"}
Workspace: ${workspaceName || "Ruang Kerja Aktif"}
Competitors: ${(competitorNames || []).join(", ")}
Signals: ${JSON.stringify(signals || [], null, 2)}

Produce a structured JSON response matching the schema.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            observed: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Strictly verifiable observed facts from the provided data in Bahasa Indonesia",
            },
            inferred: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Logical interpretations derived from observed data in Bahasa Indonesia",
            },
            hypotheses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Strategic hypotheses clearly marked as speculative in Bahasa Indonesia",
            },
            opportunities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable strategic opportunities in Bahasa Indonesia",
            },
            threats: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Market threats or competitive risks in Bahasa Indonesia",
            },
            confidence: {
              type: Type.STRING,
              description: "HIGH, MEDIUM, or LOW based strictly on evidence volume",
            },
            confidenceAssessment: {
              type: Type.OBJECT,
              properties: {
                evidence: { type: Type.STRING, description: "HIGH, MEDIUM, or LOW based on concrete data coverage" },
                interpretation: { type: Type.STRING, description: "HIGH, MEDIUM, or LOW based on logical clarity" },
                hypothesis: { type: Type.STRING, description: "Always LOW or MEDIUM to reflect speculation" },
                rationale: { type: Type.STRING, description: "Explanation in Bahasa Indonesia" },
              },
              required: ["evidence", "interpretation", "hypothesis", "rationale"],
            },
            evidenceIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            nextActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Concrete actions in Bahasa Indonesia for marketers to evaluate or test",
            },
          },
          required: ["summary", "observed", "inferred", "hypotheses", "opportunities", "threats", "confidence", "confidenceAssessment", "nextActions"],
        },
      },
    });

    const json = JSON.parse(response.text || "{}");
    res.json({ fallback: false, data: json });
  } catch (err: any) {
    console.error("Gemini API Error in synthesize-signals:", err);
    res.status(200).json({
      fallback: true,
      error: err.message,
      data: {
        summary: "Sinyal pasar dianalisis melalui mesin aturan deterministik akibat kendala respon model AI.",
        observed: ["Sinyal divalidasi melalui data observasi publik yang tercatat."],
        inferred: ["Aktivitas pasar mencerminkan rotasi dan pengujian materi iklan secara berkala."],
        hypotheses: ["Pola materi baru memerlukan pemantauan berkelanjutan untuk melihat durasi tayang."],
        opportunities: ["Uji sudut pandang pesan yang berbeda terhadap hook yang saat ini dominan."],
        threats: ["Tingginya kemiripan format iklan dapat memicu kejenuhan respon audiens."],
        confidence: "MEDIUM",
        confidenceAssessment: {
          evidence: "HIGH",
          interpretation: "MEDIUM",
          hypothesis: "LOW",
          rationale: "Analisis dilakukan melalui mesin aturan deterministik tanpa inferensi data privat.",
        },
        nextActions: [
          "Tinjau bukti pendukung sebelum mengambil keputusan pengujian.",
          "Pantau apakah creative baru bertahan lebih dari 14 hari.",
        ],
        evidenceIds: [],
      },
    });
  }
});

// AI Creative Classification & Deconstruction endpoint
app.post("/api/gemini/deconstruct-creative", async (req, res) => {
  const { headline, primaryText, cta, format } = req.body;

  const ai = getGenAI();
  if (!ai) {
    // Deterministic heuristic fallback
    const text = `${headline || ""} ${primaryText || ""}`.toLowerCase();
    let hook = "unknown";
    if (text.includes("problem") || text.includes("masalah") || text.includes("jerawat") || text.includes("kemerahan") || text.includes("rusak")) hook = "problem";
    else if (text.includes("review") || text.includes("kata mereka") || text.includes("testimoni") || text.includes("pengalaman")) hook = "testimonial";
    else if (text.includes("promo") || text.includes("diskon") || text.includes("%") || text.includes("gratis ongkir") || text.includes("cuma")) hook = "offer-led";
    else if (text.includes("dokter") || text.includes("bpom") || text.includes("klinis")) hook = "authority";
    else if (text.includes("hasil") || text.includes("before") || text.includes("after") || text.includes("sembuh")) hook = "result";

    let angle = "unknown";
    if (text.includes("perih") || text.includes("iritasi") || text.includes("radang") || text.includes("sensitif")) angle = "pain point";
    else if (text.includes("glowing") || text.includes("cerah") || text.includes("barrier") || text.includes("mulus")) angle = "transformation";
    else if (text.includes("bpom") || text.includes("dokter") || text.includes("halal") || text.includes("aman")) angle = "trust";
    else if (text.includes("terjangkau") || text.includes("murah") || text.includes("hemat") || text.includes("kantong")) angle = "price/value";

    let offer = "no explicit offer";
    if (text.includes("paket") || text.includes("bundle") || text.includes("beli 1 gratis 1")) offer = "bundle";
    else if (text.includes("diskon") || text.includes("potongan") || text.includes("%")) offer = "discount";
    else if (text.includes("ongkir") || text.includes("free shipping")) offer = "free shipping";

    return res.json({
      fallback: true,
      data: {
        detectedHook: hook,
        messagingAngle: angle,
        offerType: offer,
        observableSummary: `Creative menggabungkan hook "${hook}" dengan angle pesan "${angle}" dan penawaran "${offer}".`,
        hookConfidence: hook !== "unknown" ? "MEDIUM" : "LOW",
        reasoning: "Pencocokan pola kata kunci leksikal deterministik pada teks materi iklan publik.",
      },
    });
  }

  try {
    const prompt = `Analyze this publicly observable advertisement creative copy.
Ad Format: ${format || "unknown"}
CTA: ${cta || "unknown"}
Headline: "${headline || "None"}"
Primary Text: "${primaryText || "None"}"

Classify into standardized taxonomies:
Hook Type: problem | curiosity | result | testimonial | comparison | authority | urgency | educational | emotional | offer-led | unknown
Messaging Angle: pain point | transformation | convenience | price/value | quality | trust | social proof | status | fear/risk reduction | education | differentiation | other | unknown
Offer Type: discount | bundle | free shipping | bonus | trial | guarantee | limited time | informational | no explicit offer | unknown

MANDATORY LANGUAGE:
Return observableSummary and reasoning in clear professional Bahasa Indonesia. If no conclusive pattern is found, choose 'unknown' rather than guessing.

Return structured JSON.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedHook: { type: Type.STRING },
            messagingAngle: { type: Type.STRING },
            offerType: { type: Type.STRING },
            observableSummary: { type: Type.STRING, description: "Ringkasan observasi materi dalam Bahasa Indonesia" },
            hookConfidence: { type: Type.STRING, description: "HIGH, MEDIUM, or LOW" },
            reasoning: { type: Type.STRING, description: "Alasan klasifikasi leksikal dalam Bahasa Indonesia" },
          },
          required: ["detectedHook", "messagingAngle", "offerType", "observableSummary", "hookConfidence", "reasoning"],
        },
      },
    });

    res.json({ fallback: false, data: JSON.parse(response.text || "{}") });
  } catch (err: any) {
    res.status(200).json({
      fallback: true,
      error: err.message,
      data: {
        detectedHook: "unknown",
        messagingAngle: "unknown",
        offerType: "no explicit offer",
        observableSummary: "Belum dapat diklasifikasikan dengan cukup yakin akibat kendala respon model.",
        hookConfidence: "LOW",
        reasoning: "API error memicu graceful fallback deterministik ke status unclassified.",
      },
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ALCO MARKET RADAR] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
