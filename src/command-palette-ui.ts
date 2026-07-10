import type { AppCommand } from "./commands.js";
import {
  filterPaletteCommands,
  selectedPaletteIndexForKey,
} from "./command-palette.js";

export interface PaletteController {
  bind(): void;
  show(): void;
}

export interface PaletteOptions {
  root: HTMLElement | null;
  sidePanelContent: HTMLElement | null;
  commands: readonly AppCommand[];
  runCommand(command: AppCommand): void;
}

export function createPaletteController({
  root,
  sidePanelContent,
  commands,
  runCommand,
}: PaletteOptions): PaletteController {
  const openButton = document.querySelector<HTMLButtonElement>("#open-palette");
  const palette = document.querySelector<HTMLElement>("#palette");
  const filter = document.querySelector<HTMLInputElement>("#palette-filter");
  const results = document.querySelector<HTMLElement>("#palette-results");
  let visibleCommands: readonly AppCommand[] = commands;
  let selectedIndex = 0;
  let lastPaletteFocus: HTMLElement | null = null;

  function renderPalette(nextCommands: readonly AppCommand[], selection = 0): void {
    if (!results) return;

    visibleCommands = nextCommands;
    selectedIndex = nextCommands.length === 0
      ? 0
      : Math.min(Math.max(selection, 0), nextCommands.length - 1);
    results.replaceChildren();

    for (const [index, command] of nextCommands.entries()) {
      const item = document.createElement("li");
      item.id = `palette-result-${index}`;
      item.setAttribute("role", "option");
      item.textContent = command.title;
      item.dataset.commandId = command.id;
      item.dataset.selected = index === selectedIndex ? "true" : "false";
      item.setAttribute("aria-selected", String(index === selectedIndex));
      results.append(item);
    }
  }

  function filterCommands(text: string): readonly AppCommand[] {
    return filterPaletteCommands(commands, text);
  }

  function showPalette(): void {
    if (!palette) return;

    lastPaletteFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    sidePanelContent?.setAttribute("inert", "");
    palette.hidden = false;
    renderPalette(filterCommands(filter?.value ?? ""));
    filter?.focus();
  }

  function hidePalette(): void {
    if (palette) palette.hidden = true;
    sidePanelContent?.removeAttribute("inert");
    lastPaletteFocus?.focus();
    lastPaletteFocus = null;
  }

  function runSelectedCommand(): void {
    const command = visibleCommands[selectedIndex];
    if (!command) return;

    runCommand(command);
    hidePalette();
  }

  function bind(): void {
    openButton?.addEventListener("click", showPalette);
    root?.addEventListener("keyup", (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        showPalette();
      }
    });
    filter?.addEventListener("input", () => {
      renderPalette(filterCommands(filter.value));
    });
    filter?.addEventListener("keydown", (event: KeyboardEvent) => {
      const nextIndex = selectedPaletteIndexForKey(
        event.key,
        selectedIndex,
        visibleCommands.length,
      );
      if (nextIndex !== undefined) {
        event.preventDefault();
        renderPalette(visibleCommands, nextIndex);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        runSelectedCommand();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        hidePalette();
      }
    });
    results?.addEventListener("click", (event) => {
      const item = (event.target as Element).closest<HTMLElement>("[data-command-id]");
      if (!item) return;
      const index = Array.from(results.children).indexOf(item);
      if (index < 0) return;
      selectedIndex = index;
      runSelectedCommand();
    });
    palette?.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        filter?.focus();
      }
    });
  }

  return { bind, show: showPalette };
}
