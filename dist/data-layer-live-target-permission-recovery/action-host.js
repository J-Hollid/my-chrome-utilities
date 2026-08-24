export function createLiveTargetPermissionRecoveryActionHost(root = typeof document === "undefined" ? undefined : document) {
    let action;
    const removeAction = () => {
        action?.remove();
        action = undefined;
    };
    return {
        show(target, requestAccess) {
            const step = root?.querySelector("#live-setup-readiness");
            if (!step || typeof document === "undefined")
                return;
            removeAction();
            action = document.createElement("button");
            action.type = "button";
            action.dataset.liveTargetPermissionRecovery = target.id;
            action.textContent = "Request access";
            action.addEventListener("click", () => { void requestAccess(); });
            step.append(action);
        },
        hide: removeAction,
        historyPath: () => {
            const fieldValue = root?.querySelector("#history-path")?.value.trim();
            return fieldValue
                || root?.querySelector("#history-path-display")?.textContent?.trim();
        },
        pathStatus: () => root?.querySelector("#history-path-status")?.textContent?.trim(),
    };
}
//# sourceMappingURL=action-host.js.map