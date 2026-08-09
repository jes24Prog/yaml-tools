import { parseDocument, stringify } from "yaml";
import { isPlainObject, toPlainValue } from "../utils/yamlParser";

export type DiffKind = "added" | "removed" | "changed";

export interface DiffChange {
  path: string;
  kind: DiffKind;
  oldValue: string;
  newValue: string;
}

export interface DiffResult {
  hasChanges: boolean;
  changes: DiffChange[];
  addedCount: number;
  removedCount: number;
  changedCount: number;
  unified: string;
}

function stringifyValue(value: unknown): string {
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
    return value.map((item) => `- ${stringifyValue(item)}`).join("\n");
  }
  if (isPlainObject(value)) {
    const lines = Object.keys(value).map(
      (key) => `${key}: ${stringifyValue(value[key]).replace(/\n/g, "\n  ")}`,
    );
    return lines.join("\n");
  }
  return String(value);
}

function walkDiff(
  left: unknown,
  right: unknown,
  basePath: string,
  changes: DiffChange[],
): void {
  const bothObjects = isPlainObject(left) && isPlainObject(right);

  if (!bothObjects) {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      changes.push({
        path: basePath,
        kind: "changed",
        oldValue: stringifyValue(left),
        newValue: stringifyValue(right),
      });
    }
    return;
  }

  const leftObj = left as Record<string, unknown>;
  const rightObj = right as Record<string, unknown>;
  const leftKeys = new Set(Object.keys(leftObj));
  const rightKeys = new Set(Object.keys(rightObj));

  for (const key of rightKeys) {
    if (!leftKeys.has(key)) {
      const path = basePath === "" ? key : `${basePath}.${key}`;
      changes.push({
        path,
        kind: "added",
        oldValue: "",
        newValue: stringifyValue(rightObj[key]),
      });
    }
  }

  for (const key of leftKeys) {
    const path = basePath === "" ? key : `${basePath}.${key}`;
    if (!rightKeys.has(key)) {
      changes.push({
        path,
        kind: "removed",
        oldValue: stringifyValue(leftObj[key]),
        newValue: "",
      });
    } else {
      walkDiff(leftObj[key], rightObj[key], path, changes);
    }
  }
}

export function diffYamlValues(left: unknown, right: unknown): DiffResult {
  const changes: DiffChange[] = [];
  walkDiff(toPlainValue(left), toPlainValue(right), "", changes);
  const addedCount = changes.filter((c) => c.kind === "added").length;
  const removedCount = changes.filter((c) => c.kind === "removed").length;
  const changedCount = changes.filter((c) => c.kind === "changed").length;
  return {
    hasChanges: changes.length > 0,
    changes,
    addedCount,
    removedCount,
    changedCount,
    unified: buildUnifiedDiff(left, right),
  };
}

export function diffYamlSources(leftSource: string, rightSource: string): DiffResult {
  const leftDoc = parseDocument(leftSource);
  const rightDoc = parseDocument(rightSource);
  if (leftDoc.errors.length > 0 || rightDoc.errors.length > 0) {
    return {
      hasChanges: false,
      changes: [],
      addedCount: 0,
      removedCount: 0,
      changedCount: 0,
      unified: "",
    };
  }
  return diffYamlValues(leftDoc.toJS(), rightDoc.toJS());
}

interface LineDiff {
  type: "same" | "add" | "del";
  text: string;
}

function lineDiff(leftLines: string[], rightLines: string[]): LineDiff[] {
  let start = 0;
  const maxCommon =
    leftLines.length === 0 || rightLines.length === 0
      ? 0
      : Math.min(leftLines.length, rightLines.length);
  while (start < maxCommon && leftLines[start] === rightLines[start]) {
    start += 1;
  }
  let end = 0;
  while (
    end < leftLines.length - start &&
    end < rightLines.length - start &&
    leftLines[leftLines.length - 1 - end] === rightLines[rightLines.length - 1 - end]
  ) {
    end += 1;
  }

  const middleLeft = leftLines.slice(start, leftLines.length - end);
  const middleRight = rightLines.slice(start, rightLines.length - end);

  const pairs = lcsPairs(middleLeft, middleRight);

  const result: LineDiff[] = [];
  for (let i = 0; i < start; i += 1) {
    result.push({ type: "same", text: leftLines[i] });
  }
  for (const pair of pairs) {
    if (pair.left >= 0 && pair.right >= 0) {
      result.push({ type: "same", text: middleLeft[pair.left] });
    } else if (pair.left >= 0) {
      result.push({ type: "del", text: middleLeft[pair.left] });
    } else if (pair.right >= 0) {
      result.push({ type: "add", text: middleRight[pair.right] });
    }
  }
  for (let i = 0; i < end; i += 1) {
    result.push({ type: "same", text: leftLines[leftLines.length - end + i] });
  }
  return result;
}

interface IndexPair {
  left: number;
  right: number;
}

function lcsPairs(left: string[], right: string[]): IndexPair[] {
  const n = left.length;
  const m = right.length;
  if (n === 0 || m === 0) {
    return left.map((_, index) => ({ left: index, right: -1 })).concat(
      right.map((_, index) => ({ left: -1, right: index })),
    );
  }
  if (n * m > 1_000_000) {
    return greedyPairs(left, right);
  }
  const table: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] =
        left[i] === right[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const pairs: IndexPair[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i] === right[j]) {
      pairs.push({ left: i, right: j });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      pairs.push({ left: i, right: -1 });
      i += 1;
    } else {
      pairs.push({ left: -1, right: j });
      j += 1;
    }
  }
  while (i < n) {
    pairs.push({ left: i, right: -1 });
    i += 1;
  }
  while (j < m) {
    pairs.push({ left: -1, right: j });
    j += 1;
  }
  return pairs;
}

function greedyPairs(left: string[], right: string[]): IndexPair[] {
  const pairs: IndexPair[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      pairs.push({ left: i, right: j });
      i += 1;
      j += 1;
    } else if (i < left.length && left.includes(right[j])) {
      pairs.push({ left: i, right: -1 });
      i += 1;
    } else if (j < right.length) {
      pairs.push({ left: -1, right: j });
      j += 1;
    } else {
      pairs.push({ left: i, right: -1 });
      i += 1;
    }
  }
  return pairs;
}

function buildUnifiedDiff(left: unknown, right: unknown): string {
  const leftText = stringify(toPlainValue(left), { lineWidth: 0 }).trimEnd();
  const rightText = stringify(toPlainValue(right), { lineWidth: 0 }).trimEnd();
  const diff = lineDiff(leftText.split("\n"), rightText.split("\n"));
  const body = diff
    .filter((line) => line.type !== "same")
    .map((line) => {
      if (line.type === "add") {
        return `+ ${line.text}`;
      }
      return `- ${line.text}`;
    })
    .join("\n");
  return `--- left\n+++ right\n${body}`;
}
