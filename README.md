# YAML Value Override Tool

A production-ready, fully client-side React developer utility that overrides values in a **Target** YAML configuration using values from a **Primary** YAML document — while preserving the Target's structure, key order, and YAML data types.

> **100% client-side.** No backend, no database, no API, no external service. Your YAML never leaves the browser.

---

## Table of Contents

1. [Project overview](#1-project-overview)
2. [Features](#2-features)
3. [Screenshots](#3-screenshots)
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
16. [Error handling](#16-error-handling)
17. [Security](#17-security)
18. [Privacy](#18-privacy)
19. [Local storage behavior](#19-local-storage-behavior)
20. [Deployment](#20-deployment)
21. [Vercel deployment](#21-vercel-deployment)
22. [Netlify deployment](#22-netlify-deployment)
23. [GitHub Pages deployment](#23-github-pages-deployment)
24. [Troubleshooting](#24-troubleshooting)
25. [Future enhancement ideas](#25-future-enhancement-ideas)

---

## 1. Project overview

**YAML Value Override Tool** is a developer utility with exactly three YAML editors:

| Panel | Role |
| ----- | ---- |
| **Primary YAML** | Source of **values** (overrides) |
| **Target YAML** | Source of **keys / structure** (the shape that is preserved) |
| **Output YAML** | The generated result (read-only) |

The mental model is:

```
INPUT 1 (Primary) = VALUE OVERRIDE SOURCE
INPUT 2 (Target)  = OUTPUT KEY/STRUCTURE SOURCE
OUTPUT            = INPUT 2 PRESERVED, WITH MATCHING VALUES REPLACED BY INPUT 1
```

This is **not** a generic merge ("union of everything"). A key that exists only in Primary is **never** added to the output.

### Basic example

**Primary YAML**

```yaml
USERNAME-USER: "value"
AGE_AGE: 15
```

**Target YAML**

```yaml
PASSWORD_PASS: "12345"
USERNAME-USER: "bababab"
WHATEVER: "HELLO"
AGE_AGE: 152323
```

**Output YAML** (after clicking **Update Values**)

```yaml
PASSWORD_PASS: "12345"
USERNAME-USER: "value"
WHATEVER: "HELLO"
AGE_AGE: 15
```

- `PASSWORD_PASS` exists only in Target → unchanged.
- `USERNAME-USER` exists in both → Primary value `"value"` replaces `"bababab"`.
- `WHATEVER` exists only in Target → unchanged.
- `AGE_AGE` exists in both → Primary value `15` replaces `152323`.

---

## 2. Features

- **Three synchronized editor panels** — Primary, Target, and read-only Output.
- **Update Values** — runs the merge algorithm on demand.
- **Auto Update** toggle (default off) — re-generates the output (debounced) whenever both inputs are valid YAML.
- **Format** — re-formats Primary, Target, or Output YAML (configurable target).
- **Copy Output** — copies the generated YAML to the clipboard with "Copied!" feedback.
- **Download YAML** — downloads the result as `updated-config.yaml`.
- **Clear** — empties all three editors.
- **Swap Inputs** — exchanges Primary and Target YAML.
- **Load Example** — loads the built-in example document.
- **Show Changes** — lists every overridden key with its old and new value (does not affect output).
- **Statistics** — keys processed / values updated / keys preserved.
- **Nested objects** — recursive merge, same rules at every level.
- **Arrays** — replaced wholesale (indexes are never merged).
- **Data type preservation** — strings, numbers, floats, booleans, `null`, arrays, objects, multiline strings, quoted/unquoted strings.
- **Strict key matching** — case-sensitive, hyphen vs. underscore respected, no normalization.
- **Key order preservation** — the Output keeps the Target's key order; never sorts.
- **Inline validation errors** — invalid YAML is flagged on the offending editor with line/column info.
- **Monaco Editor** — YAML syntax highlighting, line numbers, folding, bracket matching, find/replace, dark & light themes.
- **Dark / Light theme toggle**, persisted.
- **localStorage persistence** for editor contents and settings, with a **Clear Saved Data** control.
- **Responsive layout** — three columns on desktop, stacked on mobile.
- **Fully offline** — Monaco is bundled locally (no CDN), and all processing is in-browser.

---

## 3. Screenshots

> Screenshots coming soon.
>
> *(Add your own images here: e.g. `docs/screenshot-dark.png`, `docs/screenshot-light.png`, `docs/screenshot-mobile.png`.)*

---

## 4. Technology stack

| Layer | Choice |
| ----- | ------ |
| Framework | [React 19](https://react.dev) (functional components + hooks) |
| Language | [TypeScript](https://www.typescriptlang.org) (strict mode) |
| Build tool | [Vite 8](https://vitejs.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + CSS custom properties |
| YAML engine | [`yaml`](https://www.npmjs.com/package/yaml) v2 |
| Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/react` |
| Testing | [Vitest](https://vitest.dev) |

---

## 5. Installation

Requirements: **Node.js 20+** and **npm**.

```bash
git clone <your-repo-url>
cd yaml-value-override-tool
npm install
```

> The scaffold originally targeted `yaml-tools`; rename the folder to `yaml-value-override-tool` if you wish (the `name` in `package.json` is already `yaml-value-override-tool`).

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

The suite covers the full merge contract (see [Merge rules](#12-merge-rules)):

- Basic replacement, no matching keys, partial matching
- Input-1-only keys are never added
- Nested objects (recursive), deep hierarchies, mixed objects/arrays
- Arrays replaced wholesale (including arrays of objects)
- Data types: booleans, integers, floats, `null`, empty strings, `"null"` vs `null`, special characters, block strings, quoted/unquoted strings
- Strict key matching: hyphens, underscores, case-sensitivity, numeric suffixes
- Key ordering (root and nested)
- Statistics accounting
- Change tracking (updated / preserved, dotted paths)
- Parser behavior: invalid YAML, root scalar, root array, empty document

---

## 9. Architecture

The application is split into **presentation** (`components/`, `App.tsx`) and **business logic** (`services/`, `utils/`, `hooks/`).

- **Business logic is framework-agnostic.** `src/services/yamlMergeService.ts` and `src/utils/yamlParser.ts` are pure TypeScript with zero React dependencies, so the merge algorithm is independently unit-testable.
- **State orchestration** lives in `src/hooks/useYamlMerge.ts` (parsing → merging → serialization + debounce) and `src/hooks/useLocalStorage.ts` (persistence).
- **Editors** are isolated in `YamlEditor.tsx` and wrapped by `EditorPanel.tsx`.
- **Theming** is driven by CSS custom properties on a `data-theme` attribute, mapped into Tailwind utilities with `@theme inline`.

---

## 10. Folder structure

```
yaml-value-override-tool/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── YamlEditor.tsx        # Monaco wrapper (syntax, markers, read-only)
│   │   ├── EditorPanel.tsx       # Panel chrome: header, badge, description
│   │   ├── Toolbar.tsx           # All action buttons + toggles
│   │   ├── Statistics.tsx        # keys processed / updated / preserved
│   │   ├── ChangeViewer.tsx      # old vs. new override diffs
│   │   ├── ErrorMessage.tsx      # inline YAML validation errors
│   │   └── StatusMessage.tsx     # transient feedback messages
│   ├── services/
│   │   └── yamlMergeService.ts   # THE merge algorithm (pure, testable)
│   ├── utils/
│   │   ├── yamlParser.ts         # safe parsing + root-type validation
│   │   ├── yamlFormatter.ts      # serialization / pretty-printing
│   │   ├── yamlLanguage.ts       # custom Monaco Monarch YAML grammar
│   │   ├── clipboard.ts          # clipboard helper with fallback
│   │   └── download.ts           # Blob download helper
│   ├── hooks/
│   │   ├── useYamlMerge.ts       # parse → merge → serialize orchestration
│   │   └── useLocalStorage.ts    # typed localStorage state
│   ├── types/
│   │   └── yaml.ts               # shared domain types
│   ├── tests/
│   │   ├── yamlMergeService.test.ts
│   │   └── yamlParser.test.ts
│   ├── monacoSetup.ts            # local Monaco + YAML language registration
│   ├── App.tsx
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

`src/services/yamlMergeService.ts` implements:

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

Never add keys that exist only in overrideSource.
Preserve targetConfiguration key ordering.
```

The implementation is a single recursive function that walks `targetConfiguration` and consults `overrideSource` at each key.

---

## 12. Merge rules

| Rule | Behavior |
| ---- | -------- |
| **Rule 1 — Key in both** | Output value = Input 1 (Primary) value. |
| **Rule 2 — Key only in Input 2** | Output value = Input 2 (Target) value — preserved. |
| **Rule 3 — Key only in Input 1** | **Not added** to the output. |
| **Rule 4 — Exact matching** | Keys are never normalized. `USERNAME-USER`, `USERNAME_USER`, `username-user` and `USERNAME-USER-2` are four different keys. Case matters. |
| **Rule 5 — Ordering** | Output preserves Input 2's key order. Never sorted. |

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

When a matching key holds an array, the **entire Target array is replaced** by the Primary array. Array indexes are never merged element-by-element.

```yaml
# Primary                        # Target
servers:                         servers:
  - server1                        - oldserver1
  - server2                        - oldserver2

# Output
servers:
  - server1
  - server2
```

If a matching key holds an array in one document but a non-array in the other, the ordinary "override wins" rule applies.

---

## 15. Data type handling

Values are merged as parsed YAML nodes — nothing is coerced to a string. The `yaml` library is used for both parsing and serialization, so the following round-trip losslessly:

- strings (quoted and unquoted)
- integers and floating-point numbers
- booleans
- `null`
- arrays (of scalars or objects)
- objects (nested arbitrarily deep)
- multiline block strings (`|`, `>`)
- special characters (`&`, `<`, `>`, `#`, `:`, `-`, etc.)
- explicit empty values (`VALUE:`) vs. `null` vs. `""` vs. `"null"` are preserved as distinct YAML constructs where the input distinguishes them.

---

## 16. Error handling

- **Invalid YAML** → an inline error appears on the affected editor with the parser's message plus line/column when available, and the corresponding Monaco editor gets a squiggly marker. The application never crashes.
- **Empty inputs** → "Primary YAML is empty." / "Target YAML is empty." is shown and no output is generated.
- **Root type validation** → if the root is a scalar, an array, or otherwise not an object/map, the editor shows "Root YAML must be an object/map."
- **Clipboard failure** → graceful fallback to a hidden textarea + `document.execCommand`, with a visible failure message if blocked.
- All YAML content is treated as **untrusted data**; it is never executed or injected into the DOM.

---

## 17. Security

- No `eval()`, `new Function`, or execution of YAML/user-provided content.
- No `dangerouslySetInnerHTML`.
- YAML is parsed with the `yaml` library's plain `toJS()` conversion and treated as inert data.
- Editor contents are rendered by Monaco as plain text (no HTML injection).
- No secrets are logged or persisted beyond what you type (localStorage is client-only).

---

## 18. Privacy

- The application is fully static and client-side.
- There is **no backend, database, API, cloud YAML processing, or external service**.
- YAML content is processed entirely in the browser.
- The only Monaco assets are bundled locally — no CDN requests at runtime (useful for air-gapped environments).

---

## 19. Local storage behavior

The following are persisted to `localStorage` (key prefix `yaml-value-override-tool:`):

- `primary` — Primary YAML text
- `target` — Target YAML text
- `autoUpdate` — Auto Update toggle
- `showChanges` — Show Changes toggle
- `theme` — Dark/Light theme

Storage failures (private mode, full quota) degrade gracefully to in-memory behavior. Use **Clear Saved Data** in the footer to wipe all stored values.

---

## 20. Deployment

The output of `npm run build` is a static `dist/` folder — deployable to any static host. Because it is a single-page app with no routes, no server rewrites are required.

---

## 21. Vercel deployment

1. Push the repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **New Project** → import the repo.
3. Framework preset: **Vite** (Vercel auto-detects it).
4. Build command: `npm run build` · Output directory: `dist`.
5. Deploy. No environment variables needed.

---

## 22. Netlify deployment

1. Push the repo to GitHub/GitLab/Bitbucket.
2. In Netlify, **Add new site** → import the repo.
3. Build command: `npm run build` · Publish directory: `dist`.
4. Deploy. No environment variables needed.

---

## 23. GitHub Pages deployment

The app is fully static and uses relative-free asset paths produced by Vite, so it can be served from a subpath.

```bash
npm run build
# then publish ./dist to a gh-pages branch, for example:
npx gh-pages -d dist
```

> If you serve from a subpath such as `https://<user>.github.io/<repo>/`, set `base: "/<repo>/"` in `vite.config.ts` and rebuild.

---

## 24. Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Monaco loads but looks broken / falls back | Ensure `src/main.tsx` imports `./monacoSetup` **before** rendering. The local Monaco bundle is configured there (no CDN). |
| YAML text "disappears" after reload | localStorage may be unavailable (private mode) or the storage quota is full. Content persists best-effort; use **Clear Saved Data** to reset. |
| Very large YAML files feel slow | Auto Update is debounced (400 ms). Disable Auto Update and use **Update Values** for very large documents. |
| Output shows `null` for an empty panel | Output is only generated when **both** inputs are valid YAML objects and **Update Values** (or Auto Update) has run. |
| Build warns about a large chunk | Expected — Monaco is bundled locally. The warning is informational; gzip (~800 KB) is dominated by Monaco. |
| `npm install` fails | Use Node.js 20+. Delete `node_modules`/`package-lock.json` and retry. |

---

## 25. Future enhancement ideas

- JSON ↔ YAML input conversion (parse JSON in the editors, output YAML).
- Schema-aware validation (e.g. JSON Schema for the Target).
- YAML anchors/aliases round-trip support.
- Diff view of Output vs. Target with colors and folding.
- Multiple named Target configurations (tabs).
- Env-file (`.env`) import/export.
- History / undo stack across all three editors.
- Keyboard shortcut reference overlay (⌘/Ctrl+Enter to update).
- PWA support for offline use.
- i18n for the UI.

---

## License

MIT — use it freely.
