import { recordActions } from "../../interface/record-actions.js";
export function renderInstalledSavedSessionList(list, sessions, actions) {
    if (!list)
        return;
    list.replaceChildren(...sessions.map((session) => {
        const item = document.createElement("li");
        item.append(Object.assign(document.createElement("strong"), { textContent: session.name }));
        const controls = [
            ["Open in Live feed", () => actions.open(session.id)],
            ["Rename", () => { const name = globalThis.prompt("Saved session name", session.name); if (name !== null)
                    actions.rename(session.id, name); }],
            ["Export", () => actions.export(session.id)],
            ["Start linked capture", () => actions.resume(session.id)],
            ["Create sequence", () => actions.createSequence(session.id)],
            ["Delete", () => actions.requestDelete(session.id)],
        ];
        const buttons = controls.map(([label, activate]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.addEventListener("click", activate);
            return button;
        });
        item.append(recordActions(buttons[0], buttons.slice(1)));
        return item;
    }));
}
//# sourceMappingURL=session-list.js.map