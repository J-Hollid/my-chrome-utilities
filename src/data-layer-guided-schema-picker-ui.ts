import {
  assignmentScopeSummary,
  searchSchemaDestinationOptions,
  type GuidedSchemaCandidate,
  type GuidedValidationDraft,
} from "./data-layer-guided-validation.js";

export interface GuidedSchemaPickerOptions {
  container: HTMLElement;
  draft: GuidedValidationDraft;
  candidates: readonly GuidedSchemaCandidate[];
  query: string;
  onQuery(query: string): void;
  onClose(): void;
  onSelect(candidate: GuidedSchemaCandidate): void;
}

function element<K extends keyof HTMLElementTagNameMap>(name: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(name);
  if (text !== undefined) result.textContent = text;
  return result;
}

export function renderGuidedSchemaPicker({
  container,
  draft,
  candidates,
  query,
  onQuery,
  onClose,
  onSelect,
}: GuidedSchemaPickerOptions): void {
  const options = searchSchemaDestinationOptions(draft, candidates, query);
  const dialog = element("dialog"); dialog.id = "guided-schema-picker"; dialog.setAttribute("aria-labelledby", "guided-schema-picker-heading");
  const heading = element("h5", "Choose an existing schema"); heading.id = "guided-schema-picker-heading";
  const close = element("button", "Close schema picker"); close.type = "button"; close.addEventListener("click", onClose);
  const searchLabel = element("label", "Schema search"); searchLabel.htmlFor = "guided-schema-search";
  const search = element("input"); search.id = "guided-schema-search"; search.type = "search"; search.value = query; search.setAttribute("aria-describedby", "guided-schema-search-hint");
  const searchHint = element("p", "Search schema names, versions, targets, properties, events, domains, and paths."); searchHint.id = "guided-schema-search-hint";
  search.addEventListener("input", () => onQuery(search.value));
  const count = element("output", `${options.length} of ${candidates.length} schemas`); count.id = "guided-schema-result-count"; count.setAttribute("aria-live", "polite");
  const results = element("section"); results.id = "guided-schema-results"; results.setAttribute("aria-label", "Matching schemas");
  if (!options.length) {
    const empty = element("p", "No schemas match the current search."); empty.id = "guided-schema-empty-result";
    const clear = element("button", "Clear search"); clear.type = "button"; clear.addEventListener("click", () => onQuery(""));
    results.append(empty, clear);
  } else {
    for (const option of options) {
      const result = element("article"); result.className = "guided-schema-result"; result.dataset.available = String(option.available);
      const title = element("h6", `${option.name} version ${option.version}`);
      const target = element("p", `Target: ${option.target}`);
      const compatibility = element("p", `Property compatibility: ${option.explanation}`);
      const assignment = element("p", `Assignment scope: ${assignmentScopeSummary(option.assignments)}`);
      const select = element("button", `Select ${option.name} version ${option.version}`); select.type = "button"; select.disabled = !option.available;
      if (!option.available) select.setAttribute("aria-disabled", "true");
      select.addEventListener("click", () => onSelect(option));
      select.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { event.preventDefault(); onSelect(option); return; }
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const selectable = Array.from(dialog.querySelectorAll<HTMLButtonElement>(".guided-schema-result button:not(:disabled)"));
        const current = selectable.indexOf(select);
        const offset = event.key === "ArrowDown" ? 1 : -1;
        selectable[(current + offset + selectable.length) % selectable.length]?.focus();
        event.preventDefault();
      });
      result.append(title, target, compatibility, assignment, select); results.append(result);
    }
  }
  dialog.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); onClose(); });
  dialog.append(heading, close, searchLabel, search, searchHint, count, results); container.append(dialog);
  dialog.showModal();
  search.focus({ preventScroll:true });
  search.setSelectionRange(search.value.length, search.value.length);
}
