interface FlowSectionPointerCaptureTarget {
  setPointerCapture(pointerId: number): void;
  hasPointerCapture(pointerId: number): boolean;
  releasePointerCapture(pointerId: number): void;
}

interface FlowSectionPointerEventSource {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export function trackFlowSectionPointerGesture(options: {
  pointerId: number;
  captureTarget: FlowSectionPointerCaptureTarget;
  eventSource: FlowSectionPointerEventSource;
  move(event: PointerEvent): void;
  finish(event: PointerEvent): void;
  cancel(event: PointerEvent): void;
}): () => void {
  const ownsPointer = (event: PointerEvent): boolean => event.pointerId === options.pointerId;
  const move = ((event: PointerEvent): void => {
    if (ownsPointer(event)) options.move(event);
  }) as EventListener;
  const cleanup = (): void => {
    options.eventSource.removeEventListener("pointermove", move);
    options.eventSource.removeEventListener("pointerup", finish);
    options.eventSource.removeEventListener("pointercancel", cancel);
    if (options.captureTarget.hasPointerCapture(options.pointerId)) {
      options.captureTarget.releasePointerCapture(options.pointerId);
    }
  };
  const finish = ((event: PointerEvent): void => {
    if (!ownsPointer(event)) return;
    cleanup();
    options.finish(event);
  }) as EventListener;
  const cancel = ((event: PointerEvent): void => {
    if (!ownsPointer(event)) return;
    cleanup();
    options.cancel(event);
  }) as EventListener;
  options.eventSource.addEventListener("pointermove", move);
  options.eventSource.addEventListener("pointerup", finish);
  options.eventSource.addEventListener("pointercancel", cancel);
  try {
    options.captureTarget.setPointerCapture(options.pointerId);
  } catch {
    // Synthetic test pointers have no active device pointer to capture.
  }
  return cleanup;
}
