import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { SchemaInstalledEditorWorkflowPorts } from "./installed-editor-contracts.js";
/** Owns installed specification presentation and focus return. */
export function openInstalledSchemaSpecification(ports: SchemaInstalledEditorWorkflowPorts, schema: SchemaDefinition,
     surface: `published:${number}` | `historical:${number}` | "working-draft", trigger: HTMLButtonElement): void {
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
