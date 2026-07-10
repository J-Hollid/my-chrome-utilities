import { listCommands, runCommandById, } from "./commands.js";
import { advanceHotkeySequence, blankHotkeyKeymap, changeHotkeyBinding, duplicateSequences, HOTKEY_KEYMAP_STORAGE_KEY, keyTokenFromKeyboardEvent, updateHotkeyKeymap, validateHotkeyKeymap, } from "./hotkey-keymap.js";
import { isWorkspaceTabId, WORKSPACE_TAB_STORAGE_KEY, workspaceTabForNavigationKey, workspaceTabs, } from "./workspace-tabs.js";
import { activePageObservation, tabPageObservation, } from "./active-page-observation.js";
import { getHistoryArrayPath, pathStatus, samplePageObject, setHistoryArrayPath, } from "./data-layer.js";
import { appendObservedHistoryEntry, attachHistoryArrayObserver, } from "./data-layer-observer.js";
import { beginObservedPageLoad, initialObservationRefreshState, markObservationRefreshPageEntryCaptured, nextObservationRefreshAttempt, observationRefreshDelay, observationRefreshRequestForPageLoad, observationRefreshRequestIsCurrent, shouldRetryObservationRefresh, } from "./data-layer-observation-refresh.js";
import { startLiveHistoryPushCapture, } from "./data-layer-live-observation.js";
import { observerAttachmentStatus, restartObservation, } from "./data-layer-recovery.js";
import { captureEntry, DATA_LAYER_SESSION_STORAGE_KEY, endDataLayerTestingSession, navigateSession, persistSession, restoreSession, sessionScope, startDataLayerTestingSession, } from "./data-layer-session.js";
import { nestedTimeline, timelineEventHeading, } from "./data-layer-timeline.js";
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
const allCommands = [...listCommands()];
let visibleCommands = allCommands;
let selectedIndex = 0;
let activeHotkeyKeymap = loadStoredHotkeyKeymap() ?? blankHotkeyKeymap(allCommands);
let pendingHotkeySequence = [];
let activeWorkspaceTab = loadWorkspaceTab();
let dataLayerSessionState = restoreSession();
let dataLayerObserverState = {
    pageObject: samplePageObject(),
    observedEntries: [],
};
let stopLiveHistoryPushCapture = () => { };
let observationRefreshTimeoutId;
let observationRefreshState = initialObservationRefreshState;
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
}
const commandRunContext = {
    record: recordCommandRun,
    showWorkspace,
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
function loadWorkspaceTab() {
    const stored = localStorage.getItem(WORKSPACE_TAB_STORAGE_KEY);
    return isWorkspaceTabId(stored) ? stored : "data-layer";
}
function showWorkspace(tab, focus = false) {
    activeWorkspaceTab = tab;
    localStorage.setItem(WORKSPACE_TAB_STORAGE_KEY, tab);
    for (const workspaceTab of workspaceTabs) {
        const button = document.querySelector(`#workspace-tab-${workspaceTab.id}`);
        const panel = document.querySelector(`#workspace-panel-${workspaceTab.id}`);
        const selected = workspaceTab.id === tab;
        if (button) {
            button.setAttribute("aria-selected", String(selected));
            button.tabIndex = selected ? 0 : -1;
            if (focus)
                button.focus();
        }
        if (panel)
            panel.hidden = !selected;
    }
}
function editorGroupLabel(command) {
    if (command.category === "navigation")
        return "Navigation";
    if (command.category === "data-layer")
        return "Workspace";
    return "General";
}
function renderHotkeyEditor() {
    if (!hotkeyEditorCommands)
        return;
    const query = hotkeyEditorFilter?.value.trim().toLowerCase() ?? "";
    const matching = allCommands.filter((command) => `${command.title} ${command.id} ${activeHotkeyKeymap.bindings[command.id] ?? ""}`
        .toLowerCase().includes(query));
    hotkeyEditorCommands.replaceChildren();
    const groups = new Map();
    for (const command of matching) {
        const label = editorGroupLabel(command);
        groups.set(label, [...(groups.get(label) ?? []), command]);
    }
    for (const [label, commands] of groups) {
        const section = document.createElement("section");
        const heading = document.createElement("h3");
        const list = document.createElement("ul");
        heading.textContent = label;
        for (const command of commands) {
            const item = document.createElement("li");
            const title = document.createElement("strong");
            const id = document.createElement("code");
            const input = document.createElement("input");
            const save = document.createElement("button");
            const clear = document.createElement("button");
            title.textContent = command.title;
            id.textContent = command.id;
            input.type = "text";
            input.value = activeHotkeyKeymap.bindings[command.id] ?? "";
            input.placeholder = "Unassigned";
            input.dataset.commandId = command.id;
            input.addEventListener("input", () => setKeymapStatus(`Pending hotkey change: ${input.value}`));
            input.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    input.value = activeHotkeyKeymap.bindings[command.id] ?? "";
                    setKeymapStatus("");
                }
            });
            save.type = "button";
            save.textContent = "Save";
            save.addEventListener("click", () => commitHotkeyChange(command, input.value));
            clear.type = "button";
            clear.textContent = "Clear";
            clear.addEventListener("click", () => commitHotkeyChange(command, ""));
            item.append(title, document.createTextNode(" "), id, input, save, clear);
            list.append(item);
        }
        section.append(heading, list);
        hotkeyEditorCommands.append(section);
    }
}
function commitHotkeyChange(command, sequence) {
    const change = changeHotkeyBinding(activeHotkeyKeymap, command.id, sequence);
    if (!change.keymap) {
        setKeymapWarning(`Conflict: ${change.sequence} is assigned to ${change.conflictingCommandId}; ${command.id} was not changed.`);
        return;
    }
    activeHotkeyKeymap = change.keymap;
    storeHotkeyKeymap(activeHotkeyKeymap);
    setKeymapWarning("");
    setKeymapStatus(change.sequence ? `Hotkey updated: ${command.id}` : `Hotkey cleared: ${command.id}`);
    renderHotkeyEditor();
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
    clearPendingHotkeySequence();
    setKeymapWarning("");
    setKeymapStatus("Keymap loaded");
    activateHotkeyFocus();
    return true;
}
function createHotkeyKeymapFile() {
    activeHotkeyKeymap = blankHotkeyKeymap(allCommands);
    downloadHotkeyKeymapFile(activeHotkeyKeymap);
    setKeymapWarning("");
    setKeymapStatus("Blank keymap created");
}
function updateHotkeyKeymapFile() {
    const summary = updateHotkeyKeymap(activeHotkeyKeymap, allCommands);
    activeHotkeyKeymap = summary.keymap;
    downloadHotkeyKeymapFile(activeHotkeyKeymap);
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
workspaceTabList?.addEventListener("click", (event) => {
    const button = event.target.closest("[role=tab]");
    const tab = button?.id.replace("workspace-tab-", "") ?? null;
    if (isWorkspaceTabId(tab))
        showWorkspace(tab, true);
});
workspaceTabList?.addEventListener("keydown", (event) => {
    const next = workspaceTabForNavigationKey(activeWorkspaceTab, event.key);
    if (next) {
        event.preventDefault();
        showWorkspace(next, true);
    }
});
hotkeyEditorFilter?.addEventListener("input", renderHotkeyEditor);
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
showWorkspace(activeWorkspaceTab);
renderHotkeyEditor();
activateHotkeyFocus();
export { DATA_LAYER_SESSION_STORAGE_KEY, HOTKEY_KEYMAP_STORAGE_KEY, navigateSession, sessionScope, };
//# sourceMappingURL=side-panel.js.map