import type { FlowPoint } from "./workspace.js";

export type FlowItemMenuKind = "section" | "page" | "event" | "relationship";

export interface FlowItemMenuRequest {
  clientPosition?: FlowPoint;
}

export const FLOW_ITEM_MENU_SPECS = Object.freeze({
  section: Object.freeze({
    commands: Object.freeze(["Rename", "Move", "Resize", "Wrap selection", "Remove Section", "Remove with contents"]),
    editorCommands: Object.freeze(["Rename"]),
    destructiveCommand: "Remove with contents",
  }),
  page: Object.freeze({
    commands: Object.freeze(["Rename in Flow", "Add Event", "Add visual", "View visual", "Edit visual", "Replace visual", "Remove visual", "Move", "Connect", "Duplicate", "Details", "Open schema contribution", "Remove"]),
    editorCommands: Object.freeze(["Rename in Flow", "Add visual", "Edit visual", "Replace visual", "Details"]),
    destructiveCommand: "Remove",
  }),
  event: Object.freeze({
    commands: Object.freeze(["Move", "Change Page", "Add visual", "View visual", "Edit visual", "Replace visual", "Remove visual", "Duplicate", "Details", "Open schema contribution", "Remove"]),
    editorCommands: Object.freeze(["Change Page", "Add visual", "Edit visual", "Replace visual", "Details"]),
    destructiveCommand: "Remove",
  }),
  relationship: Object.freeze({
    commands: Object.freeze(["Edit documentation", "Delete relationship"]),
    editorCommands: Object.freeze(["Edit documentation"]),
    destructiveCommand: "Delete relationship",
  }),
});

export function flowItemMenuRequest(event: {
  type: string;
  key?: string;
  shiftKey?: boolean;
  clientX?: number;
  clientY?: number;
}): FlowItemMenuRequest | undefined {
  if (event.type === "contextmenu") {
    return { clientPosition: { x: event.clientX ?? 0, y: event.clientY ?? 0 } };
  }
  if (event.type !== "keydown") return undefined;
  return event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey) ? {} : undefined;
}

export function flowItemActivationRequest(event: { type: string; key?: string; button?: number }): "select" | undefined {
  if (event.type === "click" && (event.button === undefined || event.button === 0)) return "select";
  if (event.type === "keydown" && (event.key === "Enter" || event.key === " ")) return "select";
  return undefined;
}

export function flowItemMenuIdentity(kind: FlowItemMenuKind, itemId: string): string {
  const stableId = itemId.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return `flow-${kind}-${stableId}-actions-menu`;
}

export function prepareFlowItemMenu(menu: HTMLElement, kind: FlowItemMenuKind, itemId: string): HTMLButtonElement[] {
  const spec = FLOW_ITEM_MENU_SPECS[kind];
  const controls = Array.from(menu.querySelectorAll<HTMLButtonElement>("button[data-flow-item-command]"));
  const byCommand = new Map(controls.map((control) => [control.dataset.flowItemCommand, control]));
  const ordered = spec.commands.flatMap((command) => {
    const control = byCommand.get(command);
    return control ? [control] : [];
  });
  menu.id = flowItemMenuIdentity(kind, itemId);
  menu.setAttribute("role", "menu");
  menu.dataset.flowItemMenu = kind;
  for (const control of ordered) {
    control.setAttribute("role", "menuitem");
    control.dataset.flowEditorCommand = String(spec.editorCommands.includes(control.dataset.flowItemCommand as never));
  }
  menu.replaceChildren(...ordered);
  return ordered;
}

export function prepareFlowActionsButton(button: HTMLButtonElement, menuId: string, expanded = false): void {
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-controls", menuId);
  button.setAttribute("aria-expanded", String(expanded));
}
