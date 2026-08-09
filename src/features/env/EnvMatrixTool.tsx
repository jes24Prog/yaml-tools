import { useMemo, useState } from "react";
import { buildEnvMatrix } from "../../services/envService";
import { ToolPage, Stat } from "../shared/ToolShell";

interface EnvFile {
  name: string;
  content: string;
}

const EMPTY_FILE: EnvFile = { name: "production.env", content: "" };

export default function EnvMatrixTool() {
  const [files, setFiles] = useState<EnvFile[]>([
    { name: "production.env", content: "API_URL=https://api.example.com\nDEBUG=false" },
    { name: "staging.env", content: "API_URL=https://staging.example.com\nDEBUG=true" },
    { name: "local.env", content: "API_URL=http://localhost:3000\nDEBUG=true\nEXTRA=1" },
  ]);

  const matrix = useMemo(() => buildEnvMatrix(files), [files]);

  const updateFile = (index: number, patch: Partial<EnvFile>) => {
    setFiles((current) => current.map((file, i) => (i === index ? { ...file, ...patch } : file)));
  };

  const addFile = () => setFiles((current) => [...current, { ...EMPTY_FILE, name: `env-${current.length + 1}.env` }]);

  const removeFile = (index: number) => setFiles((current) => current.filter((_, i) => i !== index));

  const differingRows = matrix.rows.filter((row) => row.differs).length;

  return (
    <ToolPage
      icon="env"
      title="Env Matrix"
      description="Compare variables across multiple .env files side by side."
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-5 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <Stat label="files" value={matrix.files.length} accent="text-sky-400" />
          <Stat label="keys" value={matrix.keys.length} accent="text-ink-strong" />
          <Stat label="differing keys" value={differingRows} accent={differingRows > 0 ? "text-amber-400" : "text-emerald-400"} />
          <button
            type="button"
            onClick={addFile}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-edge-1 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-strong transition-colors hover:bg-surface-3"
          >
            + Add file
          </button>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
          <div className="flex min-h-0 flex-col gap-3 overflow-auto rounded-xl border border-edge-1 bg-surface-1 p-3 shadow-lg shadow-black/20">
            {files.map((file, index) => (
              <div key={index} className="flex flex-col gap-1.5 rounded-lg border border-edge-1 bg-surface-2 p-2">
                <div className="flex items-center gap-2">
                  <input
                    value={file.name}
                    onChange={(event) => updateFile(index, { name: event.target.value })}
                    className="min-w-0 flex-1 rounded-md border border-edge-1 bg-surface-0 px-2 py-1 font-mono text-xs text-ink outline-none focus:border-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={files.length <= 1}
                    className="shrink-0 rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={file.content}
                  onChange={(event) => updateFile(index, { content: event.target.value })}
                  rows={4}
                  spellCheck={false}
                  placeholder="KEY=VALUE"
                  className="w-full resize-y rounded-md border border-edge-1 bg-surface-0 px-2 py-1.5 font-mono text-xs text-ink outline-none focus:border-emerald-500/50"
                />
              </div>
            ))}
          </div>

          <div className="flex min-h-0 flex-col overflow-auto rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <table className="min-h-0 w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-surface-2">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Key</th>
                  {matrix.files.map((name) => (
                    <th key={name} className="px-3 py-2 text-left font-mono text-[11px] font-semibold text-sky-400">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-0">
                {matrix.rows.map((row) => (
                  <tr key={row.key} className={row.differs ? "bg-amber-500/5" : ""}>
                    <td className="px-3 py-2">
                      <code className="font-mono text-xs text-ink">{row.key}</code>
                    </td>
                    {row.cells.map((cell, index) => (
                      <td key={index} className="px-3 py-2">
                        {cell.present ? (
                          <code className={`font-mono text-xs ${row.differs ? "text-amber-400" : "text-emerald-400"}`}>
                            {cell.value || <span className="text-ink-faint">(empty)</span>}
                          </code>
                        ) : (
                          <span className="text-xs text-ink-faint">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
