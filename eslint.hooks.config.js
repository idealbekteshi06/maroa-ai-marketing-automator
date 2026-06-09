// Build-gating lint config: fails ONLY on React hook-order violations
// (react-hooks/rules-of-hooks). Wired into `npm run build` via the `prebuild`
// script so the React #310 crash class — "Rendered more hooks than during the
// previous render", e.g. a useState after an early return — is caught before
// shipping. Kept separate from eslint.config.js so it isn't blocked by the
// repo's pre-existing lint debt (no-explicit-any etc.); this gate stays green
// unless an actual hook-order bug is introduced.
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    plugins: { "react-hooks": reactHooks },
    rules: { "react-hooks/rules-of-hooks": "error" },
    // This gate cares about exactly one rule; don't flag disable-directives
    // for the dozens of other rules it deliberately doesn't run.
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
);
