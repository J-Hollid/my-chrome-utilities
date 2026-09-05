import type { CanonicalSchemaDocument, SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { CanonicalInstalledViewPorts } from "./canonical-view-contracts.js";
import { SchemaCanonicalContextControls } from "./canonical-context-controls.js";
import { SchemaCanonicalTableView } from "./canonical-table-view.js";

/** Coordinates canonical context controls with the table projection. */
export class SchemaCanonicalContextTableView {
  readonly #controls: SchemaCanonicalContextControls;
  readonly #table: SchemaCanonicalTableView;

  constructor(
    ports: CanonicalInstalledViewPorts,
    projection: (canonical: CanonicalSchemaDocument) => SchemaDefinition,
  ) {
    this.#controls = new SchemaCanonicalContextControls(ports);
    this.#table = new SchemaCanonicalTableView(ports, projection);
  }

  renderContext(): void { this.#controls.renderContext(); }
  showProperty(propertyId: string): void { this.#controls.showProperty(propertyId); }
  clearContext(): void { this.#controls.clearContext(); }
  ownContext(dispose: () => void): void { this.#controls.ownContext(dispose); }
  removeTable(): void { this.#table.remove(); }
  render(): void { this.#controls.renderContext(); this.#table.render(); }
  dispose(): void { this.#controls.dispose(); this.#table.remove(); }
}
