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
    if (model.active) {
        const heading = document.createElement("h4"), summary = document.createElement("p");
        heading.textContent = model.active.name;
        summary.textContent = model.active.summary;
        const open = button("Open in Specification Studio", `Open ${model.active.name} in Specification Studio`, () => callbacks.openProject(model.active.id));
        const edit = button("Edit details", `Edit details for ${model.active.name}`, (control) => callbacks.editProject(model.active.id, control));
        const close = button("Close project", `Close active project ${model.active.name}`, () => callbacks.closeProject());
        open.disabled = edit.disabled = close.disabled = model.blocked;
        hosts.activeCard.append(heading, summary, open, edit, button("Export", `Export ${model.active.name}`, () => callbacks.exportProject(model.active.id)), close);
    }
    else {
        const message = document.createElement("p");
        message.textContent = "No active project";
        hosts.activeCard.append(message, button("Open project", "Open a project", () => callbacks.focusSearch()), button("Create project", "Create project", (control) => callbacks.createProject(control)));
    }
    hosts.list.replaceChildren();
    for (const entry of model.entries) {
        const item = document.createElement("li"), summary = document.createElement("p");
        item.dataset.projectId = entry.id;
        item.tabIndex = -1;
        summary.textContent = entry.summary;
        item.append(summary);
        if (entry.active)
            item.append(button("Active", `${entry.name} Active`, () => { }));
        else {
            const switchControl = button("Switch", `Switch to ${entry.name}`, (control) => callbacks.switchProject(entry.id, control));
            switchControl.disabled = model.blocked;
            item.append(switchControl);
        }
        item.append(button("Edit details", `Edit details for ${entry.name}`, (control) => callbacks.editProject(entry.id, control)), button("Export", `Export ${entry.name}`, () => callbacks.exportProject(entry.id)));
        hosts.list.append(item);
    }
}
//# sourceMappingURL=data-layer-project-library-presentation-ui.js.map