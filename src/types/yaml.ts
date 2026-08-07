export type YamlScalar = string | number | boolean | null;

export interface YamlObject {
  [key: string]: YamlValue;
}

export type YamlValue = YamlScalar | YamlValue[] | YamlObject;

export interface MergeStatistics {
  /** Total number of leaf keys present in the target configuration. */
  keysProcessed: number;
  /** Number of leaf keys whose value was replaced by the override source. */
  valuesUpdated: number;
  /** Number of leaf keys kept unchanged from the target configuration. */
  keysPreserved: number;
}

export type ChangeType = "updated" | "preserved";

export interface ValueChange {
  /** Dot/path notation of the key within the target document. */
  path: string;
  /** The previous value from the target configuration. */
  oldValue: string;
  /** The new value applied from the override source. */
  newValue: string;
  /** The change type. */
  type: ChangeType;
}

export interface MergeResult {
  /** The merged output value (the target configuration with overrides applied). */
  output: YamlValue;
  /** Statistics gathered during the merge. */
  statistics: MergeStatistics;
  /** Detailed list of value changes when `trackChanges` is enabled. */
  changes: ValueChange[];
}

export interface YamlParseError {
  message: string;
  line?: number;
  column?: number;
}

export type EditorKind = "primary" | "target" | "output";

export type ThemeMode = "dark" | "light";
