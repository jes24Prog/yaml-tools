import { useMemo, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";
import { parseDocument } from "yaml";
import { isPlainObject } from "../../utils/yamlParser";
import { ToolButton, ToolPage, editorThemeFor } from "../shared/ToolShell";
import { YamlEditor } from "../../components/YamlEditor";
import { copyToClipboard } from "../../utils/clipboard";

interface TreeNode {
  path: string;
  key: string;
  type: string;
  value: unknown;
  display: string;
  children: TreeNode[];
  depth: number;
}

function typeLabel(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array[${value.length}]`;
  if (isPlainObject(value)) return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
  if (typeof value === "boolean") return "bool";
  return typeof value;
}

function displayValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") {
    const preview = value.length > 60 ? `${value.slice(0, 60)}…` : value;
    return JSON.stringify(preview);
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function buildTree(value: unknown, path: string, key: string, depth: number): TreeNode[] {
  if (Array.isArray(value)) {
    const children = value.flatMap((item, index) => buildTree(item, `${path}[${index}]`, `[${index}]`, depth + 1));
    return [{
      path, key, type: `array[${value.length}]`, value, display: "", children, depth,
    }];
  }
  if (isPlainObject(value)) {
    const record = value as Record<string, unknown>;
    const children = Object.keys(record).flatMap((childKey) =>
      buildTree(record[childKey], path === "" ? childKey : `${path}.${childKey}`, childKey, depth + 1),
    );
    return [{
      path, key, type: `object (${children.length})`, value, display: "", children, depth,
    }];
  }
  return [{ path, key, type: typeLabel(value), value, display: displayValue(value), children: [], depth }];
}

const TYPE_COLORS: Record<string, string> = {
  null: "text-red-400",
  string: "text-sky-400",
  int: "text-orange-400",
  float: "text-orange-400",
  bool: "text-violet-400",
  object: "text-emerald-400",
  array: "text-emerald-400",
};

function TreeRow({ node, expanded, onToggle, onCopy }: { node: TreeNode; expanded: boolean; onToggle: () => void; onCopy: (path: string) => void }) {
  const isContainer = node.children.length > 0;
  const color = TYPE_COLORS[node.type] ?? "text-ink-muted";
  return (
    <div className="group flex items-center gap-1 rounded px-2 py-0.5 hover:bg-surface-2" style={{ paddingLeft: `${node.depth * 16 + 8}px` }}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={isContainer ? (expanded ? "Collapse" : "Expand") : "Leaf"}
        className="flex h-4 w-4 shrink-0 items-center justify-center text-ink-faint"
      >
        {isContainer ? (
          <svg className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 4l4 4-4 4V4z" />
          </svg>
        ) : (
          <span className="h-1 w-1 rounded-full bg-ink-faint/60" />
        )}
      </button>
      <span className="truncate font-mono text-xs text-ink-strong">{node.key}</span>
      <span className={`shrink-0 text-[10px] font-semibold ${color}`}>{node.type}</span>
      {node.display && <span className="truncate font-mono text-xs text-ink-muted">{node.display}</span>}
      <button
        type="button"
        title="Copy path"
        onClick={() => onCopy(node.path)}
        className="ml-auto hidden shrink-0 rounded px-1 text-[10px] text-ink-faint hover:bg-surface-3 hover:text-ink group-hover:block"
      >
        copy
      </button>
    </div>
  );
}

export default function TreeTool() {
  const { activeDocument, themeMode } = useWorkbench();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["$"]));
  const [query, setQuery] = useState("");
  const theme = editorThemeFor(themeMode);

  const root = useMemo(() => {
    const doc = parseDocument(activeDocument.content);
    if (doc.errors.length > 0 || doc.toJS() === undefined) {
      return null;
    }
    return buildTree(doc.toJS(), "", "$", 0)[0];
  }, [activeDocument.content]);

  const filterTree = (node: TreeNode, term: string): TreeNode | null => {
    if (term === "") return node;
    const matchesSelf = node.key.toLowerCase().includes(term) || node.path.toLowerCase().includes(term);
    const filteredChildren = node.children
      .map((child) => filterTree(child, term))
      .filter((child): child is TreeNode => child !== null);
    if (matchesSelf || filteredChildren.length > 0) {
      return { ...node, children: matchesSelf ? node.children : filteredChildren };
    }
    return null;
  };

  const visible = useMemo(() => {
    if (!root) return null;
    return filterTree(root, query.trim().toLowerCase());
  }, [root, query]);

  const toggle = (path: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const copyPath = async (path: string) => {
    await copyToClipboard(path);
  };

  const renderTree = (node: TreeNode) => {
    const isExpanded = expanded.has(node.path);
    const rows = [
      <TreeRow key={node.path} node={node} expanded={isExpanded} onToggle={() => toggle(node.path)} onCopy={copyPath} />,
    ];
    if (isExpanded) {
      for (const child of node.children) {
        rows.push(...renderTree(child));
      }
    }
    return rows;
  };

  const countLeaves = (node: TreeNode): number => node.children.length === 0 ? 1 : node.children.reduce((sum, child) => sum + countLeaves(child), 0);

  return (
    <ToolPage
      icon="tree"
      title="Tree Viewer"
      description="Inspect the active document as an expandable tree. Values are shown inline; use the copy button to copy a JSONPath-style path."
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
          <header className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-edge-1 bg-surface-2 px-4 py-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Document tree</h3>
            <div className="flex items-center gap-2">
              {root && (
                <>
                  <ToolButton onClick={() => setExpanded((current) => {
                    const next = new Set(current);
                    const all = (n: TreeNode) => { next.add(n.path); n.children.forEach(all); };
                    all(root);
                    return next;
                  })}>
                    Expand all
                  </ToolButton>
                  <ToolButton onClick={() => setExpanded(new Set())}>Collapse</ToolButton>
                </>
              )}
            </div>
          </header>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by key or path…"
            aria-label="Filter tree"
            className="mx-3 mt-3 rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 font-mono text-xs text-ink outline-none placeholder:text-ink-faint focus:border-emerald-500/50"
          />
          <div className="min-h-0 flex-1 overflow-auto p-1.5 pt-2">
            {visible ? renderTree(visible) : <div className="p-3 text-xs text-ink-faint">No tree to show (empty or invalid YAML).</div>}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-none flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-edge-1 bg-surface-1 px-4 py-2.5 text-xs shadow-lg shadow-black/20">
            {root && (
              <>
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-semibold text-emerald-400">{countLeaves(root)}</span>
                  <span className="text-ink-muted">leaf values</span>
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-semibold text-sky-400">{activeDocument.content.split("\n").length}</span>
                  <span className="text-ink-muted">lines</span>
                </span>
              </>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-edge-1 bg-surface-1 shadow-lg shadow-black/20">
            <YamlEditor value={activeDocument.content} readOnly theme={theme} ariaLabel="Document preview" />
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
