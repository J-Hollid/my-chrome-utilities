export interface InspectorReturnSnapshot {
  eventId: string;
  scrollTop: number;
}

export function captureInspectorReturn(
  eventId: string,
  scrollTop: number,
): InspectorReturnSnapshot {
  return { eventId, scrollTop: Math.max(0, scrollTop) };
}

export function restoreInspectorReturn(
  snapshot: InspectorReturnSnapshot,
): InspectorReturnSnapshot {
  return snapshot;
}
