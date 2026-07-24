/** Create the persisted copy for a Page frame without changing its semantic placement. */
export function duplicatePageFrameRecord(source, id) {
    const copy = structuredClone(source);
    copy.id = id;
    copy.position = { x: Math.max(20, Math.round((source.position.x ?? 40) + 240)), y: source.position.y };
    return copy;
}
//# sourceMappingURL=data-layer-flow-graph-structural.js.map