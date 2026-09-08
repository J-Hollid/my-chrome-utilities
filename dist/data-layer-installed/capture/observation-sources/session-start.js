export function createObservationSessionStart(ports) {
    return async () => {
        const state = ports.targets();
        const target = state.targets.find(candidate => candidate.id === (state.attachedTargetId ?? state.selectedTargetId));
        if (!target)
            throw new Error("Select a target before testing.");
        const configuration = ports.configuration();
        if (!configuration || configuration.projectId !== ports.projectId())
            throw new Error("Loading project observation sources");
        const readiness = ports.readiness();
        if (readiness !== "Ready")
            throw new Error(readiness ?? "Enable an observation source");
        return {
            id: `tab-${target.tabId}-session-${crypto.randomUUID()}`, tabId: target.tabId, url: target.pageUrl,
            historyPath: ports.path(), windowId: target.windowId, targetTitle: target.title, targetOrigin: target.origin,
        };
    };
}
//# sourceMappingURL=session-start.js.map