import { parseDocument } from "yaml";
import { isPlainObject } from "../utils/yamlParser";

export interface SchemaIssue {
  path: string;
  keyword: string;
  message: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  issues: SchemaIssue[];
  error?: string;
}

interface ValidatorContext {
  root: unknown;
  issues: SchemaIssue[];
  visitedRefs: Set<string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/u;
const HOSTNAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/u;

function typeMatches(value: unknown, type: string): boolean {
  switch (type) {
    case "object":
      return isPlainObject(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return true;
  }
}

function formatMatches(value: string, format: string): boolean {
  switch (format) {
    case "email":
      return EMAIL_RE.test(value);
    case "uuid":
      return UUID_RE.test(value);
    case "ipv4":
      return IPV4_RE.test(value);
    case "hostname":
    case "host-name":
      return HOSTNAME_RE.test(value);
    case "date-time":
      return !isNaN(Date.parse(value));
    case "uri":
    case "url":
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case "regex":
      try {
        new RegExp(value);
        return true;
      } catch {
        return false;
      }
    default:
      return true;
  }
}

function resolveRef(ref: string, context: ValidatorContext): unknown {
  const root = context.root;
  const clean = ref.replace(/^#\//u, "").split("/").map((part) => part.replace(/~1/gu, "/").replace(/~0/gu, "~"));
  let current: unknown = root;
  for (const segment of clean) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (Array.isArray(current)) {
      current = current[Number(segment)];
    } else if (isPlainObject(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

export function validateValue(value: unknown, schema: unknown): SchemaValidationResult {
  const context: ValidatorContext = { root: schema, issues: [], visitedRefs: new Set() };
  if (!isPlainObject(schema) && !Array.isArray(schema)) {
    return { valid: false, issues: [{ path: "$", keyword: "schema", message: "Schema must be an object or array." }] };
  }
  validate(value, schema, "$", context);
  return { valid: context.issues.length === 0, issues: context.issues };
}

function validate(value: unknown, schema: unknown, path: string, context: ValidatorContext): void {
  if (!isPlainObject(schema)) {
    return;
  }
  const schemaObj = schema as Record<string, unknown>;

  if (typeof schemaObj.$ref === "string") {
    const ref = schemaObj.$ref;
    const refKey = `${ref}|${path}`;
    if (context.visitedRefs.has(refKey)) {
      return;
    }
    context.visitedRefs.add(refKey);
    const resolved = resolveRef(ref, context);
    if (resolved === undefined) {
      context.issues.push({ path, keyword: "$ref", message: `Unresolved $ref '${ref}'.` });
      return;
    }
    validate(value, resolved, path, context);
    context.visitedRefs.delete(refKey);
    return;
  }

  if (typeof schemaObj.type === "string") {
    if (!typeMatches(value, schemaObj.type)) {
      context.issues.push({ path, keyword: "type", message: `Expected type '${schemaObj.type}', got '${describeType(value)}'.` });
      return;
    }
  }

  if (Array.isArray(schemaObj.enum)) {
    if (!schemaObj.enum.some((item) => JSON.stringify(item) === JSON.stringify(value))) {
      context.issues.push({ path, keyword: "enum", message: `Value must be one of: ${schemaObj.enum.map(String).join(", ")}.` });
    }
  }

  if ("const" in schemaObj && JSON.stringify(schemaObj.const) !== JSON.stringify(value)) {
    context.issues.push({ path, keyword: "const", message: `Value must equal ${JSON.stringify(schemaObj.const)}.` });
  }

  if (typeof value === "string") {
    if (typeof schemaObj.pattern === "string") {
      try {
        if (!new RegExp(schemaObj.pattern, "u").test(value)) {
          context.issues.push({ path, keyword: "pattern", message: `Does not match pattern /${schemaObj.pattern}/.` });
        }
      } catch {
        context.issues.push({ path, keyword: "pattern", message: `Invalid regex in schema: '${schemaObj.pattern}'.` });
      }
    }
    if (typeof schemaObj.minLength === "number" && value.length < schemaObj.minLength) {
      context.issues.push({ path, keyword: "minLength", message: `Length ${value.length} is less than ${schemaObj.minLength}.` });
    }
    if (typeof schemaObj.maxLength === "number" && value.length > schemaObj.maxLength) {
      context.issues.push({ path, keyword: "maxLength", message: `Length ${value.length} exceeds ${schemaObj.maxLength}.` });
    }
    if (typeof schemaObj.format === "string" && !formatMatches(value, schemaObj.format)) {
      context.issues.push({ path, keyword: "format", message: `Does not match format '${schemaObj.format}'.` });
    }
  }

  if (typeof value === "number") {
    if (typeof schemaObj.minimum === "number" && value < schemaObj.minimum) {
      context.issues.push({ path, keyword: "minimum", message: `Value ${value} is less than ${schemaObj.minimum}.` });
    }
    if (typeof schemaObj.maximum === "number" && value > schemaObj.maximum) {
      context.issues.push({ path, keyword: "maximum", message: `Value ${value} exceeds ${schemaObj.maximum}.` });
    }
    if (typeof schemaObj.exclusiveMinimum === "number" && value <= schemaObj.exclusiveMinimum) {
      context.issues.push({ path, keyword: "exclusiveMinimum", message: `Value ${value} must be greater than ${schemaObj.exclusiveMinimum}.` });
    }
    if (typeof schemaObj.exclusiveMaximum === "number" && value >= schemaObj.exclusiveMaximum) {
      context.issues.push({ path, keyword: "exclusiveMaximum", message: `Value ${value} must be less than ${schemaObj.exclusiveMaximum}.` });
    }
    if (typeof schemaObj.multipleOf === "number" && schemaObj.multipleOf !== 0 && value % schemaObj.multipleOf !== 0) {
      context.issues.push({ path, keyword: "multipleOf", message: `Value ${value} is not a multiple of ${schemaObj.multipleOf}.` });
    }
  }

  if (Array.isArray(value)) {
    if (typeof schemaObj.minItems === "number" && value.length < schemaObj.minItems) {
      context.issues.push({ path, keyword: "minItems", message: `Expected at least ${schemaObj.minItems} items, got ${value.length}.` });
    }
    if (typeof schemaObj.maxItems === "number" && value.length > schemaObj.maxItems) {
      context.issues.push({ path, keyword: "maxItems", message: `Expected at most ${schemaObj.maxItems} items, got ${value.length}.` });
    }
    if (schemaObj.uniqueItems === true) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) {
        context.issues.push({ path, keyword: "uniqueItems", message: "Array items must be unique." });
      }
    }
    if (schemaObj.items !== undefined) {
      value.forEach((item, index) => validate(item, schemaObj.items, `${path}[${index}]`, context));
    }
  }

  if (isPlainObject(value) && isPlainObject(schemaObj.properties)) {
    const properties = schemaObj.properties as Record<string, unknown>;
    for (const key of Object.keys(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validate(value[key], properties[key], path === "$" ? `$.${key}` : `${path}.${key}`, context);
      }
    }
  }

  if (isPlainObject(value)) {
    const allowed = new Set(Object.keys(schemaObj.properties as Record<string, unknown> ?? {}));
    if (isPlainObject(schemaObj.patternProperties)) {
      const patternProps = schemaObj.patternProperties as Record<string, unknown>;
      for (const key of Object.keys(value)) {
        for (const pattern of Object.keys(patternProps)) {
          try {
            if (new RegExp(pattern, "u").test(key)) {
              allowed.add(key);
              validate(value[key], patternProps[pattern], path === "$" ? `$.${key}` : `${path}.${key}`, context);
            }
          } catch {
            // Ignore invalid schema regex.
          }
        }
      }
    }
    if (schemaObj.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) {
          context.issues.push({ path, keyword: "additionalProperties", message: `Additional property '${key}' is not allowed.` });
        }
      }
    } else if (isPlainObject(schemaObj.additionalProperties)) {
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) {
          validate(value[key], schemaObj.additionalProperties, path === "$" ? `$.${key}` : `${path}.${key}`, context);
        }
      }
    }
  }

