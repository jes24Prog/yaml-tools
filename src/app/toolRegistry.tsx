import type { ComponentType } from "react";
import type { ToolCategoryId, ToolDefinition, ToolIcon } from "../types/workbench";
import AnalyzerTool from "../features/analyzer/AnalyzerTool";
import CiCdTool from "../features/cicd/CiCdTool";
import CleanerTool from "../features/cleaner/CleanerTool";
import ConfigGeneratorsTool from "../features/configGenerators/ConfigGeneratorsTool";
import EnvConverterTool from "../features/converter/EnvConverterTool";
import JsonConverterTool from "../features/converter/JsonConverterTool";
import PropertiesConverterTool from "../features/converter/PropertiesConverterTool";
import TomlConverterTool from "../features/converter/TomlConverterTool";
import XmlConverterTool from "../features/converter/XmlConverterTool";
import DiffTool from "../features/diff/DiffTool";
import DockerComposeTool from "../features/dockerCompose/DockerComposeTool";
import DocsGeneratorTool from "../features/docs/DocsGeneratorTool";
import DocumentsTool from "../features/documents/DocumentsTool";
import EditorTool from "../features/editor/EditorTool";
import EnvMatrixTool from "../features/env/EnvMatrixTool";
import EnvSubstitutionTool from "../features/env/EnvSubstitutionTool";
import FlattenTool from "../features/flatten/FlattenTool";
import FormatterTool from "../features/formatter/FormatterTool";
import KubernetesGeneratorsTool from "../features/kubernetes/KubernetesGeneratorsTool";
import KubernetesInspectorTool from "../features/kubernetes/KubernetesInspectorTool";
import MergeTool from "../features/merge/MergeTool";
import MinifierTool from "../features/minifier/MinifierTool";
import OpenApiTool from "../features/openapi/OpenApiTool";
import OverrideTool from "../features/override/OverrideTool";
import QueryTool from "../features/query/QueryTool";
import SchemaGeneratorTool from "../features/schema/SchemaGeneratorTool";
import SchemaValidatorTool from "../features/schema/SchemaValidatorTool";
import SearchTool from "../features/search/SearchTool";
import SecretScannerTool from "../features/security/SecretScannerTool";
import SettingsTool from "../features/settings/SettingsTool";
import SnippetsTool from "../features/snippets/SnippetsTool";
import SorterTool from "../features/sorter/SorterTool";
import TemplatesTool from "../features/templates/TemplatesTool";
import TreeTool from "../features/tree/TreeTool";
import ValidatorTool from "../features/validator/ValidatorTool";
import WorkspaceTool from "../features/workspace/WorkspaceTool";

interface ToolEntry {
  id: string;
  name: string;
  description: string;
  category: ToolCategoryId;
  keywords: string[];
  icon: ToolIcon;
  component: ComponentType;
  shortcut?: string;
}

const ENTRY = (entry: ToolEntry): ToolDefinition => entry;

