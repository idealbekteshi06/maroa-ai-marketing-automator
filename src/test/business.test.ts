import { describe, it, expect } from "vitest";
import { pickPrimaryBusiness } from "@/lib/business";

describe("pickPrimaryBusiness", () => {
  it("returns null for empty/missing input", () => {
    expect(pickPrimaryBusiness(null)).toBeNull();
    expect(pickPrimaryBusiness(undefined)).toBeNull();
    expect(pickPrimaryBusiness([])).toBeNull();
  });

  it("prefers the onboarded business over earlier non-onboarded rows", () => {
    const rows = [
      { id: "dup", onboarding_complete: false },
      { id: "real", onboarding_complete: true },
    ];
    expect(pickPrimaryBusiness(rows)?.id).toBe("real");
  });

  it("falls back to the first row when none are onboarded", () => {
    const rows = [
      { id: "first", onboarding_complete: false },
      { id: "second", onboarding_complete: null },
    ];
    expect(pickPrimaryBusiness(rows)?.id).toBe("first");
  });

  it("handles the multi-business account shape that broke .maybeSingle()", () => {
    // Two rows for one user_id — the case PostgREST 406s on with maybeSingle().
    const rows = [
      { id: "a", onboarding_complete: true },
      { id: "b", onboarding_complete: true },
    ];
    expect(pickPrimaryBusiness(rows)?.id).toBe("a");
  });
});
