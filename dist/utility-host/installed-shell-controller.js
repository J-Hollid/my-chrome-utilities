export function createInstalledSidePanelShellController(ports) {
    const allCommands = [...ports.commands];
    const paletteController = ports.palette;
    const workspaceTabsController = ports.workspaceTabs;
    const hotkeyController = ports.hotkeys;
    let mounted = false;
    async function recordDataLayerCommandRun(entry) {
        if (entry.commandId === "data-layer.start-testing")
            await ports.captureCommands.startTesting();
        if (entry.commandId === "data-layer.end-testing")
            await ports.captureCommands.endTesting();
        if (entry.commandId === "data-layer.choose-observation-target")
            await ports.captureCommands.chooseObservationTarget();
        if (entry.commandId === "data-layer.attach-selected-target")
            await ports.captureCommands.attachSelectedTarget();
        if (entry.commandId === "data-layer.detach-observation-target")
            ports.captureCommands.detachObservationTarget();
    }
    function recordCommandRun(entry) {
        void recordDataLayerCommandRun(entry);
        if (ports.commandLog)
            ports.commandLog.textContent = entry.message;
    }
    function showWorkspace(tab, focus = false) {
        workspaceTabsController.show(tab, focus);
    }
    const commandRunContext = {
        record: recordCommandRun,
        showWorkspace,
        showDataLayerView: ports.showDataLayerView,
    };
    const pageHidden = () => paletteController.dispose();
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            workspaceTabsController.mount();
            hotkeyController.mount();
            paletteController.mount();
            ports.pageLifecycle.addEventListener("pagehide", pageHidden, { once: true });
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            ports.pageLifecycle.removeEventListener("pagehide", pageHidden);
            paletteController.dispose();
            hotkeyController.dispose();
            workspaceTabsController.dispose();
        },
        commandContext: commandRunContext,
        runDataLayerCommand: recordDataLayerCommandRun,
        commands: () => allCommands,
        runCommand: (id) => {
            const command = allCommands.find((candidate) => candidate.id === id);
            if (!command)
                throw new Error(`Unknown installed command ${id}`);
            command.run(commandRunContext);
        },
    };
}
//# sourceMappingURL=installed-shell-controller.js.map