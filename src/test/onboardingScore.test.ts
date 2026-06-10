import { describe, it, expect } from "vitest";
import { normalizeOnboardingScore } from "@/lib/apiClient";

describe("normalizeOnboardingScore", () => {
  it("returns null for null/undefined/malformed input (no Object.entries crash)", () => {
    expect(normalizeOnboardingScore(null)).toBeNull();
    expect(normalizeOnboardingScore(undefined)).toBeNull();
    // The exact prod-crash shape: a value with no numeric score.
    expect(normalizeOnboardingScore({} as never)).toBeNull();
    expect(normalizeOnboardingScore({ score: "80" } as never)).toBeNull();
  });

  it("derives thresholds/unlocked/locked from a bare {score} (backend's real shape)", () => {
    const ui = normalizeOnboardingScore({ score: 55 });
    expect(ui).not.toBeNull();
    expect(ui!.score).toBe(55);
    // 55 unlocks social_posts(30) + email_sms(50); locks the rest.
    expect(ui!.unlocked).toEqual(["social_posts", "email_sms"]);
    expect(ui!.locked).toEqual(["paid_ads", "full_autopilot", "premium_accuracy"]);
    expect(ui!.next_unlock).toBe("paid_ads");
    expect(ui!.thresholds.paid_ads).toEqual({ required: 70, unlocked: false });
  });

  it("passes through missing_fields and handles a perfect score", () => {
    const ui = normalizeOnboardingScore({ score: 100, missing_fields: ["logo"] });
    expect(ui!.missing_for_next).toEqual(["logo"]);
    expect(ui!.locked).toEqual([]);
    expect(ui!.next_unlock).toBeNull();
  });

  it("treats a zero score as usable (not null) so the widget can show 0%", () => {
    const ui = normalizeOnboardingScore({ score: 0 });
    expect(ui).not.toBeNull();
    expect(ui!.score).toBe(0);
    expect(ui!.unlocked).toEqual([]);
  });
});
