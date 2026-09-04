import { SchemaLibraryController } from "./library-controller.js";
import { SchemaLibraryEditor } from "./library-editor.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import { SchemaRelationshipViewCoordinator } from "./relationship-view-coordinator.js";

/** Creates the library, editor, and relationship composition domain. */
export function createSchemaLibraryEditorRelationshipDomain(libraryPorts:ConstructorParameters<typeof SchemaLibraryController>[0],treePorts:Parameters<typeof createSchemaRelationshipTreeController>[0]) {
  const library=new SchemaLibraryController(libraryPorts),relationshipTree=createSchemaRelationshipTreeController(treePorts);
  return { library,relationshipTree,
    createEditor:(ports:ConstructorParameters<typeof SchemaLibraryEditor>[0]) => new SchemaLibraryEditor(ports),
    createRelationship:(ports:ConstructorParameters<typeof SchemaRelationshipViewCoordinator>[0]) => new SchemaRelationshipViewCoordinator(ports) };
}
