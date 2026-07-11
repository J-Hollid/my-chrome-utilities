import type { InspectorReturnSnapshot } from "./data-layer-live-inspector-return.js";

export interface InspectorReturnElements {
  eventList: HTMLElement | null;
  eventFeed: HTMLElement | null;
}

export function restoreInspectorReturnUi(
  elements: InspectorReturnElements,
  snapshot: InspectorReturnSnapshot,
): void {
  if (elements.eventList) elements.eventList.scrollTop = snapshot.scrollTop;
  Array.from(elements.eventFeed?.querySelectorAll<HTMLButtonElement>("button") ?? [])
    .find((button) => button.dataset.eventId === snapshot.eventId)
    ?.focus({ preventScroll: true });
}
