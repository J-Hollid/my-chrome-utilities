import type {SavedSession} from "../../data-layer-saved-sessions.js";
import {recordActions} from "../../interface/record-actions.js";
export interface InstalledSavedSessionListActions {
  open(id:string):void; rename(id:string, name:string):void; export(id:string):void;
  resume(id:string):void; createSequence(id:string):void; requestDelete(id:string):void;
}

export function renderInstalledSavedSessionList(
  list: HTMLElement | null,
  sessions: readonly SavedSession[],
  actions: InstalledSavedSessionListActions,
): void {
  if (!list) return;
  list.replaceChildren(...sessions.map((session) => {
    const item = document.createElement("li");
    item.append(Object.assign(document.createElement("strong"), { textContent:session.name }));
    const controls = [
      ["Open in Live feed", () => actions.open(session.id)],
      ["Rename", () => { const name=globalThis.prompt("Saved session name",session.name);if(name!==null)actions.rename(session.id,name); }],
      ["Export", () => actions.export(session.id)],
      ["Start linked capture", () => actions.resume(session.id)],
      ["Create sequence", () => actions.createSequence(session.id)],
      ["Delete", () => actions.requestDelete(session.id)],
    ] as const;
    const buttons = controls.map(([label, activate]) => {
      const button=document.createElement("button");button.type="button";button.textContent=label;button.addEventListener("click",activate);return button;
    });
    item.append(recordActions(buttons[0]!, buttons.slice(1)));
    return item;
  }));
}
