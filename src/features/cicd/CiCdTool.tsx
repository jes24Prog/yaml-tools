import { useMemo } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { inspectCiCd } from "../../services/ciCdService";
import { ToolPage, Stat } from "../shared/ToolShell";

export default function CiCdTool() {
  const { activeDocument } = useWorkbench();
  const result = useMemo(() => inspectCiCd(activeDocument.content), [activeDocument.content]);

  return (
    <ToolPage
      icon="cicd"
      title="CI/CD Inspector"
      description="Analyze GitHub Actions, GitLab CI and Azure Pipelines pipelines: jobs, actions, secrets and pinning issues."
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-5 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          {result.platform ? (
            <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-400">
              {result.platform}
            </span>
          ) : (
            <span className="rounded border border-edge-1 bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-faint">
              not detected
            </span>
          )}
          {result.name && <span className="text-sm font-semibold text-ink-strong">{result.name}</span>}
          <Stat label="events" value={result.events.length} accent="text-sky-400" />
          <Stat label="jobs" value={result.jobs.length} accent="text-ink-strong" />
          <Stat label="secrets" value={result.secrets.length} accent="text-amber-400" />
          <Stat label="dangers" value={result.dangers.length} accent={result.dangers.length > 0 ? "text-red-400" : "text-ink-faint"} />
        </div>

        {!result.detected && (
          <div className="flex-none rounded-xl border border-dashed border-edge-1 p-6 text-center text-xs text-ink-faint">
            No CI/CD pipeline detected in the active document.
          </div>
        )}

        {result.jobs.length > 0 && (
          <div className="grid min-h-0 grid-cols-1 gap-3 overflow-auto xl:grid-cols-2">
            {result.jobs.map((job, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-lg border border-edge-1 bg-surface-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-ink-strong">{job.name}</span>
                  {job.runsOn && <span className="text-[11px] text-ink-muted">runs-on: {job.runsOn}</span>}
                  <span className="text-[11px] text-ink-muted">steps: {job.steps}</span>
                  {job.hasScript && (
                    <span className="rounded border border-sky-500/40 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-400">
                      script
                    </span>
                  )}
                </div>
                {job.usesActions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.usesActions.map((action) => (
                      <span key={action} className="rounded border border-edge-1 bg-surface-0 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                        {action}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {result.secrets.length > 0 && (
          <div className="flex-none overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-400">Secrets referenced</h3>
            </header>
            <div className="flex flex-wrap gap-1.5 p-3">
              {result.secrets.map((secret) => (
                <span key={secret} className="rounded border border-edge-1 bg-surface-2 px-2 py-0.5 font-mono text-xs text-ink">
                  {secret}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.dangers.length > 0 && (
          <div className="flex-none overflow-hidden rounded-xl border border-red-500/30 bg-red-500/5 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-red-500/20 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-red-400">Dangerous patterns</h3>
            </header>
            <ul className="max-h-48 divide-y divide-red-500/10 overflow-auto">
              {result.dangers.map((danger, index) => (
                <li key={index} className="px-4 py-2 text-xs text-ink">
                  {danger}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
