import type { Report } from "@/types/report";

export interface AnalysisInput {
  title: string;
  description: string;
  tags: string[];
  transcript: string;
  frames: { base64: string; timestamp: number }[];
  thumbnailBase64?: string;
  duration: number;
}

export interface AIProvider {
  analyze(input: AnalysisInput): Promise<Report>;
}