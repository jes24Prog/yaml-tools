import { useMemo } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { inspectDockerCompose } from "../../services/dockerComposeService";
import { ToolPage, Stat, PathTag } from "../shared/ToolShell";

const SEVERITY_BADGE: Record<string, string> = {
  error: "border-red-500/40 bg-red-500/10 text-red-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-400",
};

export default function DockerComposeTool() {
  const { activeDocument } = useWorkbench();
  const { detected, services, issues } = useMemo(() => inspectDockerCompose(activeDocument.content), [activeDocument.content]);

  return (
    <ToolPage
      icon="docker"
      title="Docker Compose Inspector"
      description="Inspect docker-compose.yml: services, images, ports, volumes, healthchecks and validation issues."
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-5 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <Stat label="services" value={services.length} accent="text-emerald-400" />
          <Stat label="issues" value={issues.length} accent={issues.length > 0 ? "text-amber-400" : "text-ink-faint"} />
        </div>

        {!detected && (
          <div className="flex-none rounded-xl border border-dashed border-edge-1 p-6 text-center text-xs text-ink-faint">
            No docker-compose file detected in the active document.
          </div>
        )}

        {services.length > 0 && (
          <div className="grid min-h-0 grid-cols-1 gap-3 overflow-auto xl:grid-cols-2">
            {services.map((service) => (
              <div key={service.name} className="flex flex-col gap-2 rounded-lg border border-edge-1 bg-surface-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-ink-strong">{service.name}</span>
                  {service.image && <span className="font-mono text-emerald-400">{service.image}</span>}
                  {service.build && <span className="font-mono text-sky-400">build: {service.build}</span>}
                  {service.healthcheck && (
                    <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
                      healthcheck
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                  {service.ports.length > 0 && <span>ports: {service.ports.join(", ")}</span>}
                  {service.volumes.length > 0 && <span>volumes: {service.volumes.length}</span>}
                  <span>env vars: {service.environmentCount}</span>
                  {service.dependsOn.length > 0 && <span>depends_on: {service.dependsOn.join(", ")}</span>}
                  {service.restart && <span>restart: {service.restart}</span>}
                </div>
              </div>
            ))}
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