  if (Array.isArray(schemaObj.required)) {
    for (const key of schemaObj.required) {
      if (typeof key === "string" && !(isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, key))) {
        context.issues.push({ path, keyword: "required", message: `Missing required property '${key}'.` });
      }
    }
  }

  if (Array.isArray(schemaObj.anyOf)) {
    const ok = schemaObj.anyOf.some((sub) => {
      const subContext: ValidatorContext = { root: context.root, issues: [], visitedRefs: new Set() };
      validate(value, sub, path, subContext);
      return subContext.issues.length === 0;
    });
    if (!ok) {
      context.issues.push({ path, keyword: "anyOf", message: "Value does not match any of the allowed schemas." });
    }
  }

  if (Array.isArray(schemaObj.allOf)) {
    for (const sub of schemaObj.allOf) {
      validate(value, sub, path, context);
    }
  }

  if (Array.isArray(schemaObj.oneOf)) {
    const passing = schemaObj.oneOf.filter((sub) => {
      const subContext: ValidatorContext = { root: context.root, issues: [], visitedRefs: new Set() };
      validate(value, sub, path, subContext);
      return subContext.issues.length === 0;
    }).length;
    if (passing !== 1) {
      context.issues.push({ path, keyword: "oneOf", message: `Value matches ${passing} schemas, expected exactly one.` });
    }
  }

  if (schemaObj.not !== undefined) {
    const subContext: ValidatorContext = { root: context.root, issues: [], visitedRefs: new Set() };
    validate(value, schemaObj.not, path, subContext);
    if (subContext.issues.length === 0) {
      context.issues.push({ path, keyword: "not", message: "Value matches a forbidden schema." });
    }
  }
}

function describeType(value: unknown): string {
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

export function validateYamlAgainstSchema(source: string, schemaSource: string): SchemaValidationResult {
  const valueDoc = parseDocument(source);
  if (valueDoc.errors.length > 0) {
    return { valid: false, issues: [{ path: "$", keyword: "parse", message: valueDoc.errors[0].message }] };
  }
  const schemaDoc = parseDocument(schemaSource);
  if (schemaDoc.errors.length > 0) {
    return { valid: false, issues: [{ path: "$", keyword: "schema-parse", message: `Schema is not valid YAML: ${schemaDoc.errors[0].message}` }] };
  }
  return validateValue(valueDoc.toJS(), schemaDoc.toJS());
}
