import { listCommands, runCommandById, } from "./commands.js";
import { activePageObservation, tabPageObservation, } from "./active-page-observation.js";
import { getHistoryArrayPath, pathStatus, samplePageObject, setHistoryArrayPath, } from "./data-layer.js";
import { appendObservedHistoryEntry, attachHistoryArrayObserver, } from "./data-layer-observer.js";
import { startLiveHistoryPushCapture, } from "./data-layer-live-observation.js";
import { observerAttachmentStatus, restartObservation, } from "./data-layer-recovery.js";
import { captureEntry, DATA_LAYER_SESSION_STORAGE_KEY, endDataLayerTestingSession, navigateSession, persistSession, restoreSession, sessionScope, startDataLayerTestingSession, } from "./data-layer-session.js";
import { nestedTimeline, } from "./data-layer-timeline.js";
const PROJECT_NAME = "my-chrome-utilities";
const OBSERVATION_REFRESH_RETRY_DELAY_MS = 500;
const OBSERVATION_REFRESH_MAX_ATTEMPTS = 10;
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
const allCommands = [...listCommands()];
let visibleCommands = allCommands;
let selectedIndex = 0;
let dataLayerSessionState = restoreSession();
let dataLayerObserverState = {
    pageObject: samplePageObject(),
    observedEntries: [],
};
let stopLiveHistoryPushCapture = () => { };
let observationRefreshTimeoutId;
let observationRefreshToken = 0;
let observedPageLoadSequence = 0;
let scheduledObservationRefreshSequence;
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
function renderSessionState() {
    const session = dataLayerSessionState.session;
    if (sessionStatus) {
        sessionStatus.textContent = session?.status ?? "inactive";
    }
    if (sessionHistoryPath) {
        sessionHistoryPath.textContent = session?.historyPath ?? "";
    }
    if (sessionTimeline) {
        sessionTimeline.replaceChildren(...nestedTimeline(session?.timeline ?? []).map(renderTimelinePage));
    }
    if (sessionWarning) {
        sessionWarning.textContent = dataLayerSessionState.warning ?? "";
    }
}
function renderTimelinePage(page) {
    const item = document.createElement("li");
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const eventList = document.createElement("ul");
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
    summary.textContent = [event.name, event.timestamp, event.observerPath]
        .filter((value) => value.length > 0)
        .join(" | ");
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
    return {
        ...request,
        pageEntryCaptured: true,
    };
}
function scheduleObservationRefresh(request) {
    clearScheduledObservationRefresh();
    const delay = request.attempt === 0 ? 0 : OBSERVATION_REFRESH_RETRY_DELAY_MS;
    observationRefreshTimeoutId = globalThis.setTimeout(() => {
        observationRefreshTimeoutId = undefined;
        void runObservationRefresh(request);
    }, delay);
}
function refreshObservationAfterPageLoad(tabId, pageUrl, pageLoadSequence) {
    if (!activeSessionTabMatches(tabId)) {
        return;
    }
    if (scheduledObservationRefreshSequence === pageLoadSequence) {
        return;
    }
    scheduledObservationRefreshSequence = pageLoadSequence;
    observationRefreshToken += 1;
    scheduleObservationRefresh({
        token: observationRefreshToken,
        tabId,
        pageUrl,
        attempt: 0,
        pageEntryCaptured: false,
        pageLoadSequence,
    });
}
async function runObservationRefresh(request) {
    if (request.token !== observationRefreshToken ||
        !activeSessionTabMatches(request.tabId)) {
        return;
    }
    const session = dataLayerSessionState.session;
    if (!session) {
        return;
    }
    const nextRequest = capturePageEntryForRefresh(request);
    const observation = await tabPageObservation(nextRequest.tabId, nextRequest.pageUrl, session.historyPath);
    if (nextRequest.token !== observationRefreshToken ||
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
    if (observation.pageAccessStatus !== "page access unavailable" &&
        nextRequest.attempt + 1 < OBSERVATION_REFRESH_MAX_ATTEMPTS) {
        scheduleObservationRefresh({
            ...nextRequest,
            attempt: nextRequest.attempt + 1,
        });
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
if (typeof chrome !== "undefined" && chrome.tabs?.onUpdated) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (!activeSessionTabMatches(tabId)) {
            return;
        }
        if (changeInfo.status === "loading" || changeInfo.url !== undefined) {
            observedPageLoadSequence += 1;
            scheduledObservationRefreshSequence = undefined;
            observationRefreshToken += 1;
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
            refreshObservationAfterPageLoad(tabId, pageUrl, observedPageLoadSequence);
        }
    });
}
renderHistoryPath(getHistoryArrayPath());
renderSessionState();
renderObserverState();
export { DATA_LAYER_SESSION_STORAGE_KEY, navigateSession, sessionScope, };
//# sourceMappingURL=side-panel.js.map