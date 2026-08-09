import { useMemo } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { inspectKubernetes, type K8sResourceSummary } from "../../services/k8sService";
import { ToolPage, Stat, PathTag } from "../shared/ToolShell";

const SEVERITY_BADGE: Record<string, string> = {
  error: "border-red-500/40 bg-red-500/10 text-red-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-400",
};

function WorkloadCard({ resource }: { resource: K8sResourceSummary }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-edge-1 bg-surface-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-400">
          {resource.kind}
        </span>
        <span className="font-mono text-sm font-semibold text-ink-strong">{resource.name}</span>
        <span className="text-[11px] text-ink-faint">#{resource.index + 1} · {resource.apiVersion}</span>
      </div>
      {resource.namespace && <div className="text-xs text-ink-muted">namespace: {resource.namespace}</div>}
      {resource.replicas !== undefined && <div className="text-xs text-ink-muted">replicas: {resource.replicas}</div>}
      {resource.containers.map((container, index) => (
        <div key={index} className="flex flex-col gap-0.5 rounded-md border border-edge-0 bg-surface-1 px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-semibold text-ink">{container.name}</span>
            <span className="font-mono text-emerald-400">{container.image}</span>
          </div>
          {container.ports.length > 0 && (
            <div className="text-[11px] text-ink-muted">ports: {container.ports.join(", ")}</div>
          )}
          {(container.resources.requests || container.resources.limits) && (
            <div className="text-[11px] text-ink-muted">
              requests: {container.resources.requests ?? "—"} · limits: {container.resources.limits ?? "—"}
            </div>
          )}
        </div>
      ))}
      {resource.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {resource.labels.map((label) => (
            <span key={label} className="rounded border border-edge-1 bg-surface-0 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KubernetesInspectorTool() {
  const { activeDocument } = useWorkbench();
  const { resources, issues } = useMemo(() => inspectKubernetes(activeDocument.content), [activeDocument.content]);

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return (
    <ToolPage
      icon="kubernetes"
      title="Kubernetes Inspector"
      description="Parse multi-document Kubernetes manifests and validate resource names, images, replicas and selectors."
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-5 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <Stat label="resources" value={resources.length} accent="text-emerald-400" />
          <Stat label="errors" value={errorCount} accent={errorCount > 0 ? "text-red-400" : "text-ink-faint"} />
          <Stat label="warnings" value={warningCount} accent={warningCount > 0 ? "text-amber-400" : "text-ink-faint"} />
        </div>

        {resources.length > 0 && (
          <div className="grid min-h-0 grid-cols-1 gap-3 overflow-auto xl:grid-cols-2">
            {resources.map((resource) => (
              <WorkloadCard key={resource.index} resource={resource} />
            ))}
          </div>
        )}
        {resources.length === 0 && !issues.some((issue) => issue.severity === "error") && (
          <div className="flex-none rounded-xl border border-dashed border-edge-1 p-6 text-center text-xs text-ink-faint">
            No Kubernetes resources detected. Load a manifest into the active document.
          </div>
        )}

        {issues.length > 0 && (
          <div className="flex-none overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Issues ({issues.length})</h3>
            </header>
            <ul className="max-h-72 divide-y divide-edge-0 overflow-auto">
              {issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2 px-4 py-2">
                  <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SEVERITY_BADGE[issue.severity]}`}>
                    {issue.severity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-ink-muted">{issue.message}</div>
                    <div className="mt-0.5">
                      <PathTag path={issue.path} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
