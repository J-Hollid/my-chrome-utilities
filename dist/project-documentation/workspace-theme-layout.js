export function themeEditorLayout(host, sample, actions, transfer) {
    const layout = document.createElement("div"), controls = document.createElement("section"), preview = document.createElement("section");
    layout.className = "documentation-theme-layout";
    controls.setAttribute("aria-label", "Theme controls");
    preview.setAttribute("aria-label", "Theme preview");
    const state = document.createElement("output"), previewState = document.createElement("p"), bar = document.createElement("div");
    state.dataset.themeSaveState = "true";
    state.setAttribute("aria-live", "polite");
    state.textContent = "Saved theme";
    previewState.textContent = "Preview is current.";
    previewState.setAttribute("aria-live", "polite");
    controls.append(...Array.from(host.children));
    for (const label of Array.from(controls.querySelectorAll("label"))) {
        const field = label.querySelector("input,select,textarea");
        if (field && !field.matches('[type="checkbox"]'))
            label.append(field);
    }
    const more = document.createElement("details"), summary = document.createElement("summary");
    summary.textContent = "Copy or import theme values";
    more.append(summary, ...transfer);
    bar.className = "theme-actions";
    bar.append(...actions);
    const title = controls.querySelector("h2");
    controls.prepend(...(title ? [title] : []), state, bar);
    controls.append(more);
    preview.append(previewState, sample);
    layout.append(controls, preview);
    host.append(layout);
    const dirty = () => { state.textContent = "Unsaved theme changes"; previewState.textContent = "Preview is out of date. Select Preview theme changes."; };
    controls.addEventListener("input", dirty);
    controls.addEventListener("change", dirty);
    return { dirty, previewed: () => { previewState.textContent = "Preview is current. Preview does not save changes."; }, submitted: () => { state.textContent = "Theme save requested. Check the workspace save status."; } };
}
//# sourceMappingURL=workspace-theme-layout.js.map