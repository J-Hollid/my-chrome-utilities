import {
  importSchema,
  schemaInheritanceConflict,
  schemaInheritanceError,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";
import type { SchemaLibraryController } from "./library-controller.js";
import type { SchemaLibraryBehaviorPorts } from "./library-operations.js";

interface SchemaLibraryImport {
  schemas: SchemaDefinition[];
  rules: ReusableSchemaRule[];
}

/** Parses and validates one portable Schema Library archive. */
export function inspectSchemaLibraryImport(
  serialized: string,
  current: readonly SchemaDefinition[],
): SchemaLibraryImport {
  const archive = JSON.parse(serialized) as {
    version?: number;
    schemas?: unknown;
    rules?: unknown;
  };
  if (
    archive.version !== 1 ||
    !Array.isArray(archive.schemas) ||
    !Array.isArray(archive.rules)
  ) {
    throw new Error("Choose a version 1 Schema Library export.");
  }
  const schemas = archive.schemas.map((item) =>
    importSchema(JSON.stringify(item)),
  );
  const candidates = [
    ...current.filter((schema) => !schemas.some(({ id }) => id === schema.id)),
    ...schemas,
  ];
  for (const schema of schemas) {
    const issue =
      schemaInheritanceError(schema, candidates) ??
      schemaInheritanceConflict(schema, candidates);
    if (issue) throw new Error(issue);
  }
  const rules = archive.rules.filter((rule): rule is ReusableSchemaRule =>
    Boolean(
      rule &&
        typeof rule === "object" &&
        "id" in rule &&
        "name" in rule &&
        "kind" in rule &&
        "version" in rule &&
        "enabled" in rule,
    ),
  );
  return { schemas, rules: structuredClone(rules) };
}

/** Owns file input, review dialog, and commit UI for Schema Library import. */
export class SchemaLibraryImportWorkflow {
  readonly #library: SchemaLibraryController;
  readonly #ports: SchemaLibraryBehaviorPorts;
  #pending: SchemaLibraryImport | undefined;

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
  openFile(): void {
    this.#ports.elements.importFile?.click();
  }
  review(serialized: string): void {
    this.#pending = inspectSchemaLibraryImport(
      serialized,
      this.#library.schemas,
    );
    if (this.#ports.elements.importSummary) {
      this.#ports.elements.importSummary.textContent =
        `${this.#pending.schemas.length} schemas and ` +
        `${this.#pending.rules.length} reusable rules are ready to import.`;
    }
    this.#ports.elements.importReview?.showModal();
  }
  async readFile(): Promise<void> {
    const input = this.#ports.elements.importFile;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      this.review(await file.text());
    } catch (error) {
      if (this.#ports.elements.result) {
        this.#ports.elements.result.textContent =
          error instanceof Error
            ? error.message
            : "Schema Library import failed.";
      }
    }
    if (input) input.value = "";
  }
  replace(): void {
    const pending = this.#pending;
    if (!pending) return;
    this.#library.replaceSchemas(pending.schemas);
    this.#ports.replaceRules(structuredClone(pending.rules));
    this.#pending = undefined;
    this.#persist("Schema Library replaced.");
  }
  append(): void {
    const pending = this.#pending;
    if (!pending) return;
    this.#library.replaceSchemas([
      ...this.#library.schemas.filter(
        (schema) => !pending.schemas.some(({ id }) => id === schema.id),
      ),
      ...structuredClone(pending.schemas),
    ]);
    this.#ports.replaceRules([
      ...this.#ports
        .rules()
        .filter((rule) => !pending.rules.some(({ id }) => id === rule.id)),
      ...structuredClone(pending.rules),
    ]);
    this.#pending = undefined;
    this.#persist("Schema Library appended.");
  }
  cancel(): void {
    this.#pending = undefined;
    this.#ports.elements.importReview?.close();
  }

  #persist(status: string): void {
    this.#library.persist();
    this.#ports.persistRules();
    this.#ports.renderAll();
    this.#ports.renderRules();
    this.#ports.elements.importReview?.close();
    if (this.#ports.elements.result) {
      this.#ports.elements.result.textContent = status;
    }
  }
}
