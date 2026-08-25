import { createCaptureInstalledController, renderInstalledSavedSessionList } from "./capture/index.js";
import { createDefectsInstalledController } from "./defects/index.js";
import { createDurableProjectsInstalledController } from "./durable-projects/index.js";
import { createEventLibraryInstalledController } from "./event-library/index.js";
import { createLiveFlowTestingInstalledController } from "./live-flow-testing/index.js";
import { createProjectEventTransportInstalledController } from "./project-event-transport/index.js";
import { createProjectsInstalledController } from "./projects/index.js";
import { createReplayInstalledController } from "./replay/index.js";
import { createSchemasInstalledController } from "./schemas/index.js";
import { attachSavedSessionToDefect } from "../utilities/data-layer/defect-reporting.js";
import { applyCapturedValidationToProfile, capturedValidationDestinationChoices, capturedValidationProfileRequirements, createFixtureFromCapturedValidation, transactProject } from "../utilities/data-layer/schemas.js";
import { createGuidedTestCase } from "../data-layer-guided-test-cases.js";
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
];
export function createChromeRuntimeMessagePort(runtimeMessages) {
    return {
        addListener: (listener) => runtimeMessages.addListener(listener),
        removeListener: (listener) => runtimeMessages.removeListener(listener),
    };
}
export function createInstalledSidePanelShellController(ports) {
    const allCommands = [...ports.commands];
    const paletteController = ports.palette;
    const workspaceTabsController = ports.workspaceTabs;
    const hotkeyController = ports.hotkeys;
    let mounted = false;
    async function recordDataLayerCommandRun(entry) {
        if (entry.commandId === "data-layer.start-testing")
            await ports.captureCommands.startTesting();
        if (entry.commandId === "data-layer.end-testing")
            await ports.captureCommands.endTesting();
        if (entry.commandId === "data-layer.choose-observation-target")
            await ports.captureCommands.chooseObservationTarget();
        if (entry.commandId === "data-layer.attach-selected-target")
            await ports.captureCommands.attachSelectedTarget();
        if (entry.commandId === "data-layer.detach-observation-target")
            ports.captureCommands.detachObservationTarget();
    }
    function recordCommandRun(entry) {
        void recordDataLayerCommandRun(entry);
        if (ports.commandLog)
            ports.commandLog.textContent = entry.message;
    }
    function showWorkspace(tab, focus = false) {
        workspaceTabsController.show(tab, focus);
    }
    const commandRunContext = {
        record: recordCommandRun,
        showWorkspace,
        showDataLayerView: ports.showDataLayerView,
    };
    const pageHidden = () => paletteController.dispose();
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            workspaceTabsController.mount();
            hotkeyController.mount();
            paletteController.mount();
            ports.pageLifecycle.addEventListener("pagehide", pageHidden, { once: true });
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            ports.pageLifecycle.removeEventListener("pagehide", pageHidden);
            paletteController.dispose();
            hotkeyController.dispose();
            workspaceTabsController.dispose();
        },
        commandContext: commandRunContext,
        runDataLayerCommand: recordDataLayerCommandRun,
        commands: () => allCommands,
        runCommand: (id) => {
            const command = allCommands.find((candidate) => candidate.id === id);
            if (!command)
                throw new Error(`Unknown installed command ${id}`);
            command.run(commandRunContext);
        },
    };
}
export function installDurableProjectCoordinationSubscription(durableProjectRuntime, ports) {
    return durableProjectRuntime.subscribe(({ active }) => {
        ports.renderProjectEventTransport();
        if (!active?.state)
            return;
        ports.renderSchemas();
        ports.renderSchemaWorkflowRows();
        ports.renderCompactCanonicalEditor();
        ports.renderLayeredProfileEditor();
    });
}
export async function createInstalledSidePanelRuntimeFoundation(root = document, storage = globalThis.localStorage) {
    const { extensionShell, utilityRegistry } = await import("../utility-registry.js");
    const app = root.querySelector("#app");
    const panelRoot = root.querySelector("#side-panel-root");
    const utilityDirectory = root.querySelector("#utility-directory");
    const utilityStorageContract = (id) => {
        const contract = utilityRegistry.find((utility) => utility.id === id)?.storage;
        if (!contract)
            throw new Error(`Missing utility storage contract: ${id}`);
        return contract;
    };
    if (panelRoot)
        mountUtilityShell(extensionShell, panelRoot, window);
    if (utilityDirectory)
        renderUtilityDirectory(utilityRegistry, utilityDirectory);
    bindUtilityPanels(utilityRegistry, root);
    const durableProjectRuntime = await openDurableProjectRuntime(storage).catch((error) => {
        installDurableRepositoryStartupFailure(root, error);
        return new Promise(() => { });
    });
    await mountDurableProjectRepositoryUi(root, globalThis.indexedDB, durableProjectRuntime.repository);
    const projectStorage = durableProjectRuntime.storage;
    const scopedDataLayerStorage = createUtilityStorage(storage, utilityStorageContract("data-layer"));
    const dataLayerStorage = {
        get length() { return scopedDataLayerStorage.length; },
        clear() { scopedDataLayerStorage.clear(); projectStorage.removeItem(SCHEMA_LIBRARY_STORAGE_KEY); },
        key: (index) => scopedDataLayerStorage.key(index),
        getItem: (key) => key === SCHEMA_LIBRARY_STORAGE_KEY ? projectStorage.getItem(key) : scopedDataLayerStorage.getItem(key),
        setItem(key, value) { if (key === SCHEMA_LIBRARY_STORAGE_KEY)
            projectStorage.setItem(key, value);
        else
            scopedDataLayerStorage.setItem(key, value); },
        removeItem(key) { if (key === SCHEMA_LIBRARY_STORAGE_KEY)
            projectStorage.removeItem(key);
        else
            scopedDataLayerStorage.removeItem(key); },
    };
    const hotkeyStorage = createUtilityStorage(storage, utilityStorageContract("hotkeys"));
    const shellStorage = createUtilityStorage(storage, { namespace: "my-chrome-utilities.shell", version: 1,
        legacyKeys: ["my-chrome-utilities.workspace-tab.v1"] });
    const sidePanelContent = root.querySelector("#side-panel-content");
    const commandLog = root.querySelector("#command-log");
    const openPaletteButton = root.querySelector("#open-palette");
    const palette = root.querySelector("#palette");
    const paletteFilter = root.querySelector("#palette-filter");
    const paletteResults = root.querySelector("#palette-results");
    const createKeymapButton = root.querySelector("#create-keymap");
    const updateKeymapButton = root.querySelector("#update-keymap");
    const loadKeymapButton = root.querySelector("#load-keymap");
    const keymapFileInput = root.querySelector("#keymap-file");
    const keymapStatus = root.querySelector("#keymap-status");
    const keymapWarning = root.querySelector("#keymap-warning");
    const workspaceTabList = root.querySelector("#workspace-tabs");
    const hotkeyEditorFilter = root.querySelector("#hotkey-editor-filter");
    const hotkeyEditorCommands = root.querySelector("#hotkey-editor-commands");
    return { app, sidePanelContent, commandLog, openPaletteButton, palette, paletteFilter, paletteResults,
        createKeymapButton, updateKeymapButton, loadKeymapButton, keymapFileInput, keymapStatus, keymapWarning,
        workspaceTabList, hotkeyEditorFilter, hotkeyEditorCommands,
        dataLayerStorage, hotkeyStorage, shellStorage, durableProjectRuntime };
}
export function createInstalledDataLayerControllers(ports) {
    const controllers = {
        capture: createCaptureInstalledController(ports.capture),
        "event-library": createEventLibraryInstalledController(ports["event-library"]),
        schemas: createSchemasInstalledController(ports.schemas),
        defects: createDefectsInstalledController(ports.defects),
        replay: createReplayInstalledController(ports.replay),
        projects: createProjectsInstalledController(ports.projects),
        "durable-projects": createDurableProjectsInstalledController(ports["durable-projects"]),
        "project-event-transport": createProjectEventTransportInstalledController(ports["project-event-transport"]),
        "live-flow-testing": createLiveFlowTestingInstalledController(ports["live-flow-testing"]),
    };
    return { controllers, lifecycle: createInstalledDataLayerLifecycle(controllers) };
}
export function createDefectCaptureCoordination(owners, now = () => new Date().toISOString()) {
    return {
        attachCurrentSession(defectId) {
            const draft = owners.capture.currentSessionDraft();
            const result = attachSavedSessionToDefect(owners.defects.library(), owners.capture.savedSessions(), defectId, draft.completed, `Evidence for ${defectId}`, now());
            owners.defects.replace(result.library);
            owners.capture.replaceSavedSessions(result.savedSessions);
        },
        openLinkedSession(defectId) {
            const defect = owners.defects.library().defects.find(({ id }) => id === defectId);
            if (!defect?.savedSession || !owners.capture.openSavedSession(defect.savedSession.id))
                return false;
            const matching = owners.defects.matchingEvent(defect);
            if (matching)
                owners.capture.openInspector(matching.id);
            return true;
        },
    };
}
export function createEventLibrarySchemaCoordination(owners) {
    return {
        schemas: () => owners.schemas.schemas(),
        validateDraft: (draft) => owners.schemas.validateAgainstSchema({ sourceId: draft.sourceId, eventName: draft.eventName,
            payload: structuredClone(draft.payload), rawInput: [] }, draft.schemaId),
        createSchema: (template) => {
            owners.schemas.openSchemaFromSource({ name: template.name, sourceId: template.sourceId, eventName: template.eventName,
                payload: structuredClone(template.payload), label: "Library template" });
        },
    };
}
export function createEventLibraryTestCaseCoordination(ports) {
    return async (template) => {
        const mapping = async (projectId) => {
            await ports.ensureProject(projectId);
            await ports.settle();
            const { state } = await ports.load(projectId), project = state.project;
            const events = project.collections.events.filter(({ eventName, sourceId }) => eventName === template.eventName && sourceId === template.sourceId).map(({ id, name }) => ({ id, name }));
            const profiles = project.collections.profiles.filter((profile) => profile.id === template.schemaId ||
                profile.sourceIdentity === template.schemaId ||
                profile.canonicalSchema?.source?.identity === template.schemaId)
                .map(({ id, name, revision, canonicalSchema }) => ({ id, name,
                revision: Number(canonicalSchema?.revision ?? revision ?? 1) }));
            return { summary: events.length && profiles.length
                    ? `${template.name} revision ${template.version} will be copied as typed input with exact source provenance.`
                    : `No mapping was guessed. ${events.length ? "" : "Create or select a matching Event. "}${profiles.length ? "" : "Adopt or select the attached schema in this project."}`,
                events, profiles };
        };
        const activeProjectId = ports.activeProjectId();
        return { projects: ports.projects().map((project) => ({ ...project })), ...(activeProjectId ? { activeProjectId } : {}),
            refresh: mapping, repair: ports.repair,
            commit: async ({ projectId, eventId, profileId }) => {
                await ports.ensureProject(projectId);
                await ports.settle();
                const loaded = await ports.load(projectId), profile = loaded.state.project.collections.profiles.find(({ id }) => id === profileId);
                if (!eventId || !profile)
                    throw new Error("Review a matching Event and input-guidance schema before creating the Test case.");
                const testCase = createGuidedTestCase({ name: template.name, testType: "event-validation", eventId,
                    source: { kind: "event-library", id: template.id, revision: String(template.version), eventId, destination: template.destination,
                        payload: structuredClone(template.payload), schemaId: profile.id,
                        schemaRevision: String(profile.canonicalSchema?.revision ?? profile.revision ?? 1) },
                    id: ports.createId });
                const label = `Create Test case from Event Library ${template.name}`;
                const next = transactProject(loaded.state, label, (project) => ({ ...project, collections: { ...project.collections,
                        fixtures: [...project.collections.fixtures, testCase] } }));
                const result = ports.commit(next, loaded.revision, `Create Test case from ${template.name}`);
                if (result.status === "conflict")
                    throw new Error("The selected project changed; review the Test case mapping again.");
                ports.capture(next, result.revision);
                ports.route(projectId, testCase.id);
                await ports.settle();
                ports.openStudio(projectId, testCase.id);
            } };
    };
}
export function createCapturedValidationContinuationCoordination(ports) {
    return async (record) => {
        let loaded;
        try {
            loaded = await ports.load(record);
        }
        catch (error) {
            throw new Error(`Captured continuation could not load the active project. ${error instanceof Error ? error.message : String(error)}`);
        }
        const captured = loaded.captured;
        if (!loaded.state)
            throw new Error("Create or open a Specification Project before continuing captured validation.");
        const project = loaded.state.project;
        if (!captured || !record.schemaId || !record.evaluated)
            throw new Error("Recheck the captured event with the project evaluator before continuing.");
        if (!project.collections.assignments.some(({ id, targetId }) => id === record.assignmentId && targetId === record.schemaId)) {
            throw new Error(`Add ${record.schemaName ?? "the validated contributor"} to ${project.name} before creating its Test case.`);
        }
        const evaluated = structuredClone(record.evaluated);
        const choices = capturedValidationDestinationChoices(project, { eventName: record.eventName, sourceId: captured.sourceId });
        const requirements = capturedValidationProfileRequirements(project, { captureId: record.eventId, contributorId: record.schemaId, evaluated });
        if (!choices.events.length)
            throw new Error(`Add the ${record.eventName} Event to ${project.name} before continuing.`);
        return { projectName: project.name,
            summary: `${record.eventName} · ${record.state} · ${record.schemaName} revision ${record.schemaVersion} → ${project.name}.`,
            review: `Evaluated result ${evaluated.resultIdentity}. Proposed reviewed expectations: outcome ${evaluated.issueDetails.length ? "Invalid" : "Valid"}; issue paths and codes ${evaluated.issueDetails.map(({ path, code }) => `${path ?? "/"} ${code}`).join(", ") || "none"}. Proposed Profile requirements: ${requirements.map(({ path, type, required }) => `${path} (${type ?? "value"}${required ? ", required" : ""})`).join(", ") || "none"}. Each requirement retains this evidence identity.`,
            suggestedName: choices.suggestedFixtureName, events: choices.events, pages: choices.pages, flowSteps: choices.flowSteps, profiles: choices.profiles,
            commit: async (input) => {
                await ports.settle();
                await ports.ensureProject(project.id);
                await ports.settle();
                const current = await ports.loadCurrent(project.id);
                const next = input.destination === "profile"
                    ? applyCapturedValidationToProfile(current.state, { captureId: record.eventId, profileId: input.profileId, contributorId: record.schemaId, evaluated })
                    : createFixtureFromCapturedValidation(current.state, { name: input.name, captureId: record.eventId, sourceId: captured.sourceId,
                        eventName: record.eventName, payload: captured.payload, contributorId: record.schemaId, eventId: input.eventId,
                        ...(input.pageId ? { pageId: input.pageId } : {}), ...(input.flowStepId ? { flowStepId: input.flowStepId } : {}), evaluated }, ports.createId);
                const kind = input.destination === "profile" ? "profiles" : "fixtures", entity = input.destination === "profile"
                    ? next.project.collections.profiles.find(({ id }) => id === input.profileId) : next.project.collections.fixtures.at(-1);
                const result = ports.commit(next, current.revision, `Continue evaluated capture ${record.eventId} as ${input.destination === "profile" ? "Profile requirements" : "Test case"}`);
                if (result.status === "conflict")
                    throw new Error("Project changed in a newer Saved Draft; review the continuation again.");
                ports.capture(next, result.revision);
                ports.route(project.id, kind, entity.id);
                await ports.settle();
                ports.openStudio(project.id, kind, entity.id);
                return { entityName: entity.name, kind };
            } };
    };
}
export function createInstalledDataLayerLifecycle(controllers) {
    let mounted = false;
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            for (const id of installedDataLayerControllerOrder)
                controllers[id].mount();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            for (const id of [...installedDataLayerControllerOrder].reverse()) {
                controllers[id].dispose();
            }
        },
    };
}
export async function mountInstalledDataLayerRuntime(root = document, storage = globalThis.localStorage) {
    const [paletteApi, hotkeyApi, tabApi, captureApi, liveApi, eventApi, schemaApi, defectApi, replayApi, registryApi] = await Promise.all([
        import("../utilities/command-palette/index.js"), import("../utilities/hotkeys/index.js"),
        import("../workspace-tabs-ui.js"), import("../utilities/data-layer/capture.js"),
        import("../utilities/data-layer/live-inspection.js"), import("../utilities/data-layer/event-library.js"),
        import("../utilities/data-layer/schemas.js"), import("../utilities/data-layer/defect-reporting.js"),
        import("../utilities/data-layer/replay.js"), import("../utility-registry.js"),
    ]);
    const foundation = await createInstalledSidePanelRuntimeFoundation(root, storage), durable = foundation.durableProjectRuntime;
    const chromeApi = () => globalThis.chrome;
    const dataStorage = foundation.dataLayerStorage, projectStorage = durable.storage;
    const download = (filename, contents, type = "application/json") => {
        const url = URL.createObjectURL(new Blob([contents], { type }));
        const link = root.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };
    const currentProject = () => schemaApi.restoreCanonicalProjectState(projectStorage.getItem("my-chrome-utilities.specification-project.v1"));
    let controllers;
    let currentView = dataStorage.getItem("my-chrome-utilities.data-layer-view.v1") ?? "Live";
    const liveElements = liveApi.findLiveObserverElements(root);
    const showDataLayerView = (view, focus = false) => {
        if (!liveApi.dataLayerViews.includes(view))
            return;
        currentView = view;
        dataStorage.setItem("my-chrome-utilities.data-layer-view.v1", currentView);
        liveApi.renderDataLayerView(liveElements, currentView, focus);
        if (currentView === "Defects")
            controllers?.defects.render();
        if (currentView === "Schemas")
            void controllers?.schemas.hydrateActiveProjectForSchemas();
    };
    const projectLibraryUi = schemaApi.mountProjectLibraryUi({ root, storage: projectStorage,
        prepareProject: durable.ensureProject, settled: durable.settled, undoProject: durable.undo,
        subscribe: (listener) => durable.subscribe(({ library }) => listener(library)), blocked: () => Boolean(durable.failedSave()),
        exportProject: async (projectId) => JSON.stringify(await durable.repository.exportProject(projectId)),
        importProject: async (serialized, input) => { await durable.repository.importProject(JSON.parse(serialized), input); },
        projectStorageKey: "my-chrome-utilities.specification-project.v1", navigationStorageKey: "my-chrome-utilities.specification-project-navigation.v1",
        openStudio: (url) => { globalThis.open(url, "_blank"); }, onChange: () => { controllers?.["project-event-transport"].render(); }, });
    const projectRecords = () => Object.values(projectLibraryUi.library().projects).map(({ state }) => ({ id: state.project.id, name: state.project.name }));
    const activeProjectId = () => projectLibraryUi.library().activeProjectId;
    const commitProject = (next, expectedRevision, label) => {
        const base = currentProject(), result = schemaApi.commitCanonicalProjectState(projectStorage, next, { expectedRevision, pendingLabel: label, ...(base ? { base } : {}) });
        return result.status === "conflict" ? { status: "conflict", revision: result.revision } : { status: "saved", revision: result.revision };
    };
    const eventSchemas = createEventLibrarySchemaCoordination({ schemas: { schemas: () => controllers.schemas.schemas(),
            validateAgainstSchema: (event, schemaId) => controllers.schemas.validateAgainstSchema(event, schemaId),
            openSchemaFromSource: (source) => controllers.schemas.openSchemaFromSource(source) } });
    const reviewEventLibraryTestCase = createEventLibraryTestCaseCoordination({ projects: projectRecords, activeProjectId,
        ensureProject: durable.ensureProject, settle: durable.settled,
        load: async (projectId) => { await durable.ensureProject(projectId); const loaded = await durable.repository.loadProject(projectId); return { state: loaded.state, revision: loaded.draftSequence }; },
        commit: commitProject,
        capture: (next, revision) => projectLibraryUi.captureActiveProject(next, revision),
        route: (projectId, id) => { const routed = schemaApi.recordProjectNavigation(projectLibraryUi.library(), projectId, { kind: "fixtures", id }); projectStorage.setItem(schemaApi.PROJECT_LIBRARY_STORAGE_KEY, schemaApi.serializeProjectLibrary(routed)); },
        openStudio: (projectId, id) => { globalThis.open(`specification-builder.html?project=${encodeURIComponent(projectId)}&kind=fixtures&entity=${encodeURIComponent(id)}&source=event-library`, "_blank"); },
        repair: (projectId, kind) => { globalThis.open(`specification-builder.html?project=${encodeURIComponent(projectId)}&kind=${kind}&route=add&source=event-library`, "_blank"); },
        createId: (kind) => `${kind}:${crypto.randomUUID()}` });
    const tabSubscriptions = (event, listener) => {
        event?.addListener(listener);
        return () => event?.removeListener(listener);
    };
    const targetFromTab = (tab) => tab.id === undefined || tab.windowId === undefined || !tab.url ? undefined : { tabId: tab.id, windowId: tab.windowId,
        pageUrl: tab.url, title: tab.title ?? tab.url, activeTab: tab.active, currentWindow: tab.highlighted };
    const captureObserverRuntime = {
        read: ({ tabId, pageUrl, historyPath, pageLoadId }) => tabPageObservation(tabId, pageUrl, historyPath, pageLoadId),
        startPush: ({ tabId, historyPath, onSnapshot, onEntry }) => captureApi.startLiveHistoryPushCapture({ ...(tabId === undefined ? {} : { tabId }), historyPath, onSnapshot, onEntry }),
        present: (event, destination) => {
            const source = controllers.capture.state().observer.sources.find(({ id }) => id === event.sourceId), validation = controllers.schemas.validate({ sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput });
            return { ...event, validation: validation.state, validationDetails: { issues: validation.issues, evaluations: validation.evaluations ?? [], ...(validation.schema ? { schema: validation.schema } : {}), ...(validation.documentation ? { documentation: validation.documentation } : {}), ...(validation.assignment ? { assignment: validation.assignment } : {}) }, sourceName: source?.name ?? event.sourceId, ...(destination ? { destination } : {}) };
        },
        recordCapture: ({ sessionId, pageUrl, sourceId, rawValue }) => schemaApi.recordSpecificationCapture(dataStorage, { sessionId, pageUrl, sourceId, rawValue }),
        recordNavigation: ({ sessionId, pageUrl }) => schemaApi.recordSpecificationNavigation(dataStorage, { sessionId, pageUrl }),
        subscribeTabUpdated: (listener) => tabSubscriptions(chromeApi()?.tabs?.onUpdated, ((tabId, change, tab) => listener(tabId, { ...(["loading", "complete"].includes(change.status ?? "") ? { status: change.status } : {}), ...(change.url ? { url: change.url } : {}) }, { ...(tab.url ? { url: tab.url } : {}), ...(tab.title ? { title: tab.title } : {}) }))),
        subscribeTabRemoved: (listener) => tabSubscriptions(chromeApi()?.tabs?.onRemoved, listener),
        subscribePermissionsRemoved: (listener) => tabSubscriptions(chromeApi()?.permissions?.onRemoved, ((permissions) => listener(permissions.origins ?? []))),
    };
    const controllerPorts = {
        capture: { root, storage: dataStorage, initialPageUrl: () => globalThis.location.href, initialSources: () => [{ id: "history", name: "History array", status: "Disconnected" }],
            presentEvent: (event) => controllers.defects.triage(event),
            sessionStart: async () => {
                const [tab] = await chromeApi().tabs.query({ active: true, currentWindow: true });
                if (!tab) {
                    throw new Error("Open a page before starting Data Layer testing.");
                }
                const target = targetFromTab(tab);
                if (!target)
                    throw new Error("The active page cannot be observed.");
                const path = controllers["project-event-transport"].currentObservationHistoryPath();
                return { id: `tab-${target.tabId}-session-${crypto.randomUUID()}`, tabId: target.tabId, url: target.pageUrl, historyPath: path, windowId: target.windowId, targetTitle: target.title, targetOrigin: new URL(target.pageUrl).origin };
            },
            changed: () => { }, runCommand: (id) => {
                void shell.runDataLayerCommand({ commandId: id, message: `${id} ran` }).catch((error) => {
                    const message = root.querySelector("#live-session-message");
                    if (message)
                        message.textContent = error instanceof Error ? error.message : String(error);
                });
            },
            setLiveSessionMessage: (message) => { const node = root.querySelector("#live-session-message"); if (node)
                node.textContent = message; },
            observerRuntime: captureObserverRuntime,
            observation: { discover: async (scope) => { const tabs = await chromeApi().tabs.query(scope === "current" ? { active: true, currentWindow: true } : {}); return tabs.flatMap((tab) => { const value = targetFromTab(tab); return value ? [value] : []; }); },
                requestTabsAccess: async () => chromeApi().permissions ? await chromeApi().permissions.request({ permissions: ["tabs"] }) : false,
                requestOriginAccess: async (origin) => chromeApi().permissions ? await chromeApi().permissions.request({ origins: [`${origin}/*`] }) : false,
                probe: (target, path, pageLoadId) => captureObserverRuntime.read({ tabId: target.tabId, pageUrl: target.pageUrl, historyPath: path, pageLoadId }),
                render: (targets, actions) => {
                    const elements = captureApi.findObservationTargetElements(root);
                    captureApi.renderObservationTargetPicker(elements, targets, {
                        select: (target) => actions.select(target.id), requestAccess: (target) => actions.requestAccess(target.id)
                    });
                } },
            savedSessions: { now: () => new Date().toISOString(), readImportFile: async () => root.querySelector("#saved-session-file")?.files?.[0]?.text(),
                download: (name, serialized) => download(`${name}.json`, serialized), validate: (event) => { const result = controllers.schemas.validate({ sourceId: event.sourceId, eventName: event.name, payload: event.payload, rawInput: event.rawInput }); return { state: result.state, ...(result.schema ? { schema: { name: result.schema.name, version: result.schema.version } } : {}) }; },
                render: (sessions, actions) => renderInstalledSavedSessionList(root.querySelector("#saved-session-list"), sessions, actions), flowTests: () => controllers["live-flow-testing"].state().completed, resetFlowTesting: () => controllers["live-flow-testing"].reset(),
                createReplaySequence: (session) => { controllers.replay.createFromSession(session.id, session.name, session.events.map(({ id }) => id)); } },
            savedFilters: { createId: () => `filter:${crypto.randomUUID()}`, render: (events, query, controls, update) => {
                    const host = root.querySelector("#live-event-query");
                    if (host)
                        liveApi.renderEventFeedQueryBuilder(host, events, query, update, controls);
                }, dispose: () => { } },
            inspector: { splitView: () => globalThis.innerWidth >= 700, capturePresentation: () => liveApi.captureLiveInspectorPresentation(liveElements.eventInspector),
                restorePresentation: (snapshot) => liveApi.restoreLiveInspectorPresentation(liveElements.eventInspector, snapshot),
                restoreReturn: (snapshot) => liveApi.restoreInspectorReturnUi(liveElements, snapshot), render: (event) => liveApi.renderLiveInspector(liveElements, event, liveApi.createLiveInspectorActions({ currentPageUrl: () => controllers.capture.state().observer.pageUrl,
                    writeClipboard: async (text) => navigator.clipboard.writeText(text), storeTemplate: (template) => controllers["event-library"].store(template),
                    defaultDestination: () => controllers["project-event-transport"].state().pushPath,
                    expandAllowedValue: (selected, evaluation, trigger) => {
                        const assignedSchemaId = selected.validationDetails?.schema?.id ?? evaluation.schemaId;
                        if (assignedSchemaId)
                            controllers.schemas.openAllowedValueExpansionReview(selected.id, assignedSchemaId, evaluation, trigger);
                    },
                    openReportedDefect: (defectId, selected, issueIndex) => controllers.defects.open(defectId, { returnPosition: { eventId: selected.id, issueIndex,
                            listScrollTop: liveElements.eventList?.scrollTop ?? 0 } }),
                    validationState: (candidate) => controllers.schemas.validate({ sourceId: candidate.sourceId, eventName: candidate.name, payload: candidate.payload, rawInput: candidate.rawInput }).state,
                    updateValidation: (eventId) => {
                        const candidate = controllers.capture.state().observer.events.find(({ id }) => id === eventId);
                        if (!candidate)
                            return;
                        const validation = controllers.schemas.validate({ sourceId: candidate.sourceId, eventName: candidate.name, payload: candidate.payload, rawInput: candidate.rawInput });
                        controllers.capture.updateEvent(eventId, { validation: validation.state, validationDetails: { issues: validation.issues, evaluations: validation.evaluations ?? [],
                                ...(validation.schema ? { schema: validation.schema } : {}), ...(validation.documentation ? { documentation: validation.documentation } : {}), ...(validation.assignment ? { assignment: validation.assignment } : {}) } });
                    },
                    manualSchemaChoices: () => controllers.schemas.schemas().map(({ id, name, version }) => ({ id, label: `${name} version ${version}` })),
                    selectManualSchema: () => { } })) },
            ui: { historyPath: () => { const state = controllers["project-event-transport"].state(), status = ["Selection required", "Waiting for path", "Ready", "Unavailable"].includes(state.currentTargetPathStatus) ? state.currentTargetPathStatus : "Unavailable"; return { path: state.observationPath, fieldValue: state.observationPath, status: status }; },
                chooseObservationTarget: () => root.querySelector("#choose-observation-target")?.click(), browseObservationTargets: () => root.querySelector("#browse-observation-targets")?.click(),
                closeObservationTargetPicker: () => captureApi.closeObservationTargetPicker(captureApi.findObservationTargetElements(root)), searchObservationTargets: () => { }, cancelDetachTarget: () => { }, confirmDetachTarget: () => { },
                selectedTargetChanged: () => { controllers["project-event-transport"].refreshTargetPath(); if (currentView === "Schemas")
                    showDataLayerView("Live"); },
                showDataLayerView, copyPageUrl: () => { const url = controllers.capture.state().observer.pageUrl; void captureApi.copyLivePageUrl(url, navigator.clipboard?.writeText?.bind(navigator.clipboard)); },
                reportMissingEvent: () => controllers.defects.openMissingEventBuilder("Live") } },
        "event-library": { root, storage: dataStorage, defaultPushPath: () => controllers["project-event-transport"].state().pushPath,
            push: async (template) => {
                const targetState = controllers.capture.state().targets, target = targetState.targets.find(({ id }) => id === targetState.selectedTargetId);
                if (!target)
                    throw new Error("Select a target before pushing.");
                const result = await eventApi.pushSavedTemplateToSelectedTarget(template, target, async (request) => { const [injection] = await chromeApi().scripting.executeScript({ target: { tabId: request.tabId }, world: "MAIN", args: [request.destination, request.eventName, request.payload], func: eventApi.pushPayloadInPage }); if (!injection?.result?.success)
                    throw new Error(injection?.result?.result ?? "Push failed"); });
                if (!result.success)
                    throw new Error(result.result);
                const feedback = root.querySelector("#event-template-result");
                if (feedback)
                    feedback.textContent = result.summary;
            },
            changed: () => { }, createSchema: eventSchemas.createSchema, createTestCase: reviewEventLibraryTestCase,
            appendInspectorAction: (label, activate) => { const action = root.createElement("button"); action.type = "button"; action.textContent = label; action.addEventListener("click", activate); liveElements.eventInspector?.append(action); return () => action.remove(); },
            openLibrary: () => showDataLayerView("Library"), announce: (message) => { const node = root.querySelector("#live-session-message"); if (node)
                node.textContent = message; },
            createId: () => `template:${crypto.randomUUID()}`, downloadExport: (value) => download("event-library.json", `${JSON.stringify(value, null, 2)}\n`),
            readImportFile: async () => await root.querySelector("#event-library-file")?.files?.[0]?.text() ?? "",
            schemas: eventSchemas.schemas, validateDraft: eventSchemas.validateDraft, backToCapturedEvent: () => showDataLayerView("Live"),
            pushTarget: () => { const state = controllers.capture.state().targets, target = state.targets.find(({ id }) => id === state.selectedTargetId); return target ? { id: target.id, tabId: target.tabId, windowId: target.windowId, title: target.title, pageUrl: target.pageUrl, origin: target.origin, accessState: target.accessState } : undefined; },
            checkPushPath: async (target, destination) => { const [result] = await chromeApi().scripting.executeScript({ target: { tabId: target.tabId }, world: "MAIN", args: [destination], func: eventApi.pushPathCapabilityInPage }); return result?.result?.success ? { success: true, message: "Selected-page push path is ready." } : { success: false, message: result?.result?.result ?? "Push path is not push-capable" }; },
            renderPushReview: (host, review) => eventApi.renderPushDraftReview(host, review),
            renderRevisionReview: (host, review) => { const dialog = host.querySelector("#revision-change-review"); if (dialog)
                eventApi.renderTemplateChangeReview(dialog, review); } },
        schemas: { root, storage: dataStorage, relationshipViewStorage: dataStorage, changed: () => { }, subscribe: (listener) => durable.subscribe(() => listener()),
            createRuleId: () => `rule:${crypto.randomUUID()}`, capturedAssignmentValue: () => undefined, renderAssignmentConditions: schemaApi.renderAssignmentDataConditionEditor,
            localRulePromotionDialog: schemaApi.createLocalRulePromotionDialog(), subscribeSchemaPersistence: () => () => { },
            downloadSchema: (value, filename) => download(filename, `${JSON.stringify(value, null, 2)}\n`),
            relationshipTree: (schemas) => ({ projectId: activeProjectId() ?? "", nodes: schemaApi.projectSchemaRelationshipTree(currentProject(), schemas) }),
            openProjectLibrary: () => showDataLayerView("Projects"), openContributor: () => { }, openContributorInStudio: (key) => globalThis.open(`specification-builder.html?contributor=${encodeURIComponent(key)}`, "_blank"),
            adoptSavedSchema: () => { }, renderSchemaSpecification: (host, schema, schemas, surface, close) => schemaApi.renderSchemaSpecificationBuilder(host, schema, schemas, surface, close, {
                writePlain: async (plain) => navigator.clipboard.writeText(plain),
                writeRich: async (_html, plain) => navigator.clipboard.writeText(plain),
            }), reportMissingSchemaEvent: () => controllers.defects.openMissingEventBuilder("Schemas"),
            showSchemasView: () => showDataLayerView("Schemas"), scheduleFrame: (callback) => requestAnimationFrame(callback), restoreGuidedCapture: (id, path) => {
                controllers.capture.openInspector(id, true);
                const property = path ? root.querySelector(`[data-property-path="${CSS.escape(path)}"]`) : undefined;
                (property?.querySelector(".live-allowed-value-expansion") ?? property)?.focus({ preventScroll: true });
            },
            activeProjectId, ensureProjectSchemaContributors: async (projectId) => { await durable.ensureProject(projectId); return { name: (await durable.repository.loadProject(projectId)).state.project.name }; },
            settleCanonical: async () => { await durable.settled("schema"); }, mountLayeredProfileEditor: () => undefined, canonicalConceptSuggestions: () => schemaApi.projectCanonicalConcepts(currentProject()),
            revalidateCurrentLive: (schemas, overrides) => {
                const refresh = schemaApi.revalidateCurrentLiveSession(controllers.capture.state().observer, schemas, overrides);
                controllers.capture.replaceObserverState({ ...refresh.state, events: refresh.state.events.map((event) => controllers.defects.triage(event)) });
                return refresh.revalidatedEventIds.length;
            },
            prepareCapturedValidationContinuation: createCapturedValidationContinuationCoordination({ load: async (record) => { const projectId = activeProjectId(); if (!projectId)
                    return { revision: 0 }; await durable.ensureProject(projectId); const loaded = await durable.repository.loadProject(projectId), captured = controllers.capture.state().observer.events.find(({ id }) => id === record.eventId); return { state: loaded.state, revision: loaded.draftSequence, ...(captured ? { captured: { id: captured.id, sourceId: captured.sourceId, payload: captured.payload } } : {}) }; },
                settle: durable.settled, ensureProject: durable.ensureProject, loadCurrent: async (projectId) => { const loaded = await durable.repository.loadProject(projectId); return { state: loaded.state, revision: loaded.draftSequence }; },
                commit: commitProject, capture: (next, revision) => projectLibraryUi.captureActiveProject(next, revision),
                route: (projectId, kind, id) => { const routed = schemaApi.recordProjectNavigation(projectLibraryUi.library(), projectId, { kind, id }); projectStorage.setItem(schemaApi.PROJECT_LIBRARY_STORAGE_KEY, schemaApi.serializeProjectLibrary(routed)); },
                openStudio: (projectId, kind, id) => globalThis.open(`specification-builder.html?project=${encodeURIComponent(projectId)}&kind=${kind}&entity=${encodeURIComponent(id)}`, "_blank"), createId: (kind) => `${kind}:${crypto.randomUUID()}` }) },
        defects: { root, storage: dataStorage, recopy: (defect) => defectApi.copyStoredDefectForJira(defect, defectApi.browserDefectReportClipboard()).then(({ feedback }) => feedback),
            attachCurrentSession: (id) => coordination.attachCurrentSession(id), openLinkedSession: (id) => { coordination.openLinkedSession(id); }, liveEvents: () => controllers.capture.state().observer.events,
            showDefectsView: () => showDataLayerView("Defects"), returnToLive: (position) => {
                showDataLayerView("Live");
                controllers.capture.openInspector(position.eventId);
                if (liveElements.eventList)
                    liveElements.eventList.scrollTop = position.listScrollTop;
                liveElements.eventInspector?.querySelector(`.live-reported-defect-link[data-issue-index="${position.issueIndex}"]`)?.focus({ preventScroll: true });
            },
            renderLive: () => controllers.capture.refreshPresentation(),
            missingEventContext: () => ({ events: controllers.capture.state().observer.events, pageUrl: controllers.capture.state().observer.pageUrl }), mountMissingEventBuilder: () => ({ close() { } }) },
        replay: { root, listTemplates: () => controllers["event-library"].templates().map(({ id, name, payload, version, sourceId, destination }) => ({ id, name, payload, version, sourceId, destination })), listSources: () => controllers.capture.state().observer.sources,
            pageUrl: () => controllers.capture.state().observer.pageUrl },
        projects: { activeProjectId, loadProjects: projectRecords, subscribe: (listener) => durable.subscribe(() => listener()), openProject: async (id) => { projectLibraryUi.activate(id); await durable.settled(); },
            navigateToProjectArea: (area) => { showDataLayerView("Projects"); if (area === "create")
                root.querySelector("#create-library-project")?.click(); },
            adoptSavedSchema: async () => { }, projectStorage, settleProjectCommand: async () => { await durable.settled(); }, captureProject: (state, revision) => projectLibraryUi.captureActiveProject(state, revision) },
        "durable-projects": { root, startRepository: async () => durable.subscribe(() => { }), migration: () => durable.migration.status === "migrated"
                ? { status: "none" } : durable.migration, resolveMigration: durable.resolveMigration,
            readLegacySource: (key) => storage.getItem(key), downloadMigrationSources: (name, value) => download(name, value), reload: () => globalThis.location.reload(), reviewMigration: async () => { },
            retryFailedSave: durable.retryFailedSave, rejectFailedSave: () => durable.resolveFailedSave("reject"), storageRecoveryClosed: () => { }, subscribeSaveFailed: () => () => { }, saveFailed: () => { } },
        "project-event-transport": { root, loadPaths: () => { const state = currentProject(); const settings = state ? schemaApi.projectEventTransport(state.project) : undefined; return { observationPath: settings?.observationHistoryPath ?? "", pushPath: settings?.defaultPushPath ?? "" }; },
            savePaths: async (paths) => {
                const state = currentProject(), serialized = projectStorage.getItem("my-chrome-utilities.specification-project.v1"), envelope = schemaApi.restoreCanonicalProjectEnvelope(serialized);
                if (!state || !envelope)
                    return;
                const next = schemaApi.configureProjectEventTransport(state, { observationHistoryPath: paths.observationPath, defaultPushPath: paths.pushPath }), result = schemaApi.commitCanonicalProjectState(projectStorage, next, { expectedRevision: envelope.revision, pendingLabel: "Save project event transport settings", base: state });
                if (result.status === "conflict")
                    throw new Error("Project transport settings changed in a newer Draft.");
                projectLibraryUi.captureActiveProject(next, result.revision);
            },
            settleTransport: durable.settled, readTargetObservation: async (path) => { const state = controllers.capture.state().targets, target = state.targets.find(({ id }) => id === (state.attachedTargetId ?? state.selectedTargetId)); return target ? captureObserverRuntime.read({ tabId: target.tabId, pageUrl: target.pageUrl, historyPath: path, pageLoadId: `tab:${target.tabId}:transport` }) : undefined; },
            applyLiveTargetPathObservation: async () => { }, renderTargetReadiness: () => controllers.capture.refreshPresentation(), projectName: () => currentProject()?.project.name },
        "live-flow-testing": { root, activeProject: async () => { const id = activeProjectId(); if (!id)
                return; await durable.ensureProject(id); return (await durable.repository.loadProject(id)).state; },
            events: () => controllers?.capture.state().observer.events ?? [], saveSummary: () => { }, savedSummary: () => {
                const library = liveApi.restoreSavedSessionLibrary(dataStorage.getItem(liveApi.SAVED_SESSION_LIBRARY_STORAGE_KEY));
                return liveApi.restoreSavedSessionLiveFeed(dataStorage.getItem(liveApi.SAVED_SESSION_LIVE_FEED_STORAGE_KEY), library)?.session.flowTests?.at(-1);
            }, onResult: () => { },
            openProject: () => showDataLayerView("Projects"), createProject: () => { showDataLayerView("Projects"); root.querySelector("#create-library-project")?.click(); },
            id: () => `live-flow:${crypto.randomUUID()}`, now: () => new Date().toISOString(), subscribe: (listener) => durable.subscribe(() => listener()) },
    };
    const bundle = createInstalledDataLayerControllers(controllerPorts);
    controllers = bundle.controllers;
    const coordination = createDefectCaptureCoordination({ capture: controllers.capture, defects: controllers.defects });
    const allCommands = [...paletteApi.commandsForUtilityShell(paletteApi.listCommands(), registryApi.extensionShell.commands)];
    let shell;
    const workspaceTabs = tabApi.createWorkspaceTabsController({ storage: foundation.shellStorage, tabList: foundation.workspaceTabList, root, pageLifecycle: globalThis });
    const palette = paletteApi.createPaletteController({ commands: allCommands, executeCommand: (command) => paletteApi.runCommandById(command.id, shell.commandContext),
        elements: { root: root.querySelector("#side-panel-root"), launcher: foundation.openPaletteButton, palette: foundation.palette, filter: foundation.paletteFilter, results: foundation.paletteResults, sidePanelContent: foundation.sidePanelContent }, ownerDocument: root });
    const hotkeys = hotkeyApi.createInstalledHotkeyController({ commands: allCommands, storage: foundation.hotkeyStorage,
        elements: { root: root.querySelector("#side-panel-root"), createButton: foundation.createKeymapButton, updateButton: foundation.updateKeymapButton, loadButton: foundation.loadKeymapButton, fileInput: foundation.keymapFileInput, status: foundation.keymapStatus, warning: foundation.keymapWarning, editorContainer: foundation.hotkeyEditorCommands, editorFilter: foundation.hotkeyEditorFilter },
        documentEvents: root, pageLifecycle: globalThis, download: ({ filename, contents, type }) => { download(filename, contents, type); return () => { }; },
        executeCommand: (id) => paletteApi.runCommandById(id, shell.commandContext), shellClaimsKey: () => false,
        ignoresTarget: (target) => target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable) });
    shell = createInstalledSidePanelShellController({ commands: allCommands, pageLifecycle: globalThis, commandLog: foundation.commandLog, palette, workspaceTabs, hotkeys,
        captureCommands: { startTesting: controllers.capture.begin, endTesting: async () => controllers.capture.end(), chooseObservationTarget: controllers.capture.discoverTargets,
            attachSelectedTarget: controllers.capture.attachTarget, detachObservationTarget: controllers.capture.beginDetachTarget }, showDataLayerView: (view) => showDataLayerView(view) });
    const lifecycle = createInstalledDataLayerLifecycle({ ...controllers });
    let runtimeMounted = false, stopDurableCoordination;
    return { mount() {
            if (runtimeMounted)
                return;
            runtimeMounted = true;
            shell.mount();
            lifecycle.mount();
            stopDurableCoordination = durable.subscribe(() => controllers["project-event-transport"].synchronizeProjectPaths());
            void durable.settled().then(() => { if (runtimeMounted)
                controllers["project-event-transport"].synchronizeProjectPaths(); });
            showDataLayerView(currentView);
            foundation.app?.setAttribute("aria-label", "TWAtility Belt");
            const panel = root.querySelector("#side-panel-root");
            if (panel) {
                panel.dataset.chromeApiCapabilities = "installed-runtime";
                panel.dataset.utilityShellReady = "true";
            }
        },
        dispose() { if (!runtimeMounted)
            return; runtimeMounted = false; stopDurableCoordination?.(); stopDurableCoordination = undefined; lifecycle.dispose(); shell.dispose(); } };
}
import { bindUtilityPanels, mountUtilityShell, renderUtilityDirectory } from "../platform/utility-shell-dom.js";
import { createUtilityStorage } from "../platform/utility-storage.js";
import { installDurableRepositoryStartupFailure, mountDurableProjectRepositoryUi, openDurableProjectRuntime, SCHEMA_LIBRARY_STORAGE_KEY } from "../utilities/data-layer/schemas.js";
//# sourceMappingURL=runtime.js.map