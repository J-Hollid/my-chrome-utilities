import { listCommands, runCommandById, } from "./commands.js";
import { getHistoryArrayPath, pathStatus, samplePageObject, setHistoryArrayPath, } from "./data-layer.js";
import { attachHistoryArrayObserver, } from "./data-layer-observer.js";
import { observerAttachmentStatus, restartObservation, } from "./data-layer-recovery.js";
import { captureEntry, DATA_LAYER_SESSION_STORAGE_KEY, endDataLayerTestingSession, navigateSession, persistSession, restoreSession, sessionScope, startDataLayerTestingSession, } from "./data-layer-session.js";
import { timelineDetails, timelineSummary } from "./data-layer-timeline.js";
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
const allCommands = [...listCommands()];
let visibleCommands = allCommands;
let selectedIndex = 0;
let dataLayerSessionState = restoreSession();
let dataLayerObserverState = {
    pageObject: samplePageObject(),
    observedEntries: [],
};
if (app) {
    app.textContent = PROJECT_NAME;
}
function renderHistoryPath(path) {
    if (historyPathInput) {
        historyPathInput.value = path;
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
        sessionTimeline.replaceChildren(...(session?.timeline ?? []).map((entry) => {
            const item = document.createElement("li");
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            const summaryData = timelineSummary(entry);
            const detailData = timelineDetails(entry);
            const definitionList = document.createElement("dl");
            summary.textContent = [
                summaryData.name,
                summaryData.url,
                summaryData.timestamp,
                summaryData.observerPath,
            ]
                .filter((value) => value.length > 0)
                .join(" | ");
            appendDefinition(definitionList, "Event", detailData.name);
            appendDefinition(definitionList, "URL", detailData.url);
            appendDefinition(definitionList, "Time", detailData.timestamp);
            appendDefinition(definitionList, "Path", detailData.observerPath);
            appendDefinition(definitionList, "Payload", detailData.payload);
            appendDefinition(definitionList, "Raw", detailData.rawValue);
            details.append(summary, definitionList);
            item.append(details);
            return item;
        }));
    }
    if (sessionWarning) {
        sessionWarning.textContent = dataLayerSessionState.warning ?? "";
    }
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
async function activeTabPageUrl() {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        return tab?.url ?? globalThis.location.href;
    }
    catch {
        return globalThis.location.href;
    }
}
async function recordDataLayerCommandRun(entry) {
    if (entry.commandId === "data-layer.start-testing") {
        const sessionWasActive = dataLayerSessionState.session?.status === "active";
        const pageUrl = await activeTabPageUrl();
        dataLayerSessionState = startDataLayerTestingSession(dataLayerSessionState, {
            tabId: 1,
            url: pageUrl,
            historyPath: getHistoryArrayPath(),
        });
        if (!sessionWasActive) {
            dataLayerSessionState = captureEntry(dataLayerSessionState, {
                type: "page",
                url: pageUrl,
            });
            dataLayerObserverState = attachHistoryArrayObserver(dataLayerObserverState, {
                historyPath: getHistoryArrayPath(),
                pageUrl,
            });
        }
        persistSession(dataLayerSessionState);
        renderSessionState();
        renderObserverState();
    }
    if (entry.commandId === "data-layer.end-testing") {
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
    const path = setHistoryArrayPath(historyPathInput.value);
    renderHistoryPath(path);
    void activeTabPageUrl().then((pageUrl) => {
        dataLayerObserverState = attachHistoryArrayObserver(dataLayerObserverState, {
            historyPath: path,
            pageUrl,
        });
        renderObserverState();
    });
});
restartObservationButton?.addEventListener("click", () => {
    void activeTabPageUrl().then((pageUrl) => {
        dataLayerObserverState = restartObservation(dataLayerSessionState, dataLayerObserverState, {
            pageUrl,
        });
        renderObserverState();
    });
});
renderHistoryPath(getHistoryArrayPath());
renderSessionState();
renderObserverState();
export { DATA_LAYER_SESSION_STORAGE_KEY, navigateSession, sessionScope, };
//# sourceMappingURL=side-panel.js.map