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
    const properties = () => options.properties();
    const emptyPredicate = () => ({ kind: "predicate", id: options.id("condition"), propertyId: properties()[0]?.id ?? "", operator: "Exists" });
    const group = (kind) => ({ kind, id: options.id("condition"), children: [] });
    const emit = () => options.onChange(condition ? clone(condition) : undefined);
    const parentAt = (path) => {
        const node = path.reduce((candidate, index) => candidate && candidate.kind !== "predicate" ? candidate.children[index] : undefined, condition);
        return node?.kind === "predicate" ? undefined : node;
    };
    const insert = (path, node) => {
        if (path) {
            const parent = parentAt(path);
            if (!parent || parent.kind === "not" && parent.children.length)
                return;
            parent.children.push(node);
        }
        else if (!condition)
            condition = node;
        else if (condition.kind === "predicate")
            condition = { kind: "all", id: options.id("condition"), children: [condition, node] };
        else if (condition.kind !== "not" || !condition.children.length)
            condition.children.push(node);
        emit();
        render();
    };
    const remove = (path) => {
        if (!path.length)
            condition = undefined;
        else
            parentAt(path.slice(0, -1))?.children.splice(path.at(-1), 1);
        emit();
        render();
    };
    const groupChoice = (path) => {
        const controls = dom.createElement("span"), relation = dom.createElement("select");
        relation.setAttribute("aria-label", "Condition group relation");
        for (const kind of ["all", "any", "not"])
            relation.append(new Option(kind === "all" ? "All" : kind === "any" ? "Any" : "Not", kind));
        controls.append(relation, button(dom, "Add group", () => insert(path, group(relation.value))));
        return controls;
    };
    const renderPredicate = (node, path) => {
        const row = dom.createElement("article"), search = dom.createElement("input"), property = dom.createElement("select"), operator = dom.createElement("select"), valueHost = dom.createElement("span");
        row.dataset.conditionId = node.id ?? "";
        row.dataset.conditionPath = path.join(".") || "root";
        row.dataset.conditionKind = "predicate";
        search.type = "search";
        search.placeholder = "Search condition properties";
        search.setAttribute("aria-label", "Search condition properties");
        property.setAttribute("aria-label", "Condition property");
        operator.setAttribute("aria-label", "Type-valid operator");
        const selected = () => properties().find(({ id, name }) => id === property.value || name === property.value);
        const renderProperties = () => { const query = search.value.trim().toLowerCase(), prior = property.value || node.propertyId; property.replaceChildren(new Option("Choose property", ""), ...properties().filter(({ name, id }) => !query || name.toLowerCase().includes(query) || id.toLowerCase().includes(query)).map(({ name, id }) => new Option(name, id))); property.value = prior; };
        const renderValue = () => { valueHost.replaceChildren(); if (existence.includes(node.operator))
            return; const value = dom.createElement("input"); value.setAttribute("aria-label", "Typed condition value"); value.value = valueText(node.value); value.addEventListener("input", () => { try {
            node.value = typedValue(selected()?.type, value.value);
            value.setCustomValidity("");
            emit();
        }
        catch (error) {
            value.setCustomValidity(error instanceof Error ? error.message : String(error));
        } }); valueHost.append(value); };
        const renderOperators = () => { const available = operators(selected()?.type); operator.replaceChildren(...available.map((entry) => new Option(entry, entry))); if (!available.includes(node.operator))
            node.operator = "Exists"; operator.value = node.operator; renderValue(); };
        renderProperties();
        renderOperators();
        search.addEventListener("input", renderProperties);
        property.addEventListener("change", () => { node.propertyId = property.value; node.operator = "Exists"; delete node.value; renderOperators(); emit(); });
        operator.addEventListener("change", () => { node.operator = operator.value; if (existence.includes(node.operator))
            delete node.value; renderValue(); emit(); });
        row.append(labeled(dom, "Search properties", search), labeled(dom, "Property", property), labeled(dom, "Operator", operator), labeled(dom, "Value", valueHost), button(dom, "Remove", () => remove(path)));
        return row;
    };
    const renderGroup = (node, path) => {
        const row = dom.createElement("article"), header = dom.createElement("div"), relation = dom.createElement("select"), children = dom.createElement("div");
        row.dataset.conditionId = node.id ?? "";
        row.dataset.conditionPath = path.join(".") || "root";
        row.dataset.conditionKind = "group";
        relation.setAttribute("aria-label", "Condition group relation");
        for (const kind of ["all", "any", "not"])
            relation.append(new Option(kind === "all" ? "All" : kind === "any" ? "Any" : "Not", kind));
        relation.value = node.kind;
        relation.addEventListener("change", () => { const replacement = { ...node, kind: relation.value, children: relation.value === "not" ? node.children.slice(0, 1) : node.children }; if (!path.length)
            condition = replacement;
        else {
            const parent = parentAt(path.slice(0, -1));
            if (parent)
                parent.children[path.at(-1)] = replacement;
        } emit(); render(); });
        header.append(labeled(dom, "Relation", relation), button(dom, "Add condition", () => insert(path, emptyPredicate())), groupChoice(path), button(dom, "Remove", () => remove(path)));
        for (const [index, child] of node.children.entries())
            children.append(renderNode(child, [...path, index]));
        row.append(header, children);
        return row;
    };
    const renderNode = (node, path) => node.kind === "predicate" ? renderPredicate(node, path) : renderGroup(node, path);
    const render = () => { host.replaceChildren(); host.setAttribute("aria-label", "Shared editable condition tree"); if (condition)
        host.append(renderNode(condition, []));
    else {
        const empty = dom.createElement("div");
        empty.setAttribute("aria-label", "Empty When builder");
        empty.append(button(dom, "Add condition", () => insert(undefined, emptyPredicate())), groupChoice(undefined));
        host.append(empty);
    } };
    render();
}
//# sourceMappingURL=data-layer-shared-condition-tree-editor.js.map