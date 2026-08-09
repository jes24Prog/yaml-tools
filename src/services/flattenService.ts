import { parseDocument, stringify } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

function escapeSegment(segment: string): string {
  return segment.includes(".") || segment.includes("[") || segment.includes("]")
    ? `[${segment.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')}]`
    : segment;
}

function flattenInto(value: unknown, prefix: string, out: Record<string, unknown>): void {
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      const path = prefix === "" ? escapeSegment(key) : `${prefix}.${escapeSegment(key)}`;
      flattenInto(value[key], path, out);
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const path = `${prefix}[${index}]`;
      flattenInto(item, path, out);
    });
  } else {
    out[prefix] = value;
  }
}

export function flattenValue(value: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  flattenInto(value, "", out);
  return out;
}

const SEGMENT_RE = /(?:\[([^\]]+)\]|\.?([A-Za-z0-9_\-]+))/gu;

export function unflattenValue(flat: Record<string, unknown>): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  const getOrCreate = (path: string): { parent: Record<string, unknown> | unknown[]; key: string | number } => {
    const segments: Array<string | number> = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(SEGMENT_RE.source, "gu");
    while ((match = regex.exec(path)) !== null) {
      if (match[1] !== undefined) {
        segments.push(match[1]);
      } else if (match[2] !== undefined) {
        segments.push(match[2]);
      }
    }

    let container: Record<string, unknown> | unknown[] = root;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const segment = segments[i];
      const isIndex = typeof segment === "number" || /^\d+$/u.test(String(segment));
      if (Array.isArray(container)) {
        const index = Number(segment);
        let next = container[index];
        const nextIsIndex = /^\d+$/u.test(String(segments[i + 1]));
        if (next === undefined) {
          next = nextIsIndex ? [] : {};
          container[index] = next;
        }
        container = next as Record<string, unknown> | unknown[];
      } else {
        let next = (container as Record<string, unknown>)[segment as string];
        const nextIsIndex = /^\d+$/u.test(String(segments[i + 1]));
        if (next === undefined) {
          next = nextIsIndex ? [] : {};
          (container as Record<string, unknown>)[segment as string] = next;
        }
        container = next as Record<string, unknown> | unknown[];
      }
      void isIndex;
    }
    return { parent: container, key: segments[segments.length - 1] as string | number };
  };

  for (const key of Object.keys(flat)) {
    const { parent, key: lastKey } = getOrCreate(key);
    if (Array.isArray(parent)) {
      parent[Number(lastKey)] = flat[key];
    } else {
      (parent as Record<string, unknown>)[lastKey as string] = flat[key];
    }
  }
  return root;
}

export function flattenYamlText(source: string): { ok: true; text: string; count: number } | { ok: false; error: string } {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, error: doc.errors[0].message };
  }
  const flat = flattenValue(doc.toJS());
  const lines = Object.keys(flat).map((key) => `${key}: ${JSON.stringify(flat[key])}`);
  return { ok: true, text: `${lines.join("\n")}\n`, count: Object.keys(flat).length };
}

export function unflattenYamlText(source: string): { ok: true; text: string } | { ok: false; error: string } {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, error: doc.errors[0].message };
  }
  const value = doc.toJS();
  if (!isPlainObject(value)) {
    return { ok: false, error: "Input must be a flat key/value map." };
  }
  const flat: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const item = (value as Record<string, unknown>)[key];
    flat[key] = typeof item === "string" && (item.startsWith("[") || item === "true" || item === "false" || !isNaN(Number(item)))
      ? parseScalar(item)
      : item;
  }
  const root = unflattenValue(flat);
  return { ok: true, text: stringify(root, { lineWidth: 0 }) };
}

function parseScalar(text: string): unknown {
  if (text === "true") {
    return true;
  }
  if (text === "false") {
    return false;
  }
  if (text === "null") {
    return null;
  }
  if (!isNaN(Number(text))) {
    return Number(text);
  }
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}
