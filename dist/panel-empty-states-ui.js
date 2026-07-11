export function findPanelEmptyStateElements(containerSelector, recoverySelector, root = document) {
    const container = root.querySelector(containerSelector);
    return {
        container,
        heading: container?.querySelector("h4, h5") ?? null,
        detail: container?.querySelector("p") ?? null,
        recovery: root.querySelector(recoverySelector),
    };
}
export function renderPanelEmptyState(elements, state) {
    if (elements.container)
        elements.container.hidden = !state;
    if (!state)
        return;
    if (elements.heading)
        elements.heading.textContent = state.message;
    if (elements.detail)
        elements.detail.textContent = `${state.recoveryAction} can resolve this state.`;
    if (elements.recovery)
        elements.recovery.textContent = state.recoveryAction;
}
//# sourceMappingURL=panel-empty-states-ui.js.map