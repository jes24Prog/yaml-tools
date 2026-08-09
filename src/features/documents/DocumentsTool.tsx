import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { combineYamlDocuments, splitYamlDocuments } from "../../services/documentService";
import { ToolPage, YamlSourcePanel, OutputView, editorThemeFor, ToolButton, Stat } from "../shared/ToolShell";
import { useToolSource } from "../shared/hooks";

export default function DocumentsTool() {
  const { themeMode, createDocument } = useWorkbench();
  const { source, setSource, loadFromActive, applyToActive } = useToolSource();
  const theme = editorThemeFor(themeMode);

  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const split = useMemo(() => splitYamlDocuments(source), [source]);
  const combined = useMemo(() => combineYamlDocuments(split.documents.map((doc) => doc.content)), [split.documents]);
  const count = useMemo(() => (source.trim() === "" ? 0 : split.count), [source, split.count]);

  const toggle = (index: number) => setSelected((current) => ({ ...current, [index]: !current[index] }));

  const createFromSplit = () => {
    split.documents.forEach((doc, index) => {
      createDocument(`document-${index + 1}.yaml`, doc.content);
    });
  };

  const applyCombined = () => {
    if (combined) applyToActive(combined);
  };

  return (
    <ToolPage
      icon="docs"
      title="Multi-Document YAML"
      description="Split and combine multi-document YAML files (--- separated)."
      actions={
        <>
          <ToolButton onClick={loadFromActive}>Load from active doc</ToolButton>
          <ToolButton onClick={createFromSplit} disabled={split.documents.length <= 1}>
            Create docs from split
          </ToolButton>
          <ToolButton primary onClick={applyCombined} disabled={split.documents.length <= 1}>
            Apply combined output
          </ToolButton>
        </>
      }
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-none flex-wrap items-center gap-5 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
          <Stat label="documents" value={count} accent="text-ink-strong" />
          <Stat label="valid" value={split.documents.filter((doc) => doc.valid).length} accent="text-emerald-400" />
          <Stat label="invalid" value={split.documents.filter((doc) => !doc.valid).length} accent="text-red-400" />
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <YamlSourcePanel
            title="Source"
            description="Multi-document YAML separated by ---"
            value={source}
            onChange={setSource}
            theme={theme}
            minHeight="min-h-72"
          />
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Split documents</h3>
            </header>
            {split.documents.length === 0 ? (
              <div className="p-4 text-xs text-ink-faint">Nothing to split.</div>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-edge-0 overflow-auto">
                {split.documents.map((doc) => (
                  <li key={doc.index} className="flex items-start gap-3 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected[doc.index] ?? false}
                      onChange={() => toggle(doc.index)}
                      className="mt-1 h-3.5 w-3.5 rounded accent-emerald-500"
                      aria-label={`Select document ${doc.index + 1}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-ink">#{doc.index + 1}</span>
                        {doc.valid ? (
                          <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
                            valid
                          </span>
                        ) : (
                          <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-400">
                            invalid
                          </span>
                        )}
                      </div>
                      <pre className="mt-1 line-clamp-4 overflow-hidden whitespace-pre-wrap break-all font-mono text-[11px] text-ink-muted">
                        {doc.content}
                      </pre>
                      {doc.error && <div className="mt-1 text-[11px] text-red-400">{doc.error}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {split.documents.length > 1 && (
          <div className="min-h-0 flex-1">
            <OutputView title="Combined output" value={combined} onApply={applyCombined} />
          </div>
        )}
      </div>
    </ToolPage>
  );
}
