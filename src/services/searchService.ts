import { parseDocument, stringify } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export type SearchMode = "keys" | "values" | "both";

export interface SearchOptions {
  mode: SearchMode;
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  mode: "both",
  caseSensitive: false,
  regex: false,
  wholeWord: false,
};

export interface SearchHit {
  path: string;
  field: "key" | "value";
  match: string;
}

export interface SearchResult {
  ok: boolean;
  hits: SearchHit[];
  error?: string;
}

export interface ReplaceResult {
  ok: boolean;
  text: string;
  replaced: number;
  error?: string;
}

function buildMatcher(pattern: string, options: SearchOptions): (text: string) => boolean {
  const flags = options.caseSensitive ? "u" : "iu";
  const source =
    options.wholeWord && !options.regex
      ? `\\b${escapeRegex(pattern)}\\b`
      : options.regex
        ? pattern
        : escapeRegex(pattern);
  const re = new RegExp(source, flags);
  return (text: string) => re.test(text);
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function searchYaml(source: string, pattern: string, options: Partial<SearchOptions> = {}): SearchResult {
  const opts: SearchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...options };
  if (pattern === "") {
    return { ok: false, hits: [], error: "Enter a search term." };
  }
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, hits: [], error: doc.errors[0].message };
  }
  const value = doc.toJS();
  const hits: SearchHit[] = [];
  const keyMatcher = buildMatcher(pattern, opts);

  const walk = (node: unknown, path: string, key: string): void => {
    if (isPlainObject(node)) {
      for (const childKey of Object.keys(node)) {
        const childPath = path === "" ? childKey : `${path}.${childKey}`;
        if (opts.mode !== "values" && keyMatcher(childKey)) {
          hits.push({ path: childPath, field: "key", match: childKey });
        }
        walk(node[childKey], childPath, childKey);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`, key));
      return;
    }
    if (typeof node === "string" && opts.mode !== "keys" && keyMatcher(node)) {
      hits.push({ path, field: "value", match: node });
    }
  };

  walk(value, "", "");
  return { ok: true, hits };
}

export function replaceYaml(
  source: string,
  pattern: string,
  replacement: string,
  options: Partial<SearchOptions> = {},
): ReplaceResult {
  const opts: SearchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...options };
  if (pattern === "") {
    return { ok: false, text: source, replaced: 0, error: "Enter a search term." };
  }
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, text: source, replaced: 0, error: doc.errors[0].message };
  }
  const value = doc.toJS();
  let replaced = 0;

  const transformKey = (key: string): string => {
    if (opts.mode === "values") {
      return key;
    }
    const matcher = buildMatcher(pattern, opts);
    const flags = opts.caseSensitive ? "gu" : "giu";
    const re = opts.regex ? new RegExp(pattern, flags) : new RegExp(escapeRegex(pattern), flags);
    if (!matcher(key)) {
      return key;
    }
    const next = key.replace(re, replacement);
    if (next !== key) {
      replaced += 1;
    }
    return next;
  };

  const transformValue = (node: unknown): unknown => {
    if (typeof node === "string") {
      if (opts.mode === "keys") {
        return node;
      }
      const matcher = buildMatcher(pattern, opts);
      if (!matcher(node)) {
        return node;
      }
      const flags = opts.caseSensitive ? "gu" : "giu";
      const re = opts.regex ? new RegExp(pattern, flags) : new RegExp(escapeRegex(pattern), flags);
      const next = node.replace(re, replacement);
      if (next !== node) {
        replaced += 1;
      }
      return next;
    }
    if (Array.isArray(node)) {
      return node.map(transformValue);
    }
    if (isPlainObject(node)) {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(node)) {
        out[transformKey(key)] = transformValue(node[key]);
      }
      return out;
    }
    return node;
  };

  const result = transformValue(value);
  const text = stringify(result, { lineWidth: 0 });
  return { ok: true, text: text.endsWith("\n") ? text : `${text}\n`, replaced };
}
