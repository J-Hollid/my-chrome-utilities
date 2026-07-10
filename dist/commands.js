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