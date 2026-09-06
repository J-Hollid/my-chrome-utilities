import type { ProjectMetadata } from "../data-layer-project-library.js";

type MetadataFields = Record<keyof ProjectMetadata, HTMLInputElement | HTMLTextAreaElement>;

export function metadataFields(form: HTMLFormElement, values: ProjectMetadata): MetadataFields {
  const fields = {} as MetadataFields;
  for (const [key, label, multiline] of [
    ["name", "Name", false],
    ["purpose", "Purpose or description", true],
    ["website", "Website or domain", false],
    ["owner", "Owner or team", false],
    ["notes", "Notes", true],
  ] as const) {
    const wrapper = document.createElement("label");
    const control = document.createElement(multiline ? "textarea" : "input");
    wrapper.textContent = label;
    control.name = key;
    control.value = values[key];
    control.required = key === "name";
    wrapper.append(control);
    form.append(wrapper);
    fields[key] = control;
  }
  return fields;
}

export function readMetadata(fields: MetadataFields): ProjectMetadata {
  return { name: fields.name.value, purpose: fields.purpose.value, website: fields.website.value, owner: fields.owner.value, notes: fields.notes.value };
}

export function writeMetadata(fields: MetadataFields, values: ProjectMetadata): void {
  for (const key of Object.keys(fields) as (keyof ProjectMetadata)[]) fields[key].value = values[key];
}
