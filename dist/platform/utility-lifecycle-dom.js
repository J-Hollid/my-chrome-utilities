export function registerDomUtilityUnmount(deactivate, root, pageLifecycle) {
    let mounted = true;
    const unmount = () => {
        if (!mounted)
            return;
        mounted = false;
        deactivate();
        root.dataset.activeUtilities = "";
    };
    pageLifecycle.addEventListener("pagehide", unmount, { once: true });
    return { unmount };
}
export function createDomUtilityLifecycle(id, panels, options = {}) {
    let active = false;
    return {
        activate() { active = true; },
        deactivate() { active = false; },
        mount(root, pageLifecycle) {
            for (const panelId of panels) {
                const panel = root.querySelector(`#${panelId}`);
                if (!panel)
                    throw new Error(`Registered utility panel is missing: ${panelId}`);
                panel.dataset.utilityOwner = id;
            }
            const dispose = options.onMount?.(root);
            this.activate();
            root.dataset.registeredUtilities = id;
            root.dataset.activeUtilities = id;
            return registerDomUtilityUnmount(() => {
                dispose?.();
                this.deactivate();
            }, root, pageLifecycle);
        },
    };
}
//# sourceMappingURL=utility-lifecycle-dom.js.map