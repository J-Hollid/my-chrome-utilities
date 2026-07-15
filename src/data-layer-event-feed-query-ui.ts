import {
  activeQuerySummary,
  applyQueryCondition,
  clearEventFeedQuery,
  eventFeedQueryFields,
  eventFeedQueryOperators,
  eventFeedQuerySuggestions,
  filterEventsByQuery,
  observedPayloadPaths,
  queryConditionSummary,
  queryConditionComplete,
  removeQueryCondition,
  type EventFeedQuery,
  type EventFeedQueryField,
  type EventFeedQueryOperator,
} from "./data-layer-event-feed-query.js";
import type { LiveEvent } from "./data-layer-live-observer.js";
import {
  eventFeedFilterDisplayState,
  inspectSavedEventFeedFilter,
  savedEventFeedFilterNameResult,
  type SavedEventFeedFilterLibrary,
} from "./data-layer-saved-event-feed-filters.js";

function button(text: string): HTMLButtonElement {
  const control = document.createElement("button"); control.type = "button"; control.textContent = text; return control;
}

type QueryUpdate = (query: EventFeedQuery) => void;

export interface SavedEventFeedFilterControls {
  library: SavedEventFeedFilterLibrary;
  activeFilterId?: string;
  feedback?: string;
  select(filterId: string | undefined): void;
  create(name: string): void;
  update(): boolean;
  revert(): void;
  rename(name: string): void;
  delete(): void;
  setDefault(filterId: string | undefined): void;
}

type PayloadPathStage = {
  container: HTMLElement;
  back: HTMLButtonElement;
  search: HTMLInputElement;
  results: HTMLDivElement;
  enterCustom: HTMLButtonElement;
  customEditor: HTMLElement;
  customPath: HTMLInputElement;
  addCustom: HTMLButtonElement;
};

function createPayloadPathStage(): PayloadPathStage {
  const container = document.createElement("section"); container.id = "event-feed-payload-path-stage"; container.setAttribute("aria-label", "Choose payload property path"); container.hidden = true;
  const back = button("Back to fields");
  const searchLabel = document.createElement("label"); searchLabel.textContent = "Search observed payload paths ";
  const search = document.createElement("input"); search.id = "event-feed-payload-path-search"; search.type = "search"; searchLabel.append(search);
  const results = document.createElement("div"); results.id = "event-feed-payload-path-results"; results.setAttribute("role", "listbox"); results.setAttribute("aria-label", "Observed payload paths");
  const enterCustom = button("Enter custom path");
  const customEditor = document.createElement("section"); customEditor.id = "event-feed-query-custom-path-editor"; customEditor.hidden = true;
  const customLabel = document.createElement("label"); customLabel.textContent = "Custom property path ";
  const customPath = document.createElement("input"); customPath.id = "event-feed-query-custom-path"; customPath.type = "text"; customLabel.append(customPath);
  const addCustom = button("Add property path"); addCustom.disabled = true;
  customEditor.append(customLabel, addCustom);
  container.append(back, searchLabel, results, enterCustom, customEditor);
  return { container, back, search, results, enterCustom, customEditor, customPath, addCustom };
}

function clearButton(query: EventFeedQuery, update: QueryUpdate): HTMLButtonElement {
  const clear = button("Clear all");
  clear.addEventListener("click", () => update(clearEventFeedQuery(query)));
  return clear;
}

function renderToolbar(events: readonly LiveEvent[], query: EventFeedQuery): {
  toolbar: HTMLDivElement;
  add: HTMLButtonElement;
  visibleCount: number;
} {
  const toolbar = document.createElement("div"); toolbar.className = "event-feed-query-toolbar";
  const add = button("Add filter"); add.id = "add-event-feed-filter";
  const count = document.createElement("output"); count.id = "live-event-query-count"; count.setAttribute("aria-live", "polite");
  const visibleCount = filterEventsByQuery(events, query).length;
  count.textContent = `${visibleCount} of ${events.length} events`;
  toolbar.append(add, count);
  return { toolbar, add, visibleCount };
}

