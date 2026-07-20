const sayHelloCommand = {
    id: "demo.say-hello",
    title: "Say hello",
    description: "Records that the demo hello command ran.",
    category: "demo",
    run(context) {
        context.record({
            commandId: "demo.say-hello",
            message: "demo.say-hello ran",
        });
    },
};
const startDataLayerTestingCommand = {
    id: "data-layer.start-testing",
    title: "Start data layer testing",
    description: "Starts a data layer testing session for the active tab.",
    category: "data-layer",
    run(context) {
        context.record({
            commandId: "data-layer.start-testing",
            message: "data-layer.start-testing ran",
        });
    },
};
const endDataLayerTestingCommand = {
    id: "data-layer.end-testing",
    title: "End data layer testing",
    description: "Ends the active data layer testing session.",
    category: "data-layer",
    run(context) {
        context.record({
            commandId: "data-layer.end-testing",
            message: "data-layer.end-testing ran",
        });
    },
};
const saveDataLayerSessionCommand = {
    id: "data-layer.save-session",
    title: "Save data layer session",
    description: "Saves the active data layer testing session.",
    category: "data-layer",
    run(context) {
        context.record({
            commandId: "data-layer.save-session",
            message: "data-layer.save-session ran",
        });
    },
};
function observationTargetCommand(id, title, action) {
    return {
        id,
        title,
        description: `${action} in the Data Layer Live view.`,
        category: "data-layer",
        run(context) {
            context.showWorkspace?.("data-layer");
            context.showDataLayerView?.("Live");
            context.record({ commandId: id, message: action });
        },
    };
}
function dataLayerViewCommand(id, title) {
    const view = title.replace("Show ", "");
    return {
        id,
        title,
        description: `Shows the ${title.replace("Show ", "")} Data Layer view.`,
        category: "data-layer",
        run(context) {
            context.showWorkspace?.("data-layer");
            context.showDataLayerView?.(view);
            context.record({ commandId: id, message: `${id} ran` });
        },
    };
}
function workspaceNavigationCommand(id, title, tab) {
    return {
        id,
        title,
        description: `Shows the ${title.replace("Show ", "")} workspace.`,
        category: "navigation",
        run(context) {
            context.showWorkspace?.(tab);
            context.record({ commandId: id, message: `${id} ran` });
        },
    };
}
const commands = [
    sayHelloCommand,
    startDataLayerTestingCommand,
    endDataLayerTestingCommand,
    saveDataLayerSessionCommand,
    observationTargetCommand("data-layer.choose-observation-target", "Choose target", "Choose target"),
    observationTargetCommand("data-layer.attach-selected-target", "Attach selected target", "Attach selected target"),
    observationTargetCommand("data-layer.detach-observation-target", "Detach target", "Detach target"),
    dataLayerViewCommand("data-layer.show-live", "Show Live"),
    dataLayerViewCommand("data-layer.show-projects", "Show Projects"),
    dataLayerViewCommand("data-layer.show-library", "Show Library"),
    dataLayerViewCommand("data-layer.show-sessions", "Show Sessions"),
    dataLayerViewCommand("data-layer.show-schemas", "Show Schemas"),
    workspaceNavigationCommand("navigation.show-data-layer", "Show Data Layer", "data-layer"),
    workspaceNavigationCommand("navigation.show-hotkeys", "Show Hotkeys", "hotkeys"),
];
export function listCommands() {
    return commands;
}
export function findCommand(id) {
    return commands.find((command) => command.id === id);
}
export function runCommandById(id, context) {
    const command = findCommand(id);
    if (!command) {
        throw new Error(`Unknown command: ${id}`);
    }
    command.run(context);
}
//# sourceMappingURL=commands.js.map