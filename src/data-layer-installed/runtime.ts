import { createInstalledSidePanelShellController, type InstalledWorkspaceTabsLifecycle } from "../utility-host/installed-shell-controller.js";
export { createInstalledSidePanelShellController, type InstalledSidePanelShellPorts } from "../utility-host/installed-shell-controller.js";
import {renderObservationSourceDetails} from "./capture/observation-sources/feed.js";
import {createObservationSessionStart} from "./capture/observation-sources/session-start.js";
import {createInstalledTransportPersistence} from "./project-event-transport/persistence.js";
import {startObservationSourceSubscription} from "./capture/observation-sources/subscription.js";
import { createCaptureInstalledController, renderInstalledSavedSessionList, type CaptureInstalledPorts, type CaptureObserverRuntimePorts,
  type CaptureTargetTab } from "./capture/index.js";
import { createDefectsInstalledController, type DefectsInstalledPorts } from "./defects/index.js";
import { createDurableProjectsInstalledController, type DurableProjectsInstalledPorts } from "./durable-projects/index.js";
import { createEventLibraryInstalledController, type EventLibraryInstalledPorts,
  type EventLibraryTestCaseReview } from "./event-library/index.js";
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
import type { ValidationState } from "../utilities/data-layer/capture.js";
import type { ValidationEvaluation } from "../utilities/data-layer/schemas.js";
import type { OccurrenceExpectationMode } from "../utilities/data-layer/defect-reporting.js";
import type { LiveDraftContinuation, LiveInspectorActionEffects } from "../data-layer-live-inspector-actions.js";
import { applyCapturedValidationToProfile, capturedValidationDestinationChoices, capturedValidationProfileRequirements,
  createFixtureFromCapturedValidation, transactProject, type CanonicalSchemaDocument, type ProjectState } from "../utilities/data-layer/schemas.js";
import type { CapturedValidationResult } from "../data-layer-specification-project.js";
import { createGuidedTestCase } from "../data-layer-guided-test-cases.js";
import type { DataLayerView, LiveEvent } from "../utilities/data-layer/live-inspection.js";
import type { CompletedLiveFlowTest } from "../data-layer-live-flow-testing.js";
import { tabPageObservation } from "../active-page-observation.js";

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

