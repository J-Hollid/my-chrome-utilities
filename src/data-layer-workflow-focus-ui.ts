export interface PushReviewFocusElements {
  dialog: HTMLDialogElement | null;
  heading: HTMLElement | null;
  trigger: HTMLButtonElement | null;
}

function focusables(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(
    "button:not(:disabled), input:not(:disabled), [tabindex='0']",
  ));
}

export function openPushReview(elements: PushReviewFocusElements): void {
  if (!elements.dialog) return;
  elements.dialog.hidden = false;
  if (!elements.dialog.open) elements.dialog.showModal();
  elements.heading?.focus({ preventScroll: true });
}

export function closePushReview(
  elements: PushReviewFocusElements,
  restoreFocus = true,
): void {
  if (elements.dialog?.open) elements.dialog.close();
  if (elements.dialog) elements.dialog.hidden = true;
  if (restoreFocus) elements.trigger?.focus({ preventScroll: true });
}

export function handlePushReviewKeydown(
  elements: PushReviewFocusElements,
  event: KeyboardEvent,
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closePushReview(elements);
    return;
  }
  if (event.key !== "Tab" || !elements.dialog) return;
  const candidates = focusables(elements.dialog);
  const current = candidates.indexOf(document.activeElement as HTMLElement);
  const next = event.shiftKey
    ? (current <= 0 ? candidates.length - 1 : current - 1)
    : (current >= candidates.length - 1 ? 0 : current + 1);
  if (candidates.length > 0) {
    event.preventDefault();
    candidates[next]?.focus({ preventScroll: true });
  }
}
