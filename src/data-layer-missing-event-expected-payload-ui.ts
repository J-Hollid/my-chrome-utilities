import type { JsonSchema } from "./data-layer-schema-document.js";
import type { SchemaDefinition } from "./data-layer-schema-verification.js";
import {
  addExpectedArrayItem,
  duplicateExpectedArrayItem,
  expectedPayloadFields,
  normalizedExpectedPayloadSchema,
  removeExpectedArrayItem,
  removeExpectedPayloadValue,
  setExpectedPayloadValue,
  type ExpectedPayloadDraft,
  type ExpectedPayloadField,
} from "./data-layer-unified-defect-builder.js";

export interface ExpectedPayloadEditorState {
  draft(): ExpectedPayloadDraft;
  update(draft: ExpectedPayloadDraft): void;
  refresh(): void;
  issues?(): readonly { instancePath:string; message:string }[];
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  return result;
}

function pointerValue(payload: unknown, pointer: string): unknown {
  let current = payload;
  for (const segment of pointer.split("/").filter(Boolean)) {
    if (current === null || typeof current !== "object") return undefined;
    const decoded = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    current = (current as Record<string, unknown>)[decoded];
  }
  return current;
}

function templatePointer(pointer: string): string {
  return pointer.replace(/\/\d+(?=\/|$)/g, "/0");
}

