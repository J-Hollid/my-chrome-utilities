export function renderEventLibraryState(input: {
  state: HTMLElement | null; recovery: HTMLButtonElement | null;
  exportButton: HTMLButtonElement | null; clearButton: HTMLButtonElement | null;
  empty: boolean; visibleCount: number; query: string;
}): void {
  const {state, recovery, exportButton, clearButton, empty, visibleCount, query} = input;
  if (exportButton) exportButton.disabled = empty;
  if (clearButton) { clearButton.disabled = empty; clearButton.hidden = empty; }
  if (state) {
    state.hidden = visibleCount > 0;
    const heading = state.querySelector("h4"), description = state.querySelector("p");
    if (heading) heading.textContent = empty ? "No event templates yet" : "No matching templates";
    if (description) description.textContent = empty
      ? "Create an event template with Add new event, import a library, or save a captured event from Live."
      : "Change the search or clear it to show your saved templates.";
  }
  if (recovery) {
    recovery.hidden = visibleCount > 0;
    recovery.textContent = query.trim() ? "Clear template search" : "Return to Live events";
  }
}
