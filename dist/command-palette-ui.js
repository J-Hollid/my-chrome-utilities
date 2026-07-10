import { filterPaletteCommands, selectedPaletteIndexForKey, } from "./command-palette.js";
export function createPaletteController({ root, sidePanelContent, commands, runCommand, }) {
    const openButton = document.querySelector("#open-palette");
    const palette = document.querySelector("#palette");
    const filter = document.querySelector("#palette-filter");
    const results = document.querySelector("#palette-results");
    let visibleCommands = commands;
    let selectedIndex = 0;
    let lastPaletteFocus = null;
    function renderPalette(nextCommands, selection = 0) {
        if (!results)
            return;
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
    function filterCommands(text) {
        return filterPaletteCommands(commands, text);
    }
    function showPalette() {
        if (!palette)
            return;
        lastPaletteFocus = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        sidePanelContent?.setAttribute("inert", "");
        palette.hidden = false;
        renderPalette(filterCommands(filter?.value ?? ""));
        filter?.focus();
    }
    function hidePalette() {
        if (palette)
            palette.hidden = true;
        sidePanelContent?.removeAttribute("inert");
        lastPaletteFocus?.focus();
        lastPaletteFocus = null;
    }
    function runSelectedCommand() {
        const command = visibleCommands[selectedIndex];
        if (!command)
            return;
        runCommand(command);
        hidePalette();
    }
    function bind() {
        openButton?.addEventListener("click", showPalette);
        root?.addEventListener("keyup", (event) => {
            if (event.ctrlKey && event.key.toLowerCase() === "k") {
                event.preventDefault();
                showPalette();
            }
        });
        filter?.addEventListener("input", () => {
            renderPalette(filterCommands(filter.value));
        });
        filter?.addEventListener("keydown", (event) => {
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
        });
        results?.addEventListener("click", (event) => {
            const item = event.target.closest("[data-command-id]");
            if (!item)
                return;
            const index = Array.from(results.children).indexOf(item);
            if (index < 0)
                return;
            selectedIndex = index;
            runSelectedCommand();
        });
        palette?.addEventListener("keydown", (event) => {
            if (event.key === "Tab") {
                event.preventDefault();
                filter?.focus();
            }
        });
    }
    return { bind, show: showPalette };
}
//# sourceMappingURL=command-palette-ui.js.map