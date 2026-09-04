/** Owns installed specification presentation and focus return. */
export function openInstalledSchemaSpecification(ports, schema, surface, trigger) {
    const root = ports.specificationBuilder;
    if (!root)
        return;
    root.hidden = false;
    if (ports.schemaEditor)
        ports.schemaEditor.hidden = true;
    if (ports.schemaDetailEmpty)
        ports.schemaDetailEmpty.hidden = true;
    ports.renderSpecification(root, structuredClone(schema), structuredClone(ports.library.schemas), surface, () => {
        root.hidden = true;
        ports.editor.render();
        trigger.focus({ preventScroll: true });
    });
}
//# sourceMappingURL=installed-specification-workflow.js.map