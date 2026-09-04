import { SchemaLibraryController } from "./library-controller.js";
import { SchemaLibraryEditor } from "./library-editor.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import { SchemaRelationshipViewCoordinator } from "./relationship-view-coordinator.js";
/** Creates the library, editor, and relationship composition domain. */
export function createSchemaLibraryEditorRelationshipDomain(libraryPorts, treePorts) {
    const library = new SchemaLibraryController(libraryPorts), relationshipTree = createSchemaRelationshipTreeController(treePorts);
    return { library, relationshipTree,
        createEditor: (ports) => new SchemaLibraryEditor(ports),
        createRelationship: (ports) => new SchemaRelationshipViewCoordinator(ports) };
}
//# sourceMappingURL=library-editor-relationship-factory.js.map