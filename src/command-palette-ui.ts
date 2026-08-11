import type { AppCommand } from "./commands.js";
import {
  filterPaletteCommands,
  selectedPaletteIndexForKey,
} from "./command-palette.js";

export interface PaletteController {
  mount(): void;
  render(): void;
  show(): void;
  hide(): void;
  dispose(): void;
}

export interface PaletteElements {
  root: HTMLElement | null;
  launcher: HTMLButtonElement | null;
  palette: HTMLElement | null;
  filter: HTMLInputElement | null;
  results: HTMLElement | null;
  sidePanelContent: HTMLElement | null;
}

export interface PaletteDocument {
  readonly activeElement: Element | null;
  createElement(tagName: "li"): HTMLElement;
}

export interface PaletteOptions {
  commands: readonly AppCommand[];
  executeCommand(command: AppCommand): void;
  elements: PaletteElements;
  ownerDocument: PaletteDocument;
}

export function createPaletteController({
  commands,
  executeCommand,
  elements,
  ownerDocument,
}: PaletteOptions): PaletteController {
  const { root, launcher, palette, filter, results, sidePanelContent } = elements;
  const openButton = launcher;
  let visibleCommands: readonly AppCommand[] = commands;
  let selectedIndex = 0;
  let lastPaletteFocus: HTMLElement | null = null;
  let mounted = false;

  function resetTransientState(): void {
    visibleCommands = commands;
    selectedIndex = 0;
    lastPaletteFocus = null;
  }

  function renderPalette(nextCommands: readonly AppCommand[], selection = 0): void {
    if (!results) return;

    visibleCommands = nextCommands;
    selectedIndex = nextCommands.length === 0
      ? 0
      : Math.min(Math.max(selection, 0), nextCommands.length - 1);
    results.replaceChildren();

    for (const [index, command] of nextCommands.entries()) {
      const item = ownerDocument.createElement("li");
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

  function focusableElement(element: Element | null): HTMLElement | null {
    return element && typeof (element as HTMLElement).focus === "function"
      ? element as HTMLElement
      : null;
  }

  function render(): void {
    renderPalette(filterCommands(filter?.value ?? ""), selectedIndex);
  }

  function showPalette(): void {
    if (!palette) return;

    if (palette.hidden) {
      lastPaletteFocus = focusableElement(ownerDocument.activeElement);
    }
    sidePanelContent?.setAttribute("inert", "");
    palette.hidden = false;
    selectedIndex = 0;
    renderPalette(filterCommands(filter?.value ?? ""));
    filter?.focus();
  }

  function hidePalette(): void {
    if (palette) palette.hidden = true;
    sidePanelContent?.removeAttribute("inert");
    if (lastPaletteFocus?.isConnected !== false) lastPaletteFocus?.focus();
    lastPaletteFocus = null;
  }

  function runSelectedCommand(): void {
    const command = visibleCommands[selectedIndex];
    if (!command) return;

    executeCommand(command);
    hidePalette();
  }

  const open = (): void => showPalette();
  const rootKeyup = (event: KeyboardEvent): void => {
    if (event.ctrlKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      showPalette();
    }
  };
  const filterInput = (): void => {
    selectedIndex = 0;
    renderPalette(filterCommands(filter?.value ?? ""));
  };
  const filterKeydown = (event: KeyboardEvent): void => {
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
  };
  const resultClick = (event: Event): void => {
    const target = event.target as (Element & { closest?<E extends Element>(selector: string): E | null }) | null;
    const item = target?.closest?.<HTMLElement>("[data-command-id]");
    if (!item || !results) return;
    const index = Array.from(results.children).indexOf(item);
    if (index < 0) return;
    selectedIndex = index;
    runSelectedCommand();
  };
  const trapTab = (event: KeyboardEvent): void => {
    if (event.key === "Tab") {
      event.preventDefault();
      filter?.focus();
    }
  };

  function mount(): void {
    if (mounted) return;
    mounted = true;
    resetTransientState();
    openButton?.addEventListener("click", open);
    root?.addEventListener("keyup", rootKeyup);
    filter?.addEventListener("input", filterInput);
    filter?.addEventListener("keydown", filterKeydown);
    results?.addEventListener("click", resultClick);
    palette?.addEventListener("keydown", trapTab);
  }

  function dispose(): void {
    if (!mounted) return;
    mounted = false;
    openButton?.removeEventListener("click", open);
    root?.removeEventListener("keyup", rootKeyup);
    filter?.removeEventListener("input", filterInput);
    filter?.removeEventListener("keydown", filterKeydown);
    results?.removeEventListener("click", resultClick);
    palette?.removeEventListener("keydown", trapTab);
    if ((palette && !palette.hidden) || lastPaletteFocus) hidePalette();
    else sidePanelContent?.removeAttribute("inert");
    resetTransientState();
  }

  return { mount, render, show: showPalette, hide: hidePalette, dispose };
}
