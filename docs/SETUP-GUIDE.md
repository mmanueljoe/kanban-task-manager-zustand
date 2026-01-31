# Vite + React + TypeScript: Modern Setup Guide

A reference for setting up a Vite React TypeScript project with Yarn, ESLint, Prettier, and pre-commit hooks. Use this doc when starting a new project or when you hit setup or formatting issues.

---

## 1. Where to Get the Most Updated Info

Always prefer **official** and **recent** sources. Check these first:

| Topic                  | Source                                                                                    | Why                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Vite**               | [vitejs.dev/guide](https://vitejs.dev/guide/)                                             | Official getting started, CLI, scripts.                                           |
| **Scaffold**           | [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)              | Official templates; `template-react-ts` shows current structure and ESLint setup. |
| **ESLint flat config** | [eslint.org/config](https://eslint.org/docs/latest/use/configure/configuration-files-new) | ESLint 9+ uses flat config; old `.eslintrc` is legacy.                            |
| **typescript-eslint**  | [typescript-eslint.io](https://typescript-eslint.io/)                                     | TypeScript + ESLint; recommended configs and parser options.                      |
| **Prettier**           | [prettier.io/docs](https://prettier.io/docs/en/)                                          | Options (e.g. `printWidth`, `singleQuote`) and integration with ESLint.           |
| **React + Vite**       | [vitejs.dev/guide](https://vitejs.dev/guide/) → Scaffolding                               | `yarn create vite` and template list (e.g. `react-ts`).                           |

**Quick check for “current” setup:**  
Open the [Vite repo `template-react-ts`](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) and look at `package.json` and `eslint.config.js`. That is the baseline the maintainers use.

---

## 2. Modern Setup (Step-by-Step)

### 2.1 Create the project (Yarn)

```bash
yarn create vite <project-name> --template react-ts
cd <project-name>
yarn install
```

Use `react-ts` for React + TypeScript. Other templates: `react`, `vue`, `vue-ts`, etc. (see [Vite guide](https://vitejs.dev/guide/)).

### 2.2 Add ESLint + Prettier (add to existing project)

**Install (Yarn):**

```bash
yarn add -D @eslint/js globals eslint eslint-config-prettier eslint-plugin-prettier eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh typescript-eslint prettier
```

**Add `eslint.config.js`** (flat config) at project root. Use:

- `defineConfig` and `globalIgnores` from `eslint/config`
- `js.configs.recommended`, `tseslint.configs.recommended` or `recommendedTypeChecked`, `react.configs.flat.recommended`, `reactHooks.configs.flat.recommended`, `reactRefresh.configs.vite`
- `eslint-config-prettier` and `eslint-plugin-prettier` with rule `'prettier/prettier': 'error'`
- `languageOptions`: `ecmaVersion: 2020`, `globals: globals.browser`
- For type-aware rules: `parserOptions.project` pointing at `tsconfig.app.json` (and `tsconfig.node.json` if you lint config files), `tsconfigRootDir: import.meta.dirname`
- Turn off `react/react-in-jsx-scope` for the new JSX transform

**Add `.prettierrc`** (example):

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "semi": true
}
```

**Add `.prettierignore`** for `dist`, `node_modules`, lockfiles, `.husky`, env files.

### 2.3 Scripts in `package.json`

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write ."
```

### 2.4 Optional: Pre-commit (Husky + lint-staged)

```bash
yarn add -D husky lint-staged
yarn exec husky init
```

- In `package.json`: `"prepare": "husky"`.
- Create `.husky/pre-commit` with: `yarn lint-staged` (or `npx lint-staged`).
- In `package.json` add:

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx,json,css,md}": [
    "prettier --write --ignore-unknown",
    "eslint --fix"
  ]
}
```

---

## 3. Challenges and How to Fix Them

### 3.1 “Replace … with …” / Prettier formatting “errors” in ESLint

**Symptom:** ESLint reports something like:  
`Replace multi-line JSX props with single-line` (or the opposite).

**Cause:**  
The message comes from **Prettier** via `eslint-plugin-prettier` (rule `prettier/prettier`). ESLint is only surfacing Prettier’s desired output; the “error” is “your file doesn’t match what Prettier would output.”

**Fix:**

1. **Let Prettier fix the file (recommended):**

   ```bash
   yarn format
   # or
   npx prettier --write src/App.tsx
   ```

   Then save. The ESLint error goes away because the file matches Prettier.

2. **If you prefer multi-line JSX:**  
   Lower `printWidth` in `.prettierrc` (e.g. `60` or `70`) so the tag no longer fits on one line. Prettier will keep it wrapped. This applies to the whole project.

**Do not:** Remove the component or change logic; only formatting (line breaks) needs to match Prettier.

---

### 3.2 I changed the line / ran `yarn format` but the error is still there

**Possible causes:**

1. **Wrong formatter in the editor**  
   The IDE might be using a different formatter (or Biome) and overwriting Prettier’s changes. Set the default formatter for TS/TSX to Prettier and, if you use it, “Format on Save” with Prettier.

2. **`printWidth` too small (e.g. 20)**  
   If `.prettierrc` has something like `"printWidth": 20`, Prettier will wrap almost everything and the file can look “wrong” or keep conflicting with ESLint. Use a normal value (e.g. **80**). Then run `yarn format` again.

3. **Several similar components**  
   If there are multiple `<Checkbox … />` (or similar) with the same style, fix **all** of them (or run `yarn format` on the whole project) so every occurrence matches Prettier.

4. **Config not applied**  
   Ensure `.prettierrc` is at the project root and not overridden by another config (e.g. in a parent directory or editor settings).

---

### 3.3 ESLint and Prettier disagree

**Cause:**  
Prettier and ESLint both have “style” rules. Without integration they can conflict.

**Fix:**

- Use **`eslint-config-prettier`** so ESLint style rules don’t conflict with Prettier.
- Use **`eslint-plugin-prettier`** so Prettier runs as the single source of truth for formatting and ESLint reports “formatting errors” as Prettier output.

Both are in the setup above. Order in `eslint.config.js`: other configs first, then `eslint-config-prettier`, then the block that adds `prettier` plugin and `'prettier/prettier': 'error'`.

---

### 3.4 Lint/format tooling: one stack vs two (e.g. ESLint+Prettier vs Biome)

**Two stacks (ESLint + Prettier + optionally Biome):**

- More common in docs and teams.
- ESLint for lint, Prettier for format; `eslint-plugin-prettier` ties them in ESLint.
- If you also use Biome, point `lint` and `format` at one stack (e.g. ESLint + Prettier) to avoid confusion; keep Biome as an extra script (e.g. `lint:biome`) or remove it for a single toolchain.

**One stack (e.g. Biome only):**

- Single tool for lint + format; faster; one config file.
- Less common in older tutorials; check [biomejs.dev](https://biomejs.dev/) for the latest.

Choose one primary stack and make `yarn lint` / `yarn format` use it consistently.

---

### 3.5 TypeScript/parser errors in ESLint

**Symptom:**  
ESLint can’t parse TS or complains about missing TypeScript config.

**Fix:**

- Use **`typescript-eslint`** and in `eslint.config.js` set `languageOptions.parserOptions.project` to your tsconfig(s), e.g. `['./tsconfig.app.json', './tsconfig.node.json']`, and `tsconfigRootDir: import.meta.dirname`.
- If type-checked rules are too slow or brittle, switch to `tseslint.configs.recommended` (no `project`) instead of `recommendedTypeChecked`.

---

### 3.6 Pre-commit hook not running or failing

- Run `yarn install` so `husky` and `lint-staged` are installed; `prepare` runs `husky` and sets up hooks.
- Ensure `.husky/pre-commit` exists and runs `yarn lint-staged` (or `npx lint-staged`).
- If `lint-staged` fails, run the same commands manually (`yarn format`, `yarn lint:fix`) and fix any real errors; then commit again.

---

## 4. Quick Reference: This Project

- **Lint:** `yarn lint` (ESLint), `yarn lint:fix` (ESLint with auto-fix).
- **Format:** `yarn format` (Prettier).
- **Config:** `eslint.config.js` (flat), `.prettierrc`, `.prettierignore`.
- **Pre-commit:** Husky runs `yarn lint-staged` (Prettier + ESLint --fix on staged files).

When in doubt: run `yarn format` then `yarn lint`; fix any remaining lint errors; use the official links in **Section 1** for the most up-to-date setup details.
