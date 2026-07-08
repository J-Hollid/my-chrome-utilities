import {
  listCommands,
  runCommandById,
  type AppCommand,
  type CommandRunRecord,
} from "./commands";

const PROJECT_NAME = "my-chrome-utilities";

const app = document.querySelector<HTMLElement>("#app");
const panelRoot = document.querySelector<HTMLElement>("#side-panel-root");
const commandList = document.querySelector<HTMLElement>("#commands");
const commandLog = document.querySelector<HTMLElement>("#command-log");
const openButton = document.querySelector<HTMLButtonElement>("#open-palette");
const palette = document.querySelector<HTMLElement>("#palette");
const filter = document.querySelector<HTMLInputElement>("#palette-filter");
const results = document.querySelector<HTMLElement>("#palette-results");
const allCommands = [...listCommands()];

let visibleCommands: readonly AppCommand[] = allCommands;
let selectedIndex = 0;

if (app) {
  app.textContent = PROJECT_NAME;
}

function recordCommandRun(entry: CommandRunRecord): void {
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