function renderActiveFilters(root: HTMLElement, events: readonly LiveEvent[], query: EventFeedQuery, update: QueryUpdate): HTMLElement {
  const active = document.createElement("section"); active.id = "active-event-feed-filters"; active.setAttribute("aria-label", "Active event feed filters"); active.hidden = query.conditions.length === 0;
  const querySummary = document.createElement("p"); querySummary.textContent = activeQuerySummary(query);
  const summaries = document.createElement("ul");
  for (const condition of query.conditions) {
    const item = document.createElement("li");
    const text = document.createElement("span"); text.textContent = queryConditionSummary(condition);
    const suggestions = eventFeedQuerySuggestions(events, condition.field);
    const unavailable = !text.textContent.includes("Needs repair") && !condition.values.some((value) => suggestions.some((candidate) => candidate.toLocaleLowerCase() === value.toLocaleLowerCase()));
    if (unavailable) text.textContent += " · Not observed in this feed";
    const remove = button("Remove"); remove.setAttribute("aria-label", `Remove filter ${text.textContent}`);
    remove.addEventListener("click", () => {
      update(removeQueryCondition(query, condition.id));
      root.querySelector<HTMLButtonElement>("#add-event-feed-filter")?.focus({ preventScroll: true });
    });
    item.append(text, remove); summaries.append(item);
  }
  active.append(querySummary, summaries, clearButton(query, update));
  return active;
}

