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
//# sourceMappingURL=utility-shell-dom.js.map