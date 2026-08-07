import { useCallback, useEffect, useRef, useState } from "react";
import { mergeYamlDocuments } from "../services/yamlMergeService";
import type {
  MergeStatistics,
  ValueChange,
  YamlObject,
  YamlParseError,
} from "../types/yaml";
import { parseYamlObject } from "../utils/yamlParser";
import { formatYaml } from "../utils/yamlFormatter";

interface UseYamlMergeOptions {
  primaryYaml: string;
  targetYaml: string;
  autoUpdate: boolean;
  trackChanges: boolean;
  debounceMs?: number;
}

export interface UseYamlMergeResult {
  outputYaml: string;
  setOutputYaml: (value: string) => void;
  primaryError: YamlParseError | null;
  targetError: YamlParseError | null;
  statistics: MergeStatistics | null;
  changes: ValueChange[];
  hasMerged: boolean;
  isProcessing: boolean;
  runMerge: () => void;
  reset: () => void;
}

/**
 * Orchestrates YAML parsing, merging and serialization.
 * When `autoUpdate` is enabled, re-processing is debounced.
 */
export function useYamlMerge({
  primaryYaml,
  targetYaml,
  autoUpdate,
  trackChanges,
  debounceMs = 400,
}: UseYamlMergeOptions): UseYamlMergeResult {
  const [outputYaml, setOutputYaml] = useState("");
  const [primaryError, setPrimaryError] = useState<YamlParseError | null>(null);
  const [targetError, setTargetError] = useState<YamlParseError | null>(null);
  const [statistics, setStatistics] = useState<MergeStatistics | null>(null);
  const [changes, setChanges] = useState<ValueChange[]>([]);
  const [hasMerged, setHasMerged] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const autoUpdateRef = useRef(autoUpdate);
  autoUpdateRef.current = autoUpdate;

  const reset = useCallback(() => {
    setOutputYaml("");
    setPrimaryError(null);
    setTargetError(null);
    setStatistics(null);
    setChanges([]);
    setHasMerged(false);
    setIsProcessing(false);
  }, []);

  const runMerge = useCallback(() => {
    setIsProcessing(true);

    try {
      const primarySource = primaryYaml.trim();
      const targetSource = targetYaml.trim();

      if (primarySource === "") {
        setPrimaryError({ message: "Primary YAML is empty." });
        setTargetError(null);
        setStatistics(null);
        setChanges([]);
        setHasMerged(false);
        return;
      }

      if (targetSource === "") {
        setPrimaryError(null);
        setTargetError({ message: "Target YAML is empty." });
        setStatistics(null);
        setChanges([]);
        setHasMerged(false);
        return;
      }

      const primaryResult = parseYamlObject(primarySource);
      if (primaryResult.error) {
        setPrimaryError(primaryResult.error);
        setTargetError(null);
        setStatistics(null);
        setChanges([]);
        setHasMerged(false);
        return;
      }

      const targetResult = parseYamlObject(targetSource);
      if (targetResult.error) {
        setPrimaryError(null);
        setTargetError(targetResult.error);
        setStatistics(null);
        setChanges([]);
        setHasMerged(false);
        return;
      }

      setPrimaryError(null);
      setTargetError(null);

      const result = mergeYamlDocuments(
        primaryResult.value as YamlObject,
        targetResult.value as YamlObject,
        { trackChanges },
      );

      setOutputYaml(formatYaml(result.output));
      setStatistics(result.statistics);
      setChanges(trackChanges ? result.changes : []);
      setHasMerged(true);
    } finally {
      setIsProcessing(false);
    }
  }, [primaryYaml, targetYaml, trackChanges]);

  useEffect(() => {
    if (!autoUpdateRef.current) {
      return;
    }
    const timer = window.setTimeout(() => {
      runMerge();
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [primaryYaml, targetYaml, runMerge, debounceMs]);

  return {
    outputYaml,
    setOutputYaml,
    primaryError,
    targetError,
    statistics,
    changes,
    hasMerged,
    isProcessing,
    runMerge,
    reset,
  };
}