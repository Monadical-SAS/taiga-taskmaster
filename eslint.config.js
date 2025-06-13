import functional from "eslint-plugin-functional";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/taiga-api-test/**", "**/tasks-machine-simulator-frontend/**"],
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
      "functional/readonly-type": "off",
      // Prohibit vi.doMock to prevent global mocking issues
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name='doMock']",
          message:
            "vi.doMock is prohibited. Use proper dependency injection or function mocking instead.",
        },
      ],
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
  },
  {
    files: [
      "**/taskmaster-test/**/*.ts",
      "**/tasktracker-test/**/*.ts",
      "**/taiga-api-test/**/*.ts",
      "**/*-test/**/*.ts",
      "**/manual-test.ts",
    ],
    rules: {
      // Disable all functional rules and strict TypeScript rules for test packages
      "functional/no-expression-statements": "off",
      "functional/no-return-void": "off",
      "functional/no-conditional-statements": "off",
      "functional/functional-parameters": "off",
      "functional/prefer-immutable-types": "off",
      "functional/no-throw-statements": "off",
      "functional/no-mixed-types": "off",
      "functional/immutable-data": "off",
      "functional/no-loop-statements": "off",
      "functional/no-let": "off",
      "functional/no-try-statements": "off",
      "functional/prefer-readonly-type": "off",
      "functional/no-classes": "off",
      "functional/no-this-expressions": "off",
      "functional/prefer-tacit": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
