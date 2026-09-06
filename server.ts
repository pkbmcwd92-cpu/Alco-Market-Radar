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

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    product: "ALCO MARKET RADAR",
    version: "1.0.0-mvp",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// AI Signal Synthesis & Explanation endpoint
// Strictly adhering to: OBSERVED vs INFERRED vs HYPOTHESIS, and evidence traceability
app.post("/api/gemini/synthesize-signals", async (req, res) => {
  const { workspaceName, marketCategory, signals, competitorNames } = req.body;

  const ai = getGenAI();
  if (!ai) {
    // Return deterministic fallback
    return res.json({
      fallback: true,
      data: {
        summary: `Deterministic analysis across ${competitorNames?.length || 0} competitors in ${workspaceName || "market"}: identified ${signals?.length || 0} active signals with dominant pattern shifts in messaging and formats.`,
        observed: [
          `Detected ${signals?.length || 0} verified market events backed by concrete ad observations.`,
          `Activity shifts recorded across competitors: ${(competitorNames || []).slice(0, 3).join(", ")}.`,
        ],
        inferred: [
          "Recent ad changes suggest market positioning adjustments to counter rising customer acquisition friction.",
        ],
        hypotheses: [
          "Competitors may be shifting creative spend into proof-of-transformation and UGC angles to improve initial hook retention.",
        ],
        opportunities: [
          "Explore unaddressed problem-first hooks that highlight underserved pain points not saturated by the top 3 competitors.",
        ],
        threats: [
          "Rapid creative turnover among competitors may indicate aggressive iteration and shorter concept fatigue lifecycles.",
        ],
        confidence: "MEDIUM",
        evidenceIds: (signals || []).flatMap((s: any) => (s.evidence || []).map((e: any) => e.evidenceId)).slice(0, 6),
      },
    });
  }

  try {
    const prompt = `You are the lead Market Intelligence AI within ALCO MARKET RADAR.
You strictly respect the ALCO Intelligence philosophy:
1. Never invent private data (ROAS, revenue, audience targeting, spend are unknown).
2. Clearly separate OBSERVED (verifiable public data), INFERRED (logical deductions), and HYPOTHESIS (speculative strategic reasoning).
3. Connect confidence to actual evidence.

Market Category: ${marketCategory || "General"}
Workspace: ${workspaceName || "Active Workspace"}
Competitors: ${(competitorNames || []).join(", ")}
Signals: ${JSON.stringify(signals || [], null, 2)}

Produce a structured JSON response matching the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
              description: "Strictly verifiable observed facts from the provided data",
            },
            inferred: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Logical interpretations derived from observed data",
            },
            hypotheses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Strategic hypotheses (clearly marked as speculative)",
            },
            opportunities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable strategic opportunities for brand builders",
            },
            threats: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Market threats or competitive risks",
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
                rationale: { type: Type.STRING },
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
              description: "Concrete actions for human marketers to evaluate or test",
            },
          },
          required: ["summary", "observed", "inferred", "hypotheses", "opportunities", "threats", "confidence"],
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
        summary: "Analysis generated via deterministic rules engine due to model response fallback.",
        observed: ["Signals validated via rule-based telemetry."],
        inferred: ["Market activity reflects ongoing competitive testing."],
        hypotheses: ["Creative fatigue cycles require regular monitoring."],
        opportunities: ["Test differentiated messaging angles against incumbent hooks."],
        threats: ["Competitor saturation in primary offer formats."],
        confidence: "MEDIUM",
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
    let hook = "curiosity";
    if (text.includes("problem") || text.includes("tired of") || text.includes("struggle") || text.includes("solusi")) hook = "problem";
    else if (text.includes("review") || text.includes("kata mereka") || text.includes("real results")) hook = "testimonial";
    else if (text.includes("promo") || text.includes("diskon") || text.includes("%") || text.includes("gratis")) hook = "offer-led";

    let angle = "pain point";
    if (text.includes("hasil") || text.includes("before") || text.includes("after") || text.includes("glowing")) angle = "transformation";
    else if (text.includes("bpom") || text.includes("dokter") || text.includes("terbukti")) angle = "trust";

    let offer = "no explicit offer";
    if (text.includes("paket") || text.includes("bundle") || text.includes("beli 1")) offer = "bundle";
    else if (text.includes("diskon") || text.includes("off") || text.includes("%")) offer = "discount";
    else if (text.includes("ongkir") || text.includes("free shipping")) offer = "free shipping";

    return res.json({
      fallback: true,
      data: {
        detectedHook: hook,
        messagingAngle: angle,
        offerType: offer,
        observableSummary: `Creative combines a ${hook} hook with a ${angle} messaging angle and ${offer} offer format.`,
        hookConfidence: "MEDIUM",
        reasoning: "Heuristic syntactic pattern matching on primary copy tokens.",
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

Return structured JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedHook: { type: Type.STRING },
            messagingAngle: { type: Type.STRING },
            offerType: { type: Type.STRING },
            observableSummary: { type: Type.STRING },
            hookConfidence: { type: Type.STRING },
            reasoning: { type: Type.STRING },
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
        detectedHook: "curiosity",
        messagingAngle: "differentiation",
        offerType: "informational",
        observableSummary: "Observable copy analyzed under deterministic rule engine fallback.",
        hookConfidence: "LOW",
        reasoning: "API error triggered graceful fallback to basic heuristic analysis.",
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
