import type { SchemasInstalledPorts as SchemasInstalledPortsContract } from "./contracts.js";
import { createSchemasInstalledController as createInstalledController } from "./installed-controller.js";

export { installedControllerDefinition } from "./installed-controller.js";

export type {
  CapturedValidationContinuation,
  CompactCanonicalCommand,
  CompactCanonicalEditorAdapter,
  CompactCanonicalProjectionPersistenceRequest,
  CompactCanonicalProjectionWorker,
  ReusableSchemaRule,
  ReusableSchemaRuleRevision,
  SchemaPersistenceEvent,
  SchemaSourceDraftInput,
  SchemaValidationRecord,
} from "./contracts.js";

export interface SchemasInstalledPorts extends SchemasInstalledPortsContract {}

export function createSchemasInstalledController(ports: SchemasInstalledPorts) {
  return createInstalledController(ports);
}
