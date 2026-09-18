import type { CategoryName, Risk } from "@/types/report";

export const POLICY_VERSION = process.env.POLICY_VERSION || "2026-09-18";

export const POLICY_RULES: Record<CategoryName, {
  label: string;
  description: string;
  guidance: string;
}> = {
  violent_graphic_content: {
    label: "Violent / Graphic Content",
    description: "Graphic violence, injuries, gore, corpses, torture, attacks, or shock/disgust presentation.",
    guidance: "Review the flagged segment and consider whether context, editing, blurring, or shortening changes the risk."
  },
  animal_safety: {
    label: "Animal Safety",
    description: "Animal cruelty, coerced fighting, graphic animal harm, or staged rescue danger.",
    guidance: "Verify whether the situation is accidental, natural, genuine rescue, or intentionally staged."
  },
  child_safety: {
    label: "Child Safety",
    description: "Danger, abuse, bullying, exploitation, or age-inappropriate themes involving minors.",
    guidance: "Review any minor-related finding carefully; the model must not infer abuse without evidence."
  },
  sexual_nudity: {
    label: "Sexual / Nudity",
    description: "Potential explicit sexual content, sexualized nudity, exploitation, or sexualization of minors.",
    guidance: "Potential minor-related sexual content is treated as critical risk without generating sexual descriptions."
  },
  self_harm_dangerous_behavior: {
    label: "Self-Harm / Dangerous Behavior",
    description: "Encouragement or instructions for harmful behavior or dangerous challenges.",
    guidance: "Do not reproduce harmful instructions in the report."
  },
  hate_harassment: {
    label: "Hate / Harassment",
    description: "Threats, targeted harassment, dehumanization, slurs, or attacks against protected groups.",
    guidance: "Distinguish targeted abuse from criticism, disagreement, satire, or political discussion."
  },
  extremist_criminal_orgs: {
    label: "Extremist / Criminal Organizations",
    description: "Possible praise, promotion, recruitment, or material support for violent extremist/criminal organizations.",
    guidance: "Educational or documentary context should be considered separately."
  },
  spam_deception: {
    label: "Spam / Deception",
    description: "Misleading titles, thumbnails, fake claims, scams, fake engagement, spam, or impersonation signals.",
    guidance: "Compare metadata with the actual content and remove unsupported claims."
  },
  misinformation: {
    label: "Misinformation",
    description: "Potentially harmful misinformation in categories where YouTube has specific restrictions.",
    guidance: "Do not treat opinions or ordinary factual disagreement as misinformation."
  },
  thumbnail_safety: {
    label: "Thumbnail Safety",
    description: "Potentially graphic, sexual, child-safety, shock, or misleading thumbnail signals.",
    guidance: "Ensure the thumbnail accurately represents the video and avoids shock-focused imagery."
  },
  title_description: {
    label: "Title / Description",
    description: "Metadata that may be misleading, shocking, sexual, hateful, spammy, dangerous, or inconsistent with the video.",
    guidance: "Rewrite unsupported or exaggerated claims and align metadata with the actual content."
  }
};

export function maxRisk(risks: Risk[]): Risk {
  const order: Risk[] = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
  return risks.sort((a,b) => order.indexOf(b) - order.indexOf(a))[0] || "NONE";
}