export function renderExpectedPayloadEditor(
  root: HTMLElement,
  schema: SchemaDefinition,
  state: ExpectedPayloadEditorState,
  schemas: readonly SchemaDefinition[] = [schema],
): void {
  const normalizedSchema = normalizedExpectedPayloadSchema(schema);
  const fieldTemplates = expectedPayloadFields(schema, schemas);
  const customValues = new Map<string, string>();
  const initializedCustomValues = new Set<string>();
  const fieldAt = (pointer: string): ExpectedPayloadField | undefined => fieldTemplates.find((field) => field.pointer === templatePointer(pointer));

  const issueText = (pointer: string) => state.issues?.().filter((issue) => issue.instancePath === pointer).map(({ message }) => message).join("; ") ?? "";

  const update = (draft: ExpectedPayloadDraft, focusAfterRender?: () => HTMLElement | null) => {
    const scrollTop = root.scrollTop;
    state.update(draft);
    render();
    state.refresh();
    root.scrollTop = scrollTop;
    focusAfterRender?.()?.focus({ preventScroll:true });
  };

  const renderLeaf = (definition: JsonSchema, path: string, pointer: string, required: boolean): HTMLElement => {
    const field = fieldAt(pointer) ?? { path, pointer, type:definition.type ?? "value", required, schemaValues:[] };
    const wrapper = element("fieldset");
    wrapper.dataset.expectedPayloadPath = path;
    wrapper.dataset.jsonPointer = pointer;
    wrapper.dataset.expectedPayloadType = field.type;
    wrapper.append(element("legend", `${path} · ${field.type} · ${required ? "required" : "optional"}`));
    const current = pointerValue(state.draft().payload, pointer);
    if (!required) {
      const includeLabel = element("label", `Include optional ${path}`);
      const include = element("input"); include.type = "checkbox"; include.checked = current !== undefined;
      include.addEventListener("change", () => {
        if (!include.checked) update(removeExpectedPayloadValue(state.draft(), pointer));
        else if (field.type === "boolean") update(setExpectedPayloadValue(schema, state.draft(), pointer, { method:"custom", value:false }));
        else if (field.type === "number") update(setExpectedPayloadValue(schema, state.draft(), pointer, { method:"custom", value:0 }));
        else update(setExpectedPayloadValue(schema, state.draft(), pointer, { method:"custom", value:"" }));
      });
      includeLabel.prepend(include); wrapper.append(includeLabel);
      if (current === undefined) return wrapper;
    }
    for (const choice of field.schemaValues) {
      const label = element("label", `Use schema value ${String(choice)}`);
      const radio = element("input"); radio.type = "radio"; radio.name = `expected-${pointer}`; radio.checked = Object.is(current, choice);
      radio.addEventListener("change", () => { if (radio.checked) update(setExpectedPayloadValue(schema, state.draft(), pointer, { method:"schema-value", value:choice })); });
      label.prepend(radio); wrapper.append(label);
    }
    const customSelected = state.draft().responseSources[pointer] === "operator custom response";
    if (customSelected && !initializedCustomValues.has(pointer)) {
      customValues.set(pointer, current == null ? "" : String(current)); initializedCustomValues.add(pointer);
    }
    const customLabel = element("label", `Custom value for ${path} `);
    const customChoice = field.example ? element("input") : undefined;
    if (customChoice) {
      customChoice.type = "radio"; customChoice.name = `expected-${pointer}`; customChoice.checked = customSelected;
      customChoice.dataset.expectedPayloadCustomChoice = pointer;
      customChoice.addEventListener("change", () => {
        if (!customChoice.checked) return;
        const first = !initializedCustomValues.has(pointer);
        const raw = first ? field.example!.value : customValues.get(pointer) ?? "";
        initializedCustomValues.add(pointer); customValues.set(pointer, String(raw));
        update(setExpectedPayloadValue(schema, state.draft(), pointer, { method:"custom", value:raw }), () => root.querySelector<HTMLElement>(`[data-expected-payload-input="${CSS.escape(pointer)}"]`));
      });
      customLabel.prepend(customChoice);
    }
    const custom = definition.type === "string" ? element("textarea") : element("input");
    custom.dataset.expectedPayloadInput = pointer;
    if (custom instanceof HTMLInputElement) custom.type = definition.type === "number" ? "number" : "text";
    custom.value = initializedCustomValues.has(pointer) ? customValues.get(pointer) ?? "" : current == null ? "" : String(current);
    custom.hidden = Boolean(field.example && !customSelected);
    custom.addEventListener("input", () => {
      if (definition.type === "number" && custom.value === "") return;
      initializedCustomValues.add(pointer); customValues.set(pointer, custom.value);
      state.update(setExpectedPayloadValue(schema, state.draft(), pointer, { method:"custom", value:custom.value }));
      const message = issueText(pointer);
      issue.textContent = message;
      issue.hidden = !message;
      custom.setAttribute("aria-invalid", String(Boolean(message)));
      source.textContent = state.draft().responseSources[pointer] ?? "Choose a schema value or enter a custom response.";
      provenance.textContent = "";
      state.refresh();
    });
    customLabel.append(custom); wrapper.append(customLabel);
    const source = element("output", state.draft().responseSources[pointer] ?? "Choose a schema value or enter a custom response.");
    source.dataset.expectedResponseSource = pointer; wrapper.append(source);
    const provenanceValue = state.draft().responseProvenance?.[pointer];
    const provenance = element("output", provenanceValue ? `${provenanceValue.name ?? provenanceValue.id} revision ${provenanceValue.version}` : "");
    provenance.dataset.expectedResponseProvenance = pointer; wrapper.append(provenance);
    const message = issueText(pointer);
    const issue = element("p", message); issue.dataset.expectedPayloadIssue = pointer; issue.hidden = !message; wrapper.append(issue);
    custom.setAttribute("aria-invalid", String(Boolean(message)));
    return wrapper;
  };

  const renderNode = (definition: JsonSchema, path: string, pointer: string, required: boolean): HTMLElement => {
    if (definition.type !== "object" && definition.type !== "array") return renderLeaf(definition, path, pointer, required);
    const container = element("details"); container.open = true;
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
    const add = element("button", `Add ${path} item`); add.type = "button";
    if (!definition.items) {
      add.disabled = true;
      add.setAttribute("aria-disabled", "true");
    } else add.addEventListener("click", () => update(addExpectedArrayItem(schema, state.draft(), pointer), () => {
      const created = Array.from(root.querySelectorAll<HTMLElement>("[data-expected-array-item]")).find((candidate) => candidate.dataset.expectedArrayItem === `${pointer}/${items.length}`);
      return created?.querySelector<HTMLElement>("input, button") ?? add;
    }));
    container.append(add);
    if (!definition.items) container.append(element("p", `The array item type must be defined before ${path} items can be added.`));
    if (!items.length && definition.items) {
      const template = element("p", `Array item template: ${path}.0 · ${definition.items.type ?? "value"}`);
      template.dataset.expectedArrayItemTemplate = `${path}.0`;
      template.dataset.jsonPointer = `${pointer}/0`;
      for (const field of fieldTemplates.filter(({ path:fieldPath }) => fieldPath.startsWith(`${path}.0.`))) template.append(element("span", ` ${field.path} · ${field.type}${field.required ? " · required" : ""}`));
      container.append(template);
    }
    items.forEach((_item, index) => {
      const item = element("details"); item.open = true; item.dataset.expectedArrayItem = `${pointer}/${index}`;
      item.append(element("summary", `${path}.${index} · ${definition.items?.type ?? "value"}`));
      const duplicate = element("button", `Duplicate ${path} item ${index + 1}`); duplicate.type = "button";
      duplicate.addEventListener("click", () => update(duplicateExpectedArrayItem(schema, state.draft(), pointer, index), () => {
        const created = Array.from(root.querySelectorAll<HTMLElement>("[data-expected-array-item]")).find((candidate) => candidate.dataset.expectedArrayItem === `${pointer}/${index + 1}`);
        return created?.querySelector<HTMLElement>("input, button") ?? null;
      }));
      const remove = element("button", `Remove ${path} item ${index + 1}`); remove.type = "button";
      remove.addEventListener("click", () => update(removeExpectedArrayItem(schema, state.draft(), pointer, index), () => {
        const retainedIndex = Math.min(index, items.length - 2);
        const retained = Array.from(root.querySelectorAll<HTMLElement>("[data-expected-array-item]")).find((candidate) => candidate.dataset.expectedArrayItem === `${pointer}/${retainedIndex}`);
        return retained?.querySelector<HTMLElement>("input, button") ?? Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === `Add ${path} item`) ?? null;
      }));
      item.append(duplicate, remove);
      if (definition.items) item.append(renderNode(definition.items, `${path}.${index}`, `${pointer}/${index}`, true));
      container.append(item);
    });
    return container;
  };

  const render = () => {
    const heading = element("h6", "Expected payload from schema");
    const tree = element("section"); tree.setAttribute("aria-label", "Recursive expected payload editor");
    if (normalizedSchema.document.type === "object") {
      const requiredProperties = new Set(normalizedSchema.document.required ?? []);
      for (const [property, child] of Object.entries(normalizedSchema.document.properties ?? {})) tree.append(renderNode(child, property, `/${property.replaceAll("~", "~0").replaceAll("/", "~1")}`, requiredProperties.has(property)));
    }
    root.replaceChildren(heading, tree);
  };
  render();
}
