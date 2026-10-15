import { recordActions } from "./record-actions.js";
function actionButton(label, action, variant = "secondary", templateId, accessibleName) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.actionVariant = variant;
    if (templateId)
        button.dataset.templateId = templateId;
    if (accessibleName)
        button.setAttribute("aria-label", accessibleName);
    button.addEventListener("click", action);
    return button;
}
export function eventTemplateRow(template, actions) {
    const item = document.createElement("li");
    item.className = "event-template-row";
    const identity = document.createElement("div");
    identity.className = "event-template-identity";
    identity.textContent = `${template.name} · ${template.eventName}`;
    const routing = document.createElement("div");
    routing.className = "event-template-routing";
    routing.textContent = `${template.sourceName} → ${template.destination}`;
    const attributes = document.createElement("dl");
    attributes.className = "event-template-attributes";
    const attributesToRender = [
        ["Version", String(template.version)],
        ["Validation", template.validation],
        ["Schema", template.schemaId ?? "None"],
        ["Tags", template.tags.join(", ") || "none"],
    ];
    for (const [label, value] of attributesToRender) {
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        attributes.append(term, description);
    }
    const actionsRow = document.createElement("div");
    actionsRow.className = "event-template-actions";
    actionsRow.append(recordActions(actionButton("Edit", () => actions.edit(template), "secondary", template.id), [
        actionButton("Delete", () => actions.delete(template), "destructive", template.id, `Delete ${template.name}`),
        actionButton("Duplicate", () => actions.duplicate(template)),
        ...(actions.createSchema ? [actionButton("Create schema", () => actions.createSchema?.(template))] : []),
        ...(actions.createTestCase ? [actionButton("Create Test case", () => actions.createTestCase?.(template))] : []),
        actionButton("Push", () => actions.push(template)),
    ]));
    item.append(identity, routing, attributes, actionsRow);
    return item;
}
//# sourceMappingURL=event-template-row.js.map