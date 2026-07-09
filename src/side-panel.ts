import {
  listCommands,
  runCommandById,
  type AppCommand,
  type CommandRunRecord,
} from "./commands.js";
import { activePageObservation } from "./active-page-observation.js";
import {
  getHistoryArrayPath,
  pathStatus,
  samplePageObject,
  setHistoryArrayPath,
} from "./data-layer.js";
import {
  attachHistoryArrayObserver,
  type DataLayerHistoryObserverState,
} from "./data-layer-observer.js";
import {
  observerAttachmentStatus,
  restartObservation,
} from "./data-layer-recovery.js";
import {
  captureEntry,
  DATA_LAYER_SESSION_STORAGE_KEY,
  endDataLayerTestingSession,
  navigateSession,
  persistSession,
  restoreSession,
  sessionScope,
  startDataLayerTestingSession,
  type DataLayerSessionState,
} from "./data-layer-session.js";
import { timelineDetails, timelineSummary } from "./data-layer-timeline.js";

const PROJECT_NAME = "my-chrome-utilities";

const app = document.querySelector<HTMLElement>("#app");
const panelRoot = document.querySelector<HTMLElement>("#side-panel-root");
const commandList = document.querySelector<HTMLElement>("#commands");
const commandLog = document.querySelector<HTMLElement>("#command-log");
const openButton = document.querySelector<HTMLButtonElement>("#open-palette");
const palette = document.querySelector<HTMLElement>("#palette");
const filter = document.querySelector<HTMLInputElement>("#palette-filter");
const results = document.querySelector<HTMLElement>("#palette-results");
const historyPathInput = document.querySelector<HTMLInputElement>("#history-path");
const historyPathDisplay = document.querySelector<HTMLElement>(
  "#history-path-display",
);
const historyPathStatus = document.querySelector<HTMLElement>(
  "#history-path-status",
);
const sessionStatus = document.querySelector<HTMLElement>("#session-status");
const sessionHistoryPath = document.querySelector<HTMLElement>(
  "#session-history-path",
);
const sessionTimeline = document.querySelector<HTMLElement>("#session-timeline");
const sessionWarning = document.querySelector<HTMLElement>("#session-warning");
const observerStatus = document.querySelector<HTMLElement>("#observer-status");
const restartObservationButton = document.querySelector<HTMLButtonElement>(
  "#restart-observation",
);
const allCommands = [...listCommands()];

let visibleCommands: readonly AppCommand[] = allCommands;
let selectedIndex = 0;
let dataLayerSessionState: DataLayerSessionState = restoreSession();
let dataLayerObserverState: DataLayerHistoryObserverState = {
  pageObject: samplePageObject(),
  observedEntries: [],
};

if (app) {
  app.textContent = PROJECT_NAME;
}

function renderHistoryPath(path: string): void {
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

function renderSessionState(): void {
  const session = dataLayerSessionState.session;

  if (sessionStatus) {
    sessionStatus.textContent = session?.status ?? "inactive";
  }

  if (sessionHistoryPath) {
    sessionHistoryPath.textContent = session?.historyPath ?? "";
  }

  if (sessionTimeline) {
    sessionTimeline.replaceChildren(
      ...(session?.timeline ?? []).map((entry) => {
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
      }),
    );
  }

  if (sessionWarning) {
    sessionWarning.textContent = dataLayerSessionState.warning ?? "";
  }
}

function appendDefinition(list: HTMLElement, label: string, value: string): void {
  if (!value) {
    return;
  }

  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  list.append(term, description);
}

function renderObserverState(): void {
  if (observerStatus) {
    observerStatus.textContent = observerAttachmentStatus(
      dataLayerSessionState,
      dataLayerObserverState,
    );
  }
}

async function recordDataLayerCommandRun(entry: CommandRunRecord): Promise<void> {
  if (entry.commandId === "data-layer.start-testing") {
    const sessionWasActive = dataLayerSessionState.session?.status === "active";
    const historyPath = getHistoryArrayPath();
    const observation = await activePageObservation(historyPath);
    dataLayerSessionState = startDataLayerTestingSession(dataLayerSessionState, {
      tabId: 1,
      url: observation.pageUrl,
      historyPath,
    });
    if (!sessionWasActive) {
      dataLayerSessionState = captureEntry(dataLayerSessionState, {
        type: "page",
        url: observation.pageUrl,
      });
      dataLayerObserverState = attachHistoryArrayObserver(
        { ...dataLayerObserverState, sessionState: dataLayerSessionState },
        observation,
      );
      dataLayerSessionState =
        dataLayerObserverState.sessionState ?? dataLayerSessionState;
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

function recordCommandRun(entry: CommandRunRecord): void {
  void recordDataLayerCommandRun(entry);

  if (commandLog) {
    commandLog.textContent = entry.message;
  }
}

function renderPalette(commands: readonly AppCommand[]): void {
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

function filterCommands(text: string): readonly AppCommand[] {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return allCommands;
  }

  return allCommands.filter((command) =>
    `${command.title} ${command.description} ${command.category}`
      .toLowerCase()
      .includes(normalized),
  );
}

function showPalette(): void {
  if (!palette) {
    return;
  }

  palette.hidden = false;
  renderPalette(filterCommands(filter?.value ?? ""));
  filter?.focus();
}

function hidePalette(): void {
  if (palette) {
    palette.hidden = true;
  }
}

function runSelectedCommand(): void {
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

panelRoot?.addEventListener("keyup", (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key.toLowerCase() === "k") {
    event.preventDefault();
    showPalette();
  }
});

filter?.addEventListener("input", () => {
  renderPalette(filterCommands(filter.value));
});

filter?.addEventListener("keyup", (event: KeyboardEvent) => {
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
  void activePageObservation(path).then((observation) => {
    dataLayerObserverState = attachHistoryArrayObserver(
      dataLayerObserverState,
      observation,
    );
    dataLayerSessionState =
      dataLayerObserverState.sessionState ?? dataLayerSessionState;
    persistSession(dataLayerSessionState);
    renderSessionState();
    renderObserverState();
  });
});

restartObservationButton?.addEventListener("click", () => {
  void activePageObservation(getHistoryArrayPath()).then((observation) => {
    dataLayerObserverState = restartObservation(
      dataLayerSessionState,
      dataLayerObserverState,
      observation,
    );
    dataLayerSessionState =
      dataLayerObserverState.sessionState ?? dataLayerSessionState;
    persistSession(dataLayerSessionState);
    renderSessionState();
    renderObserverState();
  });
});

renderHistoryPath(getHistoryArrayPath());
renderSessionState();
renderObserverState();

export {
  DATA_LAYER_SESSION_STORAGE_KEY,
  navigateSession,
  sessionScope,
};
