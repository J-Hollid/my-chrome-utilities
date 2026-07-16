export interface JsonSchema {
  typeMismatchTreatment?: "error" | "warning" | "ignore";
  type?: "object" | "string" | "number" | "boolean" | "array";
  propertyOrigin?: "manual";
  required?: readonly string[];
  forbidden?: readonly string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  minimum?: number;
  maximum?: number;
  additionalProperties?: boolean;
}
