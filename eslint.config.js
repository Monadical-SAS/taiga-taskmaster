import functional from "eslint-plugin-functional";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/taiga-api-test/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
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
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "functional/functional-parameters": "off",
      "functional/prefer-immutable-types": "off",
      "functional/no-mixed-types": "off",
      "functional/no-expression-statements": "warn",
      "functional/no-throw-statements": "off",
      "functional/no-return-void": "off",
      "functional/no-conditional-statements": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      // Disable all functional rules for tests
      "functional/no-expression-statements": "off",
      "functional/no-return-void": "off",
      "functional/no-conditional-statements": "off",
      "functional/functional-parameters": "off",
      "functional/prefer-immutable-types": "off",
      "functional/no-throw-statements": "off",
      "functional/no-mixed-types": "off",
      "functional/immutable-data": "off",
      "functional/no-loop-statements": "off",
    },
  }
);
