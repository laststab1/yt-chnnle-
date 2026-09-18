import type { Report } from "@/types/report";
import { maxRisk } from "./rules";

export function applyGuardrails(report: Report): Report {
  // Deterministic safety normalization: a model must not produce sexualized
  // descriptions involving minors or procedural self-harm content.
  const categories = report.categories.map(c => {
    if (c.name === "sexual_nudity" && /minor|child|under\s*18|young\s*person/i.test(c.summary + " " + c.timestamps.map(t=>t.reason).join(" "))) {
      return {
        ...c,
        risk: "CRITICAL" as const,
        summary: "Potential minor-related sexual content detected. This may violate YouTube child-safety/sexual-content policies.",
        timestamps: c.timestamps.map(t => ({...t, reason: "Potential minor-related sexual content; review immediately."}))
      };
    }
    if (c.name === "self_harm_dangerous_behavior") {
      return {
        ...c,
        summary: c.summary.replace(/how to|steps?|instructions?|method|recipe/gi, "potential harmful behavior")
      };
    }
    return c;
  });
  return { ...report, categories, overallRisk: maxRisk(categories.map(c=>c.risk)) };
}