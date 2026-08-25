export interface ProjectEventTransportInstalledPorts {
  root: ParentNode;
  loadPaths(): { observationPath: string; pushPath: string };
  savePaths(paths: { observationPath: string; pushPath: string }): Promise<void>;
  settleTransport(): Promise<void>;
  refreshTargetPath(): Promise<void>;
  projectName(): string | undefined;
}

export function createProjectEventTransportInstalledController(ports: ProjectEventTransportInstalledPorts) {
  const historyPathInput = ports.root.querySelector<HTMLInputElement>("#history-path");
  const defaultPushPathInput = ports.root.querySelector<HTMLInputElement>("#default-push-path");
  const defaultPushPathStatus = ports.root.querySelector<HTMLElement>("#default-push-path-status");
  const projectTransportContext = ports.root.querySelector<HTMLElement>("#project-transport-context");
  const projectTransportGuidance = ports.root.querySelector<HTMLElement>("#project-transport-guidance");
  let mounted = false;
  let paths = { ...ports.loadPaths() };
  let phase: "idle" | "dirty" | "saving" | "saved" | "failed" = "idle";
  let projectTransportSavePending = false;
  let generation = 0;
  const input = (): void => { paths = { observationPath:historyPathInput?.value ?? paths.observationPath,
    pushPath:defaultPushPathInput?.value ?? paths.pushPath }; phase = "dirty"; renderProjectEventTransport(); };
  function currentObservationHistoryPath(): string { return paths.observationPath; }
  function renderProjectEventTransport(): void {
    const name = ports.projectName();
    if (projectTransportContext) projectTransportContext.textContent = name ? `Project context: ${name}` : "No active project";
    if (projectTransportGuidance) projectTransportGuidance.hidden = Boolean(name);
    if (defaultPushPathStatus) defaultPushPathStatus.textContent = name
      ? projectTransportSavePending ? "Saving project Draft…" : phase === "failed" ? "Save failed; project Draft is unchanged." : "Saved in project Draft"
      : "Open project";
  }
  async function saveProjectEventTransport(): Promise<void> {
    input(); const operation = ++generation, snapshot = { ...paths }; phase = "saving";
    projectTransportSavePending = true; renderProjectEventTransport();
    try {
      await ports.savePaths(snapshot); await ports.settleTransport(); await ports.refreshTargetPath();
      if (mounted && operation === generation) phase = "saved";
    } catch (error) { if (mounted && operation === generation) phase = "failed"; throw error; }
    finally { if (operation === generation) { projectTransportSavePending = false; renderProjectEventTransport(); } }
  }
  const change = (): void => { void saveProjectEventTransport(); };
  return {
    mount(): void {
      if (mounted) return; mounted = true; generation += 1;
      if (historyPathInput) historyPathInput.value = paths.observationPath;
      if (defaultPushPathInput) defaultPushPathInput.value = paths.pushPath;
      historyPathInput?.addEventListener("input", input); historyPathInput?.addEventListener("change", change);
      defaultPushPathInput?.addEventListener("input", input); defaultPushPathInput?.addEventListener("change", change);
      renderProjectEventTransport();
    },
    dispose(): void {
      if (!mounted) return; mounted = false; generation += 1; phase = "idle";
      historyPathInput?.removeEventListener("input", input); historyPathInput?.removeEventListener("change", change);
      defaultPushPathInput?.removeEventListener("input", input); defaultPushPathInput?.removeEventListener("change", change);
    },
    currentObservationHistoryPath,
    render:renderProjectEventTransport,
    save:saveProjectEventTransport,
    state:() => ({ ...paths, phase }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"project-event-transport",
  capabilities:["observation path", "push path", "settlement", "target refresh"],
});