export function createChromeRuntimeMessagePort(runtimeMessages: {
  addListener(listener: (message: unknown) => void): void;
  removeListener(listener: (message: unknown) => void): void;
}) {
  return {
    addListener:(listener: (message: unknown) => void): void => runtimeMessages.addListener(listener),
    removeListener:(listener: (message: unknown) => void): void => runtimeMessages.removeListener(listener),
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
  durableProjectRepositoryUi: Awaited<ReturnType<typeof mountDurableProjectRepositoryUi>>;
}

type InstalledSchemaPersistenceEvent = Parameters<SchemasInstalledPorts["subscribeSchemaPersistence"]>[0] extends (event: infer T) => unknown ? T : never;

export interface InstalledLiveInspectorCoordinationPorts {
  currentPageUrl():string;
  writeClipboard(text:string):Promise<void>;
  storeTemplate(template:EditableEventTemplate):void;
  defaultDestination():string;
  onTemplateSaved(template:EditableEventTemplate):void;
  schemas:{
    create(event:LiveEvent):void;
    createValidation(event:LiveEvent):void;
    addPropertyValidation(event:LiveEvent,path:string,trigger:HTMLButtonElement):void;
    addPropertyToSchema(event:LiveEvent,path:string,trigger:HTMLButtonElement):void;
    propertyDeclaration(event:LiveEvent,path:string):{destination?:string;alreadyDeclared?:boolean};
    expandAllowedValue(event:LiveEvent,evaluation:ValidationEvaluation,trigger:HTMLButtonElement):void;
    draftContinuation(event:LiveEvent):LiveDraftContinuation|undefined;
    validationAvailable(event:LiveEvent):boolean;
    validationState(event:LiveEvent):ValidationState;
    manualSchemaChoices(event:LiveEvent):readonly {id:string;label:string}[];
    selectManualSchema(eventId:string,schemaId:string|undefined):void;
  };
  defects:{
    startValidationReport(event:LiveEvent):void;
    startOccurrenceReport(event:LiveEvent,mode:OccurrenceExpectationMode):void;
    openReported(defectId:string,event:LiveEvent,issueIndex:number,trigger:HTMLButtonElement):void;
  };
  updateValidation(eventId:string,state:ValidationState):void;
}

export function createInstalledLiveInspectorCoordination(
  ports:InstalledLiveInspectorCoordinationPorts,
):LiveInspectorActionEffects {
  return {
    currentPageUrl:ports.currentPageUrl,
    writeClipboard:ports.writeClipboard,
    storeTemplate:ports.storeTemplate,
    defaultDestination:ports.defaultDestination,
    onTemplateSaved:ports.onTemplateSaved,
    createSchema:ports.schemas.create,
    createValidation:ports.schemas.createValidation,
    addPropertyValidation:ports.schemas.addPropertyValidation,
    addPropertyToSchema:ports.schemas.addPropertyToSchema,
    propertyDeclaration:ports.schemas.propertyDeclaration,
    expandAllowedValue:ports.schemas.expandAllowedValue,
    draftContinuation:ports.schemas.draftContinuation,
    startDefectReport:ports.defects.startValidationReport,
    startOccurrenceDefectReport:ports.defects.startOccurrenceReport,
    openReportedDefect:ports.defects.openReported,
    validationAvailable:ports.schemas.validationAvailable,
    validationState:ports.schemas.validationState,
    updateValidation:ports.updateValidation,
    manualSchemaChoices:ports.schemas.manualSchemaChoices,
    selectManualSchema:ports.schemas.selectManualSchema,
  };
}

export interface DurableSchemaPersistenceCoordinationPorts {
  runtime: Pick<Awaited<ReturnType<typeof openDurableProjectRuntime>>, "failedSchemaSave" | "retryFailedSchemaSave" | "resolveFailedSchemaSave" | "exportUnsavedSchemas"> & {
    repository: Pick<Awaited<ReturnType<typeof openDurableProjectRuntime>>["repository"], "subscribeSavedSchemas">;
  };
  repositoryUi: Pick<Awaited<ReturnType<typeof mountDurableProjectRepositoryUi>>, "reportSaveFailure">;
  eventTarget: Pick<Window, "addEventListener" | "removeEventListener">;
  origin(): HTMLElement | undefined;
  download(serialized:string):void;
  recoveryStarted?():void;
}

export function createDurableSchemaPersistenceCoordination(ports:DurableSchemaPersistenceCoordinationPorts) {
  const listeners=new Set<(event:InstalledSchemaPersistenceEvent)=>void|Promise<void>>();
  const announce=async(event:InstalledSchemaPersistenceEvent):Promise<void>=>{await Promise.all([...listeners].map((listener)=>listener(event)));};
  const unsubscribeSaved=ports.runtime.repository.subscribeSavedSchemas(({schemaId})=>{
    if(!ports.runtime.failedSchemaSave())void announce({type:"saved",schemaId});
  });
  const failed=(event:Event):void=>{const pending=ports.runtime.failedSchemaSave();if(!pending)return;
    ports.recoveryStarted?.();
    const schemaIds=[...new Set([...pending.batch.upserts.map(({schema})=>String(schema.id)),...pending.batch.deletes.map(({schemaId})=>schemaId)])];
    for(const schemaId of schemaIds)void announce({type:"failed",schemaId,error:pending.error});
    const origin=ports.origin();
    void ports.repositoryUi.reportSaveFailure({kind:"saved-schema",projectName:pending.batch.names.join(", "),command:{label:pending.batch.label},
      retry:async()=>{await ports.runtime.retryFailedSchemaSave();for(const schemaId of schemaIds)await announce({type:"retried",schemaId});},
      reject:async()=>{await ports.runtime.resolveFailedSchemaSave("reject");for(const schemaId of schemaIds)await announce({type:"rejected",schemaId,error:pending.error});},
      exportUnsaved:()=>ports.download(ports.runtime.exportUnsavedSchemas()),...(origin?{originControl:origin}:{})},
    (event as CustomEvent<{error?:unknown}>).detail?.error??pending.error);
  };
  ports.eventTarget.addEventListener("durable-project-save-failed",failed);
  return {subscribe(listener:(event:InstalledSchemaPersistenceEvent)=>void|Promise<void>){listeners.add(listener);return()=>listeners.delete(listener);},
    dispose(){ports.eventTarget.removeEventListener("durable-project-save-failed",failed);unsubscribeSaved();listeners.clear();}};
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
  const { extensionShell, utilityRegistry } = await import("../utility-registry.js");
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
  const durableProjectRepositoryUi=await mountDurableProjectRepositoryUi(root, globalThis.indexedDB, durableProjectRuntime.repository);
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
    dataLayerStorage, hotkeyStorage, shellStorage, durableProjectRuntime, durableProjectRepositoryUi };
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

export interface EventLibraryTestCaseCoordinationPorts {
  projects():readonly {id:string;name:string}[];
  activeProjectId():string | undefined;
  ensureProject(projectId:string):Promise<void>;
  settle():Promise<void>;
  load(projectId:string):Promise<{state:ProjectState;revision:number}>;
  commit(state:ProjectState,expectedRevision:number,label:string):{status:"saved"|"conflict";revision:number};
  capture(state:ProjectState,revision:number):void;
  route(projectId:string,testCaseId:string):void;
  openStudio(projectId:string,testCaseId:string):void;
  repair(projectId:string,kind:"events"|"profiles"):void;
  createId(kind:string):string;
}

interface InstalledSchemaContributorCoordinationPorts {
  activeProjectId(): string | undefined;
  compatibilityProject(): ProjectState | undefined;
  ensureProject(projectId:string): Promise<unknown>;
  loadProject(projectId:string): Promise<{state:ProjectState;revision:number}>;
  captureProject(state:ProjectState,revision:number): void;
}

export function createInstalledSchemaContributorCoordination(ports:InstalledSchemaContributorCoordinationPorts) {
  let durableProjection:ProjectState|undefined;
  const captureProject=(state:ProjectState):void=>{
    if(state.project.id===ports.activeProjectId())durableProjection=state;
  };
  const currentProject=():ProjectState|undefined=>{
    const projectId=ports.activeProjectId();
    if(!projectId)return undefined;
    if(durableProjection?.project.id===projectId)return durableProjection;
    const compatibility=ports.compatibilityProject();
    return compatibility?.project.id===projectId?compatibility:undefined;
  };
  const ensureProjectContributors=async(projectId:string):Promise<{name:string}>=>{
    await ports.ensureProject(projectId);
    const loaded=await ports.loadProject(projectId);
    if(projectId===ports.activeProjectId()){
      durableProjection=loaded.state;
      ports.captureProject(loaded.state,loaded.revision);
    }
    return{name:loaded.state.project.name};
  };
  return{currentProject,ensureProjectContributors,captureProject};
}

export function createEventLibraryTestCaseCoordination(ports:EventLibraryTestCaseCoordinationPorts) {
  return async (template:EditableEventTemplate):Promise<EventLibraryTestCaseReview> => {
    const mapping = async (projectId:string) => {
      await ports.ensureProject(projectId); await ports.settle();
      const { state } = await ports.load(projectId), project = state.project;
      const events = project.collections.events.filter(({ eventName, sourceId }) =>
        eventName === template.eventName && sourceId === template.sourceId).map(({id,name})=>({id,name}));
      const profiles = project.collections.profiles.filter((profile) => profile.id === template.schemaId ||
        profile.sourceIdentity === template.schemaId ||
        (profile.canonicalSchema as {source?:{identity?:string}}|undefined)?.source?.identity === template.schemaId)
        .map(({id,name,revision,canonicalSchema})=>({id,name,
          revision:Number((canonicalSchema as {revision?:number}|undefined)?.revision ?? revision ?? 1)}));
      return { summary:events.length && profiles.length
        ? `${template.name} revision ${template.version} will be copied as typed input with exact source provenance.`
        : `No mapping was guessed. ${events.length ? "" : "Create or select a matching Event. "}${profiles.length ? "" : "Adopt or select the attached schema in this project."}`,
        events, profiles };
    };
    const activeProjectId=ports.activeProjectId();
    return { projects:ports.projects().map((project)=>({...project})), ...(activeProjectId?{activeProjectId}:{}),
      refresh:mapping, repair:ports.repair,
      commit:async ({projectId,eventId,profileId}) => {
        await ports.ensureProject(projectId); await ports.settle();
        const loaded=await ports.load(projectId),profile=loaded.state.project.collections.profiles.find(({id})=>id===profileId);
        if (!eventId || !profile) throw new Error("Review a matching Event and input-guidance schema before creating the Test case.");
        const testCase=createGuidedTestCase({name:template.name,testType:"event-validation",eventId,
          source:{kind:"event-library",id:template.id,revision:String(template.version),eventId,destination:template.destination,
            payload:structuredClone(template.payload) as Record<string,unknown>,schemaId:profile.id,
            schemaRevision:String((profile.canonicalSchema as {revision?:number}|undefined)?.revision??profile.revision??1)},
          id:ports.createId});
        const label=`Create Test case from Event Library ${template.name}`;
        const next=transactProject(loaded.state,label,(project)=>({...project,collections:{...project.collections,
          fixtures:[...project.collections.fixtures,testCase]}}));
        const result=ports.commit(next,loaded.revision,`Create Test case from ${template.name}`);
        if(result.status==="conflict")throw new Error("The selected project changed; review the Test case mapping again.");
        ports.capture(next,result.revision);ports.route(projectId,testCase.id);await ports.settle();ports.openStudio(projectId,testCase.id);
      } };
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

export async function mountInstalledDataLayerRuntime(
  root:Document = document,
  storage:Storage = globalThis.localStorage,
  workspaceNavigation?:InstalledWorkspaceTabsLifecycle,
):Promise<InstalledDataLayerControllerLifecycle> {
  const [paletteApi, hotkeyApi, tabApi, captureApi, liveApi, eventApi, schemaApi, defectApi, replayApi, registryApi] = await Promise.all([
    import("../utilities/command-palette/index.js"), import("../utilities/hotkeys/index.js"),
    import("../workspace-tabs-ui.js"), import("../utilities/data-layer/capture.js"),
    import("../utilities/data-layer/live-inspection.js"), import("../utilities/data-layer/event-library.js"),
    import("../utilities/data-layer/schemas.js"), import("../utilities/data-layer/defect-reporting.js"),
    import("../utilities/data-layer/replay.js"), import("../utility-registry.js"),
  ]);
  const foundation=await createInstalledSidePanelRuntimeFoundation(root,storage), durable=foundation.durableProjectRuntime;
  const chromeApi=():typeof globalThis.chrome=>globalThis.chrome;
  const dataStorage=foundation.dataLayerStorage, projectStorage=durable.storage;
  const download=(filename:string,contents:BlobPart,type="application/json"):void=>{const url=URL.createObjectURL(new Blob([contents],{type}));
    const link=root.createElement("a");link.href=url;link.download=filename;link.click();URL.revokeObjectURL(url);};
  let schemaRecoveryActive=false;
  let guidedLivePropertyReturn:{eventId:string;path:string;expanded:readonly string[];inspectorScroll:number;feedScroll:number}|undefined;
  const schemaPersistence=createDurableSchemaPersistenceCoordination({runtime:durable,repositoryUi:foundation.durableProjectRepositoryUi,
    eventTarget:globalThis,origin:()=>root.activeElement instanceof HTMLElement?root.activeElement:undefined,
    download:(serialized)=>download("unsaved-saved-schema-batch.json",serialized),recoveryStarted:()=>{schemaRecoveryActive=true;}});
  const currentProject=():ProjectState|undefined=>schemaApi.restoreCanonicalProjectState(projectStorage.getItem("my-chrome-utilities.specification-project.v1"));
  let controllers:ReturnType<typeof createInstalledDataLayerControllers>["controllers"];
  let currentView:DataLayerView=(dataStorage.getItem("my-chrome-utilities.data-layer-view.v1") as DataLayerView|null)??"Live";
  const liveElements=liveApi.findLiveObserverElements(root);
  const showDataLayerView=(view:string,focus=false):void=>{if(!liveApi.dataLayerViews.includes(view as DataLayerView))return;
    if(currentView==="Live"&&view!=="Live")controllers?.capture.rememberInspectorPresentation();
    currentView=view as DataLayerView;dataStorage.setItem("my-chrome-utilities.data-layer-view.v1",currentView);
    liveApi.renderDataLayerView(liveElements,currentView,focus);if(currentView==="Defects")controllers?.defects.render();
    if(currentView==="Live")controllers?.capture.restoreInspectorPresentation();
    if(currentView==="Schemas"){controllers?.schemas.show();void controllers?.schemas.hydrateActiveProjectForSchemas();}};
  const projectLibraryUi=schemaApi.mountProjectLibraryUi({root,storage:projectStorage,
    prepareProject:durable.ensureProject,settled:durable.settled,undoProject:durable.undo,
    subscribe:(listener)=>durable.subscribe(({library})=>listener(library)),blocked:()=>Boolean(durable.failedSave()),
    exportProject:async(projectId)=>JSON.stringify(await durable.repository.exportProject(projectId)),
    importProject:async(serialized,input)=>{await durable.repository.importProject(JSON.parse(serialized) as Record<string,unknown>,input);},
    projectStorageKey:"my-chrome-utilities.specification-project.v1",navigationStorageKey:"my-chrome-utilities.specification-project-navigation.v1",
    openStudio:(url)=>{globalThis.open(url,"_blank");},onChange:()=>{controllers?.["project-event-transport"].synchronizeProjectPaths();},});
  const projectRecords=()=>Object.values(projectLibraryUi.library().projects).map(({state})=>({id:state.project.id,name:state.project.name}));
  const activeProjectId=()=>projectLibraryUi.library().activeProjectId;
  const schemaContributors=createInstalledSchemaContributorCoordination({activeProjectId,compatibilityProject:currentProject,
    ensureProject:durable.ensureProject,loadProject:async(projectId)=>{const loaded=await durable.repository.loadProject(projectId);
      return{state:loaded.state,revision:loaded.draftSequence};},
    captureProject:(state,revision)=>projectLibraryUi.captureActiveProject(state,revision)});
  const openSchemaContributor=(key:string):void=>{
    let contributorUi:{selectedPropertyId?:string;view?:"tree"|"table"}={};
    const selectionFor=(state:ProjectState)=>schemaApi.resolveSidePanelSchemaContributor(state,key);
    const documentFor=(state:ProjectState)=>{const selection=selectionFor(state);if(!selection)throw new Error("The selected schema contributor is unavailable.");
      const base:CanonicalSchemaDocument=selection.scope!=="Shared Profile"?schemaApi.composedCanonicalSchema(state,selection.entity,selection.scope,selection.flowId)
        :(selection.entity.canonicalSchema as CanonicalSchemaDocument|undefined??schemaApi.createCanonicalSchema({id:`canonical:${selection.entity.id}`,contributorId:selection.entity.id,contributorName:selection.entity.name}));
      const selectedPropertyId=contributorUi.selectedPropertyId&&base.nodes[contributorUi.selectedPropertyId]?contributorUi.selectedPropertyId:base.selectedPropertyId;
      return{...base,...(selectedPropertyId?{selectedPropertyId}:{}),...(contributorUi.view?{view:contributorUi.view}:{})};};
    const initial=schemaContributors.currentProject(),selection=initial&&selectionFor(initial);if(!initial||!selection)throw new Error("The selected schema contributor is unavailable.");
    let pendingRevision:number|undefined;
    controllers.schemas.openCanonical({key,label:`${selection.entity.name} · Role ${selection.scope} · scope ${selection.scope} · provenance ${selection.flowId?`${selection.flowId} · `:""}${selection.entity.id}`,
      load:()=>{const live=schemaContributors.currentProject();if(!live)throw new Error("The active schema project is unavailable.");return documentFor(live);},
      dispatch:(command)=>{const live=schemaContributors.currentProject();if(!live)throw new Error("The active schema project is unavailable.");const selected=selectionFor(live);if(!selected)throw new Error("The selected schema contributor is unavailable.");
        const document=documentFor(live),result=schemaApi.applyCanonicalCommand(document,command);if(result.status==="applied"||result.status==="rebased"){
          const mutation=command.kind!=="select"&&command.kind!=="view";if(!mutation)contributorUi={...(result.document.selectedPropertyId?{selectedPropertyId:result.document.selectedPropertyId}:{}),view:result.document.view};if(mutation){let next:ProjectState;
            if(command.kind==="policy"&&selected.scope!=="Shared Profile"){
              next=structuredClone(live);const nextSelected=selectionFor(next);if(!nextSelected)throw new Error("The selected schema contributor is unavailable.");
              if(nextSelected.entity.canonicalSchema)nextSelected.entity.canonicalSchema={...nextSelected.entity.canonicalSchema,onlyDefinedFields:result.document.onlyDefinedFields};
              else nextSelected.entity.onlyDefinedFields=result.document.onlyDefinedFields;
            }else if(selected.scope==="Shared Profile")next=controllers.projects.writeUnifiedContributorCanonical(live,selected,result.document);
            else if(selected.collectionKind==="pages"||selected.collectionKind==="propertySets")next=schemaApi.saveComposedCanonicalDocument(live,selected.collectionKind,selected.entity.id,result.document);
            else if(selected.collectionKind==="events")next=schemaApi.saveComposedEventCanonicalDocument(live,selected.entity.id,result.document);
            else if(selected.scope==="Flow Page-instance")next=schemaApi.saveFlowPageInstanceCanonicalDocument(live,selected.flowId!,selected.entity.id,result.document);
            else next=schemaApi.saveEventOccurrenceCanonicalDocument(live,selected.flowId!,selected.entity.id,result.document);
            const label=`${command.kind} canonical schema in ${selected.entity.name}`,committed=controllers.projects.commitUnifiedContributorState(next,label);pendingRevision=committed.revision;schemaContributors.captureProject(next);}}
        return result;},
      settle:()=>pendingRevision===undefined?durable.settled("project"):controllers.projects.settleUnifiedContributorRevision(initial.project.id,pendingRevision),
      settles:(command)=>command.kind!=="select"&&command.kind!=="view",
      onUndo:()=>durable.canUndo(initial.project.id)?durable.undo(initial.project.id):"No page-scoped canonical command is available to Undo.",
      onRedo:()=>durable.canRedo(initial.project.id)?durable.redo(initial.project.id):"No page-scoped canonical command is available to Redo.",
      actions:[{label:"Close editor",run:()=>controllers.schemas.closeCanonical()}]});
  };
  const commitProject=(next:ProjectState,expectedRevision:number,label:string):{status:"saved"|"conflict";revision:number}=>{
    const base=currentProject(),result=schemaApi.commitCanonicalProjectState(projectStorage,next,{expectedRevision,pendingLabel:label,...(base?{base}:{})});
    return result.status==="conflict"?{status:"conflict",revision:result.revision}:{status:"saved",revision:result.revision};};
  const eventSchemas=createEventLibrarySchemaCoordination({schemas:{schemas:()=>controllers.schemas.schemas(),
    validateAgainstSchema:(event,schemaId)=>controllers.schemas.validateAgainstSchema(event,schemaId),
    openSchemaFromSource:(source)=>controllers.schemas.openSchemaFromSource(source)}});
  const reviewEventLibraryTestCase=createEventLibraryTestCaseCoordination({projects:projectRecords,activeProjectId,
    ensureProject:durable.ensureProject,settle:durable.settled,
    load:async(projectId)=>{await durable.ensureProject(projectId);const loaded=await durable.repository.loadProject(projectId);return{state:loaded.state,revision:loaded.draftSequence};},
    commit:commitProject,
    capture:(next,revision)=>projectLibraryUi.captureActiveProject(next,revision),
    route:(projectId,id)=>{const routed=schemaApi.recordProjectNavigation(projectLibraryUi.library(),projectId,{kind:"fixtures",id});projectStorage.setItem(schemaApi.PROJECT_LIBRARY_STORAGE_KEY,schemaApi.serializeProjectLibrary(routed));},
    openStudio:(projectId,id)=>{globalThis.open(`specification-builder.html?project=${encodeURIComponent(projectId)}&kind=fixtures&entity=${encodeURIComponent(id)}&source=event-library`,"_blank");},
    repair:(projectId,kind)=>{globalThis.open(`specification-builder.html?project=${encodeURIComponent(projectId)}&kind=${kind}&route=add&source=event-library`,"_blank");},
    createId:(kind)=>`${kind}:${crypto.randomUUID()}`});
  const tabSubscriptions=<T extends (...args:never[])=>void>(event:{addListener(listener:T):void;removeListener(listener:T):void}|undefined,listener:T):(()=>void)=>{
    event?.addListener(listener);return()=>event?.removeListener(listener);};
  const targetFromTab=(tab:chrome.tabs.Tab):CaptureTargetTab|undefined=>tab.id===undefined||tab.windowId===undefined||!tab.url?undefined:{tabId:tab.id,windowId:tab.windowId,
    pageUrl:tab.url,title:tab.title??tab.url,activeTab:tab.active,currentWindow:tab.highlighted};
  const defectNavigation=(selected:LiveEvent,action:()=>HTMLButtonElement|null)=>defectApi.createLiveDefectReportNavigation(selected.id,{
    reopenCapturedEvent:(id:string)=>controllers.capture.openInspector(id,true),createDefectReportAction:action,
    closeToLiveFeed:()=>controllers.capture.closeInspector(),
  });
  const guidedCapturedEvent=(event:LiveEvent)=>({id:event.id,sourceId:event.sourceId,name:event.name,payload:event.payload??{},rawInput:event.rawInput??[],
    ...(event.pageUrl?{pageUrl:event.pageUrl}:{})});
  const startValidationDefectReport=(selected:LiveEvent):void=>{const inspector=liveElements.eventInspector;if(!inspector)return;
    defectApi.renderDefectReportBuilder(inspector,selected,undefined,controllers.capture.state().observer.events,
      defectNavigation(selected,()=>liveElements.eventInspector?.querySelector<HTMLButtonElement>("#live-inspector-action-create-defect-report")??null),{
        save:async(report,options)=>{const selectedPointers=new Set(report.evidence.validation.map(({pointer}:{pointer:string})=>pointer));
          const issues=defectApi.currentDefectIssues(selected).filter((issue:{concretePath:string})=>selectedPointers.has(issue.concretePath));
          const defect=defectApi.createValidationDefect({id:`defect:${crypto.randomUUID()}`,now:new Date().toISOString(),report,issues});
          const result=controllers.defects.add(defect,options.saveSeparately);if(result.added&&selected.manualFlowContext)controllers["live-flow-testing"].attachDefect(
            selected.manualFlowContext.selectedStepId,selected.manualFlowContext.eventId,defect.id);
          if(options.copy&&navigator.clipboard?.writeText)await navigator.clipboard.writeText(defectApi.renderJiraReport(report).text);
          return result.added?{feedback:options.copy?"Defect saved and copied for Jira Cloud.":"Defect saved."}:{feedback:"A reported defect already matches the selected issue.",
            existing:result.existing.map((candidate:ReportedDefect)=>({id:candidate.id,label:String(candidate.report?.summary??candidate.id)}))};},
        openExisting:(id:string)=>controllers.defects.open(id),updateExisting:(id:string,report:unknown)=>{controllers.defects.edit(id,{report});controllers.defects.open(id);},
      });};
  const startOccurrenceDefectReport=(selected:LiveEvent,mode:Parameters<typeof defectApi.renderOccurrenceDefectReportBuilder>[2]):void=>{
    const inspector=liveElements.eventInspector;if(!inspector)return;
    defectApi.renderOccurrenceDefectReportBuilder(inspector,selected,mode,controllers.schemas.schemas(),controllers.capture.state().observer.events,undefined,
      defectNavigation(selected,()=>liveElements.eventInspector?.querySelector<HTMLButtonElement>(`#live-inspector-action-report-${mode==="Unexpected event"?"unexpected-event":"wrong-event-name"}`)??null),{
        save:async(report,options)=>{const defect=defectApi.createOccurrenceDefect({id:`defect:${crypto.randomUUID()}`,now:new Date().toISOString(),report});
          const result=controllers.defects.add(defect,options.saveSeparately);if(options.copy&&navigator.clipboard?.writeText)await navigator.clipboard.writeText(defectApi.renderOccurrenceReport(report).text);
          return result.added?{feedback:options.copy?"Occurrence defect saved and copied for Jira Cloud.":"Occurrence defect saved."}:{feedback:"A reported occurrence defect already matches this event.",
            existing:result.existing.map((candidate:ReportedDefect)=>({id:candidate.id,label:String(candidate.report?.summary??candidate.id)}))};},
        openExisting:(id:string)=>controllers.defects.open(id),updateExisting:(id:string,report:unknown)=>{controllers.defects.edit(id,{report});controllers.defects.open(id);},
      });};
  const transportPersistence=createInstalledTransportPersistence({
    currentProject,storage:projectStorage,durable,capture:(state,revision)=>projectLibraryUi.captureActiveProject(state,revision),
  });
  const startupProjectId=activeProjectId();
  if(startupProjectId)await durable.ensureProject(startupProjectId);
  await transportPersistence.sources.load().catch(()=>undefined);
  const captureObserverRuntime:CaptureObserverRuntimePorts={
    startSource:startObservationSourceSubscription,
    read:({tabId,pageUrl,historyPath,pageLoadId})=>tabPageObservation(tabId,pageUrl,historyPath,pageLoadId),
    startPush:({tabId,historyPath,onSnapshot,onEntry})=>captureApi.startLiveHistoryPushCapture({...(tabId===undefined?{}:{tabId}),historyPath,onSnapshot,onEntry}),
    present:(event,destination)=>{const source=controllers.capture.state().observer.sources.find(({id})=>id===event.sourceId),validation=controllers.schemas.validate({sourceId:event.sourceId,eventName:event.name,payload:event.payload,rawInput:event.rawInput});
      return{...event,validation:validation.state,validationDetails:{issues:validation.issues,evaluations:validation.evaluations??[],...(validation.schema?{schema:validation.schema}:{}),...(validation.documentation?{documentation:validation.documentation}:{}),...(validation.assignment?{assignment:validation.assignment}:{})},sourceName:event.sourceName??source?.name??event.sourceId,...(destination?{destination}:{})};},
    recordCapture:({sessionId,pageUrl,sourceId,rawValue})=>schemaApi.recordSpecificationCapture(dataStorage,{sessionId,pageUrl,sourceId,rawValue}),
    recordNavigation:({sessionId,pageUrl})=>schemaApi.recordSpecificationNavigation(dataStorage,{sessionId,pageUrl}),
    subscribeTabUpdated:(listener)=>tabSubscriptions(chromeApi()?.tabs?.onUpdated,((tabId:number,change:chrome.tabs.TabChangeInfo,tab:chrome.tabs.Tab)=>listener(tabId,{...(["loading","complete"].includes(change.status??"")?{status:change.status as "loading"|"complete"}:{}),...(change.url?{url:change.url}:{})},{...(tab.url?{url:tab.url}:{}),...(tab.title?{title:tab.title}:{})})) as never),
    subscribeTabRemoved:(listener)=>tabSubscriptions(chromeApi()?.tabs?.onRemoved,listener as never),
    subscribePermissionsRemoved:(listener)=>tabSubscriptions(chromeApi()?.permissions?.onRemoved,((permissions:chrome.permissions.Permissions)=>listener(permissions.origins??[])) as never),
  };
  const controllerPorts:InstalledDataLayerControllerPorts={
    capture:{root,storage:dataStorage,
      sourceConfiguration:()=>controllers?.["project-event-transport"].sourceConfiguration(),
      sourceStatus:(source,status)=>controllers?.["project-event-transport"].sourceSettings?.status(source,status),
      initialPageUrl:()=>globalThis.location.href,initialSources:()=>[{id:"history",name:"History array",status:"Disconnected"}],
      presentEvent:(event)=>controllers.defects.triage(event),
      sessionStart:createObservationSessionStart({targets:()=>controllers.capture.state().targets,
        projectId:()=>currentProject()?.project.id,configuration:()=>controllers["project-event-transport"].sourceConfiguration(),
        readiness:()=>controllers["project-event-transport"].sourceSettings?.readiness(),
        path:()=>controllers["project-event-transport"].currentObservationHistoryPath()}),
      changed:()=>{},runCommand:(id)=>{void shell.runDataLayerCommand({commandId:id,message:`${id} ran`}).catch((error:unknown)=>{
        const message=root.querySelector<HTMLElement>("#live-session-message");
        if(message)message.textContent=error instanceof Error?error.message:String(error);
      });},
      setLiveSessionMessage:(message)=>{const node=root.querySelector<HTMLElement>("#live-session-message");if(node)node.textContent=message;},
      observerRuntime:captureObserverRuntime,
      observation:{discover:async(scope)=>{const tabs=await chromeApi().tabs.query(scope==="current"?{active:true,currentWindow:true}:{});return tabs.flatMap((tab)=>{const value=targetFromTab(tab);return value?[value]:[];});},
        requestTabsAccess:async()=>chromeApi().permissions?await chromeApi().permissions.request({permissions:["tabs"]}):false,
        requestOriginAccess:async(origin)=>chromeApi().permissions?await chromeApi().permissions.request({origins:[`${origin}/*`]}):false,
        probe:(target,path,pageLoadId)=>captureObserverRuntime.read({tabId:target.tabId,pageUrl:target.pageUrl,historyPath:path,pageLoadId}),
        render:(targets,actions)=>{const elements=captureApi.findObservationTargetElements(root);captureApi.renderObservationTargetPicker(elements,targets,{
          select:(target)=>actions.select(target.id),requestAccess:(target)=>actions.requestAccess(target.id)});}},
      savedSessions:{now:()=>new Date().toISOString(),readImportFile:async()=>root.querySelector<HTMLInputElement>("#saved-session-file")?.files?.[0]?.text(),
        download:(name,serialized)=>download(`${name}.json`,serialized),validate:(event)=>{const result=controllers.schemas.validate({sourceId:event.sourceId,eventName:event.name,payload:event.payload,rawInput:event.rawInput});return{state:result.state,...(result.schema?{schema:{name:result.schema.name,version:result.schema.version}}:{})};},
        render:(sessions,actions)=>renderInstalledSavedSessionList(root.querySelector<HTMLElement>("#saved-session-list"),sessions,actions),flowTests:()=>controllers["live-flow-testing"].state().completed as unknown as CompletedLiveFlowTest[],openFlowTesting:()=>{void controllers["live-flow-testing"].begin();},resetFlowTesting:()=>controllers["live-flow-testing"].reset(),
        createReplaySequence:(session)=>{controllers.replay.createFromSession(session.id,session.name,session.events.map(({id})=>id));}},
      savedFilters:{createId:()=>`filter:${crypto.randomUUID()}`,render:(events,query,controls,update)=>{const host=root.querySelector<HTMLElement>("#live-event-query");
        if(host)liveApi.renderEventFeedQueryBuilder(host,events,query,update,controls);},dispose:()=>{}},
      inspector:{splitView:()=>globalThis.innerWidth>=700,capturePresentation:()=>{
        const snapshot=liveApi.captureLiveInspectorPresentation(liveElements.eventInspector),focused=root.activeElement;
        if(focused instanceof HTMLElement&&liveElements.eventInspector?.contains(focused))return snapshot;
        const{focusedId:_focusedId,focusedPropertyPath:_focusedPropertyPath,...withoutExternalFocus}=snapshot;return withoutExternalFocus;},
        restorePresentation:(snapshot)=>{if(snapshot){const properties=liveElements.eventInspector?.querySelector<HTMLElement>('[aria-label="Properties"]');
          if((properties?.dataset.showNonApplicableProperties==="true")!==snapshot.showNonApplicableProperties)liveElements.eventInspector?.querySelector<HTMLButtonElement>("#live-non-applicable-properties")?.click();}
          liveApi.restoreLiveInspectorPresentation(liveElements.eventInspector,snapshot);},
        restoreReturn:(snapshot)=>liveApi.restoreInspectorReturnUi(liveElements,snapshot),render:(event)=>{liveApi.renderLiveInspector(liveElements,event,
          liveApi.createLiveInspectorActions(createInstalledLiveInspectorCoordination({currentPageUrl:()=>controllers.capture.state().observer.pageUrl,
            writeClipboard:async(text)=>navigator.clipboard.writeText(text),storeTemplate:(template)=>controllers["event-library"].store(template),
            defaultDestination:()=>controllers["project-event-transport"].state().pushPath,
            onTemplateSaved:(template)=>controllers["event-library"].appendOpenInLibraryAction(event.id,template.name),
            schemas:{create:(selected)=>controllers.schemas.openSchemaFromSource({name:selected.name,sourceId:selected.sourceId,eventName:selected.name,payload:selected.payload,label:"Live event"}),
              createValidation:(selected)=>{void controllers.schemas.openGuidedEvent(guidedCapturedEvent(selected));},
              addPropertyValidation:(selected,path)=>{guidedLivePropertyReturn={eventId:selected.id,path,
                expanded:Array.from(liveElements.eventInspector?.querySelectorAll<HTMLDetailsElement>("details[open][data-property-path]")??[],({dataset})=>dataset.propertyPath!).filter(Boolean),
                inspectorScroll:liveElements.eventInspector?.scrollTop??0,feedScroll:liveElements.eventFeed?.scrollTop??0};
                void controllers.schemas.openGuidedLiveProperty(guidedCapturedEvent(selected),path);},
              addPropertyToSchema:(selected,path,trigger)=>{controllers.schemas.openLivePropertyDeclaration(guidedCapturedEvent(selected),path,trigger);},
              propertyDeclaration:(selected,path)=>controllers.schemas.livePropertyDeclaration(guidedCapturedEvent(selected),path),
              expandAllowedValue:(selected,evaluation,trigger)=>{const assignedSchemaId=selected.validationDetails?.schema?.id??evaluation.schemaId;
                if(assignedSchemaId)controllers.schemas.openAllowedValueExpansionReview(selected.id,assignedSchemaId,evaluation,trigger);},
              draftContinuation:(selected)=>controllers.schemas.guidedContinuation(guidedCapturedEvent(selected)),
              validationAvailable:(selected)=>controllers.schemas.liveValidationAvailable(guidedCapturedEvent(selected)),
              validationState:(selected)=>controllers.schemas.validateLive(guidedCapturedEvent(selected)).state,manualSchemaChoices:()=>controllers.schemas.liveSchemaChoices(),
              selectManualSchema:(eventId,schemaId)=>controllers.schemas.setManualSchemaOverride(eventId,schemaId)},
            defects:{startValidationReport:startValidationDefectReport,startOccurrenceReport:startOccurrenceDefectReport,
              openReported:(defectId,selected,issueIndex)=>controllers.defects.open(defectId,{returnPosition:{eventId:selected.id,issueIndex,listScrollTop:liveElements.eventList?.scrollTop??0}})},
            updateValidation:(eventId,state)=>{const candidate=controllers.capture.state().observer.events.find(({id})=>id===eventId);if(!candidate)return;
              const scroll=liveElements.eventInspector?.scrollTop??0,focusedId=root.activeElement instanceof HTMLElement?root.activeElement.id:"",validation=controllers.schemas.validateLive(guidedCapturedEvent(candidate));
              controllers.capture.updateEvent(eventId,{validation:state,validationDetails:{issues:validation.issues,evaluations:validation.evaluations??[],
                ...(validation.schema?{schema:validation.schema}:{}),...(validation.documentation?{documentation:validation.documentation}:{}),...(validation.assignment?{assignment:validation.assignment}:{})}});
              controllers.capture.openInspector(eventId,true);if(liveElements.eventInspector)liveElements.eventInspector.scrollTop=scroll;if(focusedId)root.getElementById(focusedId)?.focus({preventScroll:true});
              liveApi.setEventValidationUpdateStatus(liveElements,`Validation changed to ${state}.`);},
          })));renderObservationSourceDetails(liveElements.eventInspector,event);if(liveElements.eventInspector)controllers["live-flow-testing"].renderEventDetails(liveElements.eventInspector,event.id);}},
      ui:{historyPath:()=>{const state=controllers["project-event-transport"].state(),status=["Selection required","Waiting for path","Ready","Unavailable"].includes(state.currentTargetPathStatus)?state.currentTargetPathStatus:"Unavailable";return{path:state.observationPath,fieldValue:state.observationPath,status:status as "Selection required"|"Waiting for path"|"Ready"|"Unavailable",generation:state.pathGeneration};},
        chooseObservationTarget:()=>root.querySelector<HTMLButtonElement>("#choose-observation-target")?.click(),browseObservationTargets:()=>root.querySelector<HTMLButtonElement>("#browse-observation-targets")?.click(),
        closeObservationTargetPicker:()=>captureApi.closeObservationTargetPicker(captureApi.findObservationTargetElements(root)),searchObservationTargets:()=>{},cancelDetachTarget:()=>{},confirmDetachTarget:()=>{},
        selectedTargetChanged:(observation)=>{if(observation)controllers["project-event-transport"].applyTargetPathObservation(observation);
          else controllers["project-event-transport"].refreshTargetPath();controllers["event-library"].refreshPushReadiness();if(currentView==="Schemas")showDataLayerView("Live");},
        showDataLayerView,copyPageUrl:()=>{const url=controllers.capture.state().observer.pageUrl;void captureApi.copyLivePageUrl(url,navigator.clipboard?.writeText?.bind(navigator.clipboard));},
        reportMissingEvent:()=>controllers.defects.openMissingEventBuilder("Live")}},
    "event-library":{root,storage:dataStorage,defaultPushPath:()=>controllers["project-event-transport"].state().pushPath,
      push:async(template)=>{const targetState=controllers.capture.state().targets,target=targetState.targets.find(({id})=>id===targetState.selectedTargetId);if(!target)throw new Error("Select a target before pushing.");
        const result=await eventApi.pushSavedTemplateToSelectedTarget(template,target,async(request)=>{const [injection]=await chromeApi().scripting.executeScript({target:{tabId:request.tabId},world:"MAIN",args:[request.destination,request.eventName,request.payload],func:eventApi.pushPayloadInPage});if(!injection?.result?.success)throw new Error(injection?.result?.result??"Push failed");});
        if(!result.success)throw new Error(result.result);const feedback=root.querySelector<HTMLElement>("#event-template-result");if(feedback)feedback.textContent=result.summary;},
      changed:()=>{},createSchema:eventSchemas.createSchema,createTestCase:reviewEventLibraryTestCase,
      appendInspectorAction:(label,activate)=>{const action=root.createElement("button");action.type="button";action.textContent=label;action.addEventListener("click",activate);liveElements.eventInspector?.append(action);return()=>action.remove();},
      openLibrary:()=>showDataLayerView("Library"),announce:(message)=>{const node=root.querySelector<HTMLElement>("#live-session-message");if(node)node.textContent=message;},
      createId:()=>`template:${crypto.randomUUID()}`,downloadExport:(value)=>download("event-library.json",`${JSON.stringify(value,null,2)}\n`),
      readImportFile:async()=>await root.querySelector<HTMLInputElement>("#event-library-file")?.files?.[0]?.text()??"",
      schemas:eventSchemas.schemas,validateDraft:eventSchemas.validateDraft,backToCapturedEvent:()=>showDataLayerView("Live"),
      pushTarget:()=>{const state=controllers.capture.state().targets,target=state.targets.find(({id})=>id===state.selectedTargetId);return target?{id:target.id,tabId:target.tabId,windowId:target.windowId,title:target.title,pageUrl:target.pageUrl,origin:target.origin,accessState:target.accessState}:undefined;},
      checkPushPath:async(target,destination)=>{const [result]=await chromeApi().scripting.executeScript({target:{tabId:target.tabId},world:"MAIN",args:[destination],func:eventApi.pushPathCapabilityInPage});return result?.result?.success?{success:true,message:"Selected-page push path is ready."}:{success:false,message:result?.result?.result??"Push path is not push-capable"};},
      renderPushReview:(host,review)=>eventApi.renderPushDraftReview(host,review),
      renderRevisionReview:(host,review)=>eventApi.renderTemplateChangeReview(host,review)},
    schemas:{root,storage:dataStorage,relationshipViewStorage:storage,changed:()=>{},subscribe:(listener)=>durable.subscribe(({library})=>{
      const projectId=library.activeProjectId,state=projectId?library.projects[projectId]?.state:undefined;if(state)schemaContributors.captureProject(state);listener(projectId);}),blocked:()=>Boolean(durable.failedSchemaSave()),
      createRuleId:()=>`rule:${crypto.randomUUID()}`,capturedAssignmentValue:(target)=>{const state=controllers.capture.state().observer,
        event=state.events.find(({id})=>id===state.inspectorEventId)??state.events.at(-1);return target==="raw input"?event?.rawInput:event?.payload;},renderAssignmentConditions:schemaApi.renderAssignmentDataConditionEditor,
      localRulePromotionDialog:schemaApi.createLocalRulePromotionDialog(),subscribeSchemaPersistence:schemaPersistence.subscribe,
      downloadSchema:(value,filename)=>download(filename,`${JSON.stringify(value,null,2)}\n`),
      relationshipTree:(schemas)=>({projectId:activeProjectId()??"no-project",nodes:schemaApi.projectSchemaRelationshipTree(schemaContributors.currentProject(),schemas)}),
      openProjectLibrary:()=>showDataLayerView("Projects"),openContributor:openSchemaContributor,openContributorInStudio:(key)=>globalThis.open(`specification-builder.html?contributor=${encodeURIComponent(key)}`,"_blank"),
      adoptSavedSchema:()=>{},renderSchemaSpecification:(host,schema,schemas,surface,close)=>schemaApi.renderSchemaSpecificationBuilder(host,schema,schemas,surface,close,{
        writePlain:async(plain:string)=>navigator.clipboard.writeText(plain),
        writeRich:async(html:string,plain:string)=>{
          if(!navigator.clipboard?.write||typeof ClipboardItem==="undefined")throw new Error("Rich clipboard writing is unavailable.");
          await navigator.clipboard.write([new ClipboardItem({
            "text/html":new Blob([html],{type:"text/html"}),
            "text/plain":new Blob([plain],{type:"text/plain"}),
          })]);
        },
      }),reportMissingSchemaEvent:()=>controllers.defects.openMissingEventBuilder("Schemas"),
      showSchemasView:()=>showDataLayerView("Schemas"),scheduleFrame:(callback)=>requestAnimationFrame(callback),restoreGuidedCapture:(id,path,focusAction="validation")=>{
        const snapshot=guidedLivePropertyReturn?.eventId===id?guidedLivePropertyReturn:undefined;
        const restore=()=>{controllers.capture.openInspector(id,true);const inspector=liveElements.eventInspector,feed=liveElements.eventFeed;
          if(snapshot){for(const propertyPath of snapshot.expanded)inspector?.querySelector<HTMLDetailsElement>(`details[data-property-path="${CSS.escape(propertyPath)}"]`)?.setAttribute("open","");
            if(inspector)inspector.scrollTop=snapshot.inspectorScroll;if(feed)feed.scrollTop=snapshot.feedScroll;}
          const action=focusAction==="declaration"?"add-property-to-schema":"add-property-validation";
          const target=Array.from(inspector?.querySelectorAll<HTMLButtonElement>(`button[data-action="${action}"]`)??[])
            .find((button)=>button.dataset.propertyPath===(path??snapshot?.path));
          target?.focus({preventScroll:true});};
        restore();if(schemaRecoveryActive){root.querySelector<HTMLDialogElement>("#durable-storage-recovery")?.close();schemaRecoveryActive=false;
          requestAnimationFrame(()=>{if(snapshot&&guidedLivePropertyReturn!==snapshot)return;restore();if(guidedLivePropertyReturn===snapshot)guidedLivePropertyReturn=undefined;});}
        else queueMicrotask(()=>{if(snapshot&&guidedLivePropertyReturn!==snapshot)return;restore();if(guidedLivePropertyReturn===snapshot)guidedLivePropertyReturn=undefined;});},
      guidedSaved:(message)=>{const status=root.querySelector<HTMLElement>("#live-session-message");if(status)status.textContent=message;},
      activeProjectId,ensureProjectSchemaContributors:schemaContributors.ensureProjectContributors,
      settleCanonical:async()=>{await durable.settled("schema");},mountLayeredProfileEditor:()=>undefined,canonicalConceptSuggestions:()=>{const project=currentProject();return project?schemaApi.projectCanonicalConcepts(project):[];},
      revalidateCurrentLive:(schemas,overrides)=>{const refresh=schemaApi.revalidateCurrentLiveSession(controllers.capture.state().observer,schemas,overrides);
        controllers.capture.replaceObserverState({...refresh.state,events:refresh.state.events.map((event)=>controllers.defects.triage(event))});
        return refresh.revalidatedEventIds.length;},
      prepareCapturedValidationContinuation:createCapturedValidationContinuationCoordination({load:async(record)=>{const projectId=activeProjectId();if(!projectId)return{revision:0};await durable.ensureProject(projectId);const loaded=await durable.repository.loadProject(projectId),captured=controllers.capture.state().observer.events.find(({id})=>id===record.eventId);return{state:loaded.state,revision:loaded.draftSequence,...(captured?{captured:{id:captured.id,sourceId:captured.sourceId,payload:captured.payload}}:{})};},
        settle:durable.settled,ensureProject:durable.ensureProject,loadCurrent:async(projectId)=>{const loaded=await durable.repository.loadProject(projectId);return{state:loaded.state,revision:loaded.draftSequence};},
        commit:commitProject,capture:(next,revision)=>projectLibraryUi.captureActiveProject(next,revision),
        route:(projectId,kind,id)=>{const routed=schemaApi.recordProjectNavigation(projectLibraryUi.library(),projectId,{kind,id});projectStorage.setItem(schemaApi.PROJECT_LIBRARY_STORAGE_KEY,schemaApi.serializeProjectLibrary(routed));},
        openStudio:(projectId,kind,id)=>globalThis.open(`specification-builder.html?project=${encodeURIComponent(projectId)}&kind=${kind}&entity=${encodeURIComponent(id)}`,"_blank"),createId:(kind)=>`${kind}:${crypto.randomUUID()}`})},
    defects:{root,storage:dataStorage,recopy:(defect)=>defectApi.copyStoredDefectForJira(defect,defectApi.browserDefectReportClipboard()).then(({feedback})=>feedback),
      attachCurrentSession:(id)=>coordination.attachCurrentSession(id),openLinkedSession:(id)=>{coordination.openLinkedSession(id);},liveEvents:()=>controllers.capture.state().observer.events,
      showDefectsView:()=>showDataLayerView("Defects"),returnToLive:(position)=>{showDataLayerView("Live");controllers.capture.openInspector(position.eventId);
        if(liveElements.eventList)liveElements.eventList.scrollTop=position.listScrollTop;
        liveElements.eventInspector?.querySelector<HTMLElement>(`.live-reported-defect-link[data-issue-index="${position.issueIndex}"]`)?.focus({preventScroll:true});},
      renderLive:()=>controllers.capture.refreshPresentation(),
      missingEventContext:()=>({events:controllers.capture.state().observer.events,pageUrl:controllers.capture.state().observer.pageUrl}),mountMissingEventBuilder:()=>({close(){}})},
    replay:{root,listTemplates:()=>controllers["event-library"].templates().map(({id,name,payload,version,sourceId,destination})=>({id,name,payload,version,sourceId,destination})),listSources:()=>controllers.capture.state().observer.sources,
      pageUrl:()=>controllers.capture.state().observer.pageUrl},
    projects:{activeProjectId,loadProjects:projectRecords,subscribe:(listener)=>durable.subscribe(()=>listener()),openProject:async(id)=>{projectLibraryUi.activate(id);await durable.settled();},
      navigateToProjectArea:(area)=>{showDataLayerView("Projects");if(area==="create")root.querySelector<HTMLButtonElement>("#create-library-project")?.click();},
      adoptSavedSchema:async()=>{},projectStorage,settleProjectCommand:async()=>{await durable.settled();},captureProject:(state,revision)=>projectLibraryUi.captureActiveProject(state,revision)},
    "durable-projects":{root,startRepository:async()=>durable.subscribe(()=>{}),migration:()=>durable.migration.status==="migrated"
      ? {status:"none"} : durable.migration as ReturnType<DurableProjectsInstalledPorts["migration"]>,resolveMigration:durable.resolveMigration,
      readLegacySource:(key)=>storage.getItem(key),downloadMigrationSources:(name,value)=>download(name,value),reload:()=>globalThis.location.reload(),reviewMigration:async()=>{},
      retryFailedSave:durable.retryFailedSave,rejectFailedSave:()=>durable.resolveFailedSave("reject"),storageRecoveryClosed:()=>{},subscribeSaveFailed:()=>()=>{},saveFailed:()=>{}},
    "project-event-transport":{root,...transportPersistence,
      sourceConfigurationChanged:()=>controllers.capture.sourceConfigurationChanged(),
      settleTransport:durable.settled,readTargetObservation:async(path)=>{const state=controllers.capture.state().targets,target=state.targets.find(({id})=>id===(state.attachedTargetId??state.selectedTargetId));return target?captureObserverRuntime.read({tabId:target.tabId,pageUrl:target.pageUrl,historyPath:path,pageLoadId:`tab:${target.tabId}:transport`}):undefined;},
      applyLiveTargetPathObservation:(observation)=>controllers.capture.applyTargetPathObservation(observation),
      renderTargetReadiness:()=>controllers.capture.refreshPresentation(),projectName:()=>currentProject()?.project.name},
    "live-flow-testing":{root,activeProject:async()=>{const id=activeProjectId();if(!id)return;await durable.ensureProject(id);return(await durable.repository.loadProject(id)).state;},
      events:()=>controllers?.capture.state().observer.events??[],saveSummary:()=>{},savedSummary:()=>{const library=liveApi.restoreSavedSessionLibrary(dataStorage.getItem(liveApi.SAVED_SESSION_LIBRARY_STORAGE_KEY));
        return liveApi.restoreSavedSessionLiveFeed(dataStorage.getItem(liveApi.SAVED_SESSION_LIVE_FEED_STORAGE_KEY),library)?.session.flowTests?.at(-1);},onResult:(entry,event)=>{
        controllers.capture.updateEvent(event.id,liveApi.createManualFlowDefectEvent(entry,event as LiveEvent));controllers.capture.openInspector(event.id,true);},
      openProject:()=>{showDataLayerView("Projects");root.querySelector<HTMLInputElement>("#project-library-search")?.focus({preventScroll:true});},createProject:()=>{showDataLayerView("Projects");root.querySelector<HTMLButtonElement>("#create-library-project")?.click();},
      id:()=>`live-flow:${crypto.randomUUID()}`,now:()=>new Date().toISOString(),subscribe:(listener)=>durable.subscribe(()=>listener())},
  };
  const bundle=createInstalledDataLayerControllers(controllerPorts);controllers=bundle.controllers;
  const coordination=createDefectCaptureCoordination({capture:controllers.capture,defects:controllers.defects});
  const allCommands=[...paletteApi.commandsForUtilityShell(paletteApi.listCommands(),registryApi.extensionShell.commands)];
  let shell!:ReturnType<typeof createInstalledSidePanelShellController>;
  const workspaceTabs=workspaceNavigation??tabApi.createWorkspaceTabsController({storage:foundation.shellStorage,tabList:foundation.workspaceTabList,root,pageLifecycle:globalThis});
  const palette=paletteApi.createPaletteController({commands:allCommands,executeCommand:(command)=>paletteApi.runCommandById(command.id,shell.commandContext),
    elements:{root:root.querySelector<HTMLElement>("#side-panel-root"),launcher:foundation.openPaletteButton,palette:foundation.palette,filter:foundation.paletteFilter,results:foundation.paletteResults,sidePanelContent:foundation.sidePanelContent},ownerDocument:root});
  const hotkeys=hotkeyApi.createInstalledHotkeyController({commands:allCommands,storage:foundation.hotkeyStorage,
    elements:{root:root.querySelector<HTMLElement>("#side-panel-root"),createButton:foundation.createKeymapButton,updateButton:foundation.updateKeymapButton,loadButton:foundation.loadKeymapButton,fileInput:foundation.keymapFileInput,status:foundation.keymapStatus,warning:foundation.keymapWarning,editorContainer:foundation.hotkeyEditorCommands,editorFilter:foundation.hotkeyEditorFilter},
    documentEvents:root,pageLifecycle:globalThis,download:({filename,contents,type})=>{download(filename,contents,type);return()=>{};},
    executeCommand:(id)=>paletteApi.runCommandById(id,shell.commandContext),shellClaimsKey:()=>false,
    ignoresTarget:(target)=>target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target instanceof HTMLSelectElement||(target instanceof HTMLElement&&target.isContentEditable)});
  shell=createInstalledSidePanelShellController({commands:allCommands,pageLifecycle:globalThis,commandLog:foundation.commandLog,palette,workspaceTabs,hotkeys,
    captureCommands:{startTesting:controllers.capture.begin,endTesting:async()=>controllers.capture.end(),chooseObservationTarget:controllers.capture.discoverTargets,
      attachSelectedTarget:controllers.capture.attachTarget,detachObservationTarget:controllers.capture.beginDetachTarget},showDataLayerView:(view)=>showDataLayerView(view)});
  const lifecycle=createInstalledDataLayerLifecycle({...controllers});
  await controllers["project-event-transport"].sourceSettings?.refresh();
  let runtimeMounted=false, stopDurableCoordination:(()=>void)|undefined;
  return{mount(){if(runtimeMounted)return;runtimeMounted=true;shell.mount();lifecycle.mount();
      stopDurableCoordination=durable.subscribe(()=>controllers["project-event-transport"].synchronizeProjectPaths());
      void durable.settled().then(()=>{if(runtimeMounted)controllers["project-event-transport"].synchronizeProjectPaths();});
      showDataLayerView(currentView);foundation.app?.setAttribute("aria-label","TWAtility Belt");
      const panel=root.querySelector<HTMLElement>("#side-panel-root");if(panel){panel.dataset.chromeApiCapabilities="installed-runtime";panel.dataset.utilityShellReady="true";}},
    dispose(){if(!runtimeMounted)return;runtimeMounted=false;stopDurableCoordination?.();stopDurableCoordination=undefined;lifecycle.dispose();schemaPersistence.dispose();
      guidedLivePropertyReturn=undefined;shell.dispose();}};
}
import { listCommands } from "../utilities/command-palette/index.js";
import { bindUtilityPanels, mountUtilityShell, renderUtilityDirectory } from "../platform/utility-shell-dom.js";
import { createUtilityStorage } from "../platform/utility-storage.js";
import { installDurableRepositoryStartupFailure, mountDurableProjectRepositoryUi, openDurableProjectRuntime,
  SCHEMA_LIBRARY_STORAGE_KEY } from "../utilities/data-layer/schemas.js";
