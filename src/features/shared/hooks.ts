import { useCallback, useEffect, useState } from "react";
import { useWorkbench } from "../../app/workbenchContext";

/**
 * Manages a tool's working text buffer seeded from the active document,
 * with explicit "load from document" and "apply to document" actions.
 */
export function useToolSource(seedFromActive = true) {
  const { activeDocument, replaceActiveDocument, notify } = useWorkbench();
  const [source, setSource] = useState(() => (seedFromActive ? activeDocument.content : ""));

  const loadFromActive = useCallback(() => {
    setSource(activeDocument.content);
    notify("Loaded content from the active document.", "info");
  }, [activeDocument.content, notify]);

  const applyToActive = useCallback(
    (text: string) => {
      replaceActiveDocument(text);
      notify("Applied output to the active document.", "success");
    },
    [replaceActiveDocument, notify],
  );

  return { source, setSource, loadFromActive, applyToActive };
}

/** Two independent buffers, e.g. for merge/diff/convert tools. */
export function useToolSources() {
  const { activeDocument, notify } = useWorkbench();
  const [left, setLeft] = useState(() => activeDocument.content);
  const [right, setRight] = useState("");

  const loadLeftFromActive = useCallback(() => {
    setLeft(activeDocument.content);
    notify("Loaded content from the active document.", "info");
  }, [activeDocument.content, notify]);

  const loadRightFromActive = useCallback(() => {
    setRight(activeDocument.content);
    notify("Loaded content from the active document.", "info");
  }, [activeDocument.content, notify]);

  return {
    left,
    setLeft,
    right,
    setRight,
    loadLeftFromActive,
    loadRightFromActive,
  };
}

/** Sizes the Monaco panes to roughly half the available viewport height. */
export function usePaneHeight() {
  const [height, setHeight] = useState(360);
  useEffect(() => {
    const update = () => setHeight(Math.max(280, Math.floor(window.innerHeight * 0.38)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return height;
}
