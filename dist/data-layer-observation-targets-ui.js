import { targetAccessExplanation, } from "./data-layer-observation-targets.js";
let lastPickerFocus;
export function findObservationTargetElements(root = document) {
    return {
        result: root.querySelector("#observation-target-result"),
        chooseButton: root.querySelector("#choose-observation-target"),
        browseButton: root.querySelector("#browse-observation-targets"),
        picker: root.querySelector("#observation-target-picker"),
        closePickerButton: root.querySelector("#close-observation-target-picker"),
        sidePanelContent: root.querySelector("#side-panel-content"),
        search: root.querySelector("#observation-target-search"),
        count: root.querySelector("#observation-target-count"),
        list: root.querySelector("#observation-target-list"),
        detachConfirmation: root.querySelector("#detach-observation-target-confirmation"),
        detachMessage: root.querySelector("#detach-observation-target-message"),
        cancelDetachButton: root.querySelector("#cancel-detach-observation-target"),
        confirmDetachButton: root.querySelector("#confirm-detach-observation-target"),
    };
}
export function setObservationTargetResult(elements, result) {
    if (elements.result)
        elements.result.textContent = result;
}
function targetLocation(target) {
    try {
        const url = new URL(target.pageUrl);
        return `${url.hostname}${url.pathname}`;
    }
    catch {
        return target.pageUrl;
    }
}
function targetRow(target, actions) {
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
export function renderObservationTargetPicker(elements, targets, actions) {
    if (elements.count)
        elements.count.textContent = `${targets.length} matching targets`;
    elements.list?.replaceChildren(...targets.map((target) => targetRow(target, actions)));
}
export function showObservationTargetPicker(elements) {
    lastPickerFocus = typeof document !== "undefined"
        && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;
    elements.sidePanelContent?.setAttribute("inert", "");
    if (elements.picker)
        elements.picker.hidden = false;
    elements.search?.focus();
}
export function closeObservationTargetPicker(elements) {
    if (elements.picker)
        elements.picker.hidden = true;
    elements.sidePanelContent?.removeAttribute("inert");
    (lastPickerFocus ?? elements.browseButton)?.focus();
    lastPickerFocus = undefined;
}
export function showDetachTargetConfirmation(elements, message, labels = {
    cancel: "Cancel",
    confirm: "Detach target",
}) {
    if (elements.detachMessage) {
        elements.detachMessage.textContent = message;
    }
    if (elements.cancelDetachButton)
        elements.cancelDetachButton.textContent = labels.cancel;
    if (elements.confirmDetachButton)
        elements.confirmDetachButton.textContent = labels.confirm;
    if (elements.detachConfirmation)
        elements.detachConfirmation.hidden = false;
    elements.cancelDetachButton?.focus();
}
export function closeDetachTargetConfirmation(elements) {
    if (elements.detachConfirmation)
        elements.detachConfirmation.hidden = true;
    elements.chooseButton?.focus();
}
function targetActions(elements) {
    return Array.from(elements.list?.querySelectorAll("button:not(:disabled)") ?? []);
}
function pickerFocusables(elements) {
    return [
        elements.closePickerButton,
        elements.search,
        ...targetActions(elements),
    ].filter((element) => element !== null);
}
export function handleObservationTargetDialogKeydown(elements, event) {
    if (event.key === "Escape") {
        event.preventDefault();
        closeObservationTargetPicker(elements);
        return;
    }
    if (event.key !== "Tab")
        return;
    const focusables = pickerFocusables(elements);
    const current = focusables.indexOf(document.activeElement);
    const next = event.shiftKey
        ? (current <= 0 ? focusables.length - 1 : current - 1)
        : (current >= focusables.length - 1 ? 0 : current + 1);
    if (focusables.length > 0) {
        event.preventDefault();
        focusables.at(next)?.focus();
    }
}
export function handleObservationTargetSearchKeydown(elements, event) {
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
export function handleObservationTargetListKeydown(elements, event) {
    const actions = targetActions(elements);
    const position = actions.indexOf(document.activeElement);
    if (event.key === "Escape") {
        event.preventDefault();
        closeObservationTargetPicker(elements);
        return;
    }
    if (position < 0)
        return;
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
//# sourceMappingURL=data-layer-observation-targets-ui.js.map