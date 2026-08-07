import type { MergeStatistics } from "../types/yaml";

interface StatisticsProps {
  statistics: MergeStatistics | null;
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-mono text-sm font-semibold ${accent}`}>{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

export function Statistics({ statistics }: StatisticsProps) {
  if (!statistics) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-edge-1 bg-surface-2 px-4 py-2.5">
      <Stat label="Keys processed" value={statistics.keysProcessed} accent="text-ink-strong" />
      <span className="h-4 w-px bg-edge-1" aria-hidden="true" />
      <Stat label="Values updated" value={statistics.valuesUpdated} accent="text-emerald-400" />
      <span className="h-4 w-px bg-edge-1" aria-hidden="true" />
      <Stat label="Keys preserved" value={statistics.keysPreserved} accent="text-sky-400" />
    </div>
  );
}
