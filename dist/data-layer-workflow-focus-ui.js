function focusables(dialog) {
    return Array.from(dialog.querySelectorAll("button:not(:disabled), input:not(:disabled), [tabindex='0']"));
}
export function openPushReview(elements) {
    if (!elements.dialog)
        return;
    if (!elements.dialog.open)
        elements.dialog.showModal();
    elements.heading?.focus({ preventScroll: true });
}
export function closePushReview(elements, restoreFocus = true) {
    if (elements.dialog?.open)
        elements.dialog.close();
    if (restoreFocus)
        elements.trigger?.focus({ preventScroll: true });
}
export function handlePushReviewKeydown(elements, event) {
    if (event.key === "Escape") {
        event.preventDefault();
        closePushReview(elements);
        return;
    }
    if (event.key !== "Tab" || !elements.dialog)
        return;
    const candidates = focusables(elements.dialog);
    const current = candidates.indexOf(document.activeElement);
    const next = event.shiftKey
        ? (current <= 0 ? candidates.length - 1 : current - 1)
        : (current >= candidates.length - 1 ? 0 : current + 1);
    if (candidates.length > 0) {
        event.preventDefault();
        candidates[next]?.focus({ preventScroll: true });
    }
}
//# sourceMappingURL=data-layer-workflow-focus-ui.js.map