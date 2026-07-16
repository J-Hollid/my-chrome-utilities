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
//# sourceMappingURL=utility-shell-dom.js.map