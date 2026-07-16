export function mountUtilityShell(shell, root, pageLifecycle) {
    root.dataset.registeredUtilities = shell.utilityIds.join(",");
    root.dataset.activeUtilities = shell.activate().join(",");
    let mounted = true;
    const unmount = () => {
        if (!mounted)
            return;
        mounted = false;
        shell.deactivate();
        root.dataset.activeUtilities = "";
    };
    pageLifecycle.addEventListener("pagehide", unmount, { once: true });
    return { unmount };
}
export function renderUtilityDirectory(utilities, container, ownerDocument = document) {
    const items = utilities.map((utility) => {
        const item = ownerDocument.createElement("li");
        item.dataset.utilityId = utility.id;
        item.textContent = utility.identity.name;
        item.title = utility.identity.description;
        return item;
    });
    container.replaceChildren(...items);
}
export function bindUtilityPanels(utilities, root) {
    const owners = new Map();
    for (const utility of utilities) {
        for (const panelId of utility.panels) {
            const previousOwner = owners.get(panelId);
            if (previousOwner) {
                throw new Error(`Panel ${panelId} is owned by both ${previousOwner} and ${utility.id}`);
            }
            const panel = root.querySelector(`#${panelId}`);
            if (!panel)
                throw new Error(`Registered utility panel is missing: ${panelId}`);
            panel.dataset.utilityOwner = utility.id;
            owners.set(panelId, utility.id);
        }
    }
}
//# sourceMappingURL=utility-shell-dom.js.map