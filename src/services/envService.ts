import { parseDocument, stringify } from "yaml";
import { isPlainObject } from "../utils/yamlParser";
import { parseEnvText } from "./converterService";

export interface Substitution {
  from: string;
  to: string;
}

export interface EnvSubstituteResult {
  ok: boolean;
  text: string;
  substitutions: Substitution[];
  missing: string[];
  error?: string;
}

const VAR_PATTERN = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}|\$([A-Za-z_][A-Za-z0-9_]*)/gu;

export function substituteText(
  text: string,
  variables: Record<string, string>,
): { text: string; substitutions: Substitution[]; missing: string[] } {
  const substitutions: Substitution[] = [];
  const missing: string[] = [];
  const resolved = text.replace(VAR_PATTERN, (match, bracketed: string, defaultValue: string | undefined, bare: string) => {
    const name = bracketed ?? bare;
    if (Object.prototype.hasOwnProperty.call(variables, name)) {
      substitutions.push({ from: match, to: variables[name] });
      return variables[name];
    }
    if (defaultValue !== undefined) {
      substitutions.push({ from: match, to: defaultValue });
      return defaultValue;
    }
    missing.push(name);
    return match;
  });
  return { text: resolved, substitutions, missing: [...new Set(missing)] };
}

export function substituteYaml(
  source: string,
  variables: Record<string, string>,
): EnvSubstituteResult {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, text: source, substitutions: [], missing: [], error: doc.errors[0].message };
  }
  const value = doc.toJS();
  const substitutions: Substitution[] = [];
  const missing = new Set<string>();

  const walk = (node: unknown): unknown => {
    if (typeof node === "string") {
      const result = substituteText(node, variables);
      substitutions.push(...result.substitutions);
      result.missing.forEach((name) => missing.add(name));
      return result.text;
    }
    if (Array.isArray(node)) {
      return node.map(walk);
    }
    if (isPlainObject(node)) {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(node)) {
        out[key] = walk(node[key]);
      }
      return out;
    }
    return node;
  };

  const result = walk(value);
  const text = stringify(result, { lineWidth: 0 });
  return {
    ok: true,
    text: text.endsWith("\n") ? text : `${text}\n`,
    substitutions,
    missing: [...missing],
  };
}

export interface EnvMatrixCell {
  fileName: string;
  present: boolean;
  value: string;
}

export interface EnvMatrixRow {
  key: string;
  cells: EnvMatrixCell[];
  differs: boolean;
}

export interface EnvMatrix {
  rows: EnvMatrixRow[];
  keys: string[];
  files: string[];
}

export function buildEnvMatrix(
  files: Array<{ name: string; content: string }>,
): EnvMatrix {
  const parsed = files.map((file) => ({
    name: file.name,
    values: parseEnvText(file.content),
  }));
  const keys = new Set<string>();
  parsed.forEach((file) => Object.keys(file.values).forEach((key) => keys.add(key)));
  const sortedKeys = [...keys].sort((a, b) => a.localeCompare(b));

  const rows: EnvMatrixRow[] = sortedKeys.map((key) => {
    const cells = parsed.map((file) => ({
      fileName: file.name,
      present: Object.prototype.hasOwnProperty.call(file.values, key),
      value: file.values[key] ?? "",
    }));
    const presentValues = cells.filter((cell) => cell.present).map((cell) => cell.value);
    const differs = presentValues.length > 0 && !presentValues.every((value) => value === presentValues[0]);
    return { key, cells, differs };
  });

  return { rows, keys: sortedKeys, files: parsed.map((file) => file.name) };
}

export function variablesFromEnvText(text: string): Record<string, string> {
  return parseEnvText(text);
}