function renderSavedFilters(
  events: readonly LiveEvent[],
  query: EventFeedQuery,
  controls: SavedEventFeedFilterControls,
): HTMLElement {
  const section = document.createElement("section"); section.id = "saved-event-feed-filters"; section.setAttribute("aria-label", "Saved event feed filters");
  const label = document.createElement("label"); label.htmlFor = "saved-event-feed-filter-selector"; label.textContent = "Saved filter";
  const selector = document.createElement("select"); selector.id = "saved-event-feed-filter-selector";
  selector.append(Object.assign(document.createElement("option"), { value:"", textContent:"All events" }));
  for (const filter of controls.library.filters) selector.append(Object.assign(document.createElement("option"), {
    value:filter.id,
    textContent:`${filter.name}${controls.library.defaultFilterId === filter.id ? " · Default" : ""}`,
  }));
  selector.value = controls.activeFilterId ?? "";
  const display = eventFeedFilterDisplayState(query, controls.activeFilterId, controls.library);
  const identity = document.createElement("output"); identity.id = "saved-event-feed-filter-identity"; identity.setAttribute("aria-live", "polite"); identity.textContent = display.label;
  const feedback = document.createElement("output"); feedback.id = "saved-event-feed-filter-feedback"; feedback.setAttribute("aria-live", "polite"); feedback.textContent = controls.feedback ?? "";
  const actions = document.createElement("details"); actions.id = "saved-event-feed-filter-actions";
  actions.append(Object.assign(document.createElement("summary"), { textContent:"Saved filter actions" }));
  const active = controls.library.filters.find(({ id }) => id === controls.activeFilterId);
  const action = (text: string, run: () => void, disabled = false) => {
    const control = button(text); control.disabled = disabled; control.addEventListener("click", run); actions.append(control); return control;
  };

  const nameDialog = document.createElement("dialog"); nameDialog.id = "saved-event-feed-filter-name-dialog";
  const nameHeading = document.createElement("h5"); nameHeading.tabIndex = -1;
  const nameLabel = document.createElement("label"); nameLabel.htmlFor = "saved-event-feed-filter-name"; nameLabel.textContent = "Saved filter name";
  const nameInput = document.createElement("input"); nameInput.id = "saved-event-feed-filter-name"; nameInput.autocomplete = "off";
  const nameAssistance = document.createElement("output"); nameAssistance.id = "saved-event-feed-filter-name-assistance"; nameAssistance.setAttribute("aria-live", "polite");
  const nameConfirm = button("Save"); nameConfirm.disabled = true; const nameCancel = button("Cancel");
  let nameMode: "create" | "copy" | "rename" = "create";
  const refreshName = () => {
    const result = savedEventFeedFilterNameResult(controls.library, nameInput.value, nameMode === "rename" ? controls.activeFilterId : undefined);
    nameAssistance.textContent = result.assistance; nameConfirm.disabled = !result.accepted;
  };
  const closeName = () => { nameDialog.close(); selector.focus({ preventScroll:true }); };
  const openName = (mode: typeof nameMode) => {
    nameMode = mode; nameHeading.textContent = mode === "rename" ? "Rename saved filter" : mode === "copy" ? "Save filter as new" : "Save current filter";
    nameConfirm.textContent = mode === "rename" ? "Rename" : "Save"; nameInput.value = mode === "rename" ? active?.name ?? "" : "";
    refreshName(); nameDialog.showModal(); nameHeading.focus({ preventScroll:true });
  };
  nameInput.addEventListener("input", refreshName); nameCancel.addEventListener("click", closeName);
  nameDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeName(); });
  nameConfirm.addEventListener("click", () => {
    const result = savedEventFeedFilterNameResult(controls.library, nameInput.value, nameMode === "rename" ? controls.activeFilterId : undefined);
    if (!result.accepted) return;
    nameDialog.close();
    if (nameMode === "rename") controls.rename(result.name); else controls.create(result.name);
  });
  nameDialog.append(nameHeading, nameLabel, nameInput, nameAssistance, nameConfirm, nameCancel);

  if (display.save === "create") action("Save current filter", () => openName("create"));
  if (display.save === "update-or-copy") {
    action("Update", controls.update); action("Save as new", () => openName("copy")); action("Revert changes", controls.revert);
  }
  if (active) {
    action("Rename", () => openName("rename"));
    action(controls.library.defaultFilterId === active.id ? "Remove default" : "Set as default", () => controls.setDefault(controls.library.defaultFilterId === active.id ? undefined : active.id));
  }
  action("Clear", () => controls.select(undefined), query.conditions.length === 0);

  const deleteDialog = document.createElement("dialog"); deleteDialog.id = "saved-event-feed-filter-delete-dialog";
  deleteDialog.append(Object.assign(document.createElement("h5"), { textContent:"Delete saved filter?" }), Object.assign(document.createElement("p"), { textContent:active ? `${active.name} will be removed; current conditions will remain active.` : "" }));
  const confirmDelete = button("Delete"); const cancelDelete = button("Cancel");
  confirmDelete.addEventListener("click", () => { deleteDialog.close(); controls.delete(); });
  cancelDelete.addEventListener("click", () => { deleteDialog.close(); selector.focus({ preventScroll:true }); });
  deleteDialog.addEventListener("cancel", (event) => { event.preventDefault(); deleteDialog.close(); selector.focus({ preventScroll:true }); });
  deleteDialog.append(confirmDelete, cancelDelete); if (active) action("Delete", () => deleteDialog.showModal());

  const switchDialog = document.createElement("dialog"); switchDialog.id = "saved-event-feed-filter-switch-dialog";
  switchDialog.append(Object.assign(document.createElement("h5"), { textContent:"Save modified filter before switching?" }));
  const saveSwitch = button("Save changes"); const discardSwitch = button("Discard and switch"); const cancelSwitch = button("Cancel"); let pending = "";
  const switchToPending = () => controls.select(pending || undefined);
  saveSwitch.addEventListener("click", () => { switchDialog.close(); if (controls.update()) switchToPending(); });
  discardSwitch.addEventListener("click", () => { switchDialog.close(); switchToPending(); });
  cancelSwitch.addEventListener("click", () => { switchDialog.close(); selector.value = controls.activeFilterId ?? ""; selector.focus({ preventScroll:true }); });
  switchDialog.addEventListener("cancel", (event) => { event.preventDefault(); cancelSwitch.click(); }); switchDialog.append(saveSwitch, discardSwitch, cancelSwitch);
  selector.addEventListener("change", () => {
    pending = selector.value;
    if (display.modified && pending !== controls.activeFilterId) { selector.value = controls.activeFilterId ?? ""; switchDialog.showModal(); return; }
    controls.select(pending || undefined);
  });

  if (active) {
    const inspection = inspectSavedEventFeedFilter(active, events);
    const repair = document.createElement("p"); repair.id = "saved-event-feed-filter-repair";
    repair.textContent = inspection.conditions.filter(({ status }) => status !== "observed").map(({ condition, status }) => `${condition.field}: ${status}`).join(" · ");
    repair.hidden = !repair.textContent; section.append(repair);
  }
  label.append(selector); section.append(label, identity, actions, feedback, nameDialog, deleteDialog, switchDialog); return section;
}

