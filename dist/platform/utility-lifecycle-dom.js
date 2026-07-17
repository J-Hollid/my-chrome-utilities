export function createDomUtilityLifecycle(id, panels, options = {}) {
    let active = false;
    return {
        activate() { active = true; },
        deactivate() { active = false; },
        mount(root, pageLifecycle) {
            for (const panelId of panels) {
                const panel = root.querySelector(`#${panelId}`);
                if (!panel)
                    continue;
                panel.dataset.utilityOwner = id;
            }
            const dispose = options.onMount?.(root);
            this.activate();
            root.dataset.registeredUtilities = id;
            root.dataset.activeUtilities = id;
            let mounted = true;
            const unmount = () => { if (!mounted)
                return; mounted = false; dispose?.(); this.deactivate(); root.dataset.activeUtilities = ""; };
            pageLifecycle.addEventListener("pagehide", unmount, { once: true });
            return { unmount };
        },
    };
}
//# sourceMappingURL=utility-lifecycle-dom.js.map