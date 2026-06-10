import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression guards — turn the AUDIT_2026-06-10.md findings into CI tripwires.
 *
 * Every bug guarded here has been introduced into this codebase MORE THAN ONCE
 * (the April-17 tree restore wiped the PR-#4/PR-#7 fixes and re-shipped them).
 * These tests fail the build the moment a known-bad pattern reappears, so a
 * future wholesale restore can't silently regress the same defects again.
 */

const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

const FILES = walk(SRC).map((p) => ({ path: p.replace(SRC + "/", "src/"), text: readFileSync(p, "utf8") }));

describe("regression guards (audit findings → CI tripwires)", () => {
  it("P0 §1: no business read does `.eq(\"user_id\", …).maybeSingle()/.single()` (multi-row → PostgREST error)", () => {
    // A user can own multiple businesses rows; a single-row read on user_id
    // errors and broke login + businessId app-wide. Reads must be lists +
    // pickPrimaryBusiness(). Allow the comment in lib/business.ts.
    const offenders = FILES.filter((f) => {
      if (f.path === "src/lib/business.ts") return false;
      // collapse whitespace so multi-line chains are caught
      const flat = f.text.replace(/\s+/g, " ");
      return /\.eq\(\s*["']user_id["'][^)]*\)\s*\.maybeSingle\(\)/.test(flat)
        || /\.eq\(\s*["']user_id["'][^)]*\)\s*\.single\(\)/.test(flat);
    });
    expect(offenders.map((f) => f.path)).toEqual([]);
  });

  it("P1 §2a: no bare `caption` column selected from generated_content (column does not exist → 400)", () => {
    // Pull every `.select("…")` string literal, keep those that select a bare
    // `caption` token (a `caption` not preceded by `instagram_`/`facebook_`).
    const offenders = FILES.filter((f) => {
      const flat = f.text.replace(/\s+/g, " ");
      if (!flat.includes('from("generated_content")') && !flat.includes("from('generated_content')")) return false;
      const selectLiterals = flat.match(/\.select\(\s*["'][^"']*["']/g) ?? [];
      return selectLiterals.some((sel) => /(^|[,\s"'(])caption(?![_a-zA-Z])/.test(sel));
    });
    expect(offenders.map((f) => f.path)).toEqual([]);
  });

  it("§4: the React #310 hooks build-gate is wired (config + prebuild script present)", () => {
    expect(existsSync(join(process.cwd(), "eslint.hooks.config.js"))).toBe(true);
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    expect(pkg.scripts.prebuild).toBeTruthy();
    expect(pkg.scripts["lint:hooks"]).toBeTruthy();
  });

  it("§4: CI workflow exists and runs the verification gates", () => {
    const ci = join(process.cwd(), ".github/workflows/ci.yml");
    expect(existsSync(ci)).toBe(true);
    const text = readFileSync(ci, "utf8");
    for (const step of ["tsc --noEmit", "eslint", "lint:hooks", "run build", "test"]) {
      expect(text).toContain(step);
    }
  });

  it("§2b: DashboardContent 'Generate Now' awaits a real result, not fire-and-forget instant-content", () => {
    const f = FILES.find((x) => x.path === "src/components/dashboard/DashboardContent.tsx")!;
    expect(f.text).toContain("generateContentNow");
    // the old regressed pattern: fire-and-forget instant-content + unconditional success
    expect(f.text).not.toMatch(/apiFireAndForget\(\s*["']\/webhook\/instant-content["']/);
  });
});
