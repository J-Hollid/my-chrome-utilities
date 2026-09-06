export function metadataFields(form, values) {
    const fields = {};
    for (const [key, label, multiline] of [
        ["name", "Name", false],
        ["purpose", "Purpose or description", true],
        ["website", "Website or domain", false],
        ["owner", "Owner or team", false],
        ["notes", "Notes", true],
    ]) {
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
export function readMetadata(fields) {
    return { name: fields.name.value, purpose: fields.purpose.value, website: fields.website.value, owner: fields.owner.value, notes: fields.notes.value };
}
export function writeMetadata(fields, values) {
    for (const key of Object.keys(fields))
        fields[key].value = values[key];
}
//# sourceMappingURL=metadata.js.map