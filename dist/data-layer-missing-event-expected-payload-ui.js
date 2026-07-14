import { addExpectedArrayItem, duplicateExpectedArrayItem, expectedPayloadFields, removeExpectedArrayItem, removeExpectedPayloadValue, setExpectedPayloadValue, } from "./data-layer-unified-defect-builder.js";
function element(tag, text) {
    const result = document.createElement(tag);
    if (text !== undefined)
        result.textContent = text;
    return result;
}
function pointerValue(payload, pointer) {
    let current = payload;
    for (const segment of pointer.split("/").filter(Boolean)) {
        if (current === null || typeof current !== "object")
            return undefined;
        const decoded = segment.replaceAll("~1", "/").replaceAll("~0", "~");
        current = current[decoded];
    }
    return current;
}
function templatePointer(pointer) {
    return pointer.replace(/\/\d+(?=\/|$)/g, "/0");
}
export function renderExpectedPayloadEditor(root, schema, state) {
    const fieldTemplates = expectedPayloadFields(schema);
    const fieldAt = (pointer) => fieldTemplates.find((field) => field.pointer === templatePointer(pointer));
    const update = (draft) => {
        state.update(draft);
        render();
        state.refresh();
    };
    const renderLeaf = (definition, path, pointer, required) => {
        const field = fieldAt(pointer) ?? { path, pointer, type: definition.type ?? "value", required, schemaValues: [] };
        const wrapper = element("fieldset");
        wrapper.dataset.expectedPayloadPath = path;
        wrapper.dataset.jsonPointer = pointer;
        wrapper.dataset.expectedPayloadType = field.type;
        wrapper.append(element("legend", `${path} · ${field.type} · ${required ? "required" : "optional"}`));
        const current = pointerValue(state.draft().payload, pointer);
        if (!required) {
            const includeLabel = element("label", `Include optional ${path}`);
            const include = element("input");
            include.type = "checkbox";
            include.checked = current !== undefined;
            include.addEventListener("change", () => {
                if (!include.checked)
                    update(removeExpectedPayloadValue(state.draft(), pointer));
                else if (field.type === "boolean")
                    update(setExpectedPayloadValue(schema, state.draft(), pointer, { method: "custom", value: false }));
                else if (field.type === "number")
                    update(setExpectedPayloadValue(schema, state.draft(), pointer, { method: "custom", value: 0 }));
                else
                    update(setExpectedPayloadValue(schema, state.draft(), pointer, { method: "custom", value: "" }));
            });
            includeLabel.prepend(include);
            wrapper.append(includeLabel);
            if (current === undefined)
                return wrapper;
        }
        for (const choice of field.schemaValues) {
            const label = element("label", `Use schema value ${String(choice)}`);
            const radio = element("input");
            radio.type = "radio";
            radio.name = `expected-${pointer}`;
            radio.checked = Object.is(current, choice);
            radio.addEventListener("change", () => { if (radio.checked)
                update(setExpectedPayloadValue(schema, state.draft(), pointer, { method: "schema-value", value: choice })); });
            label.prepend(radio);
            wrapper.append(label);
        }
        const customLabel = element("label", `Custom value for ${path} `);
        const custom = element("input");
        custom.dataset.expectedPayloadInput = pointer;
        custom.type = definition.type === "number" ? "number" : "text";
        custom.value = current === undefined ? "" : String(current);
        custom.addEventListener("input", () => {
            if (definition.type === "number" && custom.value === "")
                return;
            update(setExpectedPayloadValue(schema, state.draft(), pointer, { method: "custom", value: custom.value }));
        });
        customLabel.append(custom);
        wrapper.append(customLabel);
        const source = element("output", state.draft().responseSources[pointer] ?? "Choose a schema value or enter a custom response.");
        source.dataset.expectedResponseSource = pointer;
        wrapper.append(source);
        return wrapper;
    };
    const renderNode = (definition, path, pointer, required) => {
        if (definition.type !== "object" && definition.type !== "array")
            return renderLeaf(definition, path, pointer, required);
        const container = element("details");
        container.open = true;
        container.dataset.expectedPayloadPath = path;
        container.dataset.jsonPointer = pointer;
        container.dataset.expectedPayloadType = definition.type;
        container.append(element("summary", `${path} · ${definition.type} · ${required ? "required" : "optional"}`));
        if (definition.type === "object") {
            const requiredProperties = new Set(definition.required ?? []);
            for (const [property, child] of Object.entries(definition.properties ?? {})) {
                const childPath = path ? `${path}.${property}` : property;
                const childPointer = `${pointer}/${property.replaceAll("~", "~0").replaceAll("/", "~1")}`;
                container.append(renderNode(child, childPath, childPointer, requiredProperties.has(property)));
            }
            return container;
        }
        const values = pointerValue(state.draft().payload, pointer);
        const items = Array.isArray(values) ? values : [];
        const add = element("button", `Add ${path} item`);
        add.type = "button";
        add.addEventListener("click", () => update(addExpectedArrayItem(schema, state.draft(), pointer)));
        container.append(add);
        if (!items.length && definition.items) {
            const template = element("p", `Array item template: ${path}.0 · ${definition.items.type ?? "value"}`);
            template.dataset.expectedArrayItemTemplate = `${path}.0`;
            for (const field of fieldTemplates.filter(({ path: fieldPath }) => fieldPath.startsWith(`${path}.0.`)))
                template.append(element("span", ` ${field.path} · ${field.type}${field.required ? " · required" : ""}`));
            container.append(template);
        }
        items.forEach((_item, index) => {
            const item = element("details");
            item.open = true;
            item.dataset.expectedArrayItem = `${pointer}/${index}`;
            item.append(element("summary", `${path}.${index} · ${definition.items?.type ?? "value"}`));
            const duplicate = element("button", `Duplicate ${path} item ${index + 1}`);
            duplicate.type = "button";
            duplicate.addEventListener("click", () => update(duplicateExpectedArrayItem(schema, state.draft(), pointer, index)));
            const remove = element("button", `Remove ${path} item ${index + 1}`);
            remove.type = "button";
            remove.addEventListener("click", () => update(removeExpectedArrayItem(schema, state.draft(), pointer, index)));
            item.append(duplicate, remove);
            if (definition.items)
                item.append(renderNode(definition.items, `${path}.${index}`, `${pointer}/${index}`, true));
            container.append(item);
        });
        return container;
    };
    const render = () => {
        const heading = element("h6", "Expected payload from schema");
        const tree = element("section");
        tree.setAttribute("aria-label", "Recursive expected payload editor");
        if (schema.document.type === "object") {
            const requiredProperties = new Set(schema.document.required ?? []);
            for (const [property, child] of Object.entries(schema.document.properties ?? {}))
                tree.append(renderNode(child, property, `/${property.replaceAll("~", "~0").replaceAll("/", "~1")}`, requiredProperties.has(property)));
        }
        root.replaceChildren(heading, tree);
    };
    render();
}
//# sourceMappingURL=data-layer-missing-event-expected-payload-ui.js.map