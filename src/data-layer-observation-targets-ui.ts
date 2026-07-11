import {
  attachedObservationTarget,
  selectedObservationTarget,
  targetAccessExplanation,
  type ObservationTarget,
  type ObservationTargetState,
} from "./data-layer-observation-targets.js";

export interface ObservationTargetElements {
  state: HTMLElement | null;
  result: HTMLElement | null;
  chooseButton: HTMLButtonElement | null;
  browseButton: HTMLButtonElement | null;
  attachButton: HTMLButtonElement | null;
  detachButton: HTMLButtonElement | null;
  picker: HTMLElement | null;
  closePickerButton: HTMLButtonElement | null;
  sidePanelContent: HTMLElement | null;
  search: HTMLInputElement | null;
  count: HTMLElement | null;
  list: HTMLElement | null;
  detachConfirmation: HTMLElement | null;
  detachMessage: HTMLElement | null;
  cancelDetachButton: HTMLButtonElement | null;
  confirmDetachButton: HTMLButtonElement | null;
}

export interface ObservationTargetRowActions {
  select: (target: ObservationTarget) => void;
  requestAccess: (target: ObservationTarget) => void;
}

export function findObservationTargetElements(
  root: ParentNode = document,
): ObservationTargetElements {
  return {
    state: root.querySelector<HTMLElement>("#observation-target-state"),
    result: root.querySelector<HTMLElement>("#observation-target-result"),
    chooseButton: root.querySelector<HTMLButtonElement>("#choose-observation-target"),
    browseButton: root.querySelector<HTMLButtonElement>("#browse-observation-targets"),
    attachButton: root.querySelector<HTMLButtonElement>("#attach-selected-target"),
    detachButton: root.querySelector<HTMLButtonElement>("#detach-observation-target"),
    picker: root.querySelector<HTMLElement>("#observation-target-picker"),
    closePickerButton: root.querySelector<HTMLButtonElement>("#close-observation-target-picker"),
    sidePanelContent: root.querySelector<HTMLElement>("#side-panel-content"),
    search: root.querySelector<HTMLInputElement>("#observation-target-search"),
    count: root.querySelector<HTMLElement>("#observation-target-count"),
    list: root.querySelector<HTMLElement>("#observation-target-list"),
    detachConfirmation: root.querySelector<HTMLElement>("#detach-observation-target-confirmation"),
    detachMessage: root.querySelector<HTMLElement>("#detach-observation-target-message"),
    cancelDetachButton: root.querySelector<HTMLButtonElement>("#cancel-detach-observation-target"),
    confirmDetachButton: root.querySelector<HTMLButtonElement>("#confirm-detach-observation-target"),
  };
}

export function setObservationTargetResult(
  elements: ObservationTargetElements,
  result: string,
): void {
  if (elements.result) elements.result.textContent = result;
}

export function renderObservationTargetContext(
  elements: ObservationTargetElements,
  state: ObservationTargetState,
  historyPath: string,
): void {
  if (!elements.state) return;
  const attached = attachedObservationTarget(state);
  const selected = selectedObservationTarget(state);
  elements.state.textContent = attached
    ? `Attached — ${attached.title} — ${attached.pageUrl} — ${historyPath}`
    : selected
      ? `${state.sessionState} — ${selected.title} — ${selected.accessState}`
      : "Detached — Choose target";
}

function targetLocation(target: ObservationTarget): string {
  try {
    const url = new URL(target.pageUrl);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return target.pageUrl;
  }
}

function targetRow(
  target: ObservationTarget,
  actions: ObservationTargetRowActions,
): HTMLLIElement {
  const row = document.createElement("li");
  row.className = "observation-target-row";
  const details = document.createElement("p");
  details.textContent = [
    target.title,
    targetLocation(target),
    `window ${target.windowId}`,
    target.currentWindow ? "current window" : undefined,
    target.activeTab ? "active tab" : undefined,
    target.priorSession ? "recent target" : undefined,
    `${target.accessState}: ${targetAccessExplanation(target.accessState, target.pageUrl)}`,
  ].filter(Boolean).join(" — ");
  const action = document.createElement("button");
  action.type = "button";
  action.dataset.targetId = target.id;
  action.textContent = target.accessState === "Ready"
    ? "Select"
    : target.accessState === "Permission required"
      ? "Request access"
      : "Unavailable";
  action.disabled = target.accessState === "Restricted" || target.accessState === "Closed";
  action.addEventListener("click", () => {
    if (target.accessState === "Permission required") {
      actions.requestAccess(target);
      return;
    }
    actions.select(target);
  });
  row.append(details, action);
  return row;
}

