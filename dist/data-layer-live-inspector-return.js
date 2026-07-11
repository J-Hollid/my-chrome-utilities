export function captureInspectorReturn(eventId, scrollTop) {
    return { eventId, scrollTop: Math.max(0, scrollTop) };
}
export function restoreInspectorReturn(snapshot) {
    return snapshot;
}
//# sourceMappingURL=data-layer-live-inspector-return.js.map