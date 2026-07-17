import type { UtilityMountHost } from "../../../../../platform/utility-contract.js";
import {
  createSchema,
  createSchemaLibraryExport,
  SCHEMA_LIBRARY_STORAGE_KEY,
  serializeSchemaLibrary,
  validateWithSchema,
} from "../../../schemas.js";
import type { ScopedClickBinder } from "./runtime-support.js";

export function mountScopedSchemaWorkflow(
  root: UtilityMountHost,
  storage: Storage,
  bind: ScopedClickBinder,
): void {
  const schema = createSchema("Scoped checkout", 1, {
    type: "object",
    properties: { event:{ type: "string" } },
    required: ["event"],
  });
  storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary([schema]));
  bind("#recheck-schema-validation", () => {
    const validation = validateWithSchema(
      { sourceId: "scoped", eventName: "checkout", payload: {}, rawInput: {} },
      schema,
      [schema],
    );
    const result = root.querySelector<HTMLElement>("#schema-result");
    if (!result) return;
    result.dataset.validationState = validation.state;
    result.textContent = `Validation complete: ${validation.state}`;
  });
  bind("#export-schema", () => {
    const serialized = JSON.stringify(createSchemaLibraryExport([schema], []));
    const result = root.querySelector<HTMLElement>("#schema-result");
    if (!result) return;
    result.dataset.transferBytes = String(serialized.length);
    result.textContent = `Schema Library exported (${serialized.length} bytes)`;
  });
}
