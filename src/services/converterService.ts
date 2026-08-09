import { parseDocument, stringify } from "yaml";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { isPlainObject } from "../utils/yamlParser";
import { flattenValue } from "./flattenService";

export type ConvertResult = { ok: true; text: string; note?: string } | { ok: false; error: string };

function parseYamlValue(source: string): unknown {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    throw new Error(doc.errors[0].message);
  }
  return doc.toJS();
}

function normalizeTomlValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeTomlValue);
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      out[key] = normalizeTomlValue(value[key]);
    }
    return out;
  }
  return value;
}

export function yamlToJson(source: string, pretty = true): ConvertResult {
  try {
    const value = parseYamlValue(source);
    const json = JSON.stringify(value, null, pretty ? 2 : 0);
    return { ok: true, text: `${json}\n` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function jsonToYaml(source: string): ConvertResult {
  try {
    const parsed = JSON.parse(source);
    return { ok: true, text: stringify(parsed, { lineWidth: 0 }) };
  } catch (error) {
    return { ok: false, error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export function yamlToToml(source: string): ConvertResult {
  try {
    const value = parseYamlValue(source);
    if (!isPlainObject(value)) {
      return { ok: false, error: "TOML output requires a top-level object/map." };
    }
    const text = stringifyToml(normalizeTomlValue(value) as Record<string, unknown>);
    return { ok: true, text };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function tomlToYaml(source: string): ConvertResult {
  try {
    const parsed = parseToml(source);
    return { ok: true, text: stringify(parsed, { lineWidth: 0 }) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function parseEnvText(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const withoutExport = line.startsWith("export ") ? line.slice(7) : line;
    const equalsIndex = withoutExport.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = withoutExport.slice(0, equalsIndex).trim();
    let value = withoutExport.slice(equalsIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1).replace(/\\n/gu, "\n");
    } else if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export function envToYaml(source: string): ConvertResult {
  try {
    const flat = parseEnvText(source);
    const nested: Record<string, unknown> = {};
    for (const key of Object.keys(flat)) {
      setDottedPath(nested, key, flat[key]);
    }
    return { ok: true, text: stringify(nested, { lineWidth: 0 }) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function setDottedPath(root: Record<string, unknown>, dotted: string, value: unknown): void {
  const parts = dotted.split(".");
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const next = cursor[part];
    if (!isPlainObject(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

export function yamlToEnv(source: string): ConvertResult {
  try {
    const value = parseYamlValue(source);
    if (!isPlainObject(value)) {
      return { ok: false, error: "Environment output requires a top-level object/map." };
    }
    const flat = flattenValue(value);
    const lines: string[] = [];
    let note = "";
    for (const key of Object.keys(flat)) {
      const raw = flat[key];
      let rendered: string;
      if (raw === null || raw === undefined) {
        rendered = "";
      } else if (typeof raw === "string") {
        rendered = raw;
      } else if (typeof raw === "number" || typeof raw === "boolean") {
        rendered = String(raw);
      } else {
        rendered = JSON.stringify(raw);
        note = note || "Arrays and objects were JSON-encoded.";
      }
      const safeKey = key.replace(/([A-Z])/gu, "_$1").toUpperCase().replace(/[^A-Z0-9_]/gu, "_");
      lines.push(quoteEnv(safeKey, rendered));
    }
    return { ok: true, text: `${lines.join("\n")}\n`, note };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function quoteEnv(key: string, value: string): string {
  const needsQuotes = /[\s#"'$\\]/u.test(value);
  return needsQuotes ? `${key}="${value.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')}"` : `${key}=${value}`;
}

export function propertiesToYaml(source: string): ConvertResult {
  try {
    const flat: Record<string, unknown> = {};
    for (const rawLine of source.split(/\r?\n/u)) {
      const line = rawLine.trim();
      if (line === "" || line.startsWith("#") || line.startsWith("!")) {
        continue;
      }
      const separator = line.indexOf("=") !== -1 ? line.indexOf("=") : line.indexOf(":");
      if (separator === -1) {
        continue;
      }
      const key = unescapeJava(line.slice(0, separator).trim());
      const value = unescapeJava(line.slice(separator + 1).trim());
      setDottedPath(flat, key, value);
    }
    return { ok: true, text: stringify(flat, { lineWidth: 0 }) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function unescapeJava(text: string): string {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/gu, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/gu, "\n")
    .replace(/\\t/gu, "\t")
    .replace(/\\r/gu, "\r")
    .replace(/\\:/gu, ":")
    .replace(/\\=/gu, "=")
    .replace(/\\\\/gu, "\\");
}

export function yamlToProperties(source: string): ConvertResult {
  try {
    const value = parseYamlValue(source);
    if (!isPlainObject(value)) {
      return { ok: false, error: "Properties output requires a top-level object/map." };
    }
    const flat = flattenValue(value);
    const lines: string[] = [];
    let note = "";
    for (const key of Object.keys(flat)) {
      const raw = flat[key];
      let rendered: string;
      if (raw === null || raw === undefined) {
        rendered = "";
      } else if (typeof raw === "string") {
        rendered = raw;
      } else if (typeof raw === "number" || typeof raw === "boolean") {
        rendered = String(raw);
      } else {
        rendered = JSON.stringify(raw);
        note = note || "Arrays and objects were JSON-encoded.";
      }
      lines.push(`${escapeJava(key)}=${escapeJava(rendered)}`);
    }
    return { ok: true, text: `${lines.join("\n")}\n`, note };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function escapeJava(text: string): string {
  return text
    .replace(/\\/gu, "\\\\")
    .replace(/\n/gu, "\\n")
    .replace(/\t/gu, "\\t")
    .replace(/\r/gu, "\\r")
    .replace(/([=:])/gu, "\\$1");
}

export function yamlToXml(source: string): ConvertResult {
  try {
    const value = parseYamlValue(source);
    const builder = new XMLBuilder({
      format: true,
      indentBy: "  ",
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      suppressEmptyNode: true,
      processEntities: false,
    });
    const root: Record<string, unknown> = {};
    if (isPlainObject(value)) {
      root.root = transformForXml(value);
    } else {
      root.root = value;
    }
    return { ok: true, text: builder.build(root) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function transformForXml(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(transformForXml);
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const val = value[key];
      if (key.startsWith("@") && (typeof val === "string" || typeof val === "number" || typeof val === "boolean")) {
        out[`@_${key.slice(1)}`] = val;
      } else {
        out[key] = transformForXml(val);
      }
    }
    return out;
  }
  if (value === null || value === undefined) {
    return "";
  }
  return value;
}

export function xmlToYaml(source: string): ConvertResult {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: false,
      trimValues: true,
      processEntities: false,
    });
    const parsed = parser.parse(source) as unknown;
    return { ok: true, text: stringify(stripXmlAttributes(parsed), { lineWidth: 0 }) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function stripXmlAttributes(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripXmlAttributes);
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith("@_")) {
        out[`@${key.slice(2)}`] = value[key];
      } else {
        out[key] = stripXmlAttributes(value[key]);
      }
    }
    return out;
  }
  return value;
}
