import { typedCanonicalValue } from "./data-layer-canonical-schema-facets.js";
const existence = ["Exists", "Does not exist"];
const conditionType = (type, allowedValues = []) => type !== "array" && allowedValues.length ? "enum" : type;
const operators = (type) => type === "number" || type === "integer" ? [...existence, "Equals", "Does not equal", "Greater than", "At least", "Less than", "At most"] : type === "boolean" || type === "null" ? [...existence, "Equals", "Does not equal"] : type === "array" ? [...existence, "Contains", "Contains any of"] : type === "enum" ? [...existence, "Equals", "Does not equal", "Is one of"] : [...existence, "Equals", "Does not equal", "Is one of", "Starts with", "Contains", "Matches pattern"];
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const clone = (value) => structuredClone(value);
const valueText = (value) => value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value) ?? String(value);
const typedValue = (type, text) => typedCanonicalValue(type, text);
export const sharedConditionOperators = (type, allowedValues = []) => operators(conditionType(type, allowedValues));
export const sharedConditionValueMounted = (operator) => !existence.includes(operator);
export const sharedTypedConditionValue = (type, text) => typedValue(type, text);
const predicateRows = (condition) => {
    if (!condition)
        return [];
    if (condition.kind === "predicate")
        return [clone(condition)];
    return condition.children.flatMap(predicateRows);
};
export const sharedFlatConditionRows = (condition) => predicateRows(condition).map(({ id, propertyId, operator, value }) => ({ ...(id ? { id } : {}), propertyId, operator, ...(value !== undefined ? { value } : {}) }));
const completeConditionValue = (value) => value !== undefined && !(typeof value === "string" && !value.trim()) && !(Array.isArray(value) && !value.length);
export const sharedFlatConditionResult = (mode, rows) => {
    if (!rows.length || rows.some(({ propertyId, operator, value }) => !propertyId.trim() || !operator || !existence.includes(operator) && !completeConditionValue(value)))
        return undefined;
    return { kind: mode, children: rows.map(({ id, propertyId, operator, value }) => ({ kind: "predicate", ...(id ? { id } : {}), propertyId, operator: operator, ...(existence.includes(operator) ? {} : { value }) })) };
};
export function renderSharedConditionTree(host, options) {
    const { dom } = options, initial = options.condition;
    let mode = initial?.kind === "any" ? "any" : "all", rows = sharedFlatConditionRows(initial).map((row) => ({ ...row, id: row.id ?? options.id("condition") }));
    if (!rows.length)
        rows = [{ id: options.id("condition"), propertyId: "", operator: "" }];
    if (!dom.getElementById("flat-rule-builder-responsive-style")) {
        const style = dom.createElement("style");
        style.id = "flat-rule-builder-responsive-style";
        style.textContent = `[data-rule-editor-mode]{display:grid;grid-template-columns:minmax(0,1fr)!important;box-sizing:border-box;min-width:0;max-width:100%}[data-rule-editor-mode] *{box-sizing:border-box;max-width:100%}[data-rule-editor-mode] label{display:grid;gap:.2rem;min-width:0}[data-rule-editor-mode] input,[data-rule-editor-mode] select{box-sizing:border-box;max-width:100%;min-width:0;width:100%}[data-rule-editor-mode] select{overflow:hidden;text-overflow:ellipsis}[data-rule-editor-mode] section{display:grid;gap:.5rem;min-width:0}[data-rule-field-grid="true"]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}[data-rule-field-grid="true"]>h3{grid-column:1/-1}[data-rule-editor-mode] [aria-label="Rule actions"]{position:sticky;bottom:0;z-index:1;background:Canvas;padding:.5rem 0}[data-rule-editor-mode] [aria-label="Rule actions"] [role="status"]{min-height:3em;margin:.25rem 0}[data-rule-editor-mode] h3,[data-condition-layout="responsive"] h4{margin:.4rem 0 .1rem}@media(max-width:600px){[data-condition-layout="responsive"] [data-condition-kind="predicate"],[data-rule-field-grid="true"]{grid-template-columns:minmax(0,1fr)!important}[data-condition-kind="predicate"]>button{min-width:0;width:100%}}`;
        dom.head.append(style);
    }
    let focusRowId;
    const properties = () => options.properties(), selected = (row) => properties().find(({ id }) => id === row.propertyId);
    const emit = () => options.onChange(sharedFlatConditionResult(mode, rows));
    const render = () => {
        host.closest("[data-rule-editor-mode]")?.querySelectorAll("[data-condition-property-listbox]").forEach((popup) => popup.remove());
        host.replaceChildren();
        host.setAttribute("aria-label", "Flat When condition list");
        host.dataset.conditionLayout = "responsive";
        const heading = dom.createElement("h4"), match = dom.createElement("select"), list = dom.createElement("div");
        heading.textContent = "Match conditions";
        match.setAttribute("aria-label", "Rule match mode");
        match.append(new Option("All of these conditions", "all"), new Option("Any of these conditions", "any"));
        match.value = mode;
        match.addEventListener("change", () => { mode = match.value; emit(); });
        list.setAttribute("role", "list");
        list.setAttribute("aria-label", "Condition rows");
        const chooseProperty = (row, entry, property, operator, listbox) => { row.propertyId = entry.id; row.operator = ""; delete row.value; property.value = entry.name; property.setAttribute("aria-expanded", "false"); listbox.hidden = true; renderOperators(row, operator); emit(); operator.focus({ preventScroll: true }); };
        const propertyControl = (row, operator) => {
            const wrapper = dom.createElement("span"), property = dom.createElement("input"), listbox = dom.createElement("div"), listboxId = `condition-property-list-${crypto.randomUUID()}`;
            wrapper.style.cssText = "position:relative;min-width:0;";
            property.type = "search";
            property.value = selected(row)?.name ?? "";
            property.placeholder = "Search properties";
            property.setAttribute("role", "combobox");
            property.setAttribute("aria-label", "Condition property");
            property.setAttribute("aria-autocomplete", "list");
            property.setAttribute("aria-controls", listboxId);
            property.setAttribute("aria-expanded", "false");
            listbox.id = listboxId;
            listbox.hidden = true;
            listbox.dataset.conditionPropertyListbox = "true";
            listbox.setAttribute("role", "listbox");
            listbox.setAttribute("aria-label", "Matching condition properties");
            listbox.style.cssText = "position:absolute;z-index:2147483647;box-sizing:border-box;max-width:none;overflow-y:auto;overflow-x:hidden;background:Canvas;border:1px solid ButtonBorder;padding:0.25rem;";
            let activeIndex = -1;
            const close = () => { property.setAttribute("aria-expanded", "false"); listbox.hidden = true; };
            const editorElement = host.closest("[data-rule-editor-mode]") ?? host;
            if (getComputedStyle(editorElement).position === "static")
                editorElement.style.position = "relative";
            editorElement.append(listbox);
            const open = () => { const query = property.value.trim().toLocaleLowerCase(), choices = properties().filter(({ id, name }) => !query || name.toLocaleLowerCase().includes(query) || id.toLocaleLowerCase().includes(query)); listbox.replaceChildren(); for (const [index, entry] of choices.entries()) {
                const option = dom.createElement("div");
                option.setAttribute("role", "option");
                option.tabIndex = -1;
                option.textContent = entry.name;
                option.dataset.propertyId = entry.id;
                option.style.cssText = "padding:0.35rem 0.5rem;cursor:pointer;";
                option.addEventListener("mousedown", (event) => event.preventDefault());
                option.addEventListener("click", () => chooseProperty(row, entry, property, operator, listbox));
                option.setAttribute("aria-selected", String(index === activeIndex));
                listbox.append(option);
            } listbox.hidden = false; property.setAttribute("aria-expanded", "true"); requestAnimationFrame(() => { const field = property.getBoundingClientRect(), editor = editorElement.getBoundingClientRect(), viewportWidth = dom.defaultView?.innerWidth ?? editor.right, viewportHeight = dom.defaultView?.innerHeight ?? editor.bottom, leftEdge = Math.max(0, editor.left), rightEdge = Math.min(viewportWidth, editor.left + editorElement.clientWidth), topEdge = Math.max(0, editor.top), bottomEdge = Math.min(viewportHeight, editor.top + editorElement.clientHeight), width = Math.max(1, Math.min(Math.max(field.width, 180), rightEdge - leftEdge)), left = Math.max(leftEdge, Math.min(field.left, rightEdge - width)), below = bottomEdge - field.bottom, above = field.top - topEdge, desiredHeight = Math.min(240, Math.max(1, listbox.scrollHeight)), flip = below < desiredHeight + 8 && above > below, maxHeight = Math.max(1, Math.min(240, (flip ? above : below) - 8)), popupTop = flip ? Math.max(topEdge, field.top - Math.min(listbox.scrollHeight, maxHeight)) : field.bottom, absoluteLeft = left - editor.left + editorElement.scrollLeft, absoluteTop = popupTop - editor.top + editorElement.scrollTop; listbox.style.left = `${absoluteLeft}px`; listbox.style.width = `${width}px`; listbox.style.maxHeight = `${maxHeight}px`; listbox.style.top = `${absoluteTop}px`; requestAnimationFrame(() => { if (!listbox.isConnected)
                return; const currentField = property.getBoundingClientRect(), currentPopup = listbox.getBoundingClientRect(), desiredTop = flip ? currentField.top - currentPopup.height : currentField.bottom; listbox.style.top = `${Number.parseFloat(listbox.style.top) + (desiredTop - currentPopup.top)}px`; }); }); };
            property.addEventListener("focus", open);
            property.addEventListener("input", () => { row.propertyId = ""; activeIndex = -1; emit(); open(); });
            property.addEventListener("keydown", (event) => { const choices = Array.from(listbox.querySelectorAll('[role="option"]')); if (event.key === "ArrowDown") {
                event.preventDefault();
                activeIndex = Math.min(activeIndex + 1, Math.max(0, choices.length - 1));
                choices.forEach((choice, index) => choice.setAttribute("aria-selected", String(index === activeIndex)));
                choices[activeIndex]?.scrollIntoView({ block: "nearest" });
            }
            else if (event.key === "ArrowUp") {
                event.preventDefault();
                activeIndex = Math.max(0, activeIndex < 0 ? choices.length - 1 : activeIndex - 1);
                choices.forEach((choice, index) => choice.setAttribute("aria-selected", String(index === activeIndex)));
                choices[activeIndex]?.scrollIntoView({ block: "nearest" });
            }
            else if (event.key === "Enter" && choices[activeIndex]) {
                event.preventDefault();
                const entry = properties().find(({ id }) => id === choices[activeIndex].dataset.propertyId);
                if (entry)
                    chooseProperty(row, entry, property, operator, listbox);
            }
            else if (event.key === "Escape")
                close(); });
            property.addEventListener("blur", () => setTimeout(close, 0));
            wrapper.append(property);
            return wrapper;
        };
        const valueControl = (row) => {
            const entry = selected(row), valueHost = dom.createElement("span");
            valueHost.setAttribute("aria-label", "Condition value");
            if (!entry || !row.operator) {
                valueHost.textContent = "Choose property and operator";
                return valueHost;
            }
            if (existence.includes(row.operator)) {
                valueHost.textContent = "No value required";
                return valueHost;
            }
            const multi = row.operator === "Is one of" || row.operator === "Contains any of", enumValues = entry.type !== "array" && entry.allowedValues?.length ? entry.allowedValues : undefined, control = entry.type === "boolean" || multi && enumValues ? dom.createElement("select") : dom.createElement("input");
            control.setAttribute("aria-label", "Typed condition value");
            if (control instanceof HTMLSelectElement && multi && enumValues) {
                control.multiple = true;
                for (const [index, value] of enumValues.entries()) {
                    const choice = new Option(String(value), String(index));
                    choice.selected = Array.isArray(row.value) && row.value.some((selected) => JSON.stringify(selected) === JSON.stringify(value));
                    control.append(choice);
                }
            }
            else if (control instanceof HTMLSelectElement) {
                control.append(new Option("Choose True or False", ""), new Option("True", "true"), new Option("False", "false"));
                control.value = row.value === true ? "true" : row.value === false ? "false" : "";
            }
            else {
                control.type = entry.type === "number" || entry.type === "integer" ? "number" : "text";
                control.value = multi && Array.isArray(row.value) ? row.value.join(", ") : valueText(row.value);
                control.placeholder = multi ? "Comma-separated values" : "";
            }
            const update = () => { try {
                const text = control.value;
                if (control instanceof HTMLSelectElement && control.multiple && enumValues)
                    row.value = Array.from(control.selectedOptions).map(({ value }) => clone(enumValues[Number(value)]));
                else if (control instanceof HTMLSelectElement)
                    row.value = text === "" ? undefined : text === "true";
                else if (multi)
                    row.value = text.split(",").map((value) => value.trim()).filter(Boolean).map((value) => typedValue(entry.type === "array" ? "string" : entry.type, value));
                else
                    row.value = text.trim() === "" ? undefined : typedValue(entry.type, text);
                control.setCustomValidity("");
                emit();
            }
            catch (error) {
                control.setCustomValidity(error instanceof Error ? error.message : String(error));
                emit();
            } };
            control.addEventListener("input", update);
            control.addEventListener("change", update);
            valueHost.append(control);
            return valueHost;
        };
        const renderOperators = (row, operator) => { const entry = selected(row), available = entry ? operators(conditionType(entry.type, entry.allowedValues)) : []; operator.disabled = !entry; operator.replaceChildren(new Option("Choose operator", ""), ...available.map((name) => new Option(name, name))); if (row.operator && available.includes(row.operator))
            operator.value = row.operator;
        else {
            row.operator = "";
            delete row.value;
        } };
        rows.forEach((row, index) => { const item = dom.createElement("article"), operator = dom.createElement("select"), valueSlot = dom.createElement("span"), remove = button(dom, "Remove condition", () => { if (rows.length === 1)
            rows = [{ ...(row.id ? { id: row.id } : {}), propertyId: "", operator: "" }];
        else
            rows.splice(index, 1); focusRowId = rows[Math.min(index, rows.length - 1)]?.id; emit(); render(); }); item.dataset.conditionId = row.id ?? ""; item.dataset.conditionPath = String(index); item.dataset.conditionKind = "predicate"; item.setAttribute("role", "listitem"); item.style.cssText = "display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:0.5rem;align-items:end;min-width:0;"; operator.setAttribute("aria-label", "Type-valid operator"); renderOperators(row, operator); operator.addEventListener("change", () => { row.operator = operator.value; delete row.value; emit(); render(); }); valueSlot.append(valueControl(row)); item.append(labeled(dom, "Property", propertyControl(row, operator)), labeled(dom, "Operator", operator), labeled(dom, "Value", valueSlot), remove); list.append(item); });
        const add = button(dom, "Add condition", () => { const row = { id: options.id("condition"), propertyId: "", operator: "" }; rows.push(row); focusRowId = row.id; emit(); render(); });
        host.append(heading, labeled(dom, "Match", match), list, add);
        emit();
        queueMicrotask(() => { if (focusRowId) {
            host.querySelector(`[data-condition-id="${CSS.escape(focusRowId)}"] [aria-label="Condition property"]`)?.focus({ preventScroll: true });
            focusRowId = undefined;
        } const layer = host.closest("[data-schema-row-overlay=\"true\"]"); (layer ?? host).scrollIntoView({ block: "nearest", inline: "nearest" }); });
    };
    render();
}
const projectOperators = [
    "exists",
    "does not exist",
    "equals",
    "does not equal",
    "is one of",
    "contains",
    "glob",
    "regex",
    "matches pattern",
    "is greater than",
    "is at least",
    "is less than",
    "is at most",
];
const projectExistenceOperators = new Set(["exists", "does not exist"]);
const projectNumericOperators = new Set(["is greater than", "is at least", "is less than", "is at most"]);
function projectConditionValueText(predicate) {
    if (predicate.valuePath !== undefined)
        return predicate.valuePath;
    if (predicate.values !== undefined)
        return predicate.values.map(String).join(", ");
    if (predicate.pattern !== undefined)
        return predicate.pattern;
    return valueText(predicate.value);
}
/**
 * Project applicability uses its own persisted AST and operator vocabulary.
 * This adapter deliberately shares the production condition-tree presentation
 * without casting or rewriting that durable format.
 */
