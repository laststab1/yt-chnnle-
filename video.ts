import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const exec = promisify(execFile);

export async function ffprobeDuration(file: string) {
  const { stdout } = await exec("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file
  ]);
  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration)) throw new Error("Unable to read video duration");
  return duration;
}

function sampleTimes(duration: number) {
  if (duration <= 20) return [0, duration * .25, duration * .5, duration * .75, Math.max(0, duration - .2)];
  const count = Math.min(36, Math.max(8, Math.ceil(duration / 15)));
  const times = new Set<number>([0, Math.max(0, duration - .2), duration / 2]);
  for (let i = 1; i < count - 1; i++) times.add((duration * i) / (count - 1));
  return [...times].sort((a,b) => a-b);
}

export async function extractFrames(video: string, outDir: string) {
  await fs.mkdir(outDir, { recursive: true });
  const times = sampleTimes(await ffprobeDuration(video));
  const frames: { path: string; timestamp: number }[] = [];
  for (let i = 0; i < times.length; i++) {
    const out = path.join(outDir, `frame-${String(i).padStart(3,"0")}.jpg`);
    await exec("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-ss", times[i].toFixed(3),
      "-i", video, "-frames:v", "1", "-vf", "scale='min(1280,iw)':-2",
      "-q:v", "4", "-y", out
    ]);
    frames.push({ path: out, timestamp: times[i] });
  }
  return frames;
}

export async function extractAudio(video: string, outFile: string) {
  await exec("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-i", video,
    "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", "-y", outFile
  ]);
}