import { typedCanonicalValue } from "./data-layer-canonical-schema-facets.js";
const existence = ["Exists", "Does not exist"];
const operators = (type) => type === "number" || type === "integer" ? [...existence, "Equals", "Does not equal", "Greater than", "At least", "Less than", "At most"] : type === "boolean" || type === "null" ? [...existence, "Equals", "Does not equal"] : [...existence, "Equals", "Does not equal", "Starts with", "Contains", "Matches pattern"];
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const clone = (value) => structuredClone(value);
const withIds = (condition, id) => condition.kind === "predicate" ? { ...condition, id: condition.id ?? id("condition") } : { ...condition, id: condition.id ?? id("condition"), children: condition.children.map((child) => withIds(child, id)) };
const valueText = (value) => value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value) ?? String(value);
const typedValue = (type, text) => typedCanonicalValue(type, text);
export const sharedConditionOperators = (type) => operators(type);
export const sharedConditionValueMounted = (operator) => !existence.includes(operator);
export const sharedTypedConditionValue = (type, text) => typedValue(type, text);
export function renderSharedConditionTree(host, options) {
    const { dom } = options;
    let condition = options.condition ? withIds(clone(options.condition), options.id) : undefined;
    const render = () => {
        host.replaceChildren();
        host.setAttribute("aria-label", "Shared editable condition tree");
        const tree = dom.createElement("div"), controls = dom.createElement("fieldset"), search = dom.createElement("input"), property = dom.createElement("select"), operator = dom.createElement("select"), valueHost = dom.createElement("span");
        const properties = () => options.properties();
        const selected = () => properties().find(({ id, name }) => id === property.value || name === property.value);
        const emit = () => options.onChange(condition ? clone(condition) : undefined);
        const renderValue = (target = undefined) => { valueHost.replaceChildren(); if (existence.includes(operator.value))
            return; const value = target ?? dom.createElement("input"); value.setAttribute("aria-label", "Typed condition value"); value.value = valueText(condition && condition.kind === "predicate" ? condition.value : undefined); value.addEventListener("input", () => { const choice = selected(); try {
            const typed = typedValue(choice?.type, value.value);
            if (condition?.kind === "predicate") {
                condition.value = typed;
                value.setCustomValidity("");
                emit();
            }
        }
        catch (error) {
            value.setCustomValidity(error instanceof Error ? error.message : String(error));
        } }); valueHost.append(value); };
        const renderProperties = () => { const query = search.value.trim().toLowerCase(), prior = property.value; property.replaceChildren(new Option("Choose property", ""), ...properties().filter(({ name, id }) => !query || name.toLowerCase().includes(query) || id.toLowerCase().includes(query)).map(({ name, id }) => new Option(name, id))); property.value = prior; };
        const renderOperators = () => { operator.replaceChildren(...operators(selected()?.type).map((entry) => new Option(entry, entry))); operator.value = condition?.kind === "predicate" && operators(selected()?.type).includes(condition.operator) ? condition.operator : operator.options[0]?.value ?? "Exists"; renderValue(); };
        const renderPredicateEditor = (row, node) => { row.replaceChildren(); const editor = dom.createElement("fieldset"), editSearch = dom.createElement("input"), editProperty = dom.createElement("select"), editOperator = dom.createElement("select"), editValueHost = dom.createElement("span"); editor.setAttribute("aria-label", "Progressive condition predicate editor"); editSearch.type = "search"; editSearch.placeholder = "Search condition properties"; editSearch.setAttribute("aria-label", "Search condition properties"); editProperty.setAttribute("aria-label", "Condition property"); editOperator.setAttribute("aria-label", "Type-valid operator"); const chosen = () => properties().find(({ id, name }) => id === editProperty.value || name === editProperty.value); const emitNode = () => options.onChange(condition ? clone(condition) : undefined); const renderEditProperties = () => { const query = editSearch.value.trim().toLowerCase(), prior = editProperty.value; editProperty.replaceChildren(new Option("Choose property", ""), ...properties().filter(({ name, id }) => !query || name.toLowerCase().includes(query) || id.toLowerCase().includes(query)).map(({ name, id }) => new Option(name, id))); editProperty.value = prior || node.propertyId; }; const renderEditValue = () => { editValueHost.replaceChildren(); if (existence.includes(editOperator.value))
            return; const input = dom.createElement("input"); input.setAttribute("aria-label", "Typed condition value"); input.value = valueText(node.value); input.addEventListener("input", () => { try {
            node.value = typedValue(chosen()?.type, input.value);
            input.setCustomValidity("");
            emitNode();
        }
        catch (error) {
            input.setCustomValidity(error instanceof Error ? error.message : String(error));
        } }); editValueHost.append(input); }; const renderEditOperators = () => { editOperator.replaceChildren(...operators(chosen()?.type).map((entry) => new Option(entry, entry))); editOperator.value = operators(chosen()?.type).includes(node.operator) ? node.operator : "Exists"; renderEditValue(); }; renderEditProperties(); renderEditOperators(); editSearch.addEventListener("input", renderEditProperties); editProperty.addEventListener("change", () => { node.propertyId = editProperty.value; node.operator = "Exists"; delete node.value; renderEditOperators(); emitNode(); }); editOperator.addEventListener("change", () => { node.operator = editOperator.value; if (existence.includes(node.operator))
            delete node.value; renderEditValue(); emitNode(); }); editor.append(labeled(dom, "Search properties", editSearch), labeled(dom, "Condition property", editProperty), labeled(dom, "Type-valid operator", editOperator), labeled(dom, "Typed value", editValueHost)); row.append(editor); };
        const append = (node, path) => { const row = dom.createElement("article"); row.dataset.conditionId = node.id ?? ""; row.dataset.conditionPath = path.join(".") || "root"; row.append(Object.assign(dom.createElement("p"), { textContent: node.kind === "predicate" ? `${node.propertyId} ${node.operator}${node.value === undefined ? "" : ` ${String(node.value)}`}` : `${node.kind} (${node.children.length})` })); const replace = (next) => { if (!path.length) {
            condition = next;
            emit();
            render();
            return;
        } const parent = path.slice(0, -1).reduce((candidate, index) => candidate && candidate.kind !== "predicate" ? candidate.children[index] : undefined, condition); if (!parent || parent.kind === "predicate")
            return; if (next)
            parent.children[path.at(-1)] = next;
        else
            parent.children.splice(path.at(-1), 1); emit(); render(); }; row.append(button(dom, "View", () => { row.dataset.conditionMode = "view"; }), button(dom, "Edit", () => { row.dataset.conditionMode = "edit"; if (node.kind === "predicate")
            renderPredicateEditor(row, node); }), button(dom, "Add child", () => { if (node.kind === "predicate")
            return; node.children.push({ kind: "predicate", id: options.id("condition"), propertyId: properties()[0]?.id ?? "", operator: "Exists" }); emit(); render(); }), button(dom, "Move", () => { if (!path.length)
            return; const parent = path.slice(0, -1).reduce((candidate, index) => candidate && candidate.kind !== "predicate" ? candidate.children[index] : undefined, condition); if (!parent || parent.kind === "predicate")
            return; const index = path.at(-1); const target = index === 0 ? 1 : index - 1; if (target < 0 || target >= parent.children.length)
            return; [parent.children[index], parent.children[target]] = [parent.children[target], parent.children[index]]; emit(); render(); }), button(dom, "Remove", () => replace(undefined))); tree.append(row); if (node.kind !== "predicate")
            node.children.forEach((child, index) => append(child, [...path, index])); };
        if (condition)
            append(condition, []);
        else
            tree.textContent = "No condition configured.";
        search.type = "search";
        search.placeholder = "Search condition properties";
        search.setAttribute("aria-label", "Search condition properties");
        property.setAttribute("aria-label", "Condition property");
        operator.setAttribute("aria-label", "Type-valid operator");
        search.addEventListener("input", renderProperties);
        property.addEventListener("change", () => { renderOperators(); });
        operator.addEventListener("change", () => renderValue());
        renderProperties();
        renderOperators();
        controls.append(labeled(dom, "Search properties", search), labeled(dom, "Condition property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", valueHost), button(dom, "Add predicate", () => { const choice = selected(); if (!choice)
            return; try {
            const op = operator.value, next = { kind: "predicate", id: options.id("condition"), propertyId: choice.id, operator: op, ...(existence.includes(op) ? {} : { value: typedValue(choice.type, valueHost.querySelector("input")?.value ?? "") }) };
            if (!condition)
                condition = { kind: "all", id: options.id("condition"), children: [next] };
            else if (condition.kind === "predicate")
                condition = { kind: "all", ...(condition.id ? { id: condition.id } : {}), children: [condition, next] };
            else
                condition.children.push(next);
            emit();
            render();
        }
        catch (error) {
            valueHost.querySelector("input")?.setCustomValidity(error instanceof Error ? error.message : String(error));
        } }));
        for (const kind of ["all", "any", "not"])
            controls.append(button(dom, `Add ${kind.toUpperCase()} group`, () => { const next = { kind, id: options.id("condition"), children: [] }; if (!condition)
                condition = next;
            else if (condition.kind === "predicate")
                condition = { kind: "all", id: options.id("condition"), children: [condition, next] };
            else
                condition.children.push(next); options.onChange(condition); render(); }));
        host.append(tree, controls);
    };
    render();
}
//# sourceMappingURL=data-layer-shared-condition-tree-editor.js.map