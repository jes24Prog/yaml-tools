import { useMemo } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { inspectOpenApi } from "../../services/openapiService";
import { ToolPage, Stat } from "../shared/ToolShell";

const METHOD_COLOR: Record<string, string> = {
  get: "text-emerald-400 border-emerald-500/40",
  post: "text-sky-400 border-sky-500/40",
  put: "text-amber-400 border-amber-500/40",
  patch: "text-violet-400 border-violet-500/40",
  delete: "text-red-400 border-red-500/40",
  head: "text-ink-muted border-edge-1",
  options: "text-ink-muted border-edge-1",
  trace: "text-ink-muted border-edge-1",
};

export default function OpenApiTool() {
  const { activeDocument } = useWorkbench();
  const result = useMemo(() => inspectOpenApi(activeDocument.content), [activeDocument.content]);

  return (
    <ToolPage
      icon="openapi"
      title="OpenAPI Inspector"
      description="Inspect OpenAPI 3.x and Swagger 2.0 specs: metadata, servers, paths, security schemes and validation errors."
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-5 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          {result.detected ? (
            <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-400">
              {result.version ?? "swagger"}
            </span>
          ) : (
            <span className="rounded border border-edge-1 bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-faint">
              not detected
            </span>
          )}
          {result.title && <span className="text-sm font-semibold text-ink-strong">{result.title}</span>}
          {result.versionNumber && <span className="text-xs text-ink-muted">v{result.versionNumber}</span>}
          <Stat label="servers" value={result.servers.length} accent="text-sky-400" />
          <Stat label="paths" value={result.paths.length} accent="text-ink-strong" />
          <Stat label="security schemes" value={result.securitySchemes.length} accent="text-amber-400" />
          <Stat label="components" value={result.componentsCount} accent="text-violet-400" />
          <Stat label="errors" value={result.errors.length} accent={result.errors.length > 0 ? "text-red-400" : "text-ink-faint"} />
        </div>

        {!result.detected && (
          <div className="flex-none rounded-xl border border-dashed border-edge-1 p-6 text-center text-xs text-ink-faint">
            No OpenAPI or Swagger spec detected in the active document.
          </div>
        )}

        {result.errors.length > 0 && (
          <div className="flex-none rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 shadow-lg shadow-black/20">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">Validation errors</div>
            <ul className="space-y-1">
              {result.errors.map((error, index) => (
                <li key={index} className="text-xs text-ink">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {result.servers.length > 0 && (
          <div className="flex-none rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-400">Servers</div>
            <ul className="space-y-1">
              {result.servers.map((server) => (
                <li key={server} className="break-all font-mono text-xs text-emerald-400">{server}</li>
              ))}
            </ul>
          </div>
        )}

        {result.paths.length > 0 && (
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Paths ({result.paths.length})</h3>
            </header>
            <ul className="h-full max-h-[28rem] divide-y divide-edge-0 overflow-auto">
              {result.paths.map((path) => (
                <li key={path.path} className="px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-xs text-ink">{path.path}</code>
                    <div className="flex flex-wrap gap-1">
                      {path.methods.map((method) => (
                        <span key={method} className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${METHOD_COLOR[method] ?? "border-edge-1 text-ink-faint"}`}>
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                  {path.summary && <div className="mt-0.5 text-xs text-ink-muted">{path.summary}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.securitySchemes.length > 0 && (
          <div className="flex-none rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-400">Security schemes</div>
            <div className="flex flex-wrap gap-1.5">
              {result.securitySchemes.map((scheme) => (
                <span key={scheme} className="rounded border border-edge-1 bg-surface-2 px-2 py-0.5 font-mono text-xs text-ink">
                  {scheme}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
