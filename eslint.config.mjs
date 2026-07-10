import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // React Three Fiber scene code: mutating refs/scene objects inside
    // useFrame is the intended R3F pattern (per-frame updates without
    // re-renders). The compiler-era immutability rules don't apply here.
    files: ["src/components/city/**"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
  {
    // Entry gates initialize state from external stores (localStorage,
    // URL params, WebGL capability) that can only be read post-mount.
    files: ["src/components/mode-gate.tsx", "src/components/city/city-gate.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
