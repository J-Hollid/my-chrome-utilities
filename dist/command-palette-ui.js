import { filterPaletteCommands, selectedPaletteIndexForKey, } from "./command-palette.js";
export function createPaletteController({ commands, executeCommand, elements, ownerDocument, }) {
    const { root, launcher, palette, filter, results, sidePanelContent } = elements;
    const openButton = launcher;
    let visibleCommands = commands;
    let selectedIndex = 0;
    let lastPaletteFocus = null;
    let mounted = false;
    function renderPalette(nextCommands, selection = 0) {
        if (!results)
            return;
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
    function filterCommands(text) {
        return filterPaletteCommands(commands, text);
    }
    function focusableElement(element) {
        return element && typeof element.focus === "function"
            ? element
            : null;
    }
    function render() {
        renderPalette(filterCommands(filter?.value ?? ""), selectedIndex);
    }
    function showPalette() {
        if (!palette)
            return;
        if (palette.hidden) {
            lastPaletteFocus = focusableElement(ownerDocument.activeElement);
        }
        sidePanelContent?.setAttribute("inert", "");
        palette.hidden = false;
        selectedIndex = 0;
        renderPalette(filterCommands(filter?.value ?? ""));
        filter?.focus();
    }
    function hidePalette() {
        if (palette)
            palette.hidden = true;
        sidePanelContent?.removeAttribute("inert");
        if (lastPaletteFocus?.isConnected !== false)
            lastPaletteFocus?.focus();
        lastPaletteFocus = null;
    }
    function runSelectedCommand() {
        const command = visibleCommands[selectedIndex];
        if (!command)
            return;
        executeCommand(command);
        hidePalette();
    }
    const open = () => showPalette();
    const rootKeyup = (event) => {
        if (event.ctrlKey && event.key.toLowerCase() === "k") {
            event.preventDefault();
            showPalette();
        }
    };
    const filterInput = () => {
        selectedIndex = 0;
        renderPalette(filterCommands(filter?.value ?? ""));
    };
    const filterKeydown = (event) => {
        const nextIndex = selectedPaletteIndexForKey(event.key, selectedIndex, visibleCommands.length);
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
    const resultClick = (event) => {
        const target = event.target;
        const item = target?.closest?.("[data-command-id]");
        if (!item || !results)
            return;
        const index = Array.from(results.children).indexOf(item);
        if (index < 0)
            return;
        selectedIndex = index;
        runSelectedCommand();
    };
    const trapTab = (event) => {
        if (event.key === "Tab") {
            event.preventDefault();
            filter?.focus();
        }
    };
    function mount() {
        if (mounted)
            return;
        mounted = true;
        visibleCommands = commands;
        selectedIndex = 0;
        lastPaletteFocus = null;
        openButton?.addEventListener("click", open);
        root?.addEventListener("keyup", rootKeyup);
        filter?.addEventListener("input", filterInput);
        filter?.addEventListener("keydown", filterKeydown);
        results?.addEventListener("click", resultClick);
        palette?.addEventListener("keydown", trapTab);
    }
    function dispose() {
        if (!mounted)
            return;
        mounted = false;
        openButton?.removeEventListener("click", open);
        root?.removeEventListener("keyup", rootKeyup);
        filter?.removeEventListener("input", filterInput);
        filter?.removeEventListener("keydown", filterKeydown);
        results?.removeEventListener("click", resultClick);
        palette?.removeEventListener("keydown", trapTab);
        if ((palette && !palette.hidden) || lastPaletteFocus)
            hidePalette();
        else
            sidePanelContent?.removeAttribute("inert");
        visibleCommands = commands;
        selectedIndex = 0;
        lastPaletteFocus = null;
    }
    return { mount, render, show: showPalette, hide: hidePalette, dispose };
}
//# sourceMappingURL=command-palette-ui.js.map