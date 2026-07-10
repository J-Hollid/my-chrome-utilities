import { listCommands, runCommandById, } from "./commands.js";
import { advanceHotkeySequence, blankHotkeyKeymap, duplicateSequences, HOTKEY_KEYMAP_STORAGE_KEY, keyTokenFromKeyboardEvent, shouldIgnoreHotkeyTarget, updateHotkeyKeymap, validateHotkeyKeymap, } from "./hotkey-keymap.js";
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
        runCommandById(advance.commandId, { record: recordCommandRun });
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
    runCommandById(command.id, { record: recordCommandRun });
    hidePalette();
}
if (commandList) {
    for (const command of allCommands) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = command.title;
        button.addEventListener("click", () => {
            runCommandById(command.id, { record: recordCommandRun });
        });
        commandList.append(button);
    }
}
openButton?.addEventListener("click", showPalette);
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
activateHotkeyFocus();
export { DATA_LAYER_SESSION_STORAGE_KEY, HOTKEY_KEYMAP_STORAGE_KEY, navigateSession, sessionScope, };
//# sourceMappingURL=side-panel.js.map