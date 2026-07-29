const immediateSwitches = new Map([
    ["only defined fields", "immediately applies one reversible Draft setting"],
]);
const normalized = (value) => value.trim().replace(/\s+/gu, " ").toLowerCase();
const consequenceFor = (label) => {
    const value = normalized(label);
    if (immediateSwitches.has(value))
        return immediateSwitches.get(value);
    if (value === "include concept subheadings")
        return "Changes configuration pending preview refresh";
    if (value.startsWith("include ") && value.endsWith(" concept"))
        return "Selects membership in an ordered group";
    if (value.startsWith("export "))
        return "Selects membership in an export scope";
    if (value === "confirm incomplete export")
        return "Records an acknowledgement before export";
    if (value.startsWith("select staged property"))
        return "Selects membership for a later batch action";
    if (value === "borders")
        return "Stages a theme option for an explicit save";
    return `Changes the ${label} choice`;
};
export function studioChoicePattern(label, consequence) {
    const expected = immediateSwitches.get(normalized(label));
    return expected && normalized(consequence) === normalized(expected) ? "switch" : "checkbox";
}
export function studioChoiceTargetHeight(input) {
    return input.coarsePointer || input.narrow ? 44 : 36;
}
let generatedId = 0;
const visibleLabel = (input) => input.getAttribute("aria-label")?.trim() || input.name.trim() || "Choice";
const directActions = (label) => Array.from(label.children).filter((child) => child instanceof HTMLElement && child !== label.control && child.matches("button,a[href],[role=button]"));
function enhanceChoice(input) {
    if (input.dataset.studioChoiceEnhanced === "true")
        return;
    let label = input.labels?.[0];
    if (!label) {
        label = document.createElement("label");
        input.before(label);
        label.append(input, document.createTextNode(visibleLabel(input)));
    }
    const actions = directActions(label), copy = document.createElement("span");
    copy.className = "studio-choice-copy";
    for (const node of Array.from(label.childNodes))
        if (node !== input && !actions.includes(node))
            copy.append(node);
    if (!copy.textContent?.trim())
        copy.textContent = visibleLabel(input);
    label.replaceChildren(input, copy);
    if (actions.length)
        label.after(...actions);
    input.id ||= `studio-choice-${++generatedId}`;
    input.classList.add("studio-choice-indicator");
    input.dataset.studioChoiceEnhanced = "true";
    label.htmlFor = input.id;
    label.classList.add("studio-choice-row");
    const labelText = copy.textContent?.trim() || visibleLabel(input);
    input.setAttribute("aria-description", consequenceFor(labelText));
    const consequence = immediateSwitches.get(normalized(labelText));
    if (studioChoicePattern(labelText, consequence ?? "") === "switch") {
        const mark = document.createElement("span"), state = document.createElement("span");
        mark.className = "studio-switch-mark";
        mark.setAttribute("aria-hidden", "true");
        state.className = "studio-switch-state";
        state.id = `${input.id}-state`;
        input.setAttribute("role", "switch");
        const sync = () => { mark.textContent = input.checked ? "✓" : "—"; state.textContent = input.checked ? "On" : "Off"; input.setAttribute("aria-checked", String(input.checked)); };
        sync();
        input.addEventListener("change", sync);
        copy.append(mark, state);
    }
}
function enhanceWithin(root) {
    if (root instanceof HTMLInputElement && root.type === "checkbox")
        enhanceChoice(root);
    root.querySelectorAll('input[type="checkbox"]').forEach(enhanceChoice);
}
export function installStudioChoiceControls(root) {
    enhanceWithin(root);
    const observer = new MutationObserver((records) => {
        for (const record of records)
            for (const node of Array.from(record.addedNodes))
                if (node instanceof HTMLElement)
                    enhanceWithin(node);
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
}
//# sourceMappingURL=data-layer-studio-choice-controls.js.map