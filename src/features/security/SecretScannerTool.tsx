import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { maskSecrets, scanSecrets } from "../../services/secretService";
import { ToolPage, YamlSourcePanel, OutputView, editorThemeFor, ToolButton, Stat, PathTag } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

const RISK_BADGE: Record<string, string> = {
  high: "border-red-500/40 bg-red-500/10 text-red-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  low: "border-sky-500/40 bg-sky-500/10 text-sky-400",
};

export default function SecretScannerTool() {
  const { themeMode } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [reveal, setReveal] = useState(false);
  const scan = useMemo(() => scanSecrets(source), [source]);
  const masked = useMemo(() => maskSecrets(source), [source]);

  const highCount = scan.matches.filter((match) => match.risk === "high").length;

  return (
    <ToolPage
      icon="secret"
      title="Secret Scanner"
      description="Detect passwords, tokens, API keys and credentials in the document by key names and value patterns."
      actions={
        <>
          <ToolButton onClick={loadFromActive}>Load from active doc</ToolButton>
          <ToolButton
            primary
            onClick={() => {
              if (masked.ok) applyToActive(masked.text);
            }}
            disabled={!masked.ok || masked.masked === 0}
          >
            Apply masked output
          </ToolButton>
        </>
      }
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-5 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <Stat label="secrets found" value={scan.matches.length} accent={highCount > 0 ? "text-red-400" : "text-emerald-400"} />
          <Stat label="high risk" value={highCount} accent={highCount > 0 ? "text-red-400" : "text-ink-faint"} />
          <Stat label="masked" value={masked.ok ? masked.masked : 0} accent="text-sky-400" />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={reveal}
              onChange={(event) => setReveal(event.target.checked)}
              className="h-3.5 w-3.5 rounded accent-emerald-500"
            />
            Reveal values
          </label>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <YamlSourcePanel
            title="Document"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-72"
          />
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Findings</h3>
            </header>
            {scan.error ? (
              <div className="p-4 text-xs text-red-400">{scan.error}</div>
            ) : scan.matches.length === 0 ? (
              <div className="p-4 text-xs text-ink-faint">No secrets detected.</div>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-edge-0 overflow-auto">
                {scan.matches.map((match, index) => (
                  <li key={index} className="flex items-start gap-2 px-4 py-2">
                    <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${RISK_BADGE[match.risk]}`}>
                      {match.risk}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <PathTag path={match.path} />
                        {!reveal && (
                          <span className="shrink-0 rounded border border-edge-1 bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                            ●●●
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-muted">{match.reason}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {masked.ok && masked.masked > 0 && (
          <div className="min-h-0 flex-1">
            <OutputView title="Masked output" value={masked.text} error={masked.error ?? null} onApply={() => applyToActive(masked.text)} />
          </div>
        )}
      </div>
    </ToolPage>
  );
}
