import type { AIProvider, AnalysisInput } from "./types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import type { Report } from "@/types/report";
import { POLICY_VERSION } from "@/lib/policy/rules";

function normalize(raw: any, input: AnalysisInput): Report {
  const valid = ["NONE","LOW","MEDIUM","HIGH","CRITICAL"];
  const categories = Array.isArray(raw?.categories) ? raw.categories : [];
  const safeCategories = categories.map((c: any) => ({
    name: c.name,
    risk: valid.includes(c.risk) ? c.risk : "NONE",
    confidence: Math.max(0, Math.min(1, Number(c.confidence) || 0)),
    summary: String(c.summary || ""),
    timestamps: Array.isArray(c.timestamps) ? c.timestamps.map((t: any) => ({
      start: Math.max(0, Number(t.start) || 0),
      end: t.end == null ? undefined : Math.max(0, Number(t.end) || 0),
      reason: String(t.reason || ""),
      evidence: t.evidence ? String(t.evidence) : undefined
    })) : []
  }));
  return {
    policyVersion: POLICY_VERSION,
    overallRisk: valid.includes(raw?.overallRisk) ? raw.overallRisk : "LOW",
    categories: safeCategories,
    executiveSummary: String(raw?.executiveSummary || "No conclusive policy risk was identified."),
    recommendations: Array.isArray(raw?.recommendations) ? raw.recommendations.map(String).slice(0,10) : [],
    titleAnalysis: String(raw?.titleAnalysis || ""),
    descriptionAnalysis: String(raw?.descriptionAnalysis || ""),
    thumbnailAnalysis: String(raw?.thumbnailAnalysis || (input.thumbnailBase64 ? "Thumbnail was supplied for analysis." : "No thumbnail supplied.")),
    transcriptAnalysis: String(raw?.transcriptAnalysis || ""),
    processing: {
      duration: input.duration,
      sampledFrames: input.frames.length,
      transcriptAvailable: Boolean(input.transcript)
    },
    disclaimer: "This is an AI-based risk assessment, not an official YouTube decision."
  };
}

function extractJson(text: string) {
  const cleaned = text.replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```$/,"").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("AI returned invalid JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}

class OpenAIProvider implements AIProvider {
  async analyze(input: AnalysisInput) {
    const key = process.env.AI_API_KEY;
    if (!key) throw new Error("AI_API_KEY is not configured");
    const content: any[] = [{ type: "text", text: buildUserPrompt(input) }];
    for (const frame of input.frames) {
      content.push({ type: "text", text: `Frame timestamp: ${frame.timestamp.toFixed(2)} seconds` });
      content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${frame.base64}` }});
    }
    if (input.thumbnailBase64) {
      content.push({ type: "text", text: "Thumbnail:" });
      content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${input.thumbnailBase64}` }});
    }
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4.1-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content }
        ]
      })
    });
    if (!r.ok) throw new Error(`AI provider error: ${r.status}`);
    const data = await r.json();
    return normalize(extractJson(data.choices?.[0]?.message?.content || ""), input);
  }
}

class AnthropicProvider implements AIProvider {
  async analyze(input: AnalysisInput) {
    const key = process.env.AI_API_KEY;
    if (!key) throw new Error("AI_API_KEY is not configured");
    const content: any[] = [{ type: "text", text: buildUserPrompt(input) }];
    for (const frame of input.frames) {
      content.push({ type: "text", text: `Frame timestamp: ${frame.timestamp.toFixed(2)} seconds` });
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: frame.base64 }});
    }
    if (input.thumbnailBase64) content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: input.thumbnailBase64 }});
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key, "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "claude-sonnet-4-5",
        max_tokens: 5000,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content }]
      })
    });
    if (!r.ok) throw new Error(`AI provider error: ${r.status}`);
    const data = await r.json();
    const text = data.content?.map((x:any) => x.text || "").join("") || "";
    return normalize(extractJson(text), input);
  }
}

class GeminiProvider implements AIProvider {
  async analyze(input: AnalysisInput) {
    const key = process.env.AI_API_KEY;
    if (!key) throw new Error("AI_API_KEY is not configured");
    const parts: any[] = [{ text: buildSystemPrompt() + "\\n\\n" + buildUserPrompt(input) }];
    for (const frame of input.frames) {
      parts.push({ text: `Frame timestamp: ${frame.timestamp.toFixed(2)} seconds` });
      parts.push({ inlineData: { mimeType: "image/jpeg", data: frame.base64 }});
    }
    if (input.thumbnailBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: input.thumbnailBase64 }});
    const model = process.env.AI_MODEL || "gemini-2.5-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ contents: [{ role:"user", parts }], generationConfig: { temperature:0.1, responseMimeType:"application/json" }})
    });
    if (!r.ok) throw new Error(`AI provider error: ${r.status}`);
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("") || "";
    return normalize(extractJson(text), input);
  }
}

export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  if (provider === "anthropic") return new AnthropicProvider();
  if (provider === "gemini") return new GeminiProvider();
  return new OpenAIProvider();
}