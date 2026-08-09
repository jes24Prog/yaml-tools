import { parseDocument, stringify } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface CleanOptions {
  emptyValues: boolean;
  emptyArrays: boolean;
  emptyObjects: boolean;
  trailingSpaces: boolean;
}

export const DEFAULT_CLEAN_OPTIONS: CleanOptions = {
  emptyValues: true,
  emptyArrays: true,
  emptyObjects: true,
  trailingSpaces: true,
};

export interface CleanResult {
  ok: boolean;
  text: string;
  removed: string[];
  error?: string;
}

function cleanValue(
  value: unknown,
  path: string,
  removed: string[],
  options: CleanOptions,
): { keep: boolean; value: unknown } {
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item, index) => {
        const result = cleanValue(item, `${path}[${index}]`, removed, options);
        return result.keep ? result.value : undefined;
      })
      .filter((item) => item !== undefined);
    if (cleaned.length === 0 && options.emptyArrays) {
      removed.push(path);
      return { keep: false, value: null };
    }
    return { keep: true, value: cleaned };
  }
  if (isPlainObject(value)) {
    const cleaned: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const childPath = path === "" ? key : `${path}.${key}`;
      const result = cleanValue(value[key], childPath, removed, options);
      if (result.keep) {
        cleaned[key] = result.value;
      } else {
        removed.push(childPath);
      }
    }
    if (Object.keys(cleaned).length === 0 && options.emptyObjects) {
      removed.push(path);
      return { keep: false, value: null };
    }
    return { keep: true, value: cleaned };
  }
  const isEmptyValue = value === null || value === undefined || value === "";
  if (isEmptyValue && options.emptyValues) {
    removed.push(path);
    return { keep: false, value: null };
  }
  return { keep: true, value };
}

export function cleanYaml(source: string, options: Partial<CleanOptions> = {}): CleanResult {
  const opts: CleanOptions = { ...DEFAULT_CLEAN_OPTIONS, ...options };
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, text: source, removed: [], error: doc.errors[0].message };
  }
  const value = doc.toJS();
  const removed: string[] = [];
  const cleaned = cleanValue(value, "", removed, opts);
  const output = cleaned.keep ? cleaned.value : {};
  let text = stringify(output, { lineWidth: 0 });
  if (opts.trailingSpaces) {
    text = text.replace(/[ \t]+$/gmu, "");
  }
  return { ok: true, text: text.endsWith("\n") ? text : `${text}\n`, removed };
}
