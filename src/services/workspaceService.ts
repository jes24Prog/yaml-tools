import type { DocLanguage, WorkbenchDocument, WorkbenchSettings, WorkspaceSnapshot } from "../types/workbench";

export const WORKSPACE_VERSION = 1 as const;

export const DEFAULT_SETTINGS: WorkbenchSettings = {
  theme: "system",
  fontSize: 13,
  tabSize: 2,
  wordWrap: false,
  minimap: false,
  lineNumbers: true,
  autoSave: true,
  confirmDestructive: true,
  indent: 2,
  defaultExportFormat: "yaml",
};

export function serializeWorkspace(
  documents: WorkbenchDocument[],
  activeDocId: string,
  activeToolId: string,
  settings: WorkbenchSettings,
): string {
  const snapshot: WorkspaceSnapshot = {
    version: WORKSPACE_VERSION,
    documents: documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      content: doc.content,
      language: doc.language,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })),
    activeDocId,
    activeToolId,
    settings,
    savedAt: new Date().toISOString(),
  };
  return JSON.stringify(snapshot, null, 2);
}

export type LoadResult =
  | { ok: true; snapshot: WorkspaceSnapshot }
  | { ok: false; error: string };

export function parseWorkspace(json: string): LoadResult {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return { ok: false, error: "Workspace file is not a valid JSON object." };
    }
    const record = parsed as Record<string, unknown>;
    if (record.version !== WORKSPACE_VERSION) {
      return { ok: false, error: `Unsupported workspace version '${String(record.version)}'.` };
    }
    if (!Array.isArray(record.documents)) {
      return { ok: false, error: "Workspace is missing the documents array." };
    }
    const documents = (record.documents as unknown[]).filter(isDocumentRecord);
    if (documents.length !== (record.documents as unknown[]).length) {
      return { ok: false, error: "One or more documents in the workspace are invalid." };
    }
    const settings = (record.settings as WorkbenchSettings) ?? DEFAULT_SETTINGS;
    return {
      ok: true,
      snapshot: {
        version: WORKSPACE_VERSION,
        documents,
        activeDocId: typeof record.activeDocId === "string" ? record.activeDocId : documents[0]?.id ?? "",
        activeToolId: typeof record.activeToolId === "string" ? record.activeToolId : "yaml-editor",
        settings,
        savedAt: typeof record.savedAt === "string" ? record.savedAt : "",
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to parse workspace." };
  }
}

function isDocumentRecord(value: unknown): value is Omit<WorkbenchDocument, "isModified"> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.content === "string" &&
    typeof record.language === "string" &&
    typeof record.createdAt === "number" &&
    typeof record.updatedAt === "number"
  );
}

export function loadSettings(): WorkbenchSettings {
  try {
    const raw = window.localStorage.getItem("yaml-workbench:settings");
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<WorkbenchSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: WorkbenchSettings): void {
  try {
    window.localStorage.setItem("yaml-workbench:settings", JSON.stringify(settings));
  } catch {
    // Ignore.
  }
}

const LANGUAGE_BY_EXTENSION: Record<string, DocLanguage> = {
  yaml: "yaml",
  yml: "yaml",
  json: "json",
  toml: "toml",
  env: "env",
  properties: "properties",
  xml: "xml",
  txt: "text",
};

export function languageFromFileName(name: string): DocLanguage {
  const extension = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (name.startsWith(".env")) {
    return "env";
  }
  return LANGUAGE_BY_EXTENSION[extension] ?? "yaml";
}

export const EXPORT_EXTENSIONS: Record<string, string> = {
  yaml: "yaml",
  json: "json",
  toml: "toml",
  env: "env",
  properties: "properties",
  xml: "xml",
};
