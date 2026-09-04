import { installSchemaAssignmentElements } from "./assignment-controller.js";
import { installSchemaEditorElements } from "./editor-installed-view.js";
import { installSchemaLibraryElements } from "./library-installed-view.js";
import { installSchemaPropertyElements } from "./property-installed-view.js";
import { installSchemaRuleElements } from "./rule-installed-view.js";

/** Installs each element family once and exposes one typed composition boundary. */
export function installSchemasElements(root:ParentNode) {
  return {
    editor:installSchemaEditorElements(root),
    property:installSchemaPropertyElements(root),
    rule:installSchemaRuleElements(root),
    assignment:installSchemaAssignmentElements(root),
    library:installSchemaLibraryElements(root),
    createAssignment:root.querySelector<HTMLButtonElement>("#create-schema-assignment"),
  };
}

export type SchemasInstalledElements=ReturnType<typeof installSchemasElements>;