function renderNoMatches(query: EventFeedQuery, visibleCount: number, update: QueryUpdate): HTMLElement {
  const noMatches = document.createElement("section"); noMatches.className = "event-feed-query-empty"; noMatches.setAttribute("aria-live", "polite");
  noMatches.hidden = query.conditions.length === 0 || visibleCount > 0;
  noMatches.append(
    Object.assign(document.createElement("p"), { textContent: "No events match the active filters." }),
    clearButton(query, update),
  );
  return noMatches;
}

function renderConditionEditor(
  events: readonly LiveEvent[],
  query: EventFeedQuery,
  update: QueryUpdate,
  add: HTMLButtonElement,
): HTMLElement {
  const editor = document.createElement("section"); editor.className = "event-feed-condition-editor"; editor.setAttribute("aria-label", "Add event feed condition"); editor.hidden = true;
  const fieldLabel = document.createElement("label"); fieldLabel.textContent = "Field ";
  const field = document.createElement("select"); field.id = "event-feed-query-field";
  field.append(Object.assign(document.createElement("option"), { value: "", textContent: "Choose field" }));
  for (const candidate of eventFeedQueryFields()) field.append(Object.assign(document.createElement("option"), { value: candidate, textContent: candidate }));
  fieldLabel.append(field);
  const operatorLabel = document.createElement("label"); operatorLabel.textContent = "Operator ";
  const operator = document.createElement("select"); operator.id = "event-feed-query-operator"; operator.disabled = true; operatorLabel.append(operator);
  const valueLabel = document.createElement("label"); valueLabel.textContent = "Value ";
  const value = document.createElement("input"); value.id = "event-feed-query-value"; value.type = "search"; value.disabled = true; value.setAttribute("list", "event-feed-query-suggestions");
  const suggestions = document.createElement("datalist"); suggestions.id = "event-feed-query-suggestions"; valueLabel.append(value, suggestions);
  const apply = button("Apply condition"); apply.disabled = true;
  const cancel = button("Cancel"); cancel.addEventListener("click", () => { editor.hidden = true; add.focus({ preventScroll: true }); });
  const selectedField = document.createElement("output"); selectedField.id = "event-feed-query-selected-field"; selectedField.hidden = true;

  const payloadPathStage = createPayloadPathStage();
  const {
    container: pathStage, back: backToFields, search: pathSearch, results: pathResults,
    enterCustom: enterCustomPath, customEditor: customPathEditor, customPath,
    addCustom: addPropertyPath,
  } = payloadPathStage;

  const candidate = () => ({
    id: `condition-${Date.now()}-${query.conditions.length + 1}`,
    field: field.value as EventFeedQueryField,
    operator: operator.value as EventFeedQueryOperator,
    values: value.value.split(",").map((entry) => entry.trim()).filter(Boolean),
  });
  const refreshApply = () => { apply.disabled = !queryConditionComplete(candidate()); };
  const hideConditionControls = (hidden: boolean) => {
    fieldLabel.hidden = hidden; operatorLabel.hidden = hidden; valueLabel.hidden = hidden; apply.hidden = hidden;
  };
  const configureConditionControls = () => {
    hideConditionControls(false); pathStage.hidden = true;
    operator.replaceChildren(...eventFeedQueryOperators(field.value as EventFeedQueryField).map((candidate) => Object.assign(document.createElement("option"), { value: candidate, textContent: candidate })));
    operator.disabled = !field.value; value.disabled = !field.value;
    suggestions.replaceChildren(...eventFeedQuerySuggestions(events, field.value as EventFeedQueryField).map((candidate) => Object.assign(document.createElement("option"), { value: candidate })));
    refreshApply();
  };
  const selectPayloadPath = (path: string) => {
    const payloadField = `Payload · ${path}` as EventFeedQueryField;
    if (!Array.from(field.children).some((candidate) => (candidate as HTMLOptionElement).value === payloadField)) {
      field.append(Object.assign(document.createElement("option"), { value: payloadField, textContent: payloadField }));
    }
    field.value = payloadField;
    selectedField.textContent = `Selected field ${payloadField}`; selectedField.hidden = false;
    value.value = "";
    configureConditionControls();
  };
  const renderPayloadPaths = () => {
    const query = pathSearch.value.trim().toLocaleLowerCase();
    const paths = observedPayloadPaths(events).filter((path) => path.toLocaleLowerCase().includes(query));
    pathResults.replaceChildren(...paths.map((path) => {
      const result = button(path); result.setAttribute("role", "option"); result.setAttribute("aria-label", path);
      result.addEventListener("click", () => selectPayloadPath(path)); return result;
    }));
  };
  const openPayloadPathStage = () => {
    hideConditionControls(true);
    selectedField.hidden = true; pathStage.hidden = false; customPathEditor.hidden = true;
    pathSearch.value = ""; renderPayloadPaths(); pathSearch.focus({ preventScroll: true });
  };
  field.addEventListener("change", () => {
    if (field.value === "Payload property") { openPayloadPathStage(); return; }
    selectedField.hidden = !field.value.startsWith("Payload · ");
    configureConditionControls();
  });
  pathSearch.addEventListener("input", renderPayloadPaths);
  backToFields.addEventListener("click", () => {
    pathStage.hidden = true; hideConditionControls(false);
    field.value = "Payload property"; operator.disabled = true; value.disabled = true; selectedField.hidden = true; refreshApply();
    field.focus({ preventScroll: true });
  });
  enterCustomPath.addEventListener("click", () => { customPathEditor.hidden = false; customPath.focus({ preventScroll: true }); });
  customPath.addEventListener("input", () => { addPropertyPath.disabled = !customPath.value.trim(); });
  addPropertyPath.addEventListener("click", () => { const path = customPath.value.trim(); if (path) selectPayloadPath(path); });
  operator.addEventListener("change", refreshApply); value.addEventListener("input", refreshApply);
  apply.addEventListener("click", () => { const condition = candidate(); if (queryConditionComplete(condition)) update(applyQueryCondition(query, condition)); });
  add.addEventListener("click", () => { editor.hidden = false; field.focus({ preventScroll: true }); });
  editor.append(fieldLabel, selectedField, operatorLabel, valueLabel, apply, cancel, pathStage);
  return editor;
}

export function renderEventFeedQueryBuilder(
  root: HTMLElement,
  events: readonly LiveEvent[],
  query: EventFeedQuery,
  update: (query: EventFeedQuery) => void,
  savedFilters?: SavedEventFeedFilterControls,
): void {
  root.replaceChildren();
  root.className = query.conditions.length ? "event-feed-query active" : "event-feed-query empty";
  const { toolbar, add, visibleCount } = renderToolbar(events, query);
  root.append(
    ...(savedFilters ? [renderSavedFilters(events, query, savedFilters)] : []),
    toolbar,
    renderActiveFilters(root, events, query, update),
    renderNoMatches(query, visibleCount, update),
    renderConditionEditor(events, query, update, add),
  );
}
