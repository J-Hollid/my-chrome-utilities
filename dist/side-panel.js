import { listCommands, runCommandById, } from "./commands.js";
import { advanceHotkeySequence, blankHotkeyKeymap, duplicateSequences, HOTKEY_KEYMAP_STORAGE_KEY, keyTokenFromKeyboardEvent, updateHotkeyKeymap, validateHotkeyKeymap, } from "./hotkey-keymap.js";
import { createHotkeyEditor } from "./hotkey-editor.js";
import { createWorkspaceTabsController } from "./workspace-tabs-ui.js";
import { activePageObservation, tabPageObservation, } from "./active-page-observation.js";
import { getHistoryArrayPath, pathStatus, samplePageObject, setHistoryArrayPath, } from "./data-layer.js";
import { appendObservedHistoryEntry, attachHistoryArrayObserver, } from "./data-layer-observer.js";
import { beginObservedPageLoad, initialObservationRefreshState, markObservationRefreshPageEntryCaptured, nextObservationRefreshAttempt, observationRefreshDelay, observationRefreshRequestForPageLoad, observationRefreshRequestIsCurrent, shouldRetryObservationRefresh, } from "./data-layer-observation-refresh.js";
import { startLiveHistoryPushCapture, } from "./data-layer-live-observation.js";
import { observerAttachmentStatus, restartObservation, } from "./data-layer-recovery.js";
import { captureEntry, DATA_LAYER_SESSION_STORAGE_KEY, endDataLayerTestingSession, navigateSession, persistSession, restoreSession, sessionScope, startDataLayerTestingSession, } from "./data-layer-session.js";
import { nestedTimeline, timelineEventHeading, } from "./data-layer-timeline.js";
import { createLiveObserverState, dataLayerViewForNavigationKey, dataLayerViews, pauseCapture, recordLiveEvent, resumeCapture, selectLiveEvent, } from "./data-layer-live-observer.js";
import { confirmSavedSessionDeletion, cancelSavedSessionDeletion, createSavedSessionLibrary, exportSavedSession, importSavedSession, openSavedSession, requestSavedSessionDeletion, renameSavedSession, resumeSavedSession, saveCompletedSession, searchSavedSessions, savedSessionSummary, } from "./data-layer-saved-sessions.js";
import { findLiveObserverElements, renderDataLayerView, renderLiveInspector, renderLiveObserverState, renderLiveSessionMessage, } from "./data-layer-live-observer-ui.js";
import { createEditableTemplate, discardDraft, executeDraftPush, openPropertyEditor, saveAsTemplateCopy, saveDraftRevision, searchEventTemplates, restoreEventTemplateLibrary, serializeEventTemplateLibrary, updateDraftJson, EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, } from "./data-layer-event-library-editor.js";
const PROJECT_NAME = "my-chrome-utilities";
const app = document.querySelector("#app");
const panelRoot = document.querySelector("#side-panel-root");
const commandList = document.querySelector("#commands");
const commandLog = document.querySelector("#command-log");
const openButton = document.querySelector("#open-palette");
const palette = document.querySelector("#palette");
const filter = document.querySelector("#palette-filter");
const results = document.querySelector("#palette-results");
const historyPathInput = document.querySelector("#history-path");
const historyPathDisplay = document.querySelector("#history-path-display");
const historyPathStatus = document.querySelector("#history-path-status");
const sessionStatus = document.querySelector("#session-status");
const sessionHistoryPath = document.querySelector("#session-history-path");
const sessionTimeline = document.querySelector("#session-timeline");
const sessionWarning = document.querySelector("#session-warning");
const observerStatus = document.querySelector("#observer-status");
const restartObservationButton = document.querySelector("#restart-observation");
const createKeymapButton = document.querySelector("#create-keymap");
const updateKeymapButton = document.querySelector("#update-keymap");
const loadKeymapButton = document.querySelector("#load-keymap");
const keymapFileInput = document.querySelector("#keymap-file");
const keymapStatus = document.querySelector("#keymap-status");
const keymapWarning = document.querySelector("#keymap-warning");
const workspaceTabList = document.querySelector("#workspace-tabs");
const hotkeyEditorFilter = document.querySelector("#hotkey-editor-filter");
const hotkeyEditorCommands = document.querySelector("#hotkey-editor-commands");
const saveLiveSessionButton = document.querySelector("#save-live-session");
const savedSessionSearch = document.querySelector("#saved-session-search");
const importSavedSessionButton = document.querySelector("#import-saved-session");
const savedSessionFileInput = document.querySelector("#saved-session-file");
const savedSessionList = document.querySelector("#saved-session-list");
const savedSessionCount = document.querySelector("#saved-session-count");
const savedSessionConfirmation = document.querySelector("#saved-session-confirmation");
const cancelSavedSessionDeleteButton = document.querySelector("#cancel-saved-session-delete");
const confirmSavedSessionDeleteButton = document.querySelector("#confirm-saved-session-delete");
const liveObserverElements = findLiveObserverElements();
const { viewList: dataLayerViewList, backToEventsButton, pauseCaptureButton, resumeCaptureButton, } = liveObserverElements;
const eventTemplateSearch = document.querySelector("#event-template-search");
const saveLatestTemplateButton = document.querySelector("#save-latest-template");
const eventTemplateCount = document.querySelector("#event-template-count");
const eventTemplateList = document.querySelector("#event-template-list");
const eventPropertyEditor = document.querySelector("#event-property-editor");
const eventTemplateProperties = document.querySelector("#event-template-properties");
const eventTemplateJson = document.querySelector("#event-template-json");
const eventTemplateValidation = document.querySelector("#event-template-validation");
const saveTemplateRevisionButton = document.querySelector("#save-template-revision");
const saveTemplateCopyButton = document.querySelector("#save-template-copy");
const pushTemplateDraftButton = document.querySelector("#push-template-draft");
const discardTemplateDraftButton = document.querySelector("#discard-template-draft");
const eventTemplateResult = document.querySelector("#event-template-result");
const allCommands = [...listCommands()];
let visibleCommands = allCommands;
let selectedIndex = 0;
let activeHotkeyKeymap = loadStoredHotkeyKeymap() ?? blankHotkeyKeymap(allCommands);
let pendingHotkeySequence = [];
let dataLayerSessionState = restoreSession();
let dataLayerObserverState = {
    pageObject: samplePageObject(),
    observedEntries: [],
};
let stopLiveHistoryPushCapture = () => { };
let observationRefreshTimeoutId;
let observationRefreshState = initialObservationRefreshState;
let liveObserverState = createLiveObserverState({
    pageUrl: globalThis.location.href,
    sources: [{ id: "event-history", name: "Event history", status: "Connected" }],
});
let savedSessionLibrary = createSavedSessionLibrary();
let archivedSavedSession;
let eventTemplates = restoreEventTemplateLibrary(localStorage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
let propertyEditorState;
if (app) {
    app.textContent = PROJECT_NAME;
}
function renderHistoryPath(path, fieldValue = path) {
    if (historyPathInput) {
        historyPathInput.value = fieldValue;
    }
    if (historyPathDisplay) {
        historyPathDisplay.textContent = path;
    }
    if (historyPathStatus) {
        historyPathStatus.textContent = pathStatus(samplePageObject(), path);
    }
}
function showDataLayerView(view, focus = false) {
    liveObserverState = { ...liveObserverState, view };
    localStorage.setItem("my-chrome-utilities.data-layer-view.v1", view);
    renderDataLayerView(liveObserverElements, view, focus);
}
function renderLiveObserver() {
    renderLiveObserverState(liveObserverElements, liveObserverState, openLiveInspector);
}
function openLiveInspector(eventId) {
    const split = globalThis.innerWidth >= 800;
    liveObserverState = selectLiveEvent(liveObserverState, eventId, split ? "split" : "stacked");
    const event = liveObserverState.events.find(({ id }) => id === eventId);
    if (event)
        renderLiveInspector(liveObserverElements, event);
    renderLiveObserver();
}
function setLiveSessionMessage(message) {
    renderLiveSessionMessage(liveObserverElements, message);
}
function renderEventTemplateLibrary() {
    const templates = searchEventTemplates(eventTemplates, eventTemplateSearch?.value ?? "");
    if (eventTemplateCount)
        eventTemplateCount.textContent = `${templates.length} templates`;
    if (eventTemplateList) {
        eventTemplateList.replaceChildren(...templates.map((template) => {
            const item = document.createElement("li");
            const edit = document.createElement("button");
            const duplicate = document.createElement("button");
            const push = document.createElement("button");
            item.textContent = `${template.name}: ${template.eventName}, ${template.sourceName}, ${template.destination}, ${template.tags.join(", ") || "no tags"}, ${template.schemaId ?? "no schema"}, ${template.validation}, v${template.version}. `;
            edit.type = duplicate.type = push.type = "button";
            edit.textContent = "Edit";
            duplicate.textContent = "Duplicate";
            push.textContent = "Push";
            edit.addEventListener("click", () => openTemplateEditor(template));
            duplicate.addEventListener("click", () => {
                const copy = saveAsTemplateCopy(openPropertyEditor(template), `${template.name} copy`);
                eventTemplates = [...eventTemplates, copy];
                persistEventTemplateLibrary();
                renderEventTemplateLibrary();
            });
            push.addEventListener("click", () => {
                openTemplateEditor(template);
                pushCurrentTemplateDraft();
            });
            item.append(edit, duplicate, push);
            return item;
        }));
    }
    if (eventPropertyEditor)
        eventPropertyEditor.hidden = !propertyEditorState;
    if (eventTemplateJson && propertyEditorState)
        eventTemplateJson.value = propertyEditorState.jsonDraft;
    if (eventTemplateValidation)
        eventTemplateValidation.textContent = propertyEditorState?.jsonError ?? "Properties, JSON, and Validation edit the same draft.";
    if (eventTemplateProperties)
        eventTemplateProperties.replaceChildren(...(propertyEditorState ? renderDraftProperties(propertyEditorState.draft) : []));
}
function persistEventTemplateLibrary() {
    localStorage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(eventTemplates));
}
function renderDraftProperties(value, path = "") {
    if (value === null || typeof value !== "object") {
        const item = document.createElement("li");
        item.textContent = `${path || "/"}: ${String(value)} (${typeof value})`;
        return [item];
    }
    return Object.entries(value).flatMap(([key, child]) => renderDraftProperties(child, `${path}/${key}`));
}
function openTemplateEditor(template) {
    propertyEditorState = openPropertyEditor(template);
    if (eventTemplateResult)
        eventTemplateResult.textContent = `Editing ${template.name}; unsaved changes require keep, discard, or save.`;
    renderEventTemplateLibrary();
}
function pushCurrentTemplateDraft() {
    if (!propertyEditorState)
        return;
    const template = propertyEditorState.template;
    const source = liveObserverState.sources.find(({ id }) => id === template.sourceId);
    const record = executeDraftPush(propertyEditorState, {
        id: template.sourceId,
        name: source?.name ?? template.sourceName,
        kind: "page",
        destination: template.destination,
        enabled: true,
        status: source?.status ?? "Connected",
        capabilities: ["push"],
    }, liveObserverState.pageUrl, (destination, payload) => {
        globalThis.dispatchEvent(new CustomEvent("data-layer-template-push", { detail: { destination, payload } }));
    });
    if (eventTemplateResult)
        eventTemplateResult.textContent = `${record.activePage}; ${record.adapterId}; ${record.destination}; ${record.result}.`;
}
function renderSavedSessions() {
    const sessions = searchSavedSessions(savedSessionLibrary, savedSessionSearch?.value ?? "");
    if (savedSessionCount)
        savedSessionCount.textContent = `${sessions.length} saved sessions`;
    if (savedSessionList) {
        savedSessionList.replaceChildren(...sessions.map((session) => {
            const item = document.createElement("li");
            const open = document.createElement("button");
            const rename = document.createElement("button");
            const exportButton = document.createElement("button");
            const resumeCapture = document.createElement("button");
            const createSequence = document.createElement("button");
            const remove = document.createElement("button");
            open.type = "button";
            open.textContent = `Open ${session.name}`;
            open.addEventListener("click", () => {
                archivedSavedSession = openSavedSession(savedSessionLibrary, session.id);
                if (savedSessionConfirmation) {
                    savedSessionConfirmation.textContent = `Archived session: ${session.name}. Live observer is not running.`;
                }
                showDataLayerView("Sessions");
            });
            rename.type = "button";
            rename.textContent = "Rename";
            rename.addEventListener("click", () => {
                const name = globalThis.prompt("Saved session name", session.name);
                if (name?.trim()) {
                    savedSessionLibrary = renameSavedSession(savedSessionLibrary, session.id, name.trim());
                    renderSavedSessions();
                }
            });
            exportButton.type = "button";
            exportButton.textContent = "Export";
            exportButton.addEventListener("click", () => {
                downloadSavedSessionFile(session);
                if (savedSessionConfirmation)
                    savedSessionConfirmation.textContent = `Exported saved session ${session.name}.`;
            });
            resumeCapture.type = "button";
            resumeCapture.textContent = "Resume capture";
            resumeCapture.addEventListener("click", () => {
                const archived = openSavedSession(savedSessionLibrary, session.id);
                const resumed = resumeSavedSession(archived, globalThis.location.href);
                archivedSavedSession = archived;
                liveObserverState = {
                    ...liveObserverState,
                    view: "Live",
                    status: "Live",
                    pageUrl: resumed.activeSession.pageUrl,
                    events: [],
                };
                setLiveSessionMessage(`Capture resumed from ${session.name}; new session linked to archive.`);
                renderLiveObserver();
                showDataLayerView("Live");
            });
            createSequence.type = "button";
            createSequence.textContent = "Create sequence";
            createSequence.addEventListener("click", () => {
                if (savedSessionConfirmation) {
                    savedSessionConfirmation.textContent = `Create sequence from ${session.name} is ready for the sequence editor.`;
                }
            });
            remove.type = "button";
            remove.textContent = "Delete";
            remove.addEventListener("click", () => {
                savedSessionLibrary = requestSavedSessionDeletion(savedSessionLibrary, session.id);
                if (savedSessionConfirmation)
                    savedSessionConfirmation.textContent = `Delete saved session ${session.name}?`;
                if (cancelSavedSessionDeleteButton)
                    cancelSavedSessionDeleteButton.hidden = false;
                if (confirmSavedSessionDeleteButton)
                    confirmSavedSessionDeleteButton.hidden = false;
            });
            const summary = savedSessionSummary(session);
            item.textContent = `${session.name}: ${summary.captureDate}, ${summary.pageScope}, ${summary.duration}, ${summary.sourceCount} sources, ${summary.eventCount} events, ${summary.validationSummary}. `;
            item.append(open, rename, exportButton, resumeCapture, createSequence, remove);
            return item;
        }));
    }
}
function savedSessionFileName(name) {
    return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "saved-session"}.json`;
}
function downloadSavedSessionFile(session) {
    const blob = new Blob([`${exportSavedSession(session)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = savedSessionFileName(session.name);
    link.click();
    URL.revokeObjectURL(url);
}
async function loadSavedSessionFile() {
    const file = savedSessionFileInput?.files?.[0];
    if (!file)
        return;
    try {
        savedSessionLibrary = importSavedSession(savedSessionLibrary, await file.text());
        if (savedSessionConfirmation)
            savedSessionConfirmation.textContent = "Saved session imported as an immutable archive.";
        renderSavedSessions();
    }
    catch {
        if (savedSessionConfirmation)
            savedSessionConfirmation.textContent = "Saved session file must contain valid JSON.";
    }
    finally {
        if (savedSessionFileInput)
            savedSessionFileInput.value = "";
    }
}
function expandedTimelinePageIndexes() {
    const expandedIndexes = new Set();
    if (!sessionTimeline) {
        return expandedIndexes;
    }
    const pages = Array.from(sessionTimeline.querySelectorAll(":scope > li > details"));
    pages.forEach((page, index) => {
        if (page.open) {
            expandedIndexes.add(index);
        }
    });
    return expandedIndexes;
}
function renderSessionState() {
    const session = dataLayerSessionState.session;
    if (sessionStatus) {
        sessionStatus.textContent = session?.status ?? "inactive";
    }
    if (sessionHistoryPath) {
        sessionHistoryPath.textContent = session?.historyPath ?? "";
    }
    if (sessionTimeline) {
        const expandedPageIndexes = expandedTimelinePageIndexes();
        sessionTimeline.replaceChildren(...nestedTimeline(session?.timeline ?? []).map((page, index) => renderTimelinePage(page, expandedPageIndexes.has(index))));
    }
    if (sessionWarning) {
        sessionWarning.textContent = dataLayerSessionState.warning ?? "";
    }
}
function renderTimelinePage(page, expanded = false) {
    const item = document.createElement("li");
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const eventList = document.createElement("ul");
    details.open = expanded;
    summary.textContent = page.url;
    eventList.append(...page.events.map(renderTimelineEvent));
    details.append(summary, eventList);
    item.append(details);
    return item;
}
function renderTimelineEvent(event) {
    const item = document.createElement("li");
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const definitionList = document.createElement("dl");
    summary.textContent = timelineEventHeading(event);
    appendDefinition(definitionList, "Event", event.name);
    appendDefinition(definitionList, "URL", event.url);
    appendDefinition(definitionList, "Time", event.timestamp);
    appendDefinition(definitionList, "Path", event.observerPath);
    appendDefinition(definitionList, "Payload", event.payload);
    appendDefinition(definitionList, "Raw", event.rawValue);
    details.append(summary, definitionList);
    if (event.payloadProperties.length > 0) {
        details.append(renderPayloadProperties(event.payloadProperties));
    }
    item.append(details);
    return item;
}
function renderPayloadProperties(properties) {
    const list = document.createElement("ul");
    list.append(...properties.map(renderPayloadProperty));
    return list;
}
function renderPayloadProperty(property) {
    const item = document.createElement("li");
    item.textContent = `${property.name}: ${property.value}`;
    return item;
}
function appendDefinition(list, label, value) {
    if (!value) {
        return;
    }
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    list.append(term, description);
}
function renderObserverState() {
    if (observerStatus) {
        observerStatus.textContent = observerAttachmentStatus(dataLayerSessionState, dataLayerObserverState);
    }
}
function updateSessionFromObserverState() {
    dataLayerSessionState =
        dataLayerObserverState.sessionState ?? dataLayerSessionState;
}
function persistAndRenderSessionState() {
    persistSession(dataLayerSessionState);
    renderSessionState();
}
function persistAndRenderObservationState() {
    persistAndRenderSessionState();
    renderObserverState();
}
function restartLiveHistoryCaptureIfActive(observation) {
    if (dataLayerSessionState.session?.status === "active") {
        void startLiveHistoryCapture(observation);
    }
}
function stopLiveHistoryCapture() {
    stopLiveHistoryPushCapture();
    stopLiveHistoryPushCapture = () => { };
}
async function startLiveHistoryCapture(observation) {
    stopLiveHistoryCapture();
    try {
        stopLiveHistoryPushCapture = await startLiveHistoryPushCapture({
            ...(observation.tabId === undefined ? {} : { tabId: observation.tabId }),
            historyPath: observation.historyPath,
            onEntry: ({ rawValue, timestamp }) => {
                dataLayerObserverState = appendObservedHistoryEntry(dataLayerObserverState, rawValue, timestamp);
                updateSessionFromObserverState();
                persistAndRenderObservationState();
                const record = rawValue;
                liveObserverState = recordLiveEvent(liveObserverState, {
                    id: `live-${liveObserverState.events.length + 1}`,
                    name: typeof record.event === "string" ? record.event : "observed event",
                    sourceId: "event-history",
                    captureTime: timestamp,
                });
                renderLiveObserver();
            },
        });
    }
    catch {
        stopLiveHistoryPushCapture = () => { };
    }
}
function clearScheduledObservationRefresh() {
    if (observationRefreshTimeoutId !== undefined) {
        globalThis.clearTimeout(observationRefreshTimeoutId);
        observationRefreshTimeoutId = undefined;
    }
}
function activeSessionTabMatches(tabId) {
    const session = dataLayerSessionState.session;
    return session?.status === "active" && session.tabId === tabId;
}
function capturePageEntryForRefresh(request) {
    if (request.pageEntryCaptured) {
        return request;
    }
    dataLayerSessionState = navigateSession(dataLayerSessionState, request.pageUrl);
    dataLayerSessionState = captureEntry(dataLayerSessionState, {
        type: "page",
        url: request.pageUrl,
    });
    persistAndRenderSessionState();
    return markObservationRefreshPageEntryCaptured(request);
}
function scheduleObservationRefresh(request) {
    clearScheduledObservationRefresh();
    const delay = observationRefreshDelay(request.attempt);
    observationRefreshTimeoutId = globalThis.setTimeout(() => {
        observationRefreshTimeoutId = undefined;
        void runObservationRefresh(request);
    }, delay);
}
function refreshObservationAfterPageLoad(tabId, pageUrl, pageLoadSequence) {
    if (!activeSessionTabMatches(tabId)) {
        return;
    }
    const schedule = observationRefreshRequestForPageLoad(observationRefreshState, tabId, pageUrl, pageLoadSequence);
    observationRefreshState = schedule.state;
    if (schedule.request) {
        scheduleObservationRefresh(schedule.request);
    }
}
async function runObservationRefresh(request) {
    if (!observationRefreshRequestIsCurrent(observationRefreshState, request) ||
        !activeSessionTabMatches(request.tabId)) {
        return;
    }
    const session = dataLayerSessionState.session;
    if (!session) {
        return;
    }
    const nextRequest = capturePageEntryForRefresh(request);
    const observation = await tabPageObservation(nextRequest.tabId, nextRequest.pageUrl, session.historyPath);
    if (!observationRefreshRequestIsCurrent(observationRefreshState, nextRequest) ||
        !activeSessionTabMatches(nextRequest.tabId)) {
        return;
    }
    dataLayerObserverState = restartObservation(dataLayerSessionState, dataLayerObserverState, observation);
    updateSessionFromObserverState();
    persistAndRenderObservationState();
    if (dataLayerObserverState.observer?.status === "ready") {
        await startLiveHistoryCapture(observation);
        return;
    }
    if (shouldRetryObservationRefresh(observation.pageAccessStatus, nextRequest.attempt)) {
        scheduleObservationRefresh(nextObservationRefreshAttempt(nextRequest));
    }
}
async function recordDataLayerCommandRun(entry) {
    if (entry.commandId === "data-layer.start-testing") {
        const sessionWasActive = dataLayerSessionState.session?.status === "active";
        const historyPath = getHistoryArrayPath();
        const observation = await activePageObservation(historyPath);
        dataLayerSessionState = startDataLayerTestingSession(dataLayerSessionState, {
            tabId: observation.tabId ?? 1,
            url: observation.pageUrl,
            historyPath,
        });
        if (!sessionWasActive) {
            dataLayerSessionState = captureEntry(dataLayerSessionState, {
                type: "page",
                url: observation.pageUrl,
            });
            dataLayerObserverState = attachHistoryArrayObserver({ ...dataLayerObserverState, sessionState: dataLayerSessionState }, observation);
            updateSessionFromObserverState();
            await startLiveHistoryCapture(observation);
        }
        persistAndRenderObservationState();
    }
    if (entry.commandId === "data-layer.end-testing") {
        stopLiveHistoryCapture();
        dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState);
        persistSession(dataLayerSessionState);
        renderSessionState();
    }
}
function recordCommandRun(entry) {
    void recordDataLayerCommandRun(entry);
    if (commandLog) {
        commandLog.textContent = entry.message;
    }
    if (entry.commandId === "data-layer.start-testing") {
        setLiveSessionMessage("Data Layer observation started");
    }
    if (entry.commandId === "data-layer.end-testing") {
        setLiveSessionMessage("Data Layer observation stopped");
    }
}
const commandRunContext = {
    record: recordCommandRun,
    showWorkspace,
    showDataLayerView: showDataLayerView,
};
function setKeymapStatus(message) {
    if (keymapStatus) {
        keymapStatus.textContent = message;
    }
}
function setKeymapWarning(message) {
    if (keymapWarning) {
        keymapWarning.textContent = message;
    }
}
const workspaceTabsController = createWorkspaceTabsController(workspaceTabList, localStorage);
const hotkeyEditor = createHotkeyEditor({
    commands: allCommands,
    container: hotkeyEditorCommands,
    filter: hotkeyEditorFilter,
    getKeymap: () => activeHotkeyKeymap,
    setKeymap: (keymap) => {
        activeHotkeyKeymap = keymap;
        storeHotkeyKeymap(keymap);
    },
    setStatus: setKeymapStatus,
    setWarning: setKeymapWarning,
});
function showWorkspace(tab, focus = false) {
    workspaceTabsController.show(tab, focus);
}
function activateHotkeyFocus() {
    if (!panelRoot) {
        return;
    }
    panelRoot.focus();
    panelRoot.dataset.hotkeyFocus = "active";
}
function hotkeyFocusActive() {
    return panelRoot?.dataset.hotkeyFocus === "active";
}
function clearPendingHotkeySequence() {
    pendingHotkeySequence = [];
}
function keymapFileName() {
    return `${PROJECT_NAME}-hotkey-keymap.json`;
}
function downloadHotkeyKeymapFile(keymap) {
    const blob = new Blob([`${JSON.stringify(keymap, null, 2)}\n`], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = keymapFileName();
    link.click();
    URL.revokeObjectURL(url);
}
function updateKeymapStatus(added, removed) {
    setKeymapStatus(`Keymap updated: added ${added.length}, removed ${removed.length}`);
}
function shouldIgnoreHotkeyTarget(target) {
    if (!(target instanceof Element)) {
        return false;
    }
    return (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable));
}
function storeHotkeyKeymap(keymap) {
    localStorage.setItem(HOTKEY_KEYMAP_STORAGE_KEY, JSON.stringify(keymap));
}
function loadStoredHotkeyKeymap() {
    const stored = localStorage.getItem(HOTKEY_KEYMAP_STORAGE_KEY);
    if (!stored) {
        return undefined;
    }
    try {
        const validation = validateHotkeyKeymap(JSON.parse(stored), allCommands);
        return validation.valid ? validation.keymap : undefined;
    }
    catch {
        return undefined;
    }
}
function loadHotkeyKeymap(value) {
    const validation = validateHotkeyKeymap(value, allCommands);
    const duplicates = validation.keymap
        ? duplicateSequences(validation.keymap)
        : validation.duplicateSequences;
    if (!validation.valid || !validation.keymap) {
        const duplicateSequence = duplicates[0]?.sequence;
        setKeymapWarning(duplicateSequence
            ? `Duplicate key sequence: ${duplicateSequence}`
            : (validation.error ?? "Invalid hotkey keymap."));
        return false;
    }
    activeHotkeyKeymap = validation.keymap;
    storeHotkeyKeymap(activeHotkeyKeymap);
    hotkeyEditor.render();
    clearPendingHotkeySequence();
    setKeymapWarning("");
    setKeymapStatus("Keymap loaded");
    activateHotkeyFocus();
    return true;
}
function createHotkeyKeymapFile() {
    activeHotkeyKeymap = blankHotkeyKeymap(allCommands);
    downloadHotkeyKeymapFile(activeHotkeyKeymap);
    hotkeyEditor.render();
    setKeymapWarning("");
    setKeymapStatus("Blank keymap created");
}
function updateHotkeyKeymapFile() {
    const summary = updateHotkeyKeymap(activeHotkeyKeymap, allCommands);
    activeHotkeyKeymap = summary.keymap;
    downloadHotkeyKeymapFile(activeHotkeyKeymap);
    hotkeyEditor.render();
    setKeymapWarning("");
    updateKeymapStatus(summary.added, summary.removed);
}
async function loadHotkeyKeymapFile() {
    const file = keymapFileInput?.files?.[0];
    if (!file) {
        return;
    }
    try {
        loadHotkeyKeymap(JSON.parse(await file.text()));
    }
    catch {
        setKeymapWarning("Keymap file must contain valid JSON.");
    }
    finally {
        if (keymapFileInput) {
            keymapFileInput.value = "";
        }
    }
}
function handleHotkeyKeydown(event) {
    if (!hotkeyFocusActive() || shouldIgnoreHotkeyTarget(event.target)) {
        return;
    }
    if (event.key === "Escape" && pendingHotkeySequence.length > 0) {
        event.preventDefault();
        clearPendingHotkeySequence();
        return;
    }
    const hadPendingSequence = pendingHotkeySequence.length > 0;
    const advance = advanceHotkeySequence(activeHotkeyKeymap, pendingHotkeySequence, keyTokenFromKeyboardEvent(event));
    if (advance.status === "pending") {
        event.preventDefault();
        pendingHotkeySequence = advance.pending;
        return;
    }
    if (advance.status === "matched" && advance.commandId) {
        event.preventDefault();
        clearPendingHotkeySequence();
        runCommandById(advance.commandId, commandRunContext);
        return;
    }
    clearPendingHotkeySequence();
    if (hadPendingSequence) {
        event.preventDefault();
    }
}
function isFocusHotkeysMessage(message) {
    return (typeof message === "object" &&
        message !== null &&
        "type" in message &&
        message.type === "focus-app-hotkeys");
}
function renderPalette(commands) {
    if (!results) {
        return;
    }
    visibleCommands = commands;
    selectedIndex = 0;
    results.replaceChildren();
    for (const [index, command] of commands.entries()) {
        const item = document.createElement("li");
        item.textContent = command.title;
        item.dataset.commandId = command.id;
        item.dataset.selected = index === selectedIndex ? "true" : "false";
        results.append(item);
    }
}
function filterCommands(text) {
    const normalized = text.trim().toLowerCase();
    if (!normalized) {
        return allCommands;
    }
    return allCommands.filter((command) => `${command.title} ${command.description} ${command.category}`
        .toLowerCase()
        .includes(normalized));
}
function showPalette() {
    if (!palette) {
        return;
    }
    palette.hidden = false;
    renderPalette(filterCommands(filter?.value ?? ""));
    filter?.focus();
}
function hidePalette() {
    if (palette) {
        palette.hidden = true;
    }
}
function runSelectedCommand() {
    const command = visibleCommands[selectedIndex];
    if (!command) {
        return;
    }
    runCommandById(command.id, commandRunContext);
    hidePalette();
}
if (commandList) {
    for (const command of allCommands) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = command.title;
        button.addEventListener("click", () => {
            runCommandById(command.id, commandRunContext);
        });
        commandList.append(button);
    }
}
openButton?.addEventListener("click", showPalette);
workspaceTabsController.bind();
hotkeyEditor.bind();
dataLayerViewList?.addEventListener("click", (event) => {
    const button = event.target.closest("[role=tab]");
    const view = button?.textContent;
    if (view && dataLayerViews.includes(view))
        showDataLayerView(view, true);
});
dataLayerViewList?.addEventListener("keydown", (event) => {
    const next = dataLayerViewForNavigationKey(liveObserverState.view, event.key);
    if (next) {
        event.preventDefault();
        showDataLayerView(next, true);
    }
});
pauseCaptureButton?.addEventListener("click", () => {
    liveObserverState = pauseCapture(liveObserverState);
    setLiveSessionMessage("Capture paused");
    renderLiveObserver();
});
resumeCaptureButton?.addEventListener("click", () => {
    liveObserverState = resumeCapture(liveObserverState);
    setLiveSessionMessage("Capture resumed");
    renderLiveObserver();
});
saveLiveSessionButton?.addEventListener("click", () => {
    const completed = {
        id: `live-${Date.now()}`,
        pageScope: liveObserverState.pageUrl,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        events: liveObserverState.events.map((event, index) => ({
            id: event.id,
            sourceId: event.sourceId,
            sourceName: event.sourceId,
            name: event.name,
            payload: {},
            rawInput: event,
            pageUrl: liveObserverState.pageUrl,
            captureOrder: index + 1,
            provenance: { source: "live-observer", capturedAt: event.captureTime },
        })),
        provenance: { source: "live-observer", capturedAt: new Date().toISOString() },
    };
    savedSessionLibrary = saveCompletedSession(savedSessionLibrary, completed, `Session ${savedSessionLibrary.sessions.length + 1}`);
    renderSavedSessions();
    setLiveSessionMessage("Saved session created");
});
savedSessionSearch?.addEventListener("input", renderSavedSessions);
eventTemplateSearch?.addEventListener("input", renderEventTemplateLibrary);
saveLatestTemplateButton?.addEventListener("click", () => {
    const event = liveObserverState.events.at(-1);
    if (!event) {
        if (eventTemplateResult)
            eventTemplateResult.textContent = "Capture an event before saving a template.";
        return;
    }
    const source = liveObserverState.sources.find(({ id }) => id === event.sourceId);
    const template = createEditableTemplate({
        id: event.id,
        sessionId: `live:${liveObserverState.pageUrl}`,
        sourceId: event.sourceId,
        sourceKind: "page",
        name: event.name,
        captureTime: event.captureTime,
        pageUrl: liveObserverState.pageUrl,
        payload: {},
        rawInput: event,
        validation: "Not checked",
        provenance: `captured:${event.sourceId}`,
    }, {
        name: event.name,
        destination: "event.history",
        sourceName: source?.name ?? event.sourceId,
    });
    eventTemplates = [...eventTemplates, template];
    persistEventTemplateLibrary();
    if (eventTemplateResult)
        eventTemplateResult.textContent = `Saved ${template.name} to Library.`;
    renderEventTemplateLibrary();
});
eventTemplateJson?.addEventListener("input", () => {
    if (!propertyEditorState)
        return;
    propertyEditorState = updateDraftJson(propertyEditorState, eventTemplateJson.value);
    renderEventTemplateLibrary();
});
saveTemplateRevisionButton?.addEventListener("click", () => {
    if (!propertyEditorState)
        return;
    try {
        propertyEditorState = saveDraftRevision(propertyEditorState);
        eventTemplates = eventTemplates.map((template) => template.id === propertyEditorState?.template.id ? propertyEditorState.template : template);
        persistEventTemplateLibrary();
        if (eventTemplateResult)
            eventTemplateResult.textContent = `Saved ${propertyEditorState.template.name} as version ${propertyEditorState.template.version}.`;
        renderEventTemplateLibrary();
    }
    catch (error) {
        if (eventTemplateValidation)
            eventTemplateValidation.textContent = error instanceof Error ? error.message : "Draft is invalid.";
    }
});
saveTemplateCopyButton?.addEventListener("click", () => {
    if (!propertyEditorState)
        return;
    try {
        const copy = saveAsTemplateCopy(propertyEditorState, `${propertyEditorState.template.name} copy`);
        eventTemplates = [...eventTemplates, copy];
        persistEventTemplateLibrary();
        if (eventTemplateResult)
            eventTemplateResult.textContent = `Saved ${copy.name} as a distinct template.`;
        renderEventTemplateLibrary();
    }
    catch (error) {
        if (eventTemplateValidation)
            eventTemplateValidation.textContent = error instanceof Error ? error.message : "Draft is invalid.";
    }
});
pushTemplateDraftButton?.addEventListener("click", pushCurrentTemplateDraft);
discardTemplateDraftButton?.addEventListener("click", () => {
    if (!propertyEditorState)
        return;
    propertyEditorState = discardDraft(propertyEditorState);
    if (eventTemplateResult)
        eventTemplateResult.textContent = "Draft discarded.";
    renderEventTemplateLibrary();
});
importSavedSessionButton?.addEventListener("click", () => savedSessionFileInput?.click());
savedSessionFileInput?.addEventListener("change", () => {
    void loadSavedSessionFile();
});
cancelSavedSessionDeleteButton?.addEventListener("click", () => {
    savedSessionLibrary = cancelSavedSessionDeletion(savedSessionLibrary);
    if (savedSessionConfirmation)
        savedSessionConfirmation.textContent = "";
    cancelSavedSessionDeleteButton.hidden = true;
    if (confirmSavedSessionDeleteButton)
        confirmSavedSessionDeleteButton.hidden = true;
    renderSavedSessions();
});
confirmSavedSessionDeleteButton?.addEventListener("click", () => {
    savedSessionLibrary = confirmSavedSessionDeletion(savedSessionLibrary);
    if (savedSessionConfirmation)
        savedSessionConfirmation.textContent = "Saved session deleted.";
    confirmSavedSessionDeleteButton.hidden = true;
    if (cancelSavedSessionDeleteButton)
        cancelSavedSessionDeleteButton.hidden = true;
    renderSavedSessions();
});
backToEventsButton?.addEventListener("click", () => {
    const { inspectorEventId: _inspectorEventId, ...withoutInspector } = liveObserverState;
    liveObserverState = { ...withoutInspector, listVisible: true };
    renderLiveObserver();
});
createKeymapButton?.addEventListener("click", createHotkeyKeymapFile);
updateKeymapButton?.addEventListener("click", updateHotkeyKeymapFile);
loadKeymapButton?.addEventListener("click", () => {
    keymapFileInput?.click();
});
keymapFileInput?.addEventListener("change", () => {
    void loadHotkeyKeymapFile();
});
panelRoot?.addEventListener("keyup", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        showPalette();
    }
});
filter?.addEventListener("input", () => {
    renderPalette(filterCommands(filter.value));
});
filter?.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        runSelectedCommand();
    }
    if (event.key === "Escape") {
        event.preventDefault();
        hidePalette();
    }
});
historyPathInput?.addEventListener("input", () => {
    const typedPath = historyPathInput.value;
    const path = setHistoryArrayPath(typedPath);
    renderHistoryPath(path, typedPath);
    void activePageObservation(path).then((observation) => {
        dataLayerObserverState = attachHistoryArrayObserver(dataLayerObserverState, observation);
        updateSessionFromObserverState();
        persistAndRenderSessionState();
        restartLiveHistoryCaptureIfActive(observation);
        renderObserverState();
    });
});
restartObservationButton?.addEventListener("click", () => {
    void activePageObservation(getHistoryArrayPath()).then((observation) => {
        dataLayerObserverState = restartObservation(dataLayerSessionState, dataLayerObserverState, observation);
        updateSessionFromObserverState();
        persistAndRenderSessionState();
        restartLiveHistoryCaptureIfActive(observation);
        renderObserverState();
    });
});
document.addEventListener("keydown", handleHotkeyKeydown, true);
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
        if (isFocusHotkeysMessage(message)) {
            activateHotkeyFocus();
        }
    });
}
if (typeof chrome !== "undefined" && chrome.tabs?.onUpdated) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (!activeSessionTabMatches(tabId)) {
            return;
        }
        if (changeInfo.status === "loading" || changeInfo.url !== undefined) {
            observationRefreshState = beginObservedPageLoad(observationRefreshState);
            clearScheduledObservationRefresh();
            stopLiveHistoryCapture();
            if (changeInfo.url !== undefined) {
                dataLayerSessionState = navigateSession(dataLayerSessionState, changeInfo.url);
                persistAndRenderSessionState();
            }
        }
        if (changeInfo.status === "complete") {
            const pageUrl = tab.url ??
                changeInfo.url ??
                dataLayerSessionState.session?.currentUrl ??
                globalThis.location.href;
            refreshObservationAfterPageLoad(tabId, pageUrl, observationRefreshState.observedPageLoadSequence);
        }
    });
}
renderHistoryPath(getHistoryArrayPath());
renderSessionState();
renderObserverState();
showWorkspace(workspaceTabsController.activeTab());
hotkeyEditor.render();
showDataLayerView("Live");
renderLiveObserver();
renderSavedSessions();
renderEventTemplateLibrary();
activateHotkeyFocus();
export { DATA_LAYER_SESSION_STORAGE_KEY, HOTKEY_KEYMAP_STORAGE_KEY, navigateSession, sessionScope, };
//# sourceMappingURL=side-panel.js.map