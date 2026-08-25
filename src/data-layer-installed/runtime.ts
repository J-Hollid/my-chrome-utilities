import { createCaptureInstalledController, type CaptureInstalledPorts } from "./capture/index.js";
import { createDefectsInstalledController, type DefectsInstalledPorts } from "./defects/index.js";
import { createDurableProjectsInstalledController, type DurableProjectsInstalledPorts } from "./durable-projects/index.js";
import { createEventLibraryInstalledController, type EventLibraryInstalledPorts } from "./event-library/index.js";
import { createLiveFlowTestingInstalledController, type LiveFlowTestingInstalledPorts } from "./live-flow-testing/index.js";
import { createProjectEventTransportInstalledController, type ProjectEventTransportInstalledPorts } from "./project-event-transport/index.js";
import { createProjectsInstalledController, type ProjectsInstalledPorts } from "./projects/index.js";
import { createReplayInstalledController, type ReplayInstalledPorts } from "./replay/index.js";
import { createSchemasInstalledController, type SchemasInstalledPorts, type SchemaSourceDraftInput, type SchemaValidationRecord,
  type CapturedValidationContinuation } from "./schemas/index.js";
import { attachSavedSessionToDefect, type DefectLibrary, type ReportedDefect } from "../utilities/data-layer/defect-reporting.js";
import type { SessionSaveDraft } from "../data-layer-saved-session-live-feed.js";
import type { SavedSessionLibrary } from "../utilities/data-layer/live-inspection.js";
import type { EditableEventTemplate } from "../utilities/data-layer/event-library.js";
import { applyCapturedValidationToProfile, capturedValidationDestinationChoices, capturedValidationProfileRequirements,
  createFixtureFromCapturedValidation, type ProjectState } from "../utilities/data-layer/schemas.js";
import type { CapturedValidationResult } from "../data-layer-specification-project.js";

export const installedDataLayerControllerOrder = [
  "capture",
  "event-library",
  "schemas",
  "defects",
  "replay",
  "projects",
  "durable-projects",
  "project-event-transport",
  "live-flow-testing",
] as const;

export type InstalledDataLayerControllerId =
  typeof installedDataLayerControllerOrder[number];

export interface InstalledDataLayerControllerLifecycle {
  mount(): void;
  dispose(): void;
}

interface InstalledPaletteLifecycle extends InstalledDataLayerControllerLifecycle {}
interface InstalledWorkspaceTabsLifecycle extends InstalledDataLayerControllerLifecycle {
  show(tab: WorkspaceTabId, focus?: boolean): void;
}

export interface InstalledSidePanelShellPorts {
  pageLifecycle: Pick<Window, "addEventListener" | "removeEventListener">;
  commandLog: Pick<HTMLElement, "textContent"> | null;
  palette: InstalledPaletteLifecycle;
  workspaceTabs: InstalledWorkspaceTabsLifecycle;
  hotkeys: InstalledDataLayerControllerLifecycle;
  captureCommands: {
    startTesting(): Promise<unknown>;
    endTesting(): Promise<unknown>;
    chooseObservationTarget(): Promise<unknown>;
    attachSelectedTarget(): Promise<unknown>;
    detachObservationTarget(): void;
  };
  showDataLayerView(view: Parameters<NonNullable<CommandRunContext["showDataLayerView"]>>[0]): void;
}

export function createChromeRuntimeMessagePort(runtimeMessages: {
  addListener(listener: (message: unknown) => void): void;
  removeListener(listener: (message: unknown) => void): void;
}) {
  return {
    addListener:(listener: (message: unknown) => void): void => runtimeMessages.addListener(listener),
    removeListener:(listener: (message: unknown) => void): void => runtimeMessages.removeListener(listener),
  };
}

