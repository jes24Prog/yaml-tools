# YAML Workbench

A production-ready, fully client-side **React + TypeScript** workbench with 36 integrated tools for working with YAML — editing, validating, formatting, converting, diffing/merging, querying, generating Kubernetes/docker/CI configs, scanning for secrets, and more. It grew out of the original **YAML Value Override Tool** and keeps that tool as one of its members.

> **100% client-side.** No backend, no database, no API, no external service. Your YAML never leaves the browser.

---

## Table of Contents

1. [Project overview](#1-project-overview)
2. [Tools](#2-tools)
3. [YAML Value Override](#3-yaml-value-override)
4. [Technology stack](#4-technology-stack)
5. [Installation](#5-installation)
6. [Development](#6-development)
7. [Production build](#7-production-build)
8. [Testing](#8-testing)
9. [Architecture](#9-architecture)
10. [Folder structure](#10-folder-structure)
11. [YAML merge algorithm](#11-yaml-merge-algorithm)
12. [Merge rules](#12-merge-rules)
13. [Nested YAML behavior](#13-nested-yaml-behavior)
14. [Array behavior](#14-array-behavior)
15. [Data type handling](#15-data-type-handling)
16. [Local storage behavior](#16-local-storage-behavior)
17. [Security](#17-security)
18. [Privacy](#18-privacy)
19. [Deployment](#19-deployment)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Project overview

**YAML Workbench** is a developer utility that presents every feature as a **tool**. Tools live in a sidebar grouped by category, are switchable via the command palette (`Ctrl+K`) or keyboard shortcuts, and share a common **document model** (the active document plus a tabbed document list) and a **source buffer** convention.

Core concepts:

| Concept | Description |
| ------- | ----------- |
| **Documents** | Tabbed files (`yaml`, `json`, `toml`, `env`, `properties`, `xml`, `text`). All persisted locally and restored on reload. |
| **Active document** | The document most tools read from and write back to via **Apply to active document**. |
| **Tools** | 36 feature panels registered in `src/app/toolRegistry.tsx`, each with a unique id, icon, category and keywords. |
| **Source buffers** | Many tools keep an editable in-tool copy of the active document (`useToolSource`) so they never mutate your file until you explicitly apply. |
| **Workspace** | Save/restore the whole document set, settings, and current tool to a single JSON file (`serializeWorkspace`). |

---

## 2. Tools

| Category | Tools |
| -------- | ----- |
| **Editor** | YAML Editor (Monaco), YAML Tree (collapsible browse) |
| **Validation** | YAML Validator (syntax + top-level issues) |
| **Formatting** | YAML Formatter (indent/quotes/order), YAML Minifier (one-line) |
| **Conversion** | YAML ⇄ JSON, YAML ⇄ TOML, YAML ⇄ Env, YAML ⇄ Properties, YAML ⇄ XML |
| **Diff & Merge** | Diff YAML (tree + unified view), Merge YAML (strategies + per-path conflict resolution), YAML Value Override |
| **Query** | YAML Query (JSONPath-style selectors), Search & Replace (keys/values with regex/whole-word) |
| **Transformation** | YAML Cleaner, YAML Sorter, Flatten / Unflatten (dotted keys) |
| **Schema** | Schema Validator (JSON Schema), Schema Generator (infer a schema from YAML) |
| **Analysis** | YAML Analyzer (stats, depth, empty values, long strings), Docs Generator (Markdown reference) |
| **Environment** | Env Substitution (`${VAR}` placeholders), Env Matrix (compare multiple `.env` files) |
| **Kubernetes** | Kubernetes Inspector, Kubernetes Generators (Deployment, Service, ConfigMap, Secret, HPA, PVC…) |
| **Docker** | Docker Compose Inspector |
| **CI/CD** | CI/CD Inspector (GitHub Actions, GitLab CI, Azure Pipelines) |
| **OpenAPI** | OpenAPI Inspector (paths, servers, security schemes) |
| **Templates** | Template Engine (placeholder rendering) |
| **Snippets** | Reusable YAML building blocks (stored locally) |
| **Generators** | Config Generators (docker-compose, GitHub Actions, Spring Boot, Kubernetes…) |
| **Security** | Secret Scanner (passwords, tokens, private keys) |
| **Workspace** | Multi-Document YAML (split/combine), Workspace (import/export/backup) |
| **Settings** | Theme, font size, tab size, word wrap, export format… |

Every tool's output panel supports **copy**, **download**, and — when it produces YAML — **Apply to active document**.

---

## 3. YAML Value Override

The original single-purpose tool, now one of the diff & merge tools. It overrides values in a **Target** YAML using values from a **Primary** YAML, while preserving the Target's structure, key order, and data types.

```
INPUT 1 (Primary) = VALUE OVERRIDE SOURCE
INPUT 2 (Target)  = OUTPUT KEY/STRUCTURE SOURCE
OUTPUT            = INPUT 2 PRESERVED, WITH MATCHING VALUES REPLACED BY INPUT 1
```

Key options:

- **Update Values** — runs the merge on demand.
- **Auto Update** — debounced re-generation whenever both inputs are valid YAML.
- **Add missing fields** *(default off)* — when enabled, keys that exist **only in the Primary** are appended to the output (at every nesting level), after the Target's keys.
- **Show changes** — lists every overridden key (old → new) and every added field.
- **Format / Copy / Download / Apply to document / Swap / Clear**.

### Example

**Primary** → **Target** → **Output** (with *Add missing fields* off):

```yaml
# Primary
USERNAME-USER: "value"
AGE_AGE: 15
```

```yaml
# Target
PASSWORD_PASS: "12345"
USERNAME-USER: "bababab"
WHATEVER: "HELLO"
AGE_AGE: 152323
```

```yaml
# Output
PASSWORD_PASS: "12345"
USERNAME-USER: "value"
WHATEVER: "HELLO"
AGE_AGE: 15
```

With **Add missing fields** on, a Primary-only key such as `NEW_KEY: 300` would be appended to the output.

---

## 4. Technology stack

| Layer | Choice |
| ----- | ------ |
| Framework | [React 19](https://react.dev) (functional components + hooks) |
| Language | [TypeScript](https://www.typescriptlang.org) (strict mode) |
| Build tool | [Vite 8](https://vitejs.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + CSS custom properties |
| YAML engine | [`yaml`](https://www.npmjs.com/package/yaml) v2 |
| TOML engine | [`smol-toml`](https://www.npmjs.com/package/smol-toml) |
| XML engine | [`fast-xml-parser`](https://www.npmjs.com/package/fast-xml-parser) |
| Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/react` |
| Testing | [Vitest](https://vitest.dev) |

---

## 5. Installation

Requirements: **Node.js 20+** and **npm**.

```bash
cd yaml-tools
npm install
```

---

## 6. Development

```bash
npm run dev
```

Opens the Vite dev server (default `http://localhost:5173`). Edit `src/` — Vite hot-reloads.

---

## 7. Production build

```bash
npm run build      # type-checks (tsc) then bundles with Vite
npm run preview    # serves the production build locally
```

Output is emitted to `dist/`.

---

## 8. Testing

```bash
npm run test       # runs the Vitest suite once
npm run test:watch # runs tests in watch mode
npm run lint       # type-checks with tsc --noEmit
```

The suite covers the full merge contract, including the *add missing fields* option, plus YAML parser behavior. Business logic (`src/services/`) is pure TypeScript with zero React dependencies and is fully unit-testable.

---

## 9. Architecture

The application is split into **presentation** (`components/`, `features/`, `app/`) and **business logic** (`services/`, `utils/`, `hooks/`).

- **Tool registry** — `src/app/toolRegistry.tsx` declares all 36 tools (id, name, description, category, keywords, icon, component, shortcut) and exposes `toolById(id)`.
- **Workbench context** — `src/app/workbenchContext.tsx` owns documents, tabs, settings/theme, active tool, favorites/recents, notifications and the command-palette flag, and persists everything to `localStorage`.
- **Tool shell** — `src/features/shared/ToolShell.tsx` provides shared UI primitives (`ToolPage`, `ToolButton`, `YamlSourcePanel`, `OutputView`, `SplitLayout`, `Stat`, `SeverityBadge`, `PathTag`…). Tools reuse these instead of building their own chrome.
- **Source buffers** — `src/features/shared/hooks.ts` (`useToolSource`, `useToolSources`) handles the editable-in-tool copy and `applyToActive` back to the active document.
- **Business logic is framework-agnostic.** `src/services/` holds pure TypeScript (merge, diff, query, search, flatten, schema, env, k8s, docker-compose, ci/cd, openapi, secrets, templates, snippets, converters…), independently unit-testable.
- **Editors** are isolated in `YamlEditor.tsx` and wrapped by `EditorPanel.tsx` (used by the Override tool) and `YamlSourcePanel.tsx` (used by most other tools).
- **Theming** is driven by CSS custom properties on a `data-theme` attribute, mapped into Tailwind utilities with `@theme inline`. Monaco themes (`yaml-tool-dark` / `yaml-tool-light`) are defined in `monacoSetup.ts`.

---

## 10. Folder structure

```
yaml-tools/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── toolRegistry.tsx      # 36 tool declarations + CATEGORY_LABELS + toolById
│   │   └── workbenchContext.tsx  # documents, settings, favorites, notifications…
│   ├── components/
│   │   ├── shell/                # Sidebar, Topbar, Tabs, CommandPalette, Notifications
│   │   ├── ui.tsx                # Button, Select, Toggle, Field, TextInput, Panel…
│   │   ├── Icons.tsx             # ToolGlyph + category icon map
│   │   ├── YamlEditor.tsx        # Monaco wrapper (syntax, markers, read-only)
│   │   ├── EditorPanel.tsx       # Override tool panel chrome
│   │   ├── ChangeViewer.tsx      # old vs. new override diffs + added fields
│   │   └── …                     # ErrorMessage, Statistics, StatusMessage
│   ├── features/
│   │   ├── shared/               # ToolShell.tsx + hooks.ts (source buffers)
│   │   ├── override/             # YAML Value Override
│   │   ├── diff/ · merge/ · query/ · search/ · flatten/ · analyzer/ …
│   │   └── … (one folder per tool, each default-exporting a tool component)
│   ├── services/                 # pure TS business logic (see Architecture)
│   ├── hooks/                    # useYamlMerge, useLocalStorage
│   ├── types/                    # workbench.ts (tool/doc/settings types), yaml.ts
│   ├── tests/                    # yamlMergeService.test.ts, yamlParser.test.ts
│   ├── monacoSetup.ts            # local Monaco + YAML language + themes
│   ├── App.tsx                   # shell: provider + sidebar/tabs/topbar + active tool
│   ├── main.tsx
│   └── index.css                 # Tailwind v4 + theme variables
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── .gitignore
```

---

## 11. YAML merge algorithm

`src/services/yamlMergeService.ts` implements the Override tool:

```
INPUT 1 = overrideSource
INPUT 2 = targetConfiguration

For every key K in targetConfiguration:
    If K exists in overrideSource:
        If overrideSource[K] and targetConfiguration[K] are BOTH plain objects:
            Output[K] = merge(overrideSource[K], targetConfiguration[K])   # recurse
        Else:
            Output[K] = overrideSource[K]                                   # override wins
    Else:
        Output[K] = targetConfiguration[K]                                  # preserved

When addMissingKeys is enabled:
    For every key K in overrideSource not in targetConfiguration:
        Output[K] = overrideSource[K]                                       # appended

Preserve targetConfiguration key ordering.
```

The implementation is a single recursive function that walks `targetConfiguration` and consults `overrideSource` at each key, with a second pass over `overrideSource` only when *add missing fields* is on.

---

## 12. Merge rules

| Rule | Behavior |
| ---- | -------- |
| **Rule 1 — Key in both** | Output value = Input 1 (Primary) value. |
| **Rule 2 — Key only in Input 2** | Output value = Input 2 (Target) value — preserved. |
| **Rule 3 — Key only in Input 1** | **Not added** to the output, unless *Add missing fields* is enabled (then appended at the end of the level). |
| **Rule 4 — Exact matching** | Keys are never normalized. `USERNAME-USER`, `USERNAME_USER`, `username-user` and `USERNAME-USER-2` are four different keys. Case matters. |
| **Rule 5 — Ordering** | Output preserves Input 2's key order. Never sorted. Added keys are appended after Input 2's keys. |

---

## 13. Nested YAML behavior

Nested objects are processed **recursively** with the same rules at every level. This is **not** a shallow merge.

```yaml
# Primary
database:
  username: admin
  password: secret

# Target
database:
  username: olduser
  password: oldpassword
  host: localhost

# Output
database:
  username: admin
  password: secret
  host: localhost
```

---

## 14. Array behavior

When a matching key holds an array, the **entire Target array is replaced** by the Primary array. Array indexes are never merged element-by-element. If a matching key holds an array in one document but a non-array in the other, the ordinary "override wins" rule applies.

---

## 15. Data type handling

Values are merged as parsed YAML nodes — nothing is coerced to a string. The `yaml` library is used for both parsing and serialization, so the following round-trip losslessly: strings (quoted and unquoted), integers and floats, booleans, `null`, arrays (of scalars or objects), arbitrarily deep objects, multiline block strings, special characters, and the distinction between `VALUE:` / `null` / `""` / `"null"`.

---

## 16. Local storage behavior

Everything persists under the `yaml-workbench:*` prefix (best-effort; failures degrade to in-memory):

- `documents` — the document list (debounced)
- `activeDoc` — the currently active document id
- `favorites` — favorited tools
- `recents` — recently used tools
- `settings` — theme, font size, tab size, word wrap, export format, etc.
- `snippets` — user-created snippets

Workspace export/import (`Workspace` tool) writes a portable JSON snapshot (`WORKSPACE_VERSION = 1`) that restores documents, active ids, and settings.

---

## 17. Security

- No `eval()`, `new Function`, or execution of YAML/user-provided content.
- No `dangerouslySetInnerHTML`.
- YAML is parsed with the `yaml` library's plain `toJS()` conversion and treated as inert data.
- Editor contents are rendered by Monaco as plain text (no HTML injection).
- No secrets are logged or persisted beyond what you type (localStorage is client-only). The **Secret Scanner** helps you find leaked credentials before they ship.

---

## 18. Privacy

- The application is fully static and client-side.
- There is **no backend, database, API, cloud YAML processing, or external service**.
- YAML content is processed entirely in the browser.
- The only Monaco assets are bundled locally — no CDN requests at runtime (useful for air-gapped environments).

---

## 19. Deployment

The output of `npm run build` is a static `dist/` folder — deployable to any static host (Vercel, Netlify, GitHub Pages, S3…). It is a single-page app with no routes, so no server rewrites are required.

- **Vercel**: import the repo, framework preset **Vite** (auto-detected), build `npm run build`, output `dist`.
- **Netlify**: import the repo, build `npm run build`, publish directory `dist`.
- **GitHub Pages**: `npm run build`, then publish `./dist` (e.g. `npx gh-pages -d dist`). If serving from a subpath, set `base: "/<repo>/"` in `vite.config.ts` and rebuild.

---

## 20. Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Monaco loads but looks broken / falls back | Ensure `src/main.tsx` imports `./monacoSetup` **before** rendering. The local Monaco bundle is configured there (no CDN). |
| Tool panels collapse / editors invisible on large screens | The Override tool's editor panels use a fixed minimum height; if a custom tool panel collapses, give its inner editor container a `min-h-[…]` (see `EditorPanel.tsx`). |
| Documents "disappear" after reload | localStorage may be unavailable (private mode) or full. Content persists best-effort; use the **Workspace** tool to back up. |
| Very large YAML files feel slow | Disable **Auto Update** (it is debounced at 400 ms) and trigger the transform manually. |
| Build warns about a large chunk | Expected — Monaco is bundled locally. The warning is informational; gzip (~800 KB) is dominated by Monaco. |
| `npm install` fails | Use Node.js 20+. Delete `node_modules`/`package-lock.json` and retry. |

---

## License

MIT — use it freely.
