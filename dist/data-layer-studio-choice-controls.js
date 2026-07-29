const checkbox = (key, consequence) => ({ key, pattern: "checkbox", consequence });
const contracts = {
    "schema.only-defined": { key: "schema.only-defined", pattern: "switch", consequence: "Immediately applies one reversible Draft setting" },
    "schema.copy-dependency": checkbox("schema.copy-dependency", "Selects a schema dependency for the reviewed copy operation"),
    "schema.destructive-confirmation": checkbox("schema.destructive-confirmation", "Confirms replacement impact before the reviewed schema copy"),
    "schema.specification-property": checkbox("schema.specification-property", "Selects a property for the later specification copy action"),
    "schema.specification-headings": checkbox("schema.specification-headings", "Stages heading inclusion for the later specification copy action"),
    "documentation.concept-subheadings": checkbox("documentation.concept-subheadings", "Changes configuration pending preview refresh"),
    "documentation.concept-membership": checkbox("documentation.concept-membership", "Selects membership in the ordered concept group"),
    "documentation.section-membership": checkbox("documentation.section-membership", "Selects membership in the Documentation Set"),
    "documentation.flow-context": checkbox("documentation.flow-context", "Selects a Flow context for the saved documentation configuration"),
    "documentation.property-row": checkbox("documentation.property-row", "Selects a property row for the saved documentation configuration"),
    "documentation.metadata-column": checkbox("documentation.metadata-column", "Selects a metadata column for the saved documentation configuration"),
    "documentation.matrix-context": checkbox("documentation.matrix-context", "Selects a context for the saved capture-matrix configuration"),
    "documentation.profile-column": checkbox("documentation.profile-column", "Selects a Site Profile column for the saved documentation configuration"),
    "documentation.export-section": checkbox("documentation.export-section", "Selects membership in the export scope"),
    "documentation.confirm-incomplete": checkbox("documentation.confirm-incomplete", "Records an acknowledgement before incomplete export"),
    "documentation.theme-option": checkbox("documentation.theme-option", "Stages a theme option for explicit Save theme"),
    "documentation.include-headings": checkbox("documentation.include-headings", "Stages heading inclusion for the later documentation copy action"),
    "documentation.context-column": checkbox("documentation.context-column", "Selects a context column for the later documentation export"),
    "documentation.heading-part": checkbox("documentation.heading-part", "Selects a heading part for the later documentation export"),
    "entity.creation-option": checkbox("entity.creation-option", "Stages an entity option until the creation form is submitted"),
    "entity.editor-option": checkbox("entity.editor-option", "Stages an entity option until Save changes"),
    "condition.negation": checkbox("condition.negation", "Stages condition negation until the enclosing edit is saved"),
    "conflict.pending-field": checkbox("conflict.pending-field", "Selects the pending field value for the later conflict-resolution action"),
    "bulk.staged-property": checkbox("bulk.staged-property", "Selects membership for the later bulk action"),
    "defect.issue-inclusion": checkbox("defect.issue-inclusion", "Selects an issue for the later defect report action"),
    "defect.timeline-evidence": checkbox("defect.timeline-evidence", "Selects timeline evidence for the later defect report action"),
    "defect.expected-override": checkbox("defect.expected-override", "Stages an explicit expected-result override for later defect saving"),
    "defect.acknowledgement": checkbox("defect.acknowledgement", "Records an acknowledgement required before the later defect action"),
    "defect.report-section": checkbox("defect.report-section", "Selects a section for the later defect report copy or save action"),
    "defect.warning-acknowledgement": checkbox("defect.warning-acknowledgement", "Records an acknowledgement before the later missing-event report action"),
    "defect.expected-property": checkbox("defect.expected-property", "Selects an expected property for the later defect report action"),
    "guided.conditional": checkbox("guided.conditional", "Stages conditional application until the guided rule is saved"),
    "guided.publish-rule": checkbox("guided.publish-rule", "Stages Rule Library publication until the guided rule is saved"),
};
const declarations = new WeakMap();
export function studioChoiceContract(key) {
    const contract = contracts[key];
    if (!contract)
        throw new Error(`Unknown Specification Studio choice contract ${key}.`);
    return contract;
}
export function studioChoiceContractKeys() { return Object.keys(contracts); }
export function declareStudioChoice(input, key) {
    declarations.set(input, contracts[key]);
    return input;
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
    const contract = declarations.get(input);
    input.dataset.studioChoiceContract = contract?.key ?? "missing";
    if (!contract)
        input.dataset.studioChoiceMissing = "true";
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
    input.setAttribute("aria-description", contract?.consequence ?? "Missing explicit Specification Studio choice consequence");
    label.htmlFor = input.id;
    label.classList.add("studio-choice-row");
    if (contract?.pattern === "switch") {
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