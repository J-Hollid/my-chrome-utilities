import type { ActivePageObservationResult } from "../../active-page-observation.js";
import { targetPathStatusForObservation, type TargetPathStatus } from "../../data-layer-target-path-status.js";

export interface ProjectEventTransportInstalledPorts {
  root: ParentNode;
  loadPaths(): { observationPath: string; pushPath: string };
  savePaths(paths: { observationPath: string; pushPath: string }): Promise<void>;
  settleTransport(): Promise<void>;
  readTargetObservation(path: string): Promise<ActivePageObservationResult | undefined>;
  applyLiveTargetPathObservation(observation: ActivePageObservationResult): void;
  renderTargetReadiness(): void;
  projectName(): string | undefined;
}

export function createProjectEventTransportInstalledController(ports: ProjectEventTransportInstalledPorts) {
  const historyPathInput = ports.root.querySelector<HTMLInputElement>("#history-path");
  const transportHistoryPathDisplay = ports.root.querySelector<HTMLElement>("#history-path-display");
  const transportHistoryPathStatus = ports.root.querySelector<HTMLElement>("#history-path-status");
  const defaultPushPathInput = ports.root.querySelector<HTMLInputElement>("#default-push-path");
  const defaultPushPathStatus = ports.root.querySelector<HTMLElement>("#default-push-path-status");
  const projectTransportContext = ports.root.querySelector<HTMLElement>("#project-transport-context");
  const projectTransportGuidance = ports.root.querySelector<HTMLElement>("#project-transport-guidance");
  let mounted = false;
  let paths = { ...ports.loadPaths() };
  let phase: "idle" | "dirty" | "saving" | "saved" | "failed" = "idle";
  let projectTransportSavePending = false;
  let generation = 0;
  let targetPathRequest = 0;
  let pathGeneration = 0;
  let currentTargetPathStatus: TargetPathStatus = "Selection required";
  function renderTargetPath(path: string, fieldValue = path, status: TargetPathStatus = "Selection required"): void {
    if (historyPathInput) historyPathInput.value = fieldValue;
    if (transportHistoryPathDisplay) transportHistoryPathDisplay.textContent = path;
    if (transportHistoryPathStatus) transportHistoryPathStatus.textContent = status === "Waiting for path" ? "Waiting for observation path" : status;
  }
  function currentObservationHistoryPath(): string { return paths.observationPath; }
  const targetPathStatusController = {
    apply(observation:ActivePageObservationResult, path = currentObservationHistoryPath(), fieldValue = path): void {
      if (!mounted) return;
      targetPathRequest += 1;
      currentTargetPathStatus = targetPathStatusForObservation(observation, path);
      renderTargetPath(path, fieldValue, currentTargetPathStatus); ports.renderTargetReadiness();
      ports.applyLiveTargetPathObservation(observation);
    },
    async configure(path: string, fieldValue = path): Promise<void> {
      const request = ++targetPathRequest, operation = generation;
      const observation = await ports.readTargetObservation(path);
      if (!mounted || operation !== generation || request !== targetPathRequest) return;
      if (observation) targetPathStatusController.apply(observation, path, fieldValue);
      else { currentTargetPathStatus = "Selection required";
        renderTargetPath(path, fieldValue, currentTargetPathStatus); ports.renderTargetReadiness(); }
    },
  };
  function refreshSelectedTargetPathStatus(): void {
    const path = currentObservationHistoryPath();
    if (!path.trim()) {
      currentTargetPathStatus = "Waiting for path";
      renderTargetPath(path, historyPathInput?.value ?? path, currentTargetPathStatus);
      ports.renderTargetReadiness();
      return;
    }
    void targetPathStatusController.configure(path, historyPathInput?.value ?? path);
  }
  function synchronizeProjectPaths(): void {
    const next = { ...ports.loadPaths() };
    if (next.observationPath !== paths.observationPath) pathGeneration += 1;
    paths = next;
    if (historyPathInput) historyPathInput.value = paths.observationPath;
    if (defaultPushPathInput) defaultPushPathInput.value = paths.pushPath;
    renderProjectEventTransport();
    refreshSelectedTargetPathStatus();
  }
  const syncPaths = (): void => { const next = { observationPath:historyPathInput?.value ?? paths.observationPath,
    pushPath:defaultPushPathInput?.value ?? paths.pushPath };
    if (next.observationPath !== paths.observationPath) pathGeneration += 1;
    paths = next; phase = "dirty"; };
  const input = (): void => { syncPaths();
    void targetPathStatusController.configure(currentObservationHistoryPath(), historyPathInput?.value ?? paths.observationPath);
    renderProjectEventTransport(); };
  function renderProjectEventTransport(): void {
    const name = ports.projectName();
    if (projectTransportContext) projectTransportContext.textContent = name ? `Project context: ${name}` : "No active project";
    if (projectTransportGuidance) projectTransportGuidance.hidden = Boolean(name);
    if (historyPathInput) historyPathInput.disabled = !name;
    if (defaultPushPathInput) defaultPushPathInput.disabled = !name;
    if (defaultPushPathStatus) defaultPushPathStatus.textContent = name
      ? projectTransportSavePending ? "Saving project Draft…" : phase === "failed" ? "Save failed; project Draft is unchanged." : "Saved in project Draft"
      : "Open project";
  }
  async function saveProjectEventTransport(): Promise<void> {
    syncPaths(); const operation = ++generation, snapshot = { ...paths }; phase = "saving";
    projectTransportSavePending = true; renderProjectEventTransport();
    try {
      await ports.savePaths(snapshot); await ports.settleTransport();
      if (mounted && operation === generation) phase = "saved";
    } catch (error) { if (mounted && operation === generation) phase = "failed"; throw error; }
    finally { if (operation === generation) { projectTransportSavePending = false; renderProjectEventTransport(); } }
  }
  const observationPathChange = (): void => { void saveProjectEventTransport().then(refreshSelectedTargetPathStatus).catch((error: unknown) => {
    if (transportHistoryPathStatus) transportHistoryPathStatus.textContent = error instanceof Error ? error.message : String(error);
  }); };
  const pushPathChange = (): void => { void saveProjectEventTransport().catch((error: unknown) => {
    if (defaultPushPathStatus) defaultPushPathStatus.textContent = error instanceof Error ? error.message : String(error);
  }); };
  return {
    mount(): void {
      if (mounted) return; mounted = true; generation += 1;
      paths = { ...ports.loadPaths() };
      if (historyPathInput) historyPathInput.value = paths.observationPath;
      if (defaultPushPathInput) defaultPushPathInput.value = paths.pushPath;
      historyPathInput?.addEventListener("input", input);
      historyPathInput?.addEventListener("change", observationPathChange);
      defaultPushPathInput?.addEventListener("change", pushPathChange);
      renderProjectEventTransport();
    },
    dispose(): void {
      if (!mounted) return; mounted = false; generation += 1; phase = "idle";
      targetPathRequest += 1;
      historyPathInput?.removeEventListener("input", input);
      historyPathInput?.removeEventListener("change", observationPathChange);
      defaultPushPathInput?.removeEventListener("change", pushPathChange);
    },
    currentObservationHistoryPath,
    configureTargetPath:targetPathStatusController.configure,
    applyTargetPathObservation:targetPathStatusController.apply,
    refreshTargetPath:refreshSelectedTargetPathStatus,
    synchronizeProjectPaths,
    render:renderProjectEventTransport,
    save:saveProjectEventTransport,
    state:() => ({ ...paths, phase, currentTargetPathStatus, targetPathRequest, pathGeneration }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"project-event-transport",
  capabilities:["observation path", "push path", "settlement", "target refresh"],
});
