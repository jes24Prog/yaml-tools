import { parseDocument } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface YamlStats {
  totalKeys: number;
  totalValues: number;
  maxDepth: number;
  objectCount: number;
  arrayCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
  emptyValues: Array<{ path: string; value: string }>;
  longStrings: Array<{ path: string; length: number }>;
  paths: string[];
}

export interface AnalyzeResult {
  stats: YamlStats | null;
  error?: string;
}

function valueLabel(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function analyzeInto(value: unknown, path: string, depth: number, stats: YamlStats): void {
  stats.maxDepth = Math.max(stats.maxDepth, depth);
  if (isPlainObject(value)) {
    stats.objectCount += 1;
    for (const key of Object.keys(value)) {
      stats.totalKeys += 1;
      const childPath = path === "" ? key : `${path}.${key}`;
      analyzeInto(value[key], childPath, depth + 1, stats);
    }
  } else if (Array.isArray(value)) {
    stats.arrayCount += 1;
    value.forEach((item, index) => {
      analyzeInto(item, `${path}[${index}]`, depth + 1, stats);
    });
  } else {
    stats.totalValues += 1;
    stats.paths.push(path);
    if (value === null) {
      stats.nullCount += 1;
      stats.emptyValues.push({ path, value: "null" });
    } else if (typeof value === "string") {
      stats.stringCount += 1;
      if (value.trim() === "") {
        stats.emptyValues.push({ path, value: '""' });
      }
      if (value.length > 120) {
        stats.longStrings.push({ path, length: value.length });
      }
    } else if (typeof value === "number") {
      stats.numberCount += 1;
    } else if (typeof value === "boolean") {
      stats.booleanCount += 1;
    }
  }
}

export function analyzeYaml(source: string): AnalyzeResult {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { stats: null, error: doc.errors[0].message };
  }
  const value = doc.toJS();
  const stats: YamlStats = {
    totalKeys: 0,
    totalValues: 0,
    maxDepth: 0,
    objectCount: 0,
    arrayCount: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
    emptyValues: [],
    longStrings: [],
    paths: [],
  };
  analyzeInto(value, "", 0, stats);
  return { stats };
}

export function valueType(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (isPlainObject(value)) {
    return "object";
  }
  return typeof value;
}

export function formatValue(value: unknown): string {
  return valueLabel(value);
}
