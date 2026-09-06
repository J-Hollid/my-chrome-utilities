const button = (text, aria, run) => {
    const control = document.createElement("button");
    control.type = "button";
    control.textContent = text;
    control.setAttribute("aria-label", aria);
    control.addEventListener("click", () => run(control));
    return control;
};
export function renderProjectLibraryPresentation(hosts, model, callbacks) {
    hosts.activeHeader.textContent = model.activeHeader;
    hosts.activeCard.replaceChildren();
    hosts.activeCard.hidden = Boolean(model.active);
    if (!model.active) {
        const message = document.createElement("p");
        message.textContent = "No active project";
        hosts.activeCard.append(message, button("Open project", "Open a project", () => callbacks.focusSearch()), button("Create project", "Create project", (control) => callbacks.createProject(control)));
    }
    hosts.list.replaceChildren();
    for (const entry of model.entries) {
        const item = document.createElement("li"), heading = document.createElement("h4"), summary = document.createElement("p");
        item.dataset.projectId = entry.id;
        item.dataset.active = String(entry.active);
        item.tabIndex = -1;
        heading.textContent = entry.name;
        summary.textContent = entry.summary;
        item.append(heading, summary);
        if (entry.active) {
            const label = document.createElement("strong");
            label.textContent = "Active project";
            item.append(label);
        }
        const details = document.createElement("details"), disclosure = document.createElement("summary");
        const identity = document.createElement("code"), saved = document.createElement("time");
        disclosure.textContent = "Project details";
        disclosure.setAttribute("aria-label", `Project details for ${entry.name}`);
        identity.textContent = entry.id;
        saved.textContent = entry.savedAt;
        saved.dateTime = entry.savedAt;
        details.append(disclosure, "Project identifier: ", identity, " · Last saved: ", saved);
        item.append(details);
        if (entry.active) {
            const open = button("Open in Specification Studio", `Open ${entry.name} in Specification Studio`, () => callbacks.openProject(entry.id));
            open.disabled = model.blocked;
            open.dataset.actionVariant = "primary";
            item.append(open);
        }
        else {
            const switchControl = button("Switch", `Switch to ${entry.name}`, (control) => callbacks.switchProject(entry.id, control));
            switchControl.disabled = model.blocked;
            item.append(switchControl);
        }
        const edit = button("Edit details", `Edit details for ${entry.name}`, (control) => callbacks.editProject(entry.id, control));
        edit.disabled = entry.active && model.blocked;
        item.append(edit, button("Export", `Export ${entry.name}`, () => callbacks.exportProject(entry.id)));
        if (entry.active) {
            const close = button("Close project", `Close active project ${entry.name}`, () => callbacks.closeProject());
            close.disabled = model.blocked;
            item.append(close);
        }
        hosts.list.append(item);
    }
}
//# sourceMappingURL=data-layer-project-library-presentation-ui.js.map