export const TOOLS: ToolDefinition[] = [
  ENTRY({
    id: "yaml-editor",
    name: "YAML Editor",
    description: "The main editor with syntax highlighting, errors and a document toolbar.",
    category: "editor",
    keywords: ["editor", "edit", "write", "monaco"],
    icon: "file",
    component: EditorTool,
    shortcut: "1",
  }),
  ENTRY({
    id: "yaml-tree",
    name: "YAML Tree",
    description: "Browse the document as a collapsible tree.",
    category: "editor",
    keywords: ["tree", "navigate", "structure", "browse"],
    icon: "tree",
    component: TreeTool,
    shortcut: "2",
  }),
  ENTRY({
    id: "yaml-validator",
    name: "YAML Validator",
    description: "Validate syntax and inspect top-level issues in the document.",
    category: "validation",
    keywords: ["validate", "syntax", "error", "check", "lint"],
    icon: "check",
    component: ValidatorTool,
  }),
  ENTRY({
    id: "formatter",
    name: "YAML Formatter",
    description: "Format indentation, quotes and key order with configurable options.",
    category: "formatting",
    keywords: ["format", "indent", "pretty", "style", "prettier"],
    icon: "format",
    component: FormatterTool,
  }),
  ENTRY({
    id: "minifier",
    name: "YAML Minifier",
    description: "Compress a YAML document to a minimal one-line form.",
    category: "formatting",
    keywords: ["minify", "compress", "compact", "one-line"],
    icon: "compress",
    component: MinifierTool,
  }),
  ENTRY({
    id: "cleaner",
    name: "YAML Cleaner",
    description: "Remove empty values, comments, duplicate keys and anchors.",
    category: "transformation",
    keywords: ["clean", "remove", "duplicates", "anchors", "comments"],
    icon: "clean",
    component: CleanerTool,
  }),
  ENTRY({
    id: "sorter",
    name: "YAML Sorter",
    description: "Sort keys recursively in ascending or descending order.",
    category: "transformation",
    keywords: ["sort", "order", "alphabetical"],
    icon: "sort",
    component: SorterTool,
  }),
  ENTRY({
    id: "convert-json",
    name: "YAML ⇄ JSON",
    description: "Convert between YAML and JSON in both directions.",
    category: "conversion",
    keywords: ["convert", "json", "yaml", "jsonify"],
    icon: "convert",
    component: JsonConverterTool,
  }),
  ENTRY({
    id: "convert-toml",
    name: "YAML ⇄ TOML",
    description: "Convert between YAML and TOML in both directions.",
    category: "conversion",
    keywords: ["convert", "toml"],
    icon: "convert",
    component: TomlConverterTool,
  }),
  ENTRY({
    id: "convert-env",
    name: "YAML ⇄ Env",
    description: "Convert between YAML and .env KEY=VALUE files in both directions.",
    category: "conversion",
    keywords: ["convert", "env", "environment", "dotenv"],
    icon: "convert",
    component: EnvConverterTool,
  }),
  ENTRY({
    id: "convert-properties",
    name: "YAML ⇄ Properties",
    description: "Convert between YAML and Java .properties files in both directions.",
    category: "conversion",
    keywords: ["convert", "properties", "java", "spring"],
    icon: "convert",
    component: PropertiesConverterTool,
  }),
  ENTRY({
    id: "convert-xml",
    name: "YAML ⇄ XML",
    description: "Convert between YAML and XML in both directions.",
    category: "conversion",
    keywords: ["convert", "xml"],
    icon: "convert",
    component: XmlConverterTool,
  }),
  ENTRY({
    id: "diff",
    name: "Diff YAML",
    description: "Compare two YAML documents with a tree diff and unified view.",
    category: "diff-merge",
    keywords: ["diff", "compare", "changes", "before", "after"],
    icon: "diff",
    component: DiffTool,
  }),
  ENTRY({
    id: "merge",
    name: "Merge YAML",
    description: "Merge two documents with strategies and per-path conflict resolution.",
    category: "diff-merge",
    keywords: ["merge", "conflict", "combine"],
    icon: "merge",
    component: MergeTool,
  }),
  ENTRY({
    id: "override",
    name: "YAML Value Override",
    description: "Override values in a target YAML using values from a primary YAML.",
    category: "diff-merge",
    keywords: ["override", "patch", "update values", "replace values"],
    icon: "override",
    component: OverrideTool,
  }),
  ENTRY({
    id: "query",
    name: "YAML Query",
    description: "Query YAML with JSONPath-style selectors.",
    category: "query",
    keywords: ["query", "jsonpath", "path", "selector"],
    icon: "query",
    component: QueryTool,
  }),
  ENTRY({
    id: "search",
    name: "Search & Replace",
    description: "Find and replace keys and values with matching options.",
    category: "query",
    keywords: ["search", "find", "replace", "find-and-replace"],
    icon: "search",
    component: SearchTool,
  }),
  ENTRY({
    id: "flatten",
    name: "Flatten / Unflatten",
    description: "Flatten nested YAML into dotted keys and back.",
    category: "transformation",
    keywords: ["flatten", "unflatten", "dotted", "nested"],
    icon: "flatten",
    component: FlattenTool,
  }),
  ENTRY({
    id: "analyzer",
    name: "YAML Analyzer",
    description: "Statistics and structure analysis of the active document.",
    category: "analysis",
    keywords: ["analyze", "stats", "statistics", "depth", "counts"],
    icon: "analyze",
    component: AnalyzerTool,
  }),
  ENTRY({
    id: "docs-generator",
    name: "Docs Generator",
    description: "Generate a Markdown reference document from YAML.",
    category: "analysis",
    keywords: ["docs", "documentation", "markdown", "reference"],
    icon: "docs",
    component: DocsGeneratorTool,
  }),
  ENTRY({
    id: "schema-validator",
    name: "Schema Validator",
    description: "Validate YAML against a JSON Schema.",
    category: "schema",
    keywords: ["schema", "validate", "json-schema", "draft"],
    icon: "schema",
    component: SchemaValidatorTool,
  }),
  ENTRY({
    id: "schema-generator",
    name: "Schema Generator",
    description: "Infer a JSON Schema from a YAML document.",
    category: "schema",
    keywords: ["schema", "generate", "infer"],
    icon: "generator",
    component: SchemaGeneratorTool,
  }),
  ENTRY({
    id: "env-substitution",
    name: "Env Substitution",
    description: "Substitute ${VAR} placeholders using .env variables.",
    category: "environment",
    keywords: ["env", "substitute", "placeholder", "variable"],
    icon: "env",
    component: EnvSubstitutionTool,
  }),
  ENTRY({
    id: "env-matrix",
    name: "Env Matrix",
    description: "Compare variables across multiple .env files.",
    category: "environment",
    keywords: ["env", "matrix", "compare", "difference"],
    icon: "env",
    component: EnvMatrixTool,
  }),
  ENTRY({
    id: "kubernetes-inspector",
    name: "Kubernetes Inspector",
    description: "Detect and validate Kubernetes manifests and workloads.",
    category: "kubernetes",
    keywords: ["k8s", "kubernetes", "deployment", "pod", "inspect"],
    icon: "kubernetes",
    component: KubernetesInspectorTool,
  }),
  ENTRY({
    id: "kubernetes-generators",
    name: "Kubernetes Generators",
    description: "Generate Deployment, Service, ConfigMap, Secret and more.",
    category: "kubernetes",
    keywords: ["k8s", "kubernetes", "generate", "deployment", "service"],
    icon: "generator",
    component: KubernetesGeneratorsTool,
  }),
  ENTRY({
    id: "docker-compose",
    name: "Docker Compose Inspector",
    description: "Inspect docker-compose.yml services and validation issues.",
    category: "docker",
    keywords: ["docker", "compose", "services", "inspect"],
    icon: "docker",
    component: DockerComposeTool,
  }),
  ENTRY({
    id: "cicd",
    name: "CI/CD Inspector",
    description: "Analyze GitHub Actions, GitLab CI and Azure Pipelines.",
    category: "cicd",
    keywords: ["ci", "cd", "github actions", "gitlab", "azure", "pipeline"],
    icon: "cicd",
    component: CiCdTool,
  }),
  ENTRY({
    id: "openapi",
    name: "OpenAPI Inspector",
    description: "Inspect OpenAPI and Swagger specs.",
    category: "openapi",
    keywords: ["openapi", "swagger", "api", "paths"],
    icon: "openapi",
    component: OpenApiTool,
  }),
  ENTRY({
    id: "templates",
    name: "Template Engine",
    description: "Render placeholders in plain text or YAML templates.",
    category: "templates",
    keywords: ["template", "render", "placeholder", "variables"],
    icon: "templates",
    component: TemplatesTool,
  }),
  ENTRY({
    id: "snippets",
    name: "Snippets",
    description: "Reusable YAML building blocks stored locally.",
    category: "snippets",
    keywords: ["snippet", "library", "reusable"],
    icon: "snippets",
    component: SnippetsTool,
  }),
  ENTRY({
    id: "config-generators",
    name: "Config Generators",
    description: "Generate docker-compose, GitHub Actions, Spring Boot and Kubernetes configs.",
    category: "generator",
    keywords: ["generate", "config", "docker-compose", "spring boot", "github actions"],
    icon: "generator",
    component: ConfigGeneratorsTool,
  }),
  ENTRY({
    id: "secret-scanner",
    name: "Secret Scanner",
    description: "Detect passwords, tokens and credentials in YAML.",
    category: "security",
    keywords: ["secret", "security", "scan", "password", "token", "api key"],
    icon: "secret",
    component: SecretScannerTool,
  }),
  ENTRY({
    id: "documents",
    name: "Multi-Document YAML",
    description: "Split and combine multi-document YAML files.",
    category: "workspace",
    keywords: ["multi-document", "split", "combine", "---", "parts"],
    icon: "docs",
    component: DocumentsTool,
  }),
  ENTRY({
    id: "workspace",
    name: "Workspace",
    description: "Manage documents, import files and back up the workspace.",
    category: "workspace",
    keywords: ["workspace", "documents", "import", "export", "backup", "save"],
    icon: "workspace",
    component: WorkspaceTool,
  }),
  ENTRY({
    id: "settings",
    name: "Settings",
    description: "Editor preferences and workspace behaviour.",
    category: "settings",
    keywords: ["settings", "preferences", "theme", "font size"],
    icon: "settings",
    component: SettingsTool,
  }),
];

export const TOOL_BY_ID = new Map<string, ToolDefinition>(TOOLS.map((tool) => [tool.id, tool]));

export const CATEGORY_LABELS: Record<ToolCategoryId, string> = {
  editor: "Editor",
  validation: "Validation",
  formatting: "Formatting",
  conversion: "Conversion",
  "diff-merge": "Diff & Merge",
  query: "Query & Search",
  transformation: "Transformation",
  schema: "Schema",
  analysis: "Analysis",
  environment: "Environment",
  kubernetes: "Kubernetes",
  docker: "Docker",
  cicd: "CI/CD",
  openapi: "OpenAPI",
  templates: "Templates",
  snippets: "Snippets",
  generator: "Generators",
  security: "Security",
  workspace: "Workspace",
  settings: "Settings",
};

export function toolById(id: string): ToolDefinition | undefined {
  return TOOL_BY_ID.get(id);
}
