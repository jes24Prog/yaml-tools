import * as monaco from "monaco-editor/editor/editor.api";
import { loader } from "@monaco-editor/react";
import editorWorker from "monaco-editor/editor/editor.worker?worker";
import { yamlLanguageConfiguration, yamlMonarchLanguage } from "./utils/yamlLanguage";

self.MonacoEnvironment = {
  getWorker: () => new editorWorker(),
};

loader.config({ monaco });

if (!monaco.languages.getLanguages().some((lang) => lang.id === "yaml")) {
  monaco.languages.register({ id: "yaml", extensions: [".yaml", ".yml"] });
}
monaco.languages.setMonarchTokensProvider("yaml", yamlMonarchLanguage);
monaco.languages.setLanguageConfiguration("yaml", yamlLanguageConfiguration);

monaco.editor.defineTheme("yaml-tool-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "key", foreground: "7ee787" },
    { token: "string.key", foreground: "7ee787" },
    { token: "string", foreground: "a5d6ff" },
    { token: "number", foreground: "79c0ff" },
    { token: "keyword.true", foreground: "ff7b72" },
    { token: "keyword.null", foreground: "ff7b72" },
    { token: "keyword.list", foreground: "d2a8ff" },
    { token: "keyword.document", foreground: "8b949e" },
    { token: "keyword", foreground: "d2a8ff" },
    { token: "delimiter.key", foreground: "8b949e" },
    { token: "delimiter.bracket", foreground: "79c0ff" },
    { token: "delimiter", foreground: "8b949e" },
    { token: "comment", foreground: "8b949e", fontStyle: "italic" },
    { token: "white", foreground: "e6edf3" },
  ],
  colors: {
    "editor.background": "#0d1117",
    "editor.foreground": "#e6edf3",
    "editorLineNumber.foreground": "#484f58",
    "editorLineNumber.activeForeground": "#e6edf3",
    "editor.selectionBackground": "#264f78",
    "editor.inactiveSelectionBackground": "#264f7855",
    "editor.lineHighlightBackground": "#161b22",
    "editorCursor.foreground": "#58a6ff",
    "editorIndentGuide.background1": "#21262d",
    "editorIndentGuide.activeBackground1": "#3d444d",
    "editorBracketMatch.background": "#161b22",
    "editorBracketMatch.border": "#58a6ff",
  },
});

monaco.editor.defineTheme("yaml-tool-light", {
  base: "vs",
  inherit: true,
  rules: [
    { token: "key", foreground: "1a7f37" },
    { token: "string.key", foreground: "1a7f37" },
    { token: "string", foreground: "0a3069" },
    { token: "number", foreground: "0550ae" },
    { token: "keyword.true", foreground: "cf222e" },
    { token: "keyword.null", foreground: "cf222e" },
    { token: "keyword.list", foreground: "8250df" },
    { token: "keyword.document", foreground: "57606a" },
    { token: "keyword", foreground: "8250df" },
    { token: "delimiter.key", foreground: "57606a" },
    { token: "delimiter.bracket", foreground: "0550ae" },
    { token: "delimiter", foreground: "57606a" },
    { token: "comment", foreground: "6e7781", fontStyle: "italic" },
  ],
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#1f2328",
    "editorLineNumber.foreground": "#8c959f",
    "editorLineNumber.activeForeground": "#1f2328",
    "editor.selectionBackground": "#b6e3ff",
    "editor.inactiveSelectionBackground": "#b6e3ff55",
    "editor.lineHighlightBackground": "#f6f8fa",
    "editorCursor.foreground": "#0550ae",
    "editorIndentGuide.background1": "#d8dee4",
    "editorIndentGuide.activeBackground1": "#afb8c1",
    "editorBracketMatch.background": "#f6f8fa",
    "editorBracketMatch.border": "#0550ae",
  },
});

export default monaco;
