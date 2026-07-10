import type { AppCommand } from "./commands.js";

export function filterPaletteCommands(
  commands: readonly AppCommand[],
  query: string,
): readonly AppCommand[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return commands;
  }

  return commands.filter((command) =>
    `${command.id} ${command.title} ${command.description} ${command.category}`
      .toLowerCase()
      .includes(normalized),
  );
}

export function selectedPaletteIndexForKey(
  key: string,
  selectedIndex: number,
  count: number,
): number | undefined {
  if (count === 0) {
    return undefined;
  }

  switch (key) {
    case "ArrowDown":
      return (selectedIndex + 1) % count;
    case "ArrowUp":
      return (selectedIndex - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return undefined;
  }
}
