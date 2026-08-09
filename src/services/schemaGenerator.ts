import { parseDocument, stringify } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface SchemaGenOptions {
  markAllRequired: boolean;
  inlineEnums: boolean;
  enumThreshold: number;
}

export const DEFAULT_SCHEMA_GEN_OPTIONS: SchemaGenOptions = {
  markAllRequired: true,
  inlineEnums: true,
  enumThreshold: 5,
};

export interface SchemaGenResult {
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
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  return typeof value;
}

function buildSchema(value: unknown, options: SchemaGenOptions): Record<string, unknown> {
  const type = inferType(value);

  if (type === "object") {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const key of Object.keys(value as Record<string, unknown>)) {
      properties[key] = buildSchema((value as Record<string, unknown>)[key], options);
      if (options.markAllRequired) {
        required.push(key);
      }
    }
    const schema: Record<string, unknown> = { type: "object", properties };
    if (required.length > 0) {
      schema.required = required;
    }
    return schema;
  }

  if (type === "array") {
    const items = (value as unknown[]).map((item) => buildSchema(item, options));
    const itemTypes = [...new Set(items.map((item) => item.type as string))];
    const schema: Record<string, unknown> = { type: "array" };
    if (items.length > 0) {
      if (itemTypes.length === 1) {
        const first = items[0];
        schema.items = first.type === "object" || first.type === "array" ? first : { type: first.type };
      } else {
        schema.items = { anyOf: items };
      }
    } else {
      schema.items = {};
    }
    return schema;
  }

  const schema: Record<string, unknown> = { type };
  if (type === "string") {
    const values = [value as string];
    const distinct = [...new Set(values)];
    if (options.inlineEnums && distinct.length >= 1 && distinct.length <= options.enumThreshold) {
      schema.enum = distinct;
    }
  }
  return schema;
}

export function generateSchema(source: string, options: Partial<SchemaGenOptions> = {}): SchemaGenResult {
  const opts: SchemaGenOptions = { ...DEFAULT_SCHEMA_GEN_OPTIONS, ...options };
  const doc = parseDocument(source);
  if (doc.errors.length > 0) {
    return { ok: false, text: "", error: doc.errors[0].message };
  }
  const value = doc.toJS();
  if (!isPlainObject(value)) {
    return { ok: false, text: "", error: "Schema generation requires a top-level object/map." };
  }
  const schema: Record<string, unknown> = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    ...buildSchema(value, opts),
  };
  return { ok: true, text: stringify(schema, { lineWidth: 0 }) };
}