export function renderSharedProjectConditionTree(host, options) {
    const { dom } = options;
    let condition = options.condition ? clone(options.condition) : undefined;
    const emptyPredicate = () => ({
        kind: "predicate",
        field: "",
        operator: "equals",
        value: "",
    });
    const group = (kind) => ({
        kind,
        conditions: [],
    });
    const emit = () => options.onChange(condition ? clone(condition) : undefined);
    const nodeAt = (path) => path.reduce((node, index) => node && node.kind !== "predicate" ? node.conditions[index] : undefined, condition);
    const parentAt = (path) => {
        const node = nodeAt(path);
        return node?.kind === "predicate" ? undefined : node;
    };
    const insert = (path, node) => {
        if (path) {
            const parent = parentAt(path);
            if (!parent || parent.kind === "not" && parent.conditions.length)
                return;
            parent.conditions.push(node);
        }
        else if (!condition) {
            condition = node;
        }
        else if (condition.kind === "predicate") {
            condition = { kind: "all", conditions: [condition, node] };
        }
        else if (condition.kind !== "not" || !condition.conditions.length) {
            condition.conditions.push(node);
        }
        emit();
        render();
    };
    const remove = (path) => {
        if (!path.length)
            condition = undefined;
        else
            parentAt(path.slice(0, -1))?.conditions.splice(path.at(-1), 1);
        emit();
        render();
    };
    const groupChoice = (path) => {
        const controls = dom.createElement("span");
        const relation = dom.createElement("select");
        relation.setAttribute("aria-label", "Condition group relation");
        for (const kind of ["all", "any", "not"]) {
            relation.append(new Option(kind === "all" ? "All" : kind === "any" ? "Any" : "Not", kind));
        }
        controls.append(relation, button(dom, "Add group", () => insert(path, group(relation.value))));
        return controls;
    };
    const renderPredicate = (node, path) => {
        const row = dom.createElement("article");
        const field = dom.createElement("input");
        const operator = dom.createElement("select");
        const source = dom.createElement("select");
        const valueHost = dom.createElement("span");
        row.dataset.conditionId = `project-condition:${path.join(".") || "root"}`;
        row.dataset.conditionPath = path.join(".") || "root";
        row.dataset.conditionKind = "predicate";
        field.type = "text";
        field.value = node.field;
        field.placeholder = "Context field";
        field.setAttribute("aria-label", "Condition field");
        operator.setAttribute("aria-label", "Condition operator");
        const currentOperator = node.operator.toLowerCase().replaceAll("_", "-");
        const operators = projectOperators.includes(currentOperator)
            ? projectOperators
            : [currentOperator, ...projectOperators];
        for (const entry of operators)
            operator.append(new Option(entry, entry));
        operator.value = currentOperator;
        source.setAttribute("aria-label", "Condition value source");
        source.append(new Option("Literal value", "literal"), new Option("Field reference", "field"));
        source.value = node.valuePath !== undefined ? "field" : "literal";
        const renderValue = () => {
            valueHost.replaceChildren();
            if (projectExistenceOperators.has(operator.value))
                return;
            const value = dom.createElement("input");
            value.type = "text";
            value.value = projectConditionValueText(node);
            value.setAttribute("aria-label", source.value === "field" ? "Condition comparison field" : "Condition value");
            value.addEventListener("input", () => {
                if (source.value === "field") {
                    delete node.value;
                    delete node.values;
                    delete node.pattern;
                    node.valuePath = value.value;
                }
                else {
                    delete node.valuePath;
                    delete node.value;
                    delete node.values;
                    delete node.pattern;
                    if (operator.value === "is one of") {
                        node.values = value.value.split(",").map((entry) => entry.trim()).filter(Boolean);
                    }
                    else if (operator.value === "regex" || operator.value === "matches pattern") {
                        node.pattern = value.value;
                    }
                    else if (projectNumericOperators.has(operator.value)) {
                        const numeric = Number(value.value);
                        node.value = value.value.trim() && Number.isFinite(numeric) ? numeric : value.value;
                    }
                    else {
                        node.value = value.value;
                    }
                }
                emit();
            });
            valueHost.append(value);
        };
        field.addEventListener("input", () => { node.field = field.value; emit(); });
        operator.addEventListener("change", () => {
            node.operator = operator.value;
            if (projectExistenceOperators.has(node.operator)) {
                delete node.value;
                delete node.values;
                delete node.pattern;
                delete node.valuePath;
            }
            renderValue();
            emit();
        });
        source.addEventListener("change", () => {
            const text = projectConditionValueText(node);
            delete node.value;
            delete node.values;
            delete node.pattern;
            delete node.valuePath;
            if (source.value === "field")
                node.valuePath = text;
            else
                node.value = text;
            renderValue();
            emit();
        });
        renderValue();
        row.append(labeled(dom, "Field", field), labeled(dom, "Operator", operator), labeled(dom, "Compare with", source), labeled(dom, "Value", valueHost), button(dom, "Remove", () => remove(path)));
        return row;
    };
    const renderGroup = (node, path) => {
        const row = dom.createElement("article");
        const header = dom.createElement("div");
        const relation = dom.createElement("select");
        const children = dom.createElement("div");
        row.dataset.conditionId = `project-condition:${path.join(".") || "root"}`;
        row.dataset.conditionPath = path.join(".") || "root";
        row.dataset.conditionKind = "group";
        relation.setAttribute("aria-label", "Condition group relation");
        for (const kind of ["all", "any", "not"]) {
            relation.append(new Option(kind === "all" ? "All" : kind === "any" ? "Any" : "Not", kind));
        }
        relation.value = node.kind;
        relation.addEventListener("change", () => {
            node.kind = relation.value;
            if (node.kind === "not")
                node.conditions = node.conditions.slice(0, 1);
            emit();
            render();
        });
        header.append(labeled(dom, "Relation", relation), button(dom, "Add condition", () => insert(path, emptyPredicate())), groupChoice(path), button(dom, "Remove", () => remove(path)));
        for (const [index, child] of node.conditions.entries()) {
            children.append(renderNode(child, [...path, index]));
        }
        row.append(header, children);
        return row;
    };
    const renderNode = (node, path) => node.kind === "predicate" ? renderPredicate(node, path) : renderGroup(node, path);
    const render = () => {
        host.replaceChildren();
        host.setAttribute("aria-label", "Shared editable project condition tree");
        if (condition) {
            host.append(renderNode(condition, []));
        }
        else {
            const empty = dom.createElement("div");
            empty.setAttribute("aria-label", "Empty project condition builder");
            empty.append(button(dom, "Add condition", () => insert(undefined, emptyPredicate())), groupChoice(undefined));
            host.append(empty);
        }
        queueMicrotask(() => {
            const layer = host.closest("[data-schema-row-overlay=\"true\"]");
            (layer ?? host).scrollIntoView({ block: "nearest", inline: "nearest" });
        });
    };
    render();
}
//# sourceMappingURL=data-layer-shared-condition-tree-editor.js.map