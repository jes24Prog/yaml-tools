import { useWorkbench } from "../../app/workbenchContext";
import { DEFAULT_SETTINGS } from "../../services/workspaceService";
import type { WorkbenchSettings } from "../../types/workbench";
import { ToolPage } from "../shared/ToolShell";

export default function SettingsTool() {
  const { settings, updateSettings, notify } = useWorkbench();

  const set = <K extends keyof WorkbenchSettings>(key: K, value: WorkbenchSettings[K]) => {
    updateSettings({ [key]: value });
  };

  const reset = () => {
    updateSettings(DEFAULT_SETTINGS);
    notify("Settings reset to defaults.", "success");
  };

  const booleanRows: Array<{ key: keyof WorkbenchSettings; label: string; hint?: string }> = [
    { key: "wordWrap", label: "Word wrap", hint: "Wrap long lines in the editor." },
    { key: "minimap", label: "Minimap", hint: "Show the editor minimap." },
    { key: "lineNumbers", label: "Line numbers", hint: "Show line numbers in the editor." },
    { key: "autoSave", label: "Auto-save workspace", hint: "Persist the workspace to this browser automatically." },
    { key: "confirmDestructive", label: "Confirm destructive actions", hint: "Ask before closing or overwriting documents." },
  ];

  const numberRows: Array<{ key: "fontSize" | "tabSize" | "indent"; label: string; min: number; max: number }> = [
    { key: "fontSize", label: "Font size", min: 10, max: 24 },
    { key: "tabSize", label: "Editor tab size", min: 2, max: 8 },
    { key: "indent", label: "Formatting indent", min: 2, max: 8 },
  ];

  return (
    <ToolPage
      icon="settings"
      title="Settings"
      description="Editor preferences and workspace behaviour. Changes apply instantly and are stored in this browser."
      actions={
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
        >
          Reset to defaults
        </button>
      }
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex-none rounded-xl border border-edge-1 bg-surface-1 p-4 shadow-lg shadow-black/20">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Appearance</h4>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Theme</span>
              <select
                value={settings.theme}
                onChange={(event) => set("theme", event.target.value as WorkbenchSettings["theme"])}
                className="cursor-pointer rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
              >
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
            {numberRows.map((row) => (
              <label key={row.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-muted">{row.label}</span>
                <input
                  type="number"
                  min={row.min}
                  max={row.max}
                  value={settings[row.key]}
                  onChange={(event) => set(row.key, Number(event.target.value) || row.min)}
                  className="rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
                />
              </label>
            ))}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-muted">Default export format</span>
              <select
                value={settings.defaultExportFormat}
                onChange={(event) => set("defaultExportFormat", event.target.value as WorkbenchSettings["defaultExportFormat"])}
                className="cursor-pointer rounded-md border border-edge-1 bg-surface-0 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-emerald-500/50"
              >
                {(["yaml", "json", "toml", "env", "properties", "xml"] as const).map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex-none rounded-xl border border-edge-1 bg-surface-1 p-4 shadow-lg shadow-black/20">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Behaviour</h4>
          <div className="mt-3 flex flex-col gap-3">
            {booleanRows.map((row) => (
              <label key={row.key} className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-ink">{row.label}</div>
                  {row.hint && <div className="text-xs text-ink-faint">{row.hint}</div>}
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings[row.key])}
                  onChange={(event) => set(row.key, event.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
