export type CommandCategory = "demo";

export interface CommandRunRecord {
  commandId: string;
  message: string;
}

export interface CommandRunContext {
  record(entry: CommandRunRecord): void;
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

const commands: readonly AppCommand[] = [sayHelloCommand];

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
