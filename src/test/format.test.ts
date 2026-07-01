import { describe, it, expect } from "vitest";
import { formatCurrency, formatNumber, formatPercent, timeAgo, fmt } from "@/lib/format";

describe("format helpers tolerate garbage input (never throw, never NaN)", () => {
  it("formatNumber", () => {
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(null)).toBe("0");
    expect(formatNumber("not a number")).toBe("0");
    expect(formatNumber(undefined)).toBe("0");
  });

  it("formatCurrency", () => {
    expect(formatCurrency(1500)).toBe("$1,500");
    expect(formatCurrency(null)).toBe("$0");
    expect(formatCurrency(NaN)).toBe("$0");
  });

  it("formatPercent", () => {
    expect(formatPercent(12.345)).toBe("12.3%");
    expect(formatPercent("x")).toBe("—");
  });

  it("timeAgo", () => {
    expect(timeAgo(null)).toBe("—");
    expect(timeAgo("not a date")).toBe("—");
    expect(timeAgo(new Date().toISOString())).toBe("just now");
    expect(timeAgo(new Date(Date.now() - 120_000).toISOString())).toBe("2 min ago");
  });

  it("fmt.roas / fmt.name edge cases", () => {
    expect(fmt.roas(0)).toBe("—");
    expect(fmt.roas(2.5)).toBe("2.5x");
    expect(fmt.name({ email: "lira@example.com" })).toBe("Lira");
    expect(fmt.name({})).toBe("Unknown");
  });
});
