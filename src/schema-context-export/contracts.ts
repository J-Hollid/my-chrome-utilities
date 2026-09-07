import type {CanonicalSchemaDocument} from "../data-layer-canonical-schema.js";
import type {SchemaDefinition} from "../data-layer-schema-verification.js";
import type {JsonSchemaCompatibilityReview} from "../data-layer-json-schema-export.js";

export type StandardDocument=Record<string,unknown>;
export interface ContextExportSource {
  key:string;
  name:string;
  role:string;
  context:string;
  version:"Draft"|number;
  canonical?:CanonicalSchemaDocument;
  schema?:SchemaDefinition;
  schemas?:readonly SchemaDefinition[];
  pending?:boolean;
  unconfirmed?:boolean;
  errors?:readonly string[];
}
export interface ContextExportSnapshot {
  identity:string;
  label:string;
  document:StandardDocument;
  text:string;
  filename:string;
  compatibility:JsonSchemaCompatibilityReview;
}
