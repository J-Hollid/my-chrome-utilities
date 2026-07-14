import { canonicalRulePropertyPath } from "./data-layer-schema-property-path.js";
import type { AttachedSchemaRule, JsonSchema } from "./data-layer-schema-verification.js";

export interface SchemaPropertyRow {
  canonicalPath: string;
  displayPath: string;
  origin: "local" | "inherited";
  schema: JsonSchema;
}

function documentRows(document: JsonSchema, origin: SchemaPropertyRow["origin"]): SchemaPropertyRow[] {
  const rows: SchemaPropertyRow[] = [];
  const visit = (schema: JsonSchema, prefix: string): void => {
    for (const [name, child] of Object.entries(schema.properties ?? {})) {
      const canonicalPath = name.trim().startsWith("/")
        ? canonicalRulePropertyPath(name)
        : canonicalRulePropertyPath(`${prefix}/${name}`);
      rows.push({ canonicalPath, displayPath:canonicalPath.slice(1).replaceAll("/", "."), origin, schema:structuredClone(child) });
      if (child.type === "array" && child.items) {
        const itemPath = `${canonicalPath}/*`;
        rows.push({ canonicalPath:itemPath, displayPath:itemPath.slice(1).replaceAll("/", "."), origin, schema:structuredClone(child.items) });
        visit(child.items, itemPath);
      } else visit(child, canonicalPath);
    }
  };
  visit(document, "");
  return rows;
}

export function schemaPropertyRows(
  localDocument: JsonSchema,
  inheritedDocuments: readonly JsonSchema[] = [],
  excludedInheritedPaths: ReadonlySet<string> = new Set(),
): SchemaPropertyRow[] {
  const seen = new Set<string>();
  return [
    ...documentRows(localDocument, "local"),
    ...inheritedDocuments.flatMap((document) => documentRows(document, "inherited")),
  ].filter((row) => {
    if (row.origin === "inherited" && excludedInheritedPaths.has(row.canonicalPath)) return false;
    if (seen.has(row.canonicalPath)) return false;
    seen.add(row.canonicalPath);
    return true;
  });
}

type AttachableDraft = {
  document: JsonSchema;
  attachedRules?: readonly AttachedSchemaRule[] | undefined;
};

export function attachRuleToSchemaProperty<T extends AttachableDraft>(
  draft: T,
  path: string,
  rule: Omit<AttachedSchemaRule, "propertyPath">,
): T {
  const propertyPath = canonicalRulePropertyPath(path);
  const attachedRules = draft.attachedRules ?? [];
  const attachment = { ...rule, propertyPath };
  const existingIndex = attachedRules.findIndex((item) =>
    item.id === rule.id
    && canonicalRulePropertyPath(item.propertyPath ?? "") === propertyPath);
  if (existingIndex >= 0) {
    if (JSON.stringify(attachedRules[existingIndex]) === JSON.stringify(attachment)) return draft;
    return {
      ...draft,
      attachedRules:attachedRules.map((item, index) => index === existingIndex ? attachment : item),
    };
  }
  return {
    ...draft,
    attachedRules:[...attachedRules, attachment],
  };
}
