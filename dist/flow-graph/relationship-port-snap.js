export const FLOW_PORT_SNAP_RADIUS = 24;
export function flowPortSnapTarget(point, candidates) {
    const radiusSquared = FLOW_PORT_SNAP_RADIUS * FLOW_PORT_SNAP_RADIUS;
    return candidates.reduce((nearest, candidate) => {
        const distanceSquared = (candidate.center.x - point.x) ** 2 + (candidate.center.y - point.y) ** 2;
        if (distanceSquared > radiusSquared + 1e-9)
            return nearest;
        if (!nearest)
            return candidate;
        const nearestDistanceSquared = (nearest.center.x - point.x) ** 2 + (nearest.center.y - point.y) ** 2;
        return distanceSquared < nearestDistanceSquared || distanceSquared === nearestDistanceSquared && candidate.presentationOrder > nearest.presentationOrder ? candidate : nearest;
    }, undefined);
}
export function flowPointerSnapTarget({ sourceId, compatibleSide, direct, snap }) {
    if (!compatibleSide || !snap)
        return undefined;
    if (!direct)
        return snap;
    if (direct.kind === "event" || direct.kind === "page" && direct.endpointId === sourceId)
        return undefined;
    if (direct.kind === "port" && direct.port !== compatibleSide)
        return undefined;
    return snap;
}
//# sourceMappingURL=relationship-port-snap.js.map