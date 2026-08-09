import { parseDocument } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface DocsResult {
  ok: boolean;
  text: string;
  error?: string;
}

function inferType(value: unknown): string {
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

function collectDescriptions(value: Record<string, unknown>, path: string): Record<string, string> {
  const descriptions: Record<string, string> = {};
  for (const key of Object.keys(value)) {
    const childPath = path === "" ? key : `${path}.${key}`;
    const child = value[key];
    if (typeof child === "string" && /^description$/iu.test(key)) {
      descriptions[path] = child;
      continue;
    }
    if (isPlainObject(child)) {
      const nested = collectDescriptions(child as Record<string, unknown>, childPath);
      Object.assign(descriptions, nested);
    }
  }
  return descriptions;
}

export function generateDocs(source: string): DocsResult {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, text: "", error: doc.errors[0].message };
  }
  const value = doc.toJS();
  if (!isPlainObject(value)) {
    return { ok: false, text: "", error: "Documentation generation requires a top-level object/map." };
  }

  const descriptions = collectDescriptions(value, "");
  const lines: string[] = [];
  lines.push(`# YAML Document Reference`);
  lines.push("");
  lines.push(`Generated from ${value.length === undefined ? "a YAML document" : ""} on ${new Date().toISOString().slice(0, 10)}.`);
  lines.push("");
  lines.push("## Top-level keys");
  lines.push("");
  lines.push("| Key | Type | Description |");
  lines.push("| --- | --- | --- |");
  for (const key of Object.keys(value)) {
    const type = inferType(value[key]);
    lines.push(`| \`${key}\` | \`${type}\` | ${descriptions[key] ?? ""} |`);
  }
  lines.push("");

  lines.push("## Details");
  lines.push("");
  const walk = (node: unknown, path: string): void => {
    if (isPlainObject(node)) {
      for (const key of Object.keys(node)) {
        const childPath = path === "" ? key : `${path}.${key}`;
        const child = node[key];
        if (isPlainObject(child) || Array.isArray(child)) {
          lines.push(`### \`${childPath}\``);
          lines.push("");
          if (descriptions[childPath]) {
            lines.push(`> ${descriptions[childPath]}`);
            lines.push("");
          }
          lines.push(`Type: \`${inferType(child)}\``);
          lines.push("");
          walk(child, childPath);
        } else {
          const type = inferType(child);
          const sample = typeof child === "string" ? `\`"${child}"\`` : `\`${JSON.stringify(child) ?? "null"}\``;
          lines.push(`### \`${childPath}\``);
          lines.push("");
          lines.push(`Type: \`${type}\` · Example: ${sample}`);
          lines.push("");
        }
      }
    } else if (Array.isArray(node)) {
      node.forEach((item, index) => {
        if (isPlainObject(item) || Array.isArray(item)) {
          walk(item, `${path}[${index}]`);
        } else {
          lines.push(`### \`${path}[${index}]\``);
          lines.push("");
          lines.push(`Type: \`${inferType(item)}\``);
          lines.push("");
        }
      });
    }
  };
  walk(value, "");
  return { ok: true, text: lines.join("\n") };
}
