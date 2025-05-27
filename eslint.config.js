import functional from "eslint-plugin-functional";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/dist/**", "**/node_modules/**"],
    extends: [
      functional.configs.externalTypeScriptRecommended,
      functional.configs.recommended,
      functional.configs.stylistic,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_" }
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "functional/no-expression-statements": "off",
      "functional/no-return-void": "off",
    },
  }
);