export function renderObservationTargetPicker(
  elements: ObservationTargetElements,
  targets: readonly ObservationTarget[],
  actions: ObservationTargetRowActions,
): void {
  if (elements.count) elements.count.textContent = `${targets.length} matching targets`;
  elements.list?.replaceChildren(...targets.map((target) => targetRow(target, actions)));
}

export function showObservationTargetPicker(
  elements: ObservationTargetElements,
): void {
  elements.sidePanelContent?.setAttribute("inert", "");
  if (elements.picker) elements.picker.hidden = false;
  elements.search?.focus();
}

export function closeObservationTargetPicker(
  elements: ObservationTargetElements,
): void {
  if (elements.picker) elements.picker.hidden = true;
  elements.sidePanelContent?.removeAttribute("inert");
  elements.browseButton?.focus();
}

export function showDetachTargetConfirmation(
  elements: ObservationTargetElements,
  message: string,
  labels: { cancel: string; confirm: string } = {
    cancel: "Cancel",
    confirm: "Detach target",
  },
): void {
  if (elements.detachMessage) {
    elements.detachMessage.textContent = message;
  }
  if (elements.cancelDetachButton) elements.cancelDetachButton.textContent = labels.cancel;
  if (elements.confirmDetachButton) elements.confirmDetachButton.textContent = labels.confirm;
  if (elements.detachConfirmation) elements.detachConfirmation.hidden = false;
  elements.cancelDetachButton?.focus();
}

export function closeDetachTargetConfirmation(
  elements: ObservationTargetElements,
): void {
  if (elements.detachConfirmation) elements.detachConfirmation.hidden = true;
  elements.detachButton?.focus();
}

function targetActions(elements: ObservationTargetElements): HTMLButtonElement[] {
  return Array.from(
    elements.list?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
  );
}

function pickerFocusables(elements: ObservationTargetElements): HTMLElement[] {
  return [
    elements.closePickerButton,
    elements.search,
    ...targetActions(elements),
  ].filter((element): element is HTMLButtonElement | HTMLInputElement => element !== null);
}

export function handleObservationTargetDialogKeydown(
  elements: ObservationTargetElements,
  event: KeyboardEvent,
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closeObservationTargetPicker(elements);
    return;
  }
  if (event.key !== "Tab") return;
  const focusables = pickerFocusables(elements);
  const current = focusables.indexOf(document.activeElement as HTMLElement);
  const next = event.shiftKey
    ? (current <= 0 ? focusables.length - 1 : current - 1)
    : (current >= focusables.length - 1 ? 0 : current + 1);
  if (focusables.length > 0) {
    event.preventDefault();
    focusables.at(next)?.focus();
  }
}

export function handleObservationTargetSearchKeydown(
  elements: ObservationTargetElements,
  event: KeyboardEvent,
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closeObservationTargetPicker(elements);
    return;
  }
  const first = targetActions(elements)[0];
  if (event.key === "ArrowDown" && first) {
    event.preventDefault();
    first.focus();
  }
}

export function handleObservationTargetListKeydown(
  elements: ObservationTargetElements,
  event: KeyboardEvent,
): void {
  const actions = targetActions(elements);
  const position = actions.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === "Escape") {
    event.preventDefault();
    closeObservationTargetPicker(elements);
    return;
  }
  if (position < 0) return;
  const target = event.key === "ArrowDown"
    ? actions[position + 1]
    : event.key === "ArrowUp"
      ? actions[position - 1]
      : undefined;
  if (target) {
    event.preventDefault();
    target.focus();
  }
}
