import { parseDocument, stringify, type Scalar, type Pair } from "yaml";

export type QuoteStyle = "auto" | "single" | "double";
export type SortMode = "none" | "alpha-asc" | "alpha-desc" | "priority";

export interface FormatOptions {
  indent: number;
  quoteStyle: QuoteStyle;
  sortMode: SortMode;
  keyPriority: string[];
  finalNewline: boolean;
}

export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  indent: 2,
  quoteStyle: "auto",
  sortMode: "none",
  keyPriority: ["apiVersion", "kind", "metadata", "spec", "template"],
  finalNewline: true,
};

export type TextResult = { ok: true; text: string } | { ok: false; error: string };

function makeSortComparator(mode: SortMode, priority: string[]) {
  if (mode === "none") {
    return undefined;
  }
  const priorityIndex = new Map(priority.map((key, index) => [key, index]));
  const alpha = (a: string, b: string) => a.localeCompare(b);
  return (a: Pair, b: Pair) => {
    const keyA = keyToString(a.key);
    const keyB = keyToString(b.key);
    const indexA = priorityIndex.get(keyA);
    const indexB = priorityIndex.get(keyB);
    if (indexA !== undefined || indexB !== undefined) {
      if (indexA === undefined) {
        return 1;
      }
      if (indexB === undefined) {
        return -1;
      }
      return indexA - indexB;
    }
    const result = alpha(keyA, keyB);
    return mode === "alpha-desc" ? -result : result;
  };
}

function keyToString(key: unknown): string {
  if (key === null || key === undefined) {
    return "";
  }
  const value = (key as { value?: unknown }).value;
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function defaultStringType(quoteStyle: QuoteStyle): Scalar.Type | undefined {
  if (quoteStyle === "single") {
    return "QUOTE_SINGLE";
  }
  if (quoteStyle === "double") {
    return "QUOTE_DOUBLE";
  }
  return undefined;
}

function normalizeNewline(text: string, finalNewline: boolean): string {
  const trimmed = text.replace(/\s+$/u, "");
  return finalNewline ? `${trimmed}\n` : trimmed;
}

export function formatYamlText(source: string, options: Partial<FormatOptions> = {}): TextResult {
  const opts: FormatOptions = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const sourceText = source.trim();
  if (sourceText === "") {
    return { ok: false, error: "No YAML content to format." };
  }
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    const first = doc.errors[0];
    return {
      ok: false,
      error: `${first.message}${
        "linePos" in first && first.linePos ? ` (line ${first.linePos[0].line})` : ""
      }`,
    };
  }
  const value = doc.toJS();
  const sortMapEntries = makeSortComparator(opts.sortMode, opts.keyPriority);
  const text = stringify(value, {
    indent: opts.indent,
    lineWidth: 0,
    minContentWidth: 0,
    nullStr: "null",
    defaultStringType: defaultStringType(opts.quoteStyle),
    defaultKeyType: "PLAIN",
    sortMapEntries,
  });
  return { ok: true, text: normalizeNewline(text, opts.finalNewline) };
}

export function minifyYaml(source: string): TextResult {
  const sourceText = source.trim();
  if (sourceText === "") {
    return { ok: false, error: "No YAML content to minify." };
  }
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, error: doc.errors[0].message };
  }
  const value = doc.toJS();
  const text = stringify(value, {
    collectionStyle: "flow",
    lineWidth: 0,
    nullStr: "null",
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  });
  return { ok: true, text: `${text.trim()}\n` };
}
