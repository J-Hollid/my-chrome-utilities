import type { ActionTreatment } from "./side-panel-action-hierarchy.js";

export function applyActionTreatment(
  button: HTMLButtonElement | null,
  treatment: ActionTreatment,
  descriptionId?: string,
): void {
  if (!button) return;
  button.dataset.actionVariant = treatment.variant;
  button.disabled = treatment.disabled;
  if (treatment.disabledReason) {
    button.setAttribute("aria-description", treatment.disabledReason);
    if (descriptionId) {
      button.setAttribute("aria-describedby", descriptionId);
      const description = document.getElementById(descriptionId);
      if (description) description.textContent = treatment.disabledReason;
    }
    return;
  }
  button.removeAttribute("aria-description");
  if (descriptionId) button.removeAttribute("aria-describedby");
}
