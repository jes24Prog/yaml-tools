import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef } from "react";
import type { editor } from "monaco-editor";
import type { YamlParseError } from "../types/yaml";

interface YamlEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  error?: YamlParseError | null;
  theme?: "yaml-tool-dark" | "yaml-tool-light";
  ariaLabel: string;
}

const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  language: "yaml",
  minimap: { enabled: false },
  lineNumbers: "on",
  lineNumbersMinChars: 3,
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  folding: true,
  showFoldingControls: "always",
  renderLineHighlight: "all",
  wordWrap: "off",
  bracketPairColorization: { enabled: true },
  matchBrackets: "always",
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
    useShadows: false,
  },
  padding: { top: 12, bottom: 12 },
  smoothScrolling: true,
  cursorBlinking: "smooth",
  renderWhitespace: "selection",
  suggest: { showWords: false },
  quickSuggestions: false,
};

export function YamlEditor({
  value,
  onChange,
  readOnly = false,
  error = null,
  theme = "yaml-tool-dark",
  ariaLabel,
}: YamlEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const errorRef = useRef<YamlParseError | null>(error);
  errorRef.current = error;

  const applyMarkers = useCallback(() => {
    const instance = editorRef.current;
    const monacoInstance = monacoRef.current;
    if (!instance || !monacoInstance) {
      return;
    }
    const model = instance.getModel();
    if (!model) {
      return;
    }

    const currentError = errorRef.current;
    const markers: editor.IMarkerData[] = currentError
      ? [
          {
            severity: monacoInstance.MarkerSeverity.Error,
            message: currentError.message,
            startLineNumber: currentError.line ?? 1,
            startColumn: currentError.column ?? 1,
            endLineNumber: currentError.line ?? 1,
            endColumn: (currentError.column ?? 1) + 1,
          },
        ]
      : [];

    monacoInstance.editor.setModelMarkers(model, "yaml", markers);

    if (currentError?.line) {
      instance.revealLineInCenter(currentError.line);
    }
  }, []);

  const handleMount: OnMount = (editorInstance, monacoInstance) => {
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;
    applyMarkers();
  };

  useEffect(() => {
    applyMarkers();
  }, [applyMarkers, error]);

  return (
    <Editor
      value={value}
      onChange={(next) => {
        if (!readOnly) {
          onChange?.(next ?? "");
        }
      }}
      onMount={handleMount}
      language="yaml"
      theme={theme}
      options={{
        ...EDITOR_OPTIONS,
        readOnly,
        ariaLabel,
        domReadOnly: readOnly,
      }}
      loading={
        <div className="flex h-full items-center justify-center text-sm text-ink-faint">
          Loading editor…
        </div>
      }
    />
  );
}
