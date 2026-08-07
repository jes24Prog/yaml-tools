import { parseDocument, stringify } from "yaml";

/**
 * Serializes a value back to a YAML document.
 * Uses an explicit double-quoted default so special characters are preserved.
 */
export function formatYaml(value: unknown, indent = 2): string {
  return stringify(value, {
    indent,
    lineWidth: 0,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
    nullStr: "null",
    minContentWidth: 0,
  });
}

/**
 * Re-serializes YAML source text into a normalized, formatted document.
 * Returns the original text if it cannot be parsed.
 */
export function prettyPrintYaml(source: string): string {
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return source;
  }
  const value = doc.toJS() as unknown;
  return formatYaml(value);
}
