import { SchemaCanonicalContextControls } from "./canonical-context-controls.js";
import { SchemaCanonicalTableView } from "./canonical-table-view.js";
/** Coordinates canonical context controls with the table projection. */
export class SchemaCanonicalContextTableView {
    #controls;
    #table;
    constructor(ports, projection) {
        this.#controls = new SchemaCanonicalContextControls(ports);
        this.#table = new SchemaCanonicalTableView(ports, projection);
    }
    renderContext() { this.#controls.renderContext(); }
    showProperty(propertyId) { this.#controls.showProperty(propertyId); }
    clearContext() { this.#controls.clearContext(); }
    ownContext(dispose) { this.#controls.ownContext(dispose); }
    removeTable() { this.#table.remove(); }
    render() { this.#controls.renderContext(); this.#table.render(); }
    dispose() { this.#controls.dispose(); this.#table.remove(); }
}
//# sourceMappingURL=canonical-context-table-view.js.map