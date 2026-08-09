import type { ComponentType } from "react";

export type ToolCategoryId =
  | "editor"
  | "validation"
  | "formatting"
  | "conversion"
  | "diff-merge"
  | "query"
  | "transformation"
  | "schema"
  | "analysis"
  | "environment"
  | "kubernetes"
  | "docker"
  | "cicd"
  | "openapi"
  | "templates"
  | "snippets"
  | "generator"
  | "security"
  | "workspace"
  | "settings";

export type DocLanguage =
  | "yaml"
  | "json"
  | "toml"
  | "env"
  | "properties"
  | "xml"
  | "text";

export interface WorkbenchDocument {
  id: string;
  name: string;
  content: string;
  language: DocLanguage;
  isModified: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkbenchSettings {
  theme: "dark" | "light" | "system";
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  confirmDestructive: boolean;
  indent: number;
  defaultExportFormat: "yaml" | "json" | "toml" | "env" | "properties" | "xml";
}

export type NotifyKind = "success" | "info" | "warning" | "error";

export interface NotificationItem {
  id: string;
  message: string;
  kind: NotifyKind;
  timestamp: number;
}

export interface WorkspaceSnapshot {
  version: 1;
  documents: Array<Omit<WorkbenchDocument, "isModified">>;
  activeDocId: string;
  activeToolId: string;
  settings: WorkbenchSettings;
  savedAt: string;
}

export type ToolIcon =
  | "file"
  | "tree"
  | "check"
  | "format"
  | "compress"
  | "convert"
  | "diff"
  | "merge"
  | "override"
  | "search"
  | "query"
  | "flatten"
  | "analyze"
  | "clean"
  | "sort"
  | "schema"
  | "env"
  | "kubernetes"
  | "docker"
  | "cicd"
  | "openapi"
  | "templates"
  | "snippets"
  | "generator"
  | "secret"
  | "shield"
  | "workspace"
  | "docs"
  | "settings";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategoryId;
  keywords: string[];
  icon: ToolIcon;
  component: ComponentType;
  shortcut?: string;
  favorite?: boolean;
}
