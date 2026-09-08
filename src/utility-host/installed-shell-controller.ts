import type { commandsForUtilityShell } from "../utilities/command-palette/index.js";
import type { CommandRunContext, CommandRunRecord } from "../commands.js";
import type { WorkspaceTabId } from "../workspace-tabs.js";

interface InstalledShellLifecycle { mount(): void; dispose(): void; }

interface InstalledPaletteLifecycle extends InstalledShellLifecycle {}
export interface InstalledWorkspaceTabsLifecycle extends InstalledShellLifecycle {
  show(tab: WorkspaceTabId, focus?: boolean): void;
}

export interface InstalledSidePanelShellPorts {
  commands:ReturnType<typeof commandsForUtilityShell>;
  pageLifecycle: Pick<Window, "addEventListener" | "removeEventListener">;
  commandLog: Pick<HTMLElement, "textContent"> | null;
  palette: InstalledPaletteLifecycle;
  workspaceTabs: InstalledWorkspaceTabsLifecycle;
  hotkeys: InstalledShellLifecycle;
  captureCommands: {
    startTesting(): Promise<unknown>;
    endTesting(): Promise<unknown>;
    chooseObservationTarget(): Promise<unknown>;
    attachSelectedTarget(): Promise<unknown>;
    detachObservationTarget(): void;
  };
  showDataLayerView(view: Parameters<NonNullable<CommandRunContext["showDataLayerView"]>>[0]): void;
}

export function createInstalledSidePanelShellController(ports: InstalledSidePanelShellPorts) {
  const allCommands = [...ports.commands];
  const paletteController = ports.palette;
  const workspaceTabsController = ports.workspaceTabs;
  const hotkeyController = ports.hotkeys;
  let mounted = false;
  async function recordDataLayerCommandRun(entry: CommandRunRecord): Promise<void> {
    if (entry.commandId === "data-layer.start-testing") await ports.captureCommands.startTesting();
    if (entry.commandId === "data-layer.end-testing") await ports.captureCommands.endTesting();
    if (entry.commandId === "data-layer.choose-observation-target") await ports.captureCommands.chooseObservationTarget();
    if (entry.commandId === "data-layer.attach-selected-target") await ports.captureCommands.attachSelectedTarget();
    if (entry.commandId === "data-layer.detach-observation-target") ports.captureCommands.detachObservationTarget();
  }
  function recordCommandRun(entry: CommandRunRecord): void {
    void recordDataLayerCommandRun(entry);
    if (ports.commandLog) ports.commandLog.textContent = entry.message;
  }
  function showWorkspace(tab: WorkspaceTabId, focus = false): void {
    workspaceTabsController.show(tab, focus);
  }
  const commandRunContext: CommandRunContext = {
    record:recordCommandRun,
    showWorkspace,
    showDataLayerView:ports.showDataLayerView,
  };
  const pageHidden = (): void => paletteController.dispose();
  return {
    mount(): void {
      if (mounted) return; mounted = true;
      workspaceTabsController.mount(); hotkeyController.mount(); paletteController.mount();
      ports.pageLifecycle.addEventListener("pagehide", pageHidden, { once:true });
    },
    dispose(): void {
      if (!mounted) return; mounted = false;
      ports.pageLifecycle.removeEventListener("pagehide", pageHidden);
      paletteController.dispose(); hotkeyController.dispose(); workspaceTabsController.dispose();
    },
    commandContext:commandRunContext,
    runDataLayerCommand:recordDataLayerCommandRun,
    commands:() => allCommands,
    runCommand:(id:string):void => { const command = allCommands.find((candidate) => candidate.id === id);
      if (!command) throw new Error(`Unknown installed command ${id}`); command.run(commandRunContext); },
  };
}
