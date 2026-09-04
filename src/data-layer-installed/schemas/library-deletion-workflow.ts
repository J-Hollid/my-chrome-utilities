import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { SchemaLibraryController } from "./library-controller.js";
import type { SchemaLibraryBehaviorPorts } from "./library-operations.js";

export type SchemaDeletionReview =
  | { status: "blocked"; message: string }
  | { status: "ready"; schema: SchemaDefinition; summary: string };

/** Applies the child-schema constraint without DOM or storage access. */
export function inspectSchemaDeletion(
  schemas: readonly SchemaDefinition[],
  id: string,
): SchemaDeletionReview | undefined {
  const schema = schemas.find((candidate) => candidate.id === id);
  if (!schema) return undefined;
  const children = schemas.filter(
    ({ parentSchemaId }) => parentSchemaId === id,
  );
  if (children.length) {
    return {
      status: "blocked",
      message:
        `Cannot delete ${schema.name}: it is the parent of ` +
        `${children.map(({ name }) => name).join(", ")}.`,
    };
  }
  return {
    status: "ready",
    schema: structuredClone(schema),
    summary: `${schema.name} v${schema.version} and its assignments will be removed.`,
  };
}

/** Owns Schema deletion review state and its installed dialog projection. */
export class SchemaLibraryDeletionWorkflow {
  readonly #library: SchemaLibraryController;
  readonly #ports: SchemaLibraryBehaviorPorts;
  #pending: SchemaDefinition | undefined;

  constructor(
    library: SchemaLibraryController,
    ports: SchemaLibraryBehaviorPorts,
  ) {
    this.#library = library;
    this.#ports = ports;
  }
  reset(): void {
    this.#pending = undefined;
  }
  request(id: string): boolean {
    const review = inspectSchemaDeletion(this.#library.schemas, id);
    if (!review) return false;
    if (review.status === "blocked") {
      if (this.#ports.elements.result) {
        this.#ports.elements.result.textContent = review.message;
      }
      return false;
    }
    this.#pending = review.schema;
    if (this.#ports.elements.deleteSummary) {
      this.#ports.elements.deleteSummary.textContent = review.summary;
    }
    this.#ports.elements.deleteReview?.showModal();
    return true;
  }
  confirm(): void {
    const schema = this.#pending;
    if (!schema) return;
    this.#library.replaceSchemas(
      this.#library.schemas.filter(({ id }) => id !== schema.id),
    );
    this.#pending = undefined;
    if (this.#library.activeSchemaId === schema.id) {
      this.#library.clearSelection();
    }
    this.#library.persist();
    this.#ports.renderAll();
    this.#ports.elements.deleteReview?.close();
    if (this.#ports.elements.result) {
      this.#ports.elements.result.textContent = `Deleted ${schema.name}.`;
    }
  }
  cancel(): void {
    this.#pending = undefined;
    this.#ports.elements.deleteReview?.close();
  }
}
