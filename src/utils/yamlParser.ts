import { parseDocument, Document } from "yaml";
import type { YamlObject, YamlParseError, YamlValue } from "../types/yaml";

function buildParseError(doc: Document): YamlParseError {
  const error = doc.errors[0];
  const message = error?.message ?? "Unknown YAML parse error.";
  let line: number | undefined;
  let column: number | undefined;
  if (error && "linePos" in error && error.linePos) {
    const pos = error.linePos[0];
    line = pos.line;
    column = pos.col;
  }
  return { message, line, column };
}

export interface ParseResult {
  value: YamlObject | null;
  error: YamlParseError | null;
}

export function isValidYamlDocument(source: string): boolean {
  const doc = parseDocument(source);
  return doc.errors.length === 0;
}

/**
 * Parses a YAML document and requires the root to be a plain object/map.
 * Never throws — parse and validation problems are returned in `error`.
 */
export function parseYamlObject(source: string): ParseResult {
  if (source.trim() === "") {
    return {
      value: null,
      error: {
        message: "Root YAML must be an object/map.",
      },
    };
  }

  const doc = parseDocument(source);

  if (doc.errors.length > 0) {
    return { value: null, error: buildParseError(doc) };
  }

  const value = doc.toJS() as unknown;

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {
      value: null,
      error: {
        message: "Root YAML must be an object/map.",
      },
    };
  }

  return { value: value as YamlObject, error: null };
}

export function isPlainObject(value: unknown): value is YamlObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively converts a parsed YAML value to a plain JSON-friendly value,
 * stripping any document-level YAML metadata (e.g. anchors/aliases markers).
 */
export function toPlainValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toPlainValue);
  }
  if (isPlainObject(value)) {
    const out: Record<string, YamlValue> = {};
    for (const key of Object.keys(value)) {
      out[key] = toPlainValue(value[key]) as YamlValue;
    }
    return out;
  }
  return value;
}
