// Build-gating lint config: fails ONLY on React hook-order violations
// (react-hooks/rules-of-hooks). Wired into `npm run build` via the `prebuild`
// script so the React #310 crash class — "Rendered more hooks than during the
// previous render", e.g. a useState after an early return — is caught before
// shipping. This gate previously existed (PR #7) and was wiped by the
// April-17 restore; AUDIT_2026-06-10.md §4 restores it. Kept separate from
// eslint.config.js so unrelated lint debt can never block the safety check.
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    plugins: { "react-hooks": reactHooks },
    rules: { "react-hooks/rules-of-hooks": "error" },
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
);
