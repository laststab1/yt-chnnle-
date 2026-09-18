import fs from "node:fs/promises";

export async function transcribeAudio(file: string): Promise<string> {
  const key = process.env.TRANSCRIPTION_API_KEY || process.env.AI_API_KEY;
  if (!key) return "";
  const form = new FormData();
  const buffer = await fs.readFile(file);
  form.append("file", new Blob([buffer], { type: "audio/wav" }), "audio.wav");
  form.append("model", process.env.TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form
  });
  if (!r.ok) throw new Error(`Transcription failed: ${r.status}`);
  const data = await r.json();
  return String(data.text || "");
}