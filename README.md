# YT Policy Checker

A real Next.js application for pre-publication YouTube policy risk assessment. It analyzes sampled video frames, transcript/audio, OCR-like visible text through the vision model, title, description, tags, thumbnail, and overall context.

**Important:** This is an AI-based risk assessment, not an official YouTube decision. It does not predict or guarantee removal, age restriction, demonetization, or strikes.

## Requirements

- Node.js 20+
- FFmpeg + ffprobe installed and available on PATH
- An AI provider key
- A transcription key (the default implementation uses OpenAI transcription)

## Run

```bash
npm install
cp .env.example .env.local
# edit .env.local
npm run dev
```

Open http://localhost:3000.

For production:

```bash
npm run build
npm start
```

## Environment

See `.env.example`.

`AI_PROVIDER` selects the policy-analysis adapter. The included adapters are OpenAI, Anthropic, and Gemini. `AI_API_KEY` stays server-side.

`TRANSCRIPTION_API_KEY` is used only by the transcription service. If omitted, the app continues without a transcript and reports that limitation.

## Processing

1. Validate upload and metadata.
2. Save to a temporary server directory.
3. Read duration with ffprobe.
4. Extract adaptive representative frames with FFmpeg.
5. Extract audio to a temporary WAV file.
6. Transcribe audio when configured.
7. Send a bounded set of frame images + transcript + metadata to the selected AI provider.
8. Validate and normalize structured JSON.
9. Apply deterministic policy-engine guardrails.
10. Return a report with timestamped findings.
11. Delete temporary video, audio and frames in a `finally` block.

The AI is never asked to make a YouTube enforcement prediction. Its confidence values refer only to confidence in the detected evidence.

## Policy updates

Change `POLICY_VERSION` and update `src/lib/policy/rules.ts`. Rules are data-driven so policy wording and thresholds can be changed without changing the report UI.

The current rules are intentionally phrased as risk signals rather than official enforcement decisions. YouTube's own guidelines note that context, including educational/documentary/scientific/artistic context, can matter.

## Deployment

For production, use a server/container with FFmpeg installed and a writable temporary directory. Do not use a deployment target that cannot run FFmpeg or handle large multipart uploads.

Put the AI keys in server-side environment variables only. Use an object-storage upload flow (presigned/private objects) if your deployment cannot accept large multipart requests directly. Configure strict size/type limits and authentication/rate limiting before exposing the service publicly.

## Security

Temporary uploads are private and deleted after processing. The app does not generate public media URLs. Add authentication, rate limiting, abuse monitoring, and private object storage for a multi-user production deployment.

## Disclaimer

Policy knowledge changes. The report is a screening aid, not a YouTube decision or legal advice.
