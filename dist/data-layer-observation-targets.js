const accessExplanations = {
    Ready: "Page can be observed",
    "Permission required": "Site access is required",
    Restricted: "Chrome pages cannot be observed",
    Closed: "The browser tab is no longer available",
};
export function observationTargetId(tabId, windowId) {
    return `tab:${tabId}:window:${windowId}`;
}
export function targetAccessForUrl(pageUrl) {
    try {
        const { protocol } = new URL(pageUrl);
        return protocol === "http:" || protocol === "https:"
            ? "Ready"
            : "Restricted";
    }
    catch {
        return "Closed";
    }
}
export function targetAccessExplanation(accessState, pageUrl) {
    if (accessState === "Restricted" && pageUrl?.startsWith("chrome-extension:")) {
        return "Extension pages cannot be observed";
    }
    return accessExplanations[accessState];
}
export function createObservationTarget(target) {
    const accessState = target.accessState ?? targetAccessForUrl(target.pageUrl);
    let origin = target.origin;
    if (!origin) {
        try {
            origin = new URL(target.pageUrl).origin;
        }
        catch {
            origin = "";
        }
    }
    return {
        ...target,
        id: target.id ?? observationTargetId(target.tabId, target.windowId),
        origin,
        accessState,
    };
}
export function createObservationTargetState(targets = []) {
    return { targets: [...targets], sessionState: "Detached" };
}
export function restoreAttachedObservationTarget(target) {
    const restored = { ...target, priorSession: true };
    return {
        targets: [restored],
        selectedTargetId: restored.id,
        attachedTargetId: restored.id,
        recentTargetId: restored.id,
        sessionState: "Attached",
    };
}
export function selectedObservationTarget(state) {
    return state.targets.find(({ id }) => id === state.selectedTargetId);
}
export function attachedObservationTarget(state) {
    return state.targets.find(({ id }) => id === state.attachedTargetId);
}
export function registerObservationTarget(state, target) {
    const existing = state.targets.find(({ id }) => id === target.id);
    return {
        ...state,
        targets: existing
            ? state.targets.map((candidate) => candidate.id === target.id ? target : candidate)
            : [...state.targets, target],
    };
}
export function completeAttachedObservationTargetRecovery(state, expectedTargetId, recoveredTarget) {
    if (state.selectedTargetId !== expectedTargetId ||
        state.attachedTargetId !== expectedTargetId ||
        recoveredTarget.id !== expectedTargetId) {
        return { state, applied: false };
    }
    return {
        state: registerObservationTarget(state, {
            ...recoveredTarget,
            priorSession: true,
        }),
        applied: true,
    };
}
export function refreshDiscoveredObservationTargets(state, discovered) {
    const retainedIds = new Set([
        state.selectedTargetId,
        state.attachedTargetId,
        state.recentTargetId,
    ].filter((id) => id !== undefined));
    const retained = state.targets.filter((target) => target.priorSession || retainedIds.has(target.id));
    return {
        ...state,
        targets: [...discovered, ...retained].reduce((targets, target) => targets.some(({ id }) => id === target.id)
            ? targets
            : [...targets, target], []),
    };
}
export function selectObservationTarget(state, targetId) {
    if (!state.targets.some(({ id }) => id === targetId))
        return state;
    return { ...state, selectedTargetId: targetId };
}
export function orderedObservationTargets(state) {
    const selected = selectedObservationTarget(state);
    const active = state.targets.find(({ activeTab, currentWindow }) => activeTab && currentWindow);
    const recent = state.targets.find(({ id }) => id === state.recentTargetId);
    const candidates = [
        selected,
        active,
        recent,
        ...state.targets.filter(({ currentWindow }) => currentWindow),
        ...state.targets,
    ];
    return candidates.reduce((ordered, target) => target && !ordered.some(({ id }) => id === target.id)
        ? [...ordered, target]
        : ordered, []);
}
export function findObservationTargets(state, query) {
    const needle = query.trim().toLowerCase();
    if (!needle)
        return orderedObservationTargets(state);
    return orderedObservationTargets(state).filter((target) => [target.title, target.pageUrl, target.origin, `${target.windowId}`]
        .some((value) => value.toLowerCase().includes(needle)));
}
export function attachSelectedObservationTarget(state) {
    const target = selectedObservationTarget(state);
    if (!target)
        return { state, result: "Selection required" };
    if (target.accessState !== "Ready")
        return { state, result: target.accessState };
    if (state.attachedTargetId && state.attachedTargetId !== target.id) {
        return { state, result: "End current session before attaching selected target" };
    }
    return {
        state: { ...state, attachedTargetId: target.id, recentTargetId: target.id, sessionState: "Attached" },
        result: "Attached",
    };
}
export function endAndAttachObservationTarget(state, targetId) {
    const selected = selectObservationTarget(state, targetId);
    const target = selectedObservationTarget(selected);
    if (!target)
        return { state, result: "Selection required" };
    if (target.accessState !== "Ready")
        return { state: selected, result: target.accessState };
    return {
        state: { ...selected, attachedTargetId: target.id, recentTargetId: target.id, sessionState: "Attached" },
        result: "Attached",
    };
}
export function detachObservationTarget(state) {
    const target = attachedObservationTarget(state);
    return {
        ...state,
        attachedTargetId: undefined,
        recentTargetId: target?.id ?? state.recentTargetId,
        sessionState: "Detached",
    };
}
export function updateObservationTargetAccess(state, targetId, accessState) {
    const wasAttached = state.attachedTargetId === targetId;
    return {
        ...state,
        targets: state.targets.map((target) => target.id === targetId
            ? { ...target, accessState }
            : target),
        ...(wasAttached && accessState !== "Ready"
            ? {
                attachedTargetId: undefined,
                sessionState: accessState === "Closed"
                    ? "Target unavailable"
                    : "Permission required",
            }
            : {}),
    };
}
export function navigateObservationTarget(state, tabId, pageUrl) {
    return {
        ...state,
        targets: state.targets.map((target) => target.tabId === tabId
            ? createObservationTarget({ ...target, pageUrl, accessState: targetAccessForUrl(pageUrl) })
            : target),
    };
}
export function closeObservationTarget(state, tabId) {
    const target = state.targets.find((candidate) => candidate.tabId === tabId);
    return target
        ? updateObservationTargetAccess(state, target.id, "Closed")
        : state;
}
//# sourceMappingURL=data-layer-observation-targets.js.map