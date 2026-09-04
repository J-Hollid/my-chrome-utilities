import { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import { SchemaGuidedValidationController } from "./guided-validation-controller.js";
import { SchemaValidationController } from "./validation-controller.js";

/** Creates the canonical, guided, and validation composition domain. */
export function createSchemaCanonicalGuidedValidationDomain(storage:Pick<Storage,"getItem"|"setItem">,validationPorts:ConstructorParameters<typeof SchemaValidationController>[1],canonicalPorts:ConstructorParameters<typeof SchemaCanonicalEditorController>[0]) {
  const validation=new SchemaValidationController(storage,validationPorts),guided=new SchemaGuidedValidationController(storage),canonical=new SchemaCanonicalEditorController(canonicalPorts);
  return { validation,guided,canonical,createView:(ports:ConstructorParameters<typeof SchemaCanonicalInstalledView>[0]) => new SchemaCanonicalInstalledView(ports),dispose:() => { guided.dispose();validation.dispose();canonical.disposeState(); } };
}
