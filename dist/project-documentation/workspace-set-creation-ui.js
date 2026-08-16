import { documentationButton as button, documentationControlInput as controlInput, documentationHeading as heading, documentationLabelled as labelled } from "./workspace-ui-elements.js";
export function renderDocumentationSetCreationUi(input) {
    const selector = document.createElement("select"), trigger = button("New Documentation Set", input.show), context = document.createElement("div");
    selector.setAttribute("aria-label", "Documentation Set");
    for (const set of input.sets)
        selector.append(new Option(set.name, set.id));
    selector.value = input.selectedSetId;
    selector.addEventListener("change", () => input.select(selector.value));
    trigger.dataset.newDocumentationSet = "true";
    trigger.setAttribute("aria-expanded", String(input.open));
    trigger.setAttribute("aria-controls", "documentation-set-setup");
    context.className = "documentation-set-context";
    context.append(labelled("Documentation Set", selector), trigger);
    if (!input.open)
        return { context };
    const setName = controlInput("newSetName", ""), themeName = controlInput("newSetThemeName", ""), setup = document.createElement("section");
    setName.setAttribute("aria-label", "New Documentation Set name");
    themeName.setAttribute("aria-label", "New Documentation Set theme name");
    setup.id = "documentation-set-setup";
    setup.className = "documentation-set-setup";
    setup.setAttribute("aria-label", "New Documentation Set setup");
    setup.append(heading(2, "New Documentation Set"), labelled("Set name", setName), labelled("Theme name", themeName), button("Create", () => input.create(setName.value, themeName.value)), button("Cancel", input.cancel));
    return { context, setup };
}
//# sourceMappingURL=workspace-set-creation-ui.js.map