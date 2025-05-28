# TYPESCRIPT PROJECT TOOLING STANDARDS

---

## Monorepo Setup Requirements

When creating or working with TypeScript monorepos, follow these mandatory configurations:

### Package Manager & Workspace Setup

- Use **pnpm workspaces** exclusively for monorepo management
- Create `pnpm-workspace.yaml` in the root:

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

- All packages must be **ESModules** - set `"type": "module"` in root and all package-level `package.json` files
- Use `workspace:*` protocol for internal dependencies

### TypeScript Configuration (Mandatory)

Every TypeScript project must include **incremental compilation** and **composite builds**:

**Root tsconfig.json:**

```json
{
  "compilerOptions": {
    /* Base Options: */
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    /* Strictness */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    /* For transpiling with TypeScript: */
    "module": "NodeNext",
    "outDir": "dist",
    "sourceMap": true,

    /* For library packages in monorepo: */
    "declaration": true,
    "composite": true,
    "declarationMap": true,
    "incremental": true,

    /* Environment-specific lib arrays: */
    "lib": ["es2022"] /* Add "dom", "dom.iterable" for browser code */
  },
  "references": [
    /* Add all workspace packages here */
  ]
}
```

**Package-level tsconfig.json requirements:**

- Must extend root config or include same options
- Must include `"composite": true` for all library packages
- Must include `"incremental": true`
- Use appropriate `"lib"` array based on runtime (Node.js vs browser)

### ESLint Configuration (Mandatory)

Install and configure ESLint with functional programming rules:

```bash
pnpm add -Dw eslint eslint-plugin-functional typescript-eslint
```

**Root eslint.config.js:**

```javascript
import functional from "eslint-plugin-functional";
import tseslint from "typescript-eslint";

export default tseslint.config({
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
    // Add any custom rule overrides here
  },
});
```

### Prettier Configuration (Mandatory)

Install and configure Prettier for consistent code formatting:

```bash
pnpm add -Dw prettier
```

**Root .prettierrc:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Required Scripts in Root package.json

```json
{
  "scripts": {
    "build": "pnpm -r run build",
    "dev": "pnpm -r run dev",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit"
  }
}
```

### Installation Commands

- Root dependencies: `pnpm install`
- Workspace root deps: `pnpm add <package> -w`
- Package-specific deps: `pnpm add <package> --filter <workspace>`
- Internal dependencies: `pnpm add <internal-package> --workspace`

### Key Rules

1. **Always enable incremental compilation**: Include `"incremental": true` and `"composite": true`
2. **ESModule consistency**: Use `"type": "module"` in ALL package.json files
3. **Functional programming**: ESLint functional rules are mandatory for code quality
4. **Consistent formatting**: Prettier must be configured and used
5. **TypeScript project references**: Set up references between dependent packages
6. **Source maps**: Always enable for debugging (`"sourceMap": true`)
7. **Unit testing**: ALWAYS make sure unit testing is set up and ready to go

---
