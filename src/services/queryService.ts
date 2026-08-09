import { parseDocument } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface QueryMatch {
  path: string;
  type: string;
  value: string;
}

export interface QueryResult {
  matches: QueryMatch[];
  error?: string;
}

type Token =
  | { kind: "root" }
  | { kind: "ident"; name: string }
  | { kind: "index"; index: number }
  | { kind: "star" }
  | { kind: "recursive"; name: string }
  | { kind: "filter"; key: string; value: string };

function tokenize(query: string): Token[] | { error: string } {
  const tokens: Token[] = [];
  const source = query.trim();
  let i = 0;

  if (source === "" ) {
    return { error: "Query is empty." };
  }

  if (source[0] !== "$") {
    return { error: "Query must start with '$'." };
  }
  tokens.push({ kind: "root" });
  i = 1;

  while (i < source.length) {
    const char = source[i];
    if (char === ".") {
      if (source[i + 1] === ".") {
        i += 2;
        let name = "";
        while (i < source.length && /[A-Za-z0-9_\-]/u.test(source[i])) {
          name += source[i];
          i += 1;
        }
        tokens.push({ kind: "recursive", name });
      } else if (source[i + 1] === "*") {
        i += 2;
        tokens.push({ kind: "star" });
      } else {
        i += 1;
        let name = "";
        while (i < source.length && /[A-Za-z0-9_\-]|\./u.test(source[i])) {
          name += source[i];
          i += 1;
        }
        if (name === "") {
          return { error: `Unexpected '.' at position ${i}.` };
        }
        tokens.push({ kind: "ident", name });
      }
    } else if (char === "[") {
      const close = source.indexOf("]", i);
      if (close === -1) {
        return { error: "Missing closing ']'." };
      }
      const inner = source.slice(i + 1, close).trim();
      i = close + 1;
      if (inner === "*") {
        tokens.push({ kind: "star" });
      } else if (/^\d+$/u.test(inner)) {
        tokens.push({ kind: "index", index: Number(inner) });
      } else if (inner.startsWith("'") && inner.endsWith("'") && inner.length >= 2) {
        tokens.push({ kind: "ident", name: inner.slice(1, -1) });
      } else if (inner.startsWith("?(")) {
        const filterMatch = /^\?\(@\.([A-Za-z0-9_\-]+)\s*==\s*['"](.*)['"]\)$/u.exec(inner);
        if (!filterMatch) {
          return { error: `Unsupported filter '${inner}'.` };
        }
        tokens.push({ kind: "filter", key: filterMatch[1], value: filterMatch[2] });
      } else {
        return { error: `Unsupported bracket expression '${inner}'.` };
      }
    } else {
      return { error: `Unexpected character '${char}' at position ${i}.` };
    }
  }
  return tokens;
}

function applyToken(value: unknown, token: Token): Array<{ key: string; value: unknown }> {
  if (token.kind === "ident") {
    if (isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, token.name)) {
      return [{ key: token.name, value: (value as Record<string, unknown>)[token.name] }];
    }
    return [];
  }
  if (token.kind === "index") {
    if (Array.isArray(value) && token.index >= 0 && token.index < value.length) {
      return [{ key: String(token.index), value: value[token.index] }];
    }
    return [];
  }
  if (token.kind === "star") {
    if (Array.isArray(value)) {
      return value.map((item, index) => ({ key: String(index), value: item }));
    }
    if (isPlainObject(value)) {
      return Object.keys(value).map((key) => ({ key, value: (value as Record<string, unknown>)[key] }));
    }
    return [];
  }
  if (token.kind === "recursive") {
    const results: Array<{ key: string; value: unknown }> = [];
    const collect = (current: unknown, prefix: string) => {
      if (isPlainObject(current)) {
        for (const key of Object.keys(current)) {
          const child = (current as Record<string, unknown>)[key];
          if (token.name === "" || key === token.name) {
            results.push({ key: prefix === "" ? key : `${prefix}.${key}`, value: child });
          }
          collect(child, prefix === "" ? key : `${prefix}.${key}`);
        }
      } else if (Array.isArray(current)) {
        current.forEach((child, index) => {
          collect(child, `${prefix}[${index}]`);
        });
      }
    };
    collect(value, "");
    return results;
  }
  if (token.kind === "filter") {
    const results: Array<{ key: string; value: unknown }> = [];
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (isPlainObject(item)) {
          const record = item as Record<string, unknown>;
          if (String(record[token.key]) === token.value) {
            results.push({ key: String(index), value: item });
          }
        }
      });
    }
    return results;
  }
  return [];
}

function typeOf(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (isPlainObject(value)) {
    return "object";
  }
  if (typeof value === "string") {
    return "string";
  }
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  return typeof value;
}

function display(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) || isPlainObject(value)) {
    return JSON.stringify(value);
  }
  return String(value);
}

export function queryValue(value: unknown, query: string): QueryResult {
  const tokens = tokenize(query);
  if ("error" in tokens) {
    return { matches: [], error: tokens.error };
  }

  let current: Array<{ key: string; value: unknown }> = [{ key: "$", value }];

  for (const token of tokens) {
    if (token.kind === "root") {
      continue;
    }
    const next: Array<{ key: string; value: unknown }> = [];
    for (const entry of current) {
      const applied = applyToken(entry.value, token);
      for (const match of applied) {
        next.push({ key: match.key, value: match.value });
      }
    }
    if (next.length === 0) {
      return { matches: [], error: `No matches for '${query}'.` };
    }
    current = next;
  }

  const matches: QueryMatch[] = current.map((entry) => ({
    path: entry.key,
    type: typeOf(entry.value),
    value: display(entry.value),
  }));
  return { matches };
}

export function queryYamlSource(source: string, query: string): QueryResult {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { matches: [], error: doc.errors[0].message };
  }
  return queryValue(doc.toJS(), query);
}
