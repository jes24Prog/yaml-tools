import { WorkbenchProvider, useWorkbench } from "./app/workbenchContext";
import { toolById } from "./app/toolRegistry";
import { Sidebar } from "./components/shell/Sidebar";
import { Topbar } from "./components/shell/Topbar";
import { Tabs } from "./components/shell/Tabs";
import { CommandPalette } from "./components/shell/CommandPalette";
import { Notifications } from "./components/shell/Notifications";

function Shell() {
  const { activeToolId, themeMode } = useWorkbench();
  const tool = toolById(activeToolId);
  const ToolComponent = tool?.component;

  return (
    <div data-theme={themeMode} className="flex h-screen min-h-screen flex-col overflow-hidden bg-surface-0 text-ink">
      <Topbar />
      <Tabs />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-auto">
          {ToolComponent ? (
            <ToolComponent />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-sm text-ink-faint">
              Unknown tool “{activeToolId}”.
            </div>
          )}
        </main>
      </div>
      <CommandPalette />
      <Notifications />
    </div>
  );
}

export default function App() {
  return (
    <WorkbenchProvider>
      <Shell />
    </WorkbenchProvider>
  );
}
