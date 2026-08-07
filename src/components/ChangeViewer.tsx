import type { ValueChange } from "../types/yaml";

interface ChangeViewerProps {
  changes: ValueChange[];
  visible: boolean;
}

export function ChangeViewer({ changes, visible }: ChangeViewerProps) {
  if (!visible) {
    return null;
  }

  const updated = changes.filter((change) => change.type === "updated");

  if (updated.length === 0) {
    return (
      <div className="rounded-lg border border-edge-1 bg-surface-2 px-4 py-3 text-sm text-ink-muted">
        No values were overridden by the Primary YAML.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-edge-1 bg-surface-2">
      <div className="border-b border-edge-1 bg-surface-3 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink">
        Overridden values ({updated.length})
      </div>
      <ul className="max-h-64 divide-y divide-edge-0 overflow-y-auto">
        {updated.map((change) => (
          <li key={change.path} className="px-4 py-3">
            <div className="font-mono text-sm font-medium text-amber-400">{change.path}</div>
            <dl className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-edge-0 bg-surface-1 p-2">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Old
                </dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-ink-muted line-through decoration-red-400/60">
                  {change.oldValue || '""'}
                </dd>
              </div>
              <div className="rounded-md border border-emerald-700/40 bg-emerald-900/15 p-2">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
                  New
                </dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-emerald-300">
                  {change.newValue || '""'}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
