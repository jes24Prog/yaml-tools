import type {
  MergeResult,
  MergeStatistics,
  ValueChange,
  YamlObject,
  YamlValue,
} from "../types/yaml";

export interface MergeOptions {
  /** When enabled, detailed per-key change records are produced. */
  trackChanges?: boolean;
  /** When enabled, keys that exist only in the override source are added to the output. */
  addMissingKeys?: boolean;
}

interface MergeContext {
  statistics: MergeStatistics;
  changes: ValueChange[];
  trackChanges: boolean;
  addMissingKeys: boolean;
}

function isPlainObject(value: unknown): value is YamlObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Converts a value into a readable string used in change reporting.
 */
function valueToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    return value.map((item) => `- ${valueToString(item)}`).join("\n");
  }
  if (isPlainObject(value)) {
    const lines = Object.keys(value).map(
      (key) => `${key}: ${valueToString(value[key]).replace(/\n/g, "\n  ")}`,
    );
    return lines.join("\n");
  }
  return String(value);
}

/**
 * Recursively merges the target configuration with the override source.
 *
 * For every key present in `target`:
 *   - if the key also exists in `override` and both values are plain objects,
 *     the objects are merged recursively;
 *   - if the key also exists in `override` and the values are not both objects,
 *     the override value replaces the target value (arrays are replaced whole);
 *   - otherwise the target value is preserved.
 *
 * Keys that exist only in `override` are only added to the result when
 * `options.addMissingKeys` is enabled, in which case they are appended after
 * the target keys at each level.
 * The key ordering of `target` is always preserved.
 */
export function mergeYamlDocuments(
  overrideSource: YamlObject,
  targetConfiguration: YamlObject,
  options: MergeOptions = {},
): MergeResult {
  const context: MergeContext = {
    statistics: { keysProcessed: 0, valuesUpdated: 0, keysPreserved: 0, keysAdded: 0 },
    changes: [],
    trackChanges: options.trackChanges ?? false,
    addMissingKeys: options.addMissingKeys ?? false,
  };

  const output = mergeObject(overrideSource, targetConfiguration, "", context);

  return {
    output,
    statistics: context.statistics,
    changes: context.changes,
  };
}

function mergeObject(
  overrideSource: YamlObject,
  targetConfiguration: YamlObject,
  basePath: string,
  context: MergeContext,
): YamlObject {
  const result: YamlObject = {};

  for (const key of Object.keys(targetConfiguration)) {
    const keyPath = basePath === "" ? key : `${basePath}.${key}`;
    const targetValue = targetConfiguration[key];
    const hasOverride = Object.prototype.hasOwnProperty.call(overrideSource, key);

    if (!hasOverride) {
      result[key] = targetValue as YamlValue;
      context.statistics.keysProcessed += 1;
      context.statistics.keysPreserved += 1;
      if (context.trackChanges) {
        context.changes.push({
          path: keyPath,
          oldValue: valueToString(targetValue),
          newValue: valueToString(targetValue),
          type: "preserved",
        });
      }
      continue;
    }

    const overrideValue = overrideSource[key];

    if (isPlainObject(overrideValue) && isPlainObject(targetValue)) {
      result[key] = mergeObject(overrideValue, targetValue, keyPath, context);
      continue;
    }

    result[key] = overrideValue;
    context.statistics.keysProcessed += 1;
    context.statistics.valuesUpdated += 1;
    if (context.trackChanges) {
      context.changes.push({
        path: keyPath,
        oldValue: valueToString(targetValue),
        newValue: valueToString(overrideValue),
        type: "updated",
      });
    }
  }

  for (const key of Object.keys(overrideSource)) {
    if (!Object.prototype.hasOwnProperty.call(targetConfiguration, key) && context.addMissingKeys) {
      const keyPath = basePath === "" ? key : `${basePath}.${key}`;
      const overrideValue = overrideSource[key];
      result[key] = overrideValue;
      context.statistics.keysAdded += 1;
      if (context.trackChanges) {
        context.changes.push({
          path: keyPath,
          oldValue: "",
          newValue: valueToString(overrideValue),
          type: "added",
        });
      }
    }
  }

  return result;
}

export function createEmptyStatistics(): MergeStatistics {
  return { keysProcessed: 0, valuesUpdated: 0, keysPreserved: 0, keysAdded: 0 };
}
