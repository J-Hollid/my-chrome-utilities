import type { WorkspaceTabId } from "./workspace-tabs.js";
import type { DataLayerView } from "./data-layer-live-observer.js";

export type CommandCategory = "demo" | "data-layer" | "navigation";

export interface CommandRunRecord {
  commandId: string;
  message: string;
}

export interface CommandRunContext {
  record(entry: CommandRunRecord): void;
  showWorkspace?(tab: WorkspaceTabId): void;
  showDataLayerView?(view: DataLayerView): void;
}

export interface AppCommand {
  id: string;
  title: string;
  description: string;
  category: CommandCategory;
  run(context: CommandRunContext): void;
}

const sayHelloCommand: AppCommand = {
  id: "demo.say-hello",
  title: "Say hello",
  description: "Records that the demo hello command ran.",
  category: "demo",
  run(context: CommandRunContext): void {
    context.record({
      commandId: "demo.say-hello",
      message: "demo.say-hello ran",
    });
  },
};

const startDataLayerTestingCommand: AppCommand = {
  id: "data-layer.start-testing",
  title: "Start data layer testing",
  description: "Starts a data layer testing session for the active tab.",
  category: "data-layer",
  run(context: CommandRunContext): void {
    context.record({
      commandId: "data-layer.start-testing",
      message: "data-layer.start-testing ran",
    });
  },
};

const endDataLayerTestingCommand: AppCommand = {
  id: "data-layer.end-testing",
  title: "End data layer testing",
  description: "Ends the active data layer testing session.",
  category: "data-layer",
  run(context: CommandRunContext): void {
    context.record({
      commandId: "data-layer.end-testing",
      message: "data-layer.end-testing ran",
    });
  },
};

const saveDataLayerSessionCommand: AppCommand = {
  id: "data-layer.save-session",
  title: "Save data layer session",
  description: "Saves the active data layer testing session.",
  category: "data-layer",
  run(context: CommandRunContext): void {
    context.record({
      commandId: "data-layer.save-session",
      message: "data-layer.save-session ran",
    });
  },
};

function observationTargetCommand(
  id:
    | "data-layer.choose-observation-target"
    | "data-layer.attach-selected-target"
    | "data-layer.detach-observation-target",
  title: string,
  action: string,
): AppCommand {
  return {
    id,
    title,
    description: `${action} in the Data Layer Live view.`,
    category: "data-layer",
    run(context: CommandRunContext): void {
      context.showWorkspace?.("data-layer");
      context.showDataLayerView?.("Live");
      context.record({ commandId: id, message: action });
    },
  };
}

function dataLayerViewCommand(
  id: "data-layer.show-live" | "data-layer.show-library" | "data-layer.show-sessions" | "data-layer.show-schemas",
  title: string,
): AppCommand {
  const view = title.replace("Show ", "") as DataLayerView;
  return {
    id,
    title,
    description: `Shows the ${title.replace("Show ", "")} Data Layer view.`,
    category: "data-layer",
    run(context: CommandRunContext): void {
      context.showWorkspace?.("data-layer");
      context.showDataLayerView?.(view);
      context.record({ commandId: id, message: `${id} ran` });
    },
  };
}

function workspaceNavigationCommand(
  id: "navigation.show-data-layer" | "navigation.show-hotkeys",
  title: string,
  tab: WorkspaceTabId,
): AppCommand {
  return {
    id,
    title,
    description: `Shows the ${title.replace("Show ", "")} workspace.`,
    category: "navigation",
    run(context: CommandRunContext): void {
      context.showWorkspace?.(tab);
      context.record({ commandId: id, message: `${id} ran` });
    },
  };
}

const commands: readonly AppCommand[] = [
  sayHelloCommand,
  startDataLayerTestingCommand,
  endDataLayerTestingCommand,
  saveDataLayerSessionCommand,
  observationTargetCommand(
    "data-layer.choose-observation-target",
    "Choose target",
    "Choose target",
  ),
  observationTargetCommand(
    "data-layer.attach-selected-target",
    "Attach selected target",
    "Attach selected target",
  ),
  observationTargetCommand(
    "data-layer.detach-observation-target",
    "Detach target",
    "Detach target",
  ),
  dataLayerViewCommand("data-layer.show-live", "Show Live"),
  dataLayerViewCommand("data-layer.show-library", "Show Library"),
  dataLayerViewCommand("data-layer.show-sessions", "Show Sessions"),
  dataLayerViewCommand("data-layer.show-schemas", "Show Schemas"),
  workspaceNavigationCommand(
    "navigation.show-data-layer",
    "Show Data Layer",
    "data-layer",
  ),
  workspaceNavigationCommand("navigation.show-hotkeys", "Show Hotkeys", "hotkeys"),
];

export function listCommands(): readonly AppCommand[] {
  return commands;
}

export function findCommand(id: string): AppCommand | undefined {
  return commands.find((command) => command.id === id);
}

export function runCommandById(id: string, context: CommandRunContext): void {
  const command = findCommand(id);

  if (!command) {
    throw new Error(`Unknown command: ${id}`);
  }

  command.run(context);
}
