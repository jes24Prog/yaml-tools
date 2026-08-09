import { isPlainObject } from "../utils/yamlParser";
import type { YamlObject, YamlValue } from "../types/yaml";

export type MergeStrategy =
  | "right-wins"
  | "left-wins"
  | "deep-union"
  | "prefer-non-null"
  | "prefer-non-empty";

export type ResolutionChoice = "left" | "right" | "both" | "skip";

export interface MergeConflict {
  path: string;
  left: string;
  right: string;
  resolved: ResolutionChoice;
}

export interface MergeResult {
  output: YamlValue;
  conflicts: MergeConflict[];
  keysUpdated: number;
}

interface Context {
  strategy: MergeStrategy;
  resolutions: Record<string, ResolutionChoice>;
  conflicts: MergeConflict[];
  keysUpdated: number;
}

function display(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  if (isPlainObject(value) && Object.keys(value).length === 0) {
    return true;
  }
  return false;
}

function resolveDefault(left: unknown, right: unknown, strategy: MergeStrategy): unknown {
  switch (strategy) {
    case "right-wins":
    case "deep-union":
      return right;
    case "left-wins":
      return left;
    case "prefer-non-null":
      return left === null || left === undefined ? right : left;
    case "prefer-non-empty":
      return isEmpty(left) ? right : left;
  }
}

function mergeValue(left: unknown, right: unknown, path: string, ctx: Context): { keep: boolean; value: YamlValue } {
  const bothObjects = isPlainObject(left) && isPlainObject(right);
  if (bothObjects) {
    return {
      keep: true,
      value: mergeObject(left as YamlObject, right as YamlObject, path, ctx),
    };
  }

  const hasConflict = !isPlainObject(left) && !isPlainObject(right) && JSON.stringify(left) !== JSON.stringify(right);

  let resolved: ResolutionChoice | undefined;
  if (hasConflict) {
    resolved = ctx.resolutions[path];
    if (!resolved) {
      const resolvedBy = resolveDefault(left, right, ctx.strategy);
      resolved = resolvedBy === left ? "left" : "right";
    }
    if (resolved === "skip") {
      return { keep: false, value: null };
    }
    if (resolved === "both") {
      return { keep: true, value: [left, right] as YamlValue };
    }
    const chosen = resolved === "left" ? left : right;
    if (JSON.stringify(chosen) !== JSON.stringify(left)) {
      ctx.keysUpdated += 1;
    }
    ctx.conflicts.push({
      path,
      left: display(left),
      right: display(right),
      resolved,
    });
    return { keep: true, value: chosen as YamlValue };
  }

  return { keep: true, value: left as YamlValue };
}

function mergeObject(left: YamlObject, right: YamlObject, path: string, ctx: Context): YamlObject {
  const result: YamlObject = {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of keys) {
    const keyPath = path === "" ? key : `${path}.${key}`;
    const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
    const hasRight = Object.prototype.hasOwnProperty.call(right, key);

    if (!hasLeft) {
      result[key] = right[key] as YamlValue;
      continue;
    }
    if (!hasRight) {
      result[key] = left[key] as YamlValue;
      continue;
    }

    const merged = mergeValue(left[key], right[key], keyPath, ctx);
    if (merged.keep) {
      result[key] = merged.value;
    }
  }
  return result;
}

export function mergeDocuments(
  leftSource: unknown,
  rightSource: unknown,
  strategy: MergeStrategy,
  resolutions: Record<string, ResolutionChoice> = {},
): MergeResult {
  const ctx: Context = {
    strategy,
    resolutions,
    conflicts: [],
    keysUpdated: 0,
  };
  const left = leftSource as YamlObject;
  const right = rightSource as YamlObject;
  const output = mergeObject(left, right, "", ctx);
  return { output, conflicts: ctx.conflicts, keysUpdated: ctx.keysUpdated };
}

export const MERGE_STRATEGIES: Array<{ value: MergeStrategy; label: string; hint: string }> = [
  {
    value: "right-wins",
    label: "Right overrides left",
    hint: "Values from Input 2 replace matching values in Input 1.",
  },
  {
    value: "left-wins",
    label: "Left overrides right",
    hint: "Values from Input 1 replace matching values in Input 2.",
  },
  {
    value: "deep-union",
    label: "Deep union (right wins conflicts)",
    hint: "Combines both documents; nested maps merge, scalar conflicts resolve to Input 2.",
  },
  {
    value: "prefer-non-null",
    label: "Prefer non-null",
    hint: "Keeps the non-null value when exactly one side is null.",
  },
  {
    value: "prefer-non-empty",
    label: "Prefer non-empty",
    hint: "Keeps the non-empty value when one side is empty.",
  },
];

export const RESOLUTION_OPTIONS: Array<{ value: ResolutionChoice; label: string }> = [
  { value: "left", label: "Keep left" },
  { value: "right", label: "Keep right" },
  { value: "both", label: "Keep both" },
  { value: "skip", label: "Skip" },
];