export function createInstalledSidePanelShellController(ports: InstalledSidePanelShellPorts) {
  const allCommands = [...commandsForUtilityShell(listCommands(), extensionShell.commands)];
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

export interface InstalledSidePanelRuntimeFoundation {
  app: HTMLElement | null;
  sidePanelContent: HTMLElement | null;
  commandLog: HTMLElement | null;
  openPaletteButton: HTMLButtonElement | null;
  palette: HTMLElement | null;
  paletteFilter: HTMLInputElement | null;
  paletteResults: HTMLElement | null;
  createKeymapButton: HTMLButtonElement | null;
  updateKeymapButton: HTMLButtonElement | null;
  loadKeymapButton: HTMLButtonElement | null;
  keymapFileInput: HTMLInputElement | null;
  keymapStatus: HTMLElement | null;
  keymapWarning: HTMLElement | null;
  workspaceTabList: HTMLElement | null;
  hotkeyEditorFilter: HTMLInputElement | null;
  hotkeyEditorCommands: HTMLElement | null;
  dataLayerStorage: Storage;
  hotkeyStorage: Storage;
  shellStorage: Storage;
  durableProjectRuntime: Awaited<ReturnType<typeof openDurableProjectRuntime>>;
}

export interface DurableProjectCoordinationPorts {
  renderProjectEventTransport(): void;
  renderSchemas(): void;
  renderSchemaWorkflowRows(): void;
  renderCompactCanonicalEditor(): void;
  renderLayeredProfileEditor(): void;
}

export function installDurableProjectCoordinationSubscription(
  durableProjectRuntime: Awaited<ReturnType<typeof openDurableProjectRuntime>>,
  ports: DurableProjectCoordinationPorts,
): () => void {
  return durableProjectRuntime.subscribe(({ active }) => {
    ports.renderProjectEventTransport();
    if (!active?.state) return;
    ports.renderSchemas();
    ports.renderSchemaWorkflowRows();
    ports.renderCompactCanonicalEditor();
    ports.renderLayeredProfileEditor();
  });
}

export async function createInstalledSidePanelRuntimeFoundation(
  root: Document = document,
  storage: Storage = globalThis.localStorage,
): Promise<InstalledSidePanelRuntimeFoundation> {
  const app = root.querySelector<HTMLElement>("#app");
  const panelRoot = root.querySelector<HTMLElement>("#side-panel-root");
  const utilityDirectory = root.querySelector<HTMLElement>("#utility-directory");
  const utilityStorageContract = (id: string) => {
    const contract = utilityRegistry.find((utility) => utility.id === id)?.storage;
    if (!contract) throw new Error(`Missing utility storage contract: ${id}`);
    return contract;
  };
  if (panelRoot) mountUtilityShell(extensionShell, panelRoot, window);
  if (utilityDirectory) renderUtilityDirectory(utilityRegistry, utilityDirectory);
  bindUtilityPanels(utilityRegistry, root);
  const durableProjectRuntime = await openDurableProjectRuntime(storage).catch((error) => {
    installDurableRepositoryStartupFailure(root, error);
    return new Promise<never>(() => {});
  });
  const projectStorage = durableProjectRuntime.storage;
  const scopedDataLayerStorage = createUtilityStorage(storage, utilityStorageContract("data-layer"));
  const dataLayerStorage: Storage = {
    get length() { return scopedDataLayerStorage.length; },
    clear() { scopedDataLayerStorage.clear(); projectStorage.removeItem(SCHEMA_LIBRARY_STORAGE_KEY); },
    key:(index) => scopedDataLayerStorage.key(index),
    getItem:(key) => key === SCHEMA_LIBRARY_STORAGE_KEY ? projectStorage.getItem(key) : scopedDataLayerStorage.getItem(key),
    setItem(key, value) { if (key === SCHEMA_LIBRARY_STORAGE_KEY) projectStorage.setItem(key, value); else scopedDataLayerStorage.setItem(key, value); },
    removeItem(key) { if (key === SCHEMA_LIBRARY_STORAGE_KEY) projectStorage.removeItem(key); else scopedDataLayerStorage.removeItem(key); },
  };
  const hotkeyStorage = createUtilityStorage(storage, utilityStorageContract("hotkeys"));
  const shellStorage = createUtilityStorage(storage, { namespace:"my-chrome-utilities.shell", version:1,
    legacyKeys:["my-chrome-utilities.workspace-tab.v1"] });
  const sidePanelContent = root.querySelector<HTMLElement>("#side-panel-content");
  const commandLog = root.querySelector<HTMLElement>("#command-log");
  const openPaletteButton = root.querySelector<HTMLButtonElement>("#open-palette");
  const palette = root.querySelector<HTMLElement>("#palette");
  const paletteFilter = root.querySelector<HTMLInputElement>("#palette-filter");
  const paletteResults = root.querySelector<HTMLElement>("#palette-results");
  const createKeymapButton = root.querySelector<HTMLButtonElement>("#create-keymap");
  const updateKeymapButton = root.querySelector<HTMLButtonElement>("#update-keymap");
  const loadKeymapButton = root.querySelector<HTMLButtonElement>("#load-keymap");
  const keymapFileInput = root.querySelector<HTMLInputElement>("#keymap-file");
  const keymapStatus = root.querySelector<HTMLElement>("#keymap-status");
  const keymapWarning = root.querySelector<HTMLElement>("#keymap-warning");
  const workspaceTabList = root.querySelector<HTMLElement>("#workspace-tabs");
  const hotkeyEditorFilter = root.querySelector<HTMLInputElement>("#hotkey-editor-filter");
  const hotkeyEditorCommands = root.querySelector<HTMLElement>("#hotkey-editor-commands");
  return { app, sidePanelContent, commandLog, openPaletteButton, palette, paletteFilter, paletteResults,
    createKeymapButton, updateKeymapButton, loadKeymapButton, keymapFileInput, keymapStatus, keymapWarning,
    workspaceTabList, hotkeyEditorFilter, hotkeyEditorCommands,
    dataLayerStorage, hotkeyStorage, shellStorage, durableProjectRuntime };
}

export type InstalledDataLayerControllers = Readonly<Record<
  InstalledDataLayerControllerId,
  InstalledDataLayerControllerLifecycle
>>;

export interface InstalledDataLayerControllerPorts {
  capture:CaptureInstalledPorts;
  "event-library":EventLibraryInstalledPorts;
  schemas:SchemasInstalledPorts;
  defects:DefectsInstalledPorts;
  replay:ReplayInstalledPorts;
  projects:ProjectsInstalledPorts;
  "durable-projects":DurableProjectsInstalledPorts;
  "project-event-transport":ProjectEventTransportInstalledPorts;
  "live-flow-testing":LiveFlowTestingInstalledPorts;
}

export function createInstalledDataLayerControllers(ports:InstalledDataLayerControllerPorts) {
  const controllers = {
    capture:createCaptureInstalledController(ports.capture),
    "event-library":createEventLibraryInstalledController(ports["event-library"]),
    schemas:createSchemasInstalledController(ports.schemas),
    defects:createDefectsInstalledController(ports.defects),
    replay:createReplayInstalledController(ports.replay),
    projects:createProjectsInstalledController(ports.projects),
    "durable-projects":createDurableProjectsInstalledController(ports["durable-projects"]),
    "project-event-transport":createProjectEventTransportInstalledController(ports["project-event-transport"]),
    "live-flow-testing":createLiveFlowTestingInstalledController(ports["live-flow-testing"]),
  } satisfies InstalledDataLayerControllers;
  return { controllers, lifecycle:createInstalledDataLayerLifecycle(controllers) };
}

export interface DefectCaptureOwners {
  capture:{ currentSessionDraft():SessionSaveDraft; savedSessions():SavedSessionLibrary;
    replaceSavedSessions(next:SavedSessionLibrary):void; openSavedSession(id:string):boolean; openInspector(id:string):void };
  defects:{ library():DefectLibrary; replace(next:DefectLibrary):void; matchingEvent(defect:ReportedDefect):{ id:string } | undefined };
}

export function createDefectCaptureCoordination(owners:DefectCaptureOwners, now:() => string = () => new Date().toISOString()) {
  return {
    attachCurrentSession(defectId:string):void {
      const draft = owners.capture.currentSessionDraft();
      const result = attachSavedSessionToDefect(owners.defects.library(), owners.capture.savedSessions(), defectId,
        draft.completed, `Evidence for ${defectId}`, now());
      owners.defects.replace(result.library); owners.capture.replaceSavedSessions(result.savedSessions);
    },
    openLinkedSession(defectId:string):boolean {
      const defect = owners.defects.library().defects.find(({ id }) => id === defectId);
      if (!defect?.savedSession || !owners.capture.openSavedSession(defect.savedSession.id)) return false;
      const matching = owners.defects.matchingEvent(defect); if (matching) owners.capture.openInspector(matching.id);
      return true;
    },
  };
}

export interface EventLibrarySchemaOwners {
  schemas:{ schemas():readonly { id:string; name:string; version:number }[];
    validateAgainstSchema(event:{ sourceId:string; eventName:string; payload:unknown; rawInput:unknown }, schemaId:string):{ message:string };
    openSchemaFromSource(source:SchemaSourceDraftInput):unknown };
}

export function createEventLibrarySchemaCoordination(owners:EventLibrarySchemaOwners) {
  return {
    schemas:() => owners.schemas.schemas(),
    validateDraft:(draft:{ schemaId:string; sourceId:string; eventName:string; payload:unknown }) =>
      owners.schemas.validateAgainstSchema({ sourceId:draft.sourceId, eventName:draft.eventName,
        payload:structuredClone(draft.payload), rawInput:[] }, draft.schemaId),
    createSchema:(template:EditableEventTemplate):void => {
      owners.schemas.openSchemaFromSource({ name:template.name, sourceId:template.sourceId, eventName:template.eventName,
        payload:structuredClone(template.payload), label:"Library template" });
    },
  };
}

export interface CapturedValidationCoordinationPorts {
  load(record:SchemaValidationRecord):Promise<{ state?:ProjectState; revision:number; captured?:{ id:string; sourceId:string; payload:unknown } }>;
  settle():Promise<void>;
  ensureProject(projectId:string):Promise<void>;
  loadCurrent(projectId:string):Promise<{ state:ProjectState; revision:number }>;
  commit(state:ProjectState, expectedRevision:number, label:string):{ status:"saved" | "conflict"; revision:number };
  capture(state:ProjectState, revision:number):void;
  route(projectId:string, kind:"fixtures" | "profiles", entityId:string):void;
  openStudio(projectId:string, kind:"fixtures" | "profiles", entityId:string):void;
  createId(kind:string):string;
}

export function createCapturedValidationContinuationCoordination(ports:CapturedValidationCoordinationPorts) {
  return async (record:SchemaValidationRecord):Promise<CapturedValidationContinuation> => {
    let loaded:Awaited<ReturnType<CapturedValidationCoordinationPorts["load"]>>;
    try { loaded = await ports.load(record); }
    catch (error) { throw new Error(`Captured continuation could not load the active project. ${error instanceof Error ? error.message : String(error)}`); }
    const captured = loaded.captured;
    if (!loaded.state) throw new Error("Create or open a Specification Project before continuing captured validation.");
    const project = loaded.state.project;
    if (!captured || !record.schemaId || !record.evaluated) throw new Error("Recheck the captured event with the project evaluator before continuing.");
    if (!project.collections.assignments.some(({ id, targetId }) => id === record.assignmentId && targetId === record.schemaId)) {
      throw new Error(`Add ${record.schemaName ?? "the validated contributor"} to ${project.name} before creating its Test case.`);
    }
    const evaluated = structuredClone(record.evaluated) as CapturedValidationResult;
    const choices = capturedValidationDestinationChoices(project, { eventName:record.eventName, sourceId:captured.sourceId });
    const requirements = capturedValidationProfileRequirements(project, { captureId:record.eventId, contributorId:record.schemaId, evaluated });
    if (!choices.events.length) throw new Error(`Add the ${record.eventName} Event to ${project.name} before continuing.`);
    return { projectName:project.name,
      summary:`${record.eventName} · ${record.state} · ${record.schemaName} revision ${record.schemaVersion} → ${project.name}.`,
      review:`Evaluated result ${evaluated.resultIdentity}. Proposed reviewed expectations: outcome ${evaluated.issueDetails.length ? "Invalid" : "Valid"}; issue paths and codes ${evaluated.issueDetails.map(({path,code})=>`${path ?? "/"} ${code}`).join(", ") || "none"}. Proposed Profile requirements: ${requirements.map(({path,type,required})=>`${path} (${type ?? "value"}${required ? ", required" : ""})`).join(", ") || "none"}. Each requirement retains this evidence identity.`,
      suggestedName:choices.suggestedFixtureName, events:choices.events, pages:choices.pages, flowSteps:choices.flowSteps, profiles:choices.profiles,
      commit:async (input) => {
        await ports.settle(); await ports.ensureProject(project.id); await ports.settle();
        const current = await ports.loadCurrent(project.id);
        const next = input.destination === "profile"
          ? applyCapturedValidationToProfile(current.state, { captureId:record.eventId, profileId:input.profileId!, contributorId:record.schemaId!, evaluated })
          : createFixtureFromCapturedValidation(current.state, { name:input.name, captureId:record.eventId, sourceId:captured.sourceId,
              eventName:record.eventName, payload:captured.payload, contributorId:record.schemaId!, eventId:input.eventId,
              ...(input.pageId ? {pageId:input.pageId}:{}), ...(input.flowStepId ? {flowStepId:input.flowStepId}:{}), evaluated }, ports.createId);
        const kind = input.destination === "profile" ? "profiles" : "fixtures", entity = input.destination === "profile"
          ? next.project.collections.profiles.find(({id}) => id === input.profileId)! : next.project.collections.fixtures.at(-1)!;
        const result = ports.commit(next, current.revision, `Continue evaluated capture ${record.eventId} as ${input.destination === "profile" ? "Profile requirements" : "Test case"}`);
        if (result.status === "conflict") throw new Error("Project changed in a newer Saved Draft; review the continuation again.");
        ports.capture(next, result.revision); ports.route(project.id, kind, entity.id); await ports.settle(); ports.openStudio(project.id, kind, entity.id);
        return { entityName:entity.name, kind };
      } };
  };
}

export function createInstalledDataLayerLifecycle(
  controllers: InstalledDataLayerControllers,
): InstalledDataLayerControllerLifecycle {
  let mounted = false;

  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      for (const id of installedDataLayerControllerOrder) controllers[id].mount();
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      for (const id of [...installedDataLayerControllerOrder].reverse()) {
        controllers[id].dispose();
      }
    },
  };
}
import { extensionShell, utilityRegistry } from "../utility-registry.js";
import { commandsForUtilityShell, listCommands } from "../utilities/command-palette/index.js";
import { bindUtilityPanels, mountUtilityShell, renderUtilityDirectory } from "../platform/utility-shell-dom.js";
import { createUtilityStorage } from "../platform/utility-storage.js";
import { installDurableRepositoryStartupFailure, openDurableProjectRuntime,
  SCHEMA_LIBRARY_STORAGE_KEY } from "../utilities/data-layer/schemas.js";
import type { CommandRunContext, CommandRunRecord } from "../commands.js";
import type { WorkspaceTabId } from "../workspace-tabs.js";
