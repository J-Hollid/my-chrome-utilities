import { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import { SchemaGuidedValidationController } from "./guided-validation-controller.js";
import { SchemaValidationController } from "./validation-controller.js";
/** Creates the canonical, guided, and validation composition domain. */
export function createSchemaCanonicalGuidedValidationDomain(storage, validationPorts, canonicalPorts) {
    const validation = new SchemaValidationController(storage, validationPorts), guided = new SchemaGuidedValidationController(storage), canonical = new SchemaCanonicalEditorController(canonicalPorts);
    return { validation, guided, canonical, createView: (ports) => new SchemaCanonicalInstalledView(ports), dispose: () => { guided.dispose(); validation.dispose(); canonical.disposeState(); } };
}
//# sourceMappingURL=canonical-guided-validation-factory.js.map