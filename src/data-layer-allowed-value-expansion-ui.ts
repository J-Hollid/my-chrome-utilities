import type {
  AllowedValue,
  AllowedValueExpansionDestination,
  AllowedValueExpansionReview,
} from "./data-layer-allowed-value-expansion.js";

export interface AllowedValueExpansionDialogInput {
  inspector: HTMLElement;
  review: AllowedValueExpansionReview;
  trigger: HTMLButtonElement;
  confirm(destination: AllowedValueExpansionDestination): void | (() => void);
  openDraft(destination: AllowedValueExpansionDestination): void;
}

export function allowedValueText(value: AllowedValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return `string ${value}`;
  return `${typeof value} ${String(value)}`;
}

function destinationLabel(destination: AllowedValueExpansionDestination): string {
  return ({
    "assigned-schema-draft":"Update assigned schema working draft",
    "parent-schema-draft":"Edit parent working draft",
    "assigned-schema-override":"Create assigned-schema override",
    "reusable-rule-revision":"Revise reusable rule",
  } as const)[destination];
}

export function openAllowedValueExpansionDialog(input: AllowedValueExpansionDialogInput): void {
  const { inspector, review, trigger } = input;
  inspector.querySelector("#allowed-value-expansion-review")?.remove();

  const dialog = document.createElement("dialog");
  dialog.id = "allowed-value-expansion-review";
  dialog.setAttribute("aria-labelledby", "allowed-value-expansion-heading");
  const heading = document.createElement("h5");
  heading.id = "allowed-value-expansion-heading";
  heading.tabIndex = -1;
  heading.textContent = "Review allowed value addition";
  const summary = document.createElement("p");
  summary.id = "allowed-value-expansion-summary";
  summary.textContent = `${review.assignedSchema.name} revision ${review.assignedSchema.version} · ${review.propertyPath} · ${review.rule.name} revision ${review.rule.version} · currently allows ${review.currentValues.map(allowedValueText).join(", ") || "no values"} · proposed ${allowedValueText(review.proposedValue)}.`;
  const publication = document.createElement("p");
  publication.textContent = "The published schema remains unchanged until its working draft is published.";
  const pending = document.createElement("p");
  pending.id = "allowed-value-expansion-pending";
  pending.textContent = review.alreadyPending
    ? "This value is already pending in the existing working draft."
    : "No schema or rule will change until you choose a destination and confirm.";
  const pinned = document.createElement("p");
  pinned.id = "allowed-value-expansion-pinned-warning";
  pinned.textContent = review.pinnedAssignmentWarning ?? "";
  pinned.hidden = !review.pinnedAssignmentWarning;
  const destinations = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = "Destination";
  destinations.append(legend);
  for (const [index, destination] of review.destinations.entries()) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "allowed-value-expansion-destination";
    radio.value = destination;
    radio.checked = index === 0;
    label.append(radio, ` ${destinationLabel(destination)}`);
    destinations.append(label);
  }
  const feedback = document.createElement("output");
  feedback.id = "allowed-value-expansion-feedback";
  feedback.setAttribute("aria-live", "polite");
  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.id = "confirm-allowed-value-expansion";
  confirm.textContent = review.alreadyPending ? "Keep existing pending value" : "Confirm addition";
  const openDraft = document.createElement("button");
  openDraft.type = "button";
  openDraft.id = "open-allowed-value-working-draft";
  openDraft.textContent = "Open working draft";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  const close = (restoreFocus = true) => {
    if (dialog.open) dialog.close();
    dialog.remove();
    if (restoreFocus) trigger.focus({ preventScroll:true });
  };
  const selectedDestination = () => dialog.querySelector<HTMLInputElement>(
    'input[name="allowed-value-expansion-destination"]:checked',
  )?.value as AllowedValueExpansionDestination | undefined;
  confirm.addEventListener("click", () => {
    const destination = selectedDestination();
    if (!destination) return;
    try {
      const afterClose = input.confirm(destination);
      close(false);
      afterClose?.();
    } catch (error) {
      feedback.textContent = error instanceof Error ? error.message : "The allowed value could not be added.";
    }
  });
  openDraft.addEventListener("click", () => {
    const destination = selectedDestination();
    if (!destination) return;
    close(false);
    input.openDraft(destination);
  });
  cancel.addEventListener("click", () => close());
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.append(heading, summary, publication, pending, pinned, destinations, feedback, confirm, openDraft, cancel);
  inspector.append(dialog);
  dialog.showModal();
  heading.focus({ preventScroll:true });
}
