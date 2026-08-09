import { useMemo } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { isMap, isSeq, parseAllDocuments, parseDocument, type Node, type YAMLMap, type YAMLSeq } from "yaml";
import { ToolPage, editorThemeFor, Stat } from "../shared/ToolShell";
import { YamlEditor } from "../../components/YamlEditor";

interface ValidationIssue {
  kind: "syntax" | "duplicate-key" | "empty" | "warning";
  message: string;
  line?: number;
  column?: number;
}

function keyString(key: unknown): string {
  if (key === null || key === undefined) return "?";
  return String((key as { value?: unknown }).value ?? key);
}

function positionOf(node: Node | undefined): { line?: number; column?: number } {
  if (!node || !("range" in node) || !node.range) {
    return {};
  }
  return { line: (node as { range: [number, number, number] }).range[0] + 1 };
}

function walkForDuplicates(node: Node | null, path: string, issues: ValidationIssue[]): void {
  if (!node) {
    return;
  }
  if (isMap(node)) {
    const seen = new Map<string, { path: string; line: number }>();
    for (const item of node.items) {
      const key = keyString(item.key);
      const keyPath = path === "" ? key : `${path}.${key}`;
      const previous = seen.get(key);
      if (previous) {
        issues.push({
          kind: "duplicate-key",
          message: `Duplicate key '${keyPath}'.`,
          line: positionOf(item.key as Node).line,
        });
      } else {
        seen.set(key, { path: keyPath, line: positionOf(item.key as Node).line ?? 0 });
      }
      if (isMap(item.value) || isSeq(item.value)) {
        walkForDuplicates(item.value as YAMLMap | YAMLSeq, keyPath, issues);
      }
    }
  } else if (isSeq(node)) {
    node.items.forEach((item, index) => {
      if (isMap(item) || isSeq(item)) {
        walkForDuplicates(item as YAMLMap | YAMLSeq, `${path}[${index}]`, issues);
      }
    });
  }
}

function analyzeDocument(source: string): { issues: ValidationIssue[]; docCount: number } {
  const issues: ValidationIssue[] = [];
  const doc = parseDocument(source);
  const docCount = parseAllDocuments(source).length;

  if (source.trim() === "") {
    return { issues: [{ kind: "empty", message: "The document is empty." }], docCount: 0 };
  }

  if (doc.errors.length > 0) {
    for (const error of doc.errors) {
      const line = "linePos" in error && error.linePos ? error.linePos[0].line : undefined;
      const column = "linePos" in error && error.linePos ? error.linePos[0].col : undefined;
      issues.push({ kind: "syntax", message: error.message, line, column });
    }
    return { issues, docCount };
  }

  walkForDuplicates(doc.contents as Node | null, "", issues);

  return { issues, docCount };
}

export default function ValidatorTool() {
  const { activeDocument, themeMode } = useWorkbench();
  const theme = editorThemeFor(themeMode);

  const { issues, docCount } = useMemo(() => analyzeDocument(activeDocument.content), [activeDocument.content]);

  const errorCount = issues.filter((issue) => issue.kind === "syntax" || issue.kind === "duplicate-key").length;
  const warningCount = issues.filter((issue) => issue.kind === "warning").length;
  const isValid = errorCount === 0 && activeDocument.content.trim() !== "";

  const badgeStyle = activeDocument.content.trim() === ""
    ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
    : isValid
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
      : "border-red-500/40 bg-red-500/10 text-red-400";

  const badgeText = activeDocument.content.trim() === "" ? "Empty document" : isValid ? "Valid YAML" : "Invalid YAML";

  return (
    <ToolPage
      icon="check"
      title="YAML Validator"
      description="Parses the active document and reports syntax errors, empty documents and structural warnings."
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-none flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-edge-1 bg-surface-1 px-4 py-3 shadow-lg shadow-black/20">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyle}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isValid ? "bg-emerald-400" : "bg-red-400"}`} />
              {badgeText}
            </span>
            <Stat label="documents" value={docCount} accent="text-sky-400" />
            <Stat label="errors" value={errorCount} accent={errorCount > 0 ? "text-red-400" : "text-emerald-400"} />
            <Stat label="warnings" value={warningCount} accent={warningCount > 0 ? "text-amber-400" : "text-ink-strong"} />
            <Stat label="lines" value={activeDocument.content.split("\n").length} accent="text-ink-strong" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <header className="flex-none border-b border-edge-1 bg-surface-2 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Issues</h3>
            </header>
            <div className="min-h-0 flex-1 overflow-auto">
              {issues.length === 0 ? (
                <div className="p-4 text-xs text-ink-faint">No issues found.</div>
              ) : (
                <ul className="divide-y divide-edge-0">
                  {issues.map((issue, index) => {
                    const style =
                      issue.kind === "syntax" || issue.kind === "duplicate-key"
                        ? "text-red-400"
                        : issue.kind === "warning"
                          ? "text-amber-400"
                          : "text-sky-400";
                    const badge =
                      issue.kind === "syntax"
                        ? "Syntax"
                        : issue.kind === "duplicate-key"
                          ? "Duplicate key"
                          : issue.kind === "warning"
                            ? "Warning"
                            : "Info";
                    return (
                      <li key={index} className="flex items-start gap-2 px-4 py-2.5 text-xs">
                        <span className={`shrink-0 rounded-full border border-current/40 px-2 py-0.5 text-[10px] font-bold uppercase ${style}`}>
                          {badge}
                        </span>
                        <span className="min-w-0 flex-1 break-words leading-relaxed text-ink">{issue.message}</span>
                        {issue.line != null && (
                          <span className="shrink-0 font-mono text-[10px] text-ink-faint">
                            {issue.line}:{issue.column ?? "?"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
          <YamlEditor value={activeDocument.content} readOnly theme={theme} ariaLabel="Validated document" />
        </div>
      </div>
    </ToolPage>
  );
}
