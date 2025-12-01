import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  // Relax rules for test files and config files
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "tests/**/*", "jest.config.js", "jest.setup.js"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  // Relax unescaped entities rule for JSX (common in text content)
  // and allow any in component files (to be fixed incrementally)
  {
    files: ["**/*.tsx"],
    rules: {
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Allow any in API routes (often needed for dynamic responses)
  {
    files: ["src/pages/api/**/*", "src/lib/api/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;
