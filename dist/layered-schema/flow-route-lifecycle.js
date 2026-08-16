export function openFlowSchemaRouteLifecycle(originFlowId, contributorId, contributorScope) {
    return { originFlowId, contributorId, contributorScope, returnFocusOwned: true, flowReturnOwned: true };
}
export function reconcileFlowSchemaRouteLifecycle(lifecycle, activeFlowId) {
    return lifecycle.originFlowId === activeFlowId ? lifecycle : {};
}
//# sourceMappingURL=flow-route-lifecycle.js.map