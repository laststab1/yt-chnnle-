export const CATEGORIES = [
  "violent_graphic_content",
  "animal_safety",
  "child_safety",
  "sexual_nudity",
  "self_harm_dangerous_behavior",
  "hate_harassment",
  "extremist_criminal_orgs",
  "spam_deception",
  "misinformation",
  "thumbnail_safety",
  "title_description"
] as const;

export type CategoryName = typeof CATEGORIES[number];
export type Risk = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TimestampEvidence {
  start: number;
  end?: number;
  reason: string;
  evidence?: string;
  frameIndex?: number;
}

export interface CategoryResult {
  name: CategoryName;
  risk: Risk;
  confidence: number;
  summary: string;
  timestamps: TimestampEvidence[];
}

export interface Report {
  policyVersion: string;
  overallRisk: Risk;
  categories: CategoryResult[];
  executiveSummary: string;
  recommendations: string[];
  titleAnalysis: string;
  descriptionAnalysis: string;
  thumbnailAnalysis: string;
  transcriptAnalysis: string;
  processing: {
    duration: number;
    sampledFrames: number;
    transcriptAvailable: boolean;
  };
  disclaimer: string;
}