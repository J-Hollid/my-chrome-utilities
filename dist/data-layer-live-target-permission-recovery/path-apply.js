export function createLiveTargetPermissionPathApplyBridge(options) {
    return {
        async apply(observation) {
            const target = options.attachedTarget() ?? options.selectedTarget();
            if (!target || target.tabId !== observation.tabId)
                return undefined;
            const request = {
                selectedTarget: target,
                historyPath: observation.historyPath,
                pageAccessStatus: observation.pageAccessStatus,
            };
            const result = await options.reconcileProbe(request);
            options.observeApplied?.({ request, result });
            if (result.status !== "inactive")
                options.renderReadiness();
            return result;
        },
    };
}
//# sourceMappingURL=path-apply.js.map