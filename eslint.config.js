import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      ".git/**",
      "dist/**",
      "build/**"
    ]
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        React: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        // Node.js globals
        process: "readonly",
        Buffer: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        // Common globals
        console: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        Request: "readonly",
        Response: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "no-undef": "off"
    }
  }
];
