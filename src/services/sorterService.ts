import { parseDocument, stringify } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export type SortOrder = "asc" | "desc";

export interface SortOptions {
  order: SortOrder;
  priority: string[];
  nested: boolean;
}

export const DEFAULT_SORT_OPTIONS: SortOptions = {
  order: "asc",
  priority: [],
  nested: true,
};

export interface SortResult {
  ok: boolean;
  text: string;
  error?: string;
}

function sortValue(value: unknown, options: SortOptions): unknown {
  if (Array.isArray(value)) {
    return options.nested ? value.map((item) => sortValue(item, options)) : value;
  }
  if (!isPlainObject(value)) {
    return value;
  }
  const entries = Object.keys(value).map((key) => ({
    key,
    value: options.nested ? sortValue(value[key], options) : value[key],
  }));
  const priorityIndex = new Map(options.priority.map((key, index) => [key, index]));
  entries.sort((a, b) => {
    const pa = priorityIndex.get(a.key);
    const pb = priorityIndex.get(b.key);
    if (pa !== undefined || pb !== undefined) {
      if (pa === undefined) {
        return 1;
      }
      if (pb === undefined) {
        return -1;
      }
      return pa - pb;
    }
    const cmp = a.key.localeCompare(b.key);
    return options.order === "desc" ? -cmp : cmp;
  });
  const out: Record<string, unknown> = {};
  for (const entry of entries) {
    out[entry.key] = entry.value;
  }
  return out;
}

export function sortYaml(source: string, options: Partial<SortOptions> = {}): SortResult {
  const opts: SortOptions = { ...DEFAULT_SORT_OPTIONS, ...options };
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, text: source, error: doc.errors[0].message };
  }
  const value = doc.toJS();
  const sorted = sortValue(value, opts);
  const text = stringify(sorted, { lineWidth: 0 });
  return { ok: true, text: text.endsWith("\n") ? text : `${text}\n` };
}
