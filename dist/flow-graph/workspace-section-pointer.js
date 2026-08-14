export function trackFlowSectionPointerGesture(options) {
    const ownsPointer = (event) => event.pointerId === options.pointerId;
    const move = ((event) => {
        if (ownsPointer(event))
            options.move(event);
    });
    const cleanup = () => {
        options.eventSource.removeEventListener("pointermove", move);
        options.eventSource.removeEventListener("pointerup", finish);
        options.eventSource.removeEventListener("pointercancel", cancel);
        if (options.captureTarget.hasPointerCapture(options.pointerId)) {
            options.captureTarget.releasePointerCapture(options.pointerId);
        }
    };
    const finish = ((event) => {
        if (!ownsPointer(event))
            return;
        cleanup();
        options.finish(event);
    });
    const cancel = ((event) => {
        if (!ownsPointer(event))
            return;
        cleanup();
        options.cancel(event);
    });
    options.eventSource.addEventListener("pointermove", move);
    options.eventSource.addEventListener("pointerup", finish);
    options.eventSource.addEventListener("pointercancel", cancel);
    try {
        options.captureTarget.setPointerCapture(options.pointerId);
    }
    catch {
        // Synthetic test pointers have no active device pointer to capture.
    }
    return cleanup;
}
//# sourceMappingURL=workspace-section-pointer.js.map