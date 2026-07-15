import { canonicalRulePropertyPath } from "./data-layer-schema-property-path.js";
import type { JsonSchema } from "./data-layer-schema-document.js";
import type { AttachedSchemaRule } from "./data-layer-schema-verification.js";

export interface SchemaPropertyRow {
  canonicalPath: string;
  displayPath: string;
  origin: "local" | "inherited";
  schema: JsonSchema;
}

export type SchemaPropertySortOrder = "schema" | "name-asc" | "name-desc";

export interface DisplayedSchemaPropertyRow extends SchemaPropertyRow {
  filterContext: boolean;
}

export interface SchemaPropertyRowView {
  rows: DisplayedSchemaPropertyRow[];
  matchCount: number;
  contextCount: number;
  totalCount: number;
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

function parentRowPath(path: string, paths: ReadonlySet<string>): string | undefined {
  let boundary = path.lastIndexOf("/");
  while (boundary > 0) {
    const candidate = path.slice(0, boundary);
    if (paths.has(candidate)) return candidate;
    boundary = candidate.lastIndexOf("/");
  }
  return undefined;
}

export function filterAndSortSchemaPropertyRows(
  sourceRows: readonly SchemaPropertyRow[],
  query: string,
  sortOrder: SchemaPropertySortOrder,
): SchemaPropertyRowView {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const allPaths = new Set(sourceRows.map(({ canonicalPath }) => canonicalPath));
  const matches = new Set(sourceRows
    .filter(({ canonicalPath, displayPath }) => !normalizedQuery
      || canonicalPath.toLocaleLowerCase().includes(normalizedQuery)
      || displayPath.toLocaleLowerCase().includes(normalizedQuery))
    .map(({ canonicalPath }) => canonicalPath));
  const contexts = new Set<string>();
  if (normalizedQuery) for (const path of matches) {
    let parent = parentRowPath(path, allPaths);
    while (parent) {
      if (!matches.has(parent)) contexts.add(parent);
      parent = parentRowPath(parent, allPaths);
    }
  }
  const visiblePaths = normalizedQuery ? new Set([...matches, ...contexts]) : allPaths;
  const sourceIndex = new Map(sourceRows.map((row, index) => [row.canonicalPath, index]));
  const rowByPath = new Map(sourceRows.map((row) => [row.canonicalPath, row]));
  const children = new Map<string | undefined, string[]>();
  for (const row of sourceRows) {
    if (!visiblePaths.has(row.canonicalPath)) continue;
    const parent = parentRowPath(row.canonicalPath, allPaths);
    children.set(parent, [...(children.get(parent) ?? []), row.canonicalPath]);
  }
  const compare = (left: string, right: string): number => {
    if (sortOrder === "schema") return sourceIndex.get(left)! - sourceIndex.get(right)!;
    const leftName = left.slice(left.lastIndexOf("/") + 1);
    const rightName = right.slice(right.lastIndexOf("/") + 1);
    const order = leftName.localeCompare(rightName, undefined, { sensitivity:"base" });
    return sortOrder === "name-asc" ? order : -order;
  };
  const ordered: DisplayedSchemaPropertyRow[] = [];
  const append = (parent: string | undefined): void => {
    for (const path of [...(children.get(parent) ?? [])].sort(compare)) {
      ordered.push({ ...rowByPath.get(path)!, filterContext:contexts.has(path) });
      append(path);
    }
  };
  append(undefined);
  return {
    rows:ordered,
    matchCount:normalizedQuery ? matches.size : sourceRows.length,
    contextCount:contexts.size,
    totalCount:sourceRows.length,
  };
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
