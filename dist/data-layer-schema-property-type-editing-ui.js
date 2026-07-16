import { inspectSchemaPropertyTypeEdit, schemaPropertyTypeImpactCanReplace, schemaPropertyTypeLabel, } from "./data-layer-schema-property-type-editing.js";
const valueTypes = ["string", "number", "boolean", "object", "array"];
const itemTypes = [["", "Any item type"], ["string", "String"], ["number", "Number"], ["boolean", "Boolean"], ["object", "Object"]];
const treatments = ["error", "warning", "ignore"];
function capital(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
export function renderSchemaPropertyTypeEditor(options) {
    const { schema, path, property, inheritedOwner } = options;
    const action = document.createElement("button");
    action.type = "button";
    action.className = "schema-property-edit-type";
    action.textContent = inheritedOwner ? `Type owned by ${inheritedOwner.name}` : `Edit type · ${schemaPropertyTypeLabel(property)}`;
    action.setAttribute("aria-label", inheritedOwner ? `${path} type is owned by ${inheritedOwner.name}` : `Edit type for ${path}`);
    action.setAttribute("aria-expanded", "false");
    const editor = document.createElement("fieldset");
    editor.className = "schema-property-type-editor";
    editor.hidden = true;
    const legend = document.createElement("legend");
    legend.textContent = `Type for ${path}`;
    if (inheritedOwner) {
        action.addEventListener("click", inheritedOwner.open);
        editor.append(legend);
        return { action, editor };
    }
    const valueTypeLabel = document.createElement("label");
    valueTypeLabel.textContent = "Value type ";
    const valueType = document.createElement("select");
    valueType.setAttribute("aria-label", `Value type for ${path}`);
    for (const value of valueTypes)
        valueType.append(Object.assign(document.createElement("option"), { value, textContent: capital(value) }));
    valueType.value = property?.type ?? "string";
    valueTypeLabel.append(valueType);
    const itemTypeLabel = document.createElement("label");
    itemTypeLabel.textContent = "Item type ";
    const itemType = document.createElement("select");
    itemType.setAttribute("aria-label", `Item type for ${path}`);
    for (const [value, textContent] of itemTypes)
        itemType.append(Object.assign(document.createElement("option"), { value, textContent }));
    itemType.value = property?.items?.type ?? "";
    itemTypeLabel.append(itemType);
    itemTypeLabel.hidden = valueType.value !== "array";
    const treatmentLabel = document.createElement("label");
    treatmentLabel.textContent = "Type mismatch treatment ";
    const treatment = document.createElement("select");
    treatment.setAttribute("aria-label", `Type mismatch treatment for ${path}`);
    for (const value of treatments)
        treatment.append(Object.assign(document.createElement("option"), { value, textContent: capital(value) }));
    treatment.value = property?.typeMismatchTreatment ?? "error";
    treatmentLabel.append(treatment);
    const review = document.createElement("button");
    review.type = "button";
    review.textContent = "Review type change";
    const reviewOutput = document.createElement("output");
    reviewOutput.className = "schema-property-type-review";
    const resolutions = document.createElement("div");
    resolutions.className = "schema-property-type-impact-resolutions";
    resolutions.setAttribute("aria-label", `Impact resolutions for ${path}`);
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.textContent = "Confirm type change";
    confirm.disabled = true;
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";
    let currentImpact;
    const selectedType = () => valueType.value;
    const selectedItemType = () => itemType.value
        ? itemType.value
        : undefined;
    const selectedResolutions = () => Object.fromEntries(Array.from(resolutions.querySelectorAll("select[data-impact]"), (select) => {
        const replacement = resolutions.querySelector(`input[data-impact-replacement="${CSS.escape(select.dataset.impact)}"]`);
        return [select.dataset.impact, {
                action: select.value,
                ...(select.value === "replace" && replacement ? { value: replacement.value } : {}),
            }];
    }));
    const refreshResolutionState = () => {
        if (!currentImpact)
            return;
        confirm.disabled = currentImpact.incompatible.some((impact) => {
            const select = resolutions.querySelector(`select[data-impact="${CSS.escape(impact)}"]`);
            const replacement = resolutions.querySelector(`input[data-impact-replacement="${CSS.escape(impact)}"]`);
            return !select?.value || (select.value === "replace" && !replacement?.value.trim());
        });
    };
    const invalidateReview = () => {
        currentImpact = undefined;
        confirm.disabled = true;
        reviewOutput.textContent = "";
        resolutions.replaceChildren();
    };
    const refreshReview = () => {
        currentImpact = inspectSchemaPropertyTypeEdit(schema, path, selectedType(), selectedItemType());
        reviewOutput.textContent = `${currentImpact.from} changing to ${currentImpact.to}. Retained: ${currentImpact.compatible.join(", ") || "none"}. Incompatible: ${currentImpact.incompatible.join(", ") || "none"}.`;
        resolutions.replaceChildren(...currentImpact.incompatible.map((impact) => {
            const row = document.createElement("label");
            row.textContent = `${impact} `;
            const select = document.createElement("select");
            select.dataset.impact = impact;
            select.setAttribute("aria-label", `Resolution for ${impact} at ${path}`);
            select.append(Object.assign(document.createElement("option"), { value: "", textContent: "Choose resolution" }), Object.assign(document.createElement("option"), { value: "remove", textContent: "Remove artifact" }));
            const replaceable = schemaPropertyTypeImpactCanReplace(impact, selectedType());
            if (replaceable)
                select.append(Object.assign(document.createElement("option"), { value: "replace", textContent: "Replace artifact" }));
            const replacement = document.createElement("input");
            replacement.dataset.impactReplacement = impact;
            replacement.setAttribute("aria-label", `Replacement for ${impact} at ${path}`);
            replacement.placeholder = "Replacement value";
            replacement.hidden = true;
            select.addEventListener("change", () => {
                replacement.hidden = select.value !== "replace";
                refreshResolutionState();
            });
            replacement.addEventListener("input", refreshResolutionState);
            row.append(select, replacement);
            return row;
        }));
        refreshResolutionState();
    };
    valueType.addEventListener("change", () => {
        itemTypeLabel.hidden = valueType.value !== "array";
        invalidateReview();
    });
    itemType.addEventListener("change", invalidateReview);
    treatment.addEventListener("change", invalidateReview);
    review.addEventListener("click", refreshReview);
    confirm.addEventListener("click", () => {
        try {
            const type = selectedType();
            const item = selectedItemType();
            options.confirm({
                path,
                type,
                ...(type === "array" && item ? { itemType: item } : {}),
                treatment: treatment.value,
                removeIncompatible: false,
                resolutions: selectedResolutions(),
            });
        }
        catch (error) {
            reviewOutput.textContent = error instanceof Error ? error.message : "Type change failed";
        }
    });
    cancel.addEventListener("click", () => {
        editor.hidden = true;
        action.setAttribute("aria-expanded", "false");
        action.focus({ preventScroll: true });
    });
    action.addEventListener("click", () => {
        editor.hidden = false;
        action.setAttribute("aria-expanded", "true");
        valueType.focus({ preventScroll: true });
    });
    editor.append(valueTypeLabel, itemTypeLabel, treatmentLabel, review, reviewOutput, resolutions, confirm, cancel);
    editor.prepend(legend);
    return { action, editor };
}
//# sourceMappingURL=data-layer-schema-property-type-editing-ui.js.map