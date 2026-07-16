import type {
  ConditionalRuleConditionGroup,
  ConditionalRulePredicate,
} from "./data-layer-conditional-validation-rules.js";
import { resolveEffectiveSchemaDocumentation, resolvePropertyDocumentation } from "./data-layer-schema-documentation.js";
import type { JsonSchema } from "./data-layer-schema-document.js";
import { schemaPropertyRows } from "./data-layer-schema-rule-property-identity.js";
import { schemaRevision, type AttachedSchemaRule, type SchemaDefinition } from "./data-layer-schema-verification.js";

export interface SpecificationRow {
  canonicalPath: string;
  propertyName: string;
  description: string;
  mandatory: string;
  type: string;
  example?: string;
  comments: string;
  allowedValues: readonly (string | number | boolean | null)[];
  allowedValueChoices: readonly SpecificationAllowedValueChoice[];
  allowedValueGroups: readonly string[];
  allowedValuesText?: string;
}

export interface SpecificationAllowedValueChoice { value: string | number | boolean | null; label: string; }
export type SpecificationExampleSource = "documentation" | "allowed" | "custom" | "blank";
export interface SpecificationExampleSelection { source: SpecificationExampleSource; value?: string; }
export interface SpecificationExampleChoice { id: string; label: string; available: boolean; selected: boolean; value?: string; explanation?: string; }

export interface SpecificationClipboard { html: string; plain: string; }

export type SpecificationColumn = "propertyName" | "description" | "mandatory" | "type" | "example" | "allowedValues" | "comments";
export type SpecificationTableStyle = "plain" | "bordered" | "highlighted";

export const defaultSpecificationColumns: readonly SpecificationColumn[] = [
  "propertyName", "description", "mandatory", "type", "example", "allowedValues", "comments",
];

export const specificationColumnLabels: Readonly<Record<SpecificationColumn, string>> = {
  propertyName:"Property name",
  description:"Description",
  mandatory:"Mandatory",
  type:"Type",
  example:"Example value",
  allowedValues:"Allowed values",
  comments:"Comments",
};

export interface SpecificationClipboardOptions {
  columns?: readonly SpecificationColumn[];
  includeHeadings?: boolean;
  style?: SpecificationTableStyle;
}

export function retainedSpecificationPreviewScroll(previous: number, scrollWidth: number, clientWidth: number): number {
  return Math.max(0, Math.min(previous, Math.max(0, scrollWidth - clientWidth)));
}

export interface SpecificationProperty {
  canonicalPath: string;
  propertyName: string;
  origin: "local" | "inherited";
  container: boolean;
  selectedByDefault: boolean;
}

export interface SpecificationSurface {
  key: `published:${number}` | `historical:${number}` | "working-draft";
  label: string;
  schema: SchemaDefinition;
}

function withoutWorkingState(schema: SchemaDefinition): SchemaDefinition {
  const { workingDraft:_draft, revisionHistory:_history, ...surface } = structuredClone(schema);
  return surface;
}

function workingDraftSurface(schema: SchemaDefinition): SchemaDefinition | undefined {
  const draft = schema.workingDraft;
  if (!draft) return undefined;
  const { workingDraft:_draft, revisionHistory:_history, attachedRules:_rules, parentSchemaId:_parent, inheritedRuleOverrides:_overrides, documentation:_documentation, ...published } = structuredClone(schema);
  return {
    ...published,
    name:draft.name ?? schema.name,
    document:structuredClone(draft.document),
    assignments:structuredClone(draft.assignments),
    ...(draft.attachedRules !== undefined ? { attachedRules:structuredClone(draft.attachedRules) } : {}),
    ...(draft.parentSchemaId !== undefined ? { parentSchemaId:draft.parentSchemaId } : {}),
    ...(draft.inheritedRuleOverrides !== undefined ? { inheritedRuleOverrides:structuredClone(draft.inheritedRuleOverrides) } : {}),
    ...(draft.documentation !== undefined ? { documentation:structuredClone(draft.documentation) } : {}),
  };
}

export function specificationSurfaces(schema: SchemaDefinition): SpecificationSurface[] {
  const published = schemaRevision(schema, schema.version) ?? withoutWorkingState(schema);
  const historical = (schema.revisionHistory ?? [])
    .map(({ version }) => schemaRevision(schema, version))
    .filter((revision): revision is SchemaDefinition => Boolean(revision))
    .sort((left, right) => right.version - left.version)
    .map((revision): SpecificationSurface => ({
      key:`historical:${revision.version}`,
      label:`historical revision ${revision.version}`,
      schema:revision,
    }));
  const draft = workingDraftSurface(schema);
  return [
    { key:`published:${published.version}`, label:`published revision ${published.version}`, schema:published },
    ...historical,
    ...(draft ? [{ key:"working-draft" as const, label:`working draft based on revision ${schema.workingDraft!.sourceVersion}`, schema:draft }] : []),
  ];
}

function typeLabel(schema: JsonSchema | undefined): string {
  if (!schema?.type) return "Unspecified";
  if (schema.type === "array") {
    const itemType = schema.items?.type;
    return itemType === "object"
      ? "Array of Object"
      : `Array of ${itemType ? itemType.charAt(0).toUpperCase() + itemType.slice(1) : "Unspecified"}`;
  }
  return schema.type.charAt(0).toUpperCase() + schema.type.slice(1);
}

function pathSegments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function propertyName(path: string): string {
  return path.slice(1).replaceAll("/*", "[]").replaceAll("/", ".");
}

function overrideDisabled(schema: SchemaDefinition, path: string): boolean {
  const overrides = schema.inheritedRuleOverrides ?? {};
  const topLevel = pathSegments(path)[0] ?? "";
  return overrides[path] === "disabled" || overrides[topLevel] === "disabled";
}

function parentChain(schema: SchemaDefinition, allSchemas: readonly SchemaDefinition[]): SchemaDefinition[] {
  const result: SchemaDefinition[] = [];
  const visited = new Set<string>([schema.id]);
  let parentId = schema.parentSchemaId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = allSchemas.find(({ id }) => id === parentId);
    if (!parent) break;
    result.push(parent);
    parentId = parent.parentSchemaId;
  }
  return result;
}

function ruleIdentity(rule: AttachedSchemaRule): string {
  return `${rule.id}\u0000${rule.propertyPath ?? ""}`;
}

interface EffectiveAttachedSchemaRule extends AttachedSchemaRule { inherited?: boolean; }

function effectiveRules(schema: SchemaDefinition, allSchemas: readonly SchemaDefinition[]): EffectiveAttachedSchemaRule[] {
  const rules = new Map<string, EffectiveAttachedSchemaRule>();
  for (const parent of parentChain(schema, allSchemas).reverse()) {
    for (const rule of parent.attachedRules ?? []) {
      if (rule.enabled === false || (rule.propertyPath && overrideDisabled(schema, rule.propertyPath))) continue;
      rules.set(ruleIdentity(rule), { ...rule, inherited:true });
    }
  }
  for (const rule of schema.attachedRules ?? []) {
    if (rule.enabled === false) rules.delete(ruleIdentity(rule));
    else rules.set(ruleIdentity(rule), { ...rule });
  }
  return [...rules.values()];
}

function rulesFor(path: string, rules: readonly EffectiveAttachedSchemaRule[]): EffectiveAttachedSchemaRule[] {
  return rules.filter(({ propertyPath, enabled }) => enabled !== false && propertyPath === path);
}

function schemaAt(document: JsonSchema, path: string): JsonSchema | undefined {
  return pathSegments(path).reduce<JsonSchema | undefined>(
    (current, segment) => segment === "*" ? current?.items : current?.properties?.[segment],
    document,
  );
}

function owningDocument(schema: SchemaDefinition, path: string, allSchemas: readonly SchemaDefinition[]): JsonSchema {
  return [schema, ...parentChain(schema, allSchemas)]
    .find((candidate) => schemaAt(candidate.document, path))?.document ?? schema.document;
}

function structuralRequirement(path: string, document: JsonSchema): string | undefined {
  const segments = pathSegments(path);
  const conditions: string[] = [];
  let current: JsonSchema | undefined = document;
  let readable = "";
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!;
    if (segment === "*") {
      const arrayName = readable.split(".").at(-1) ?? "array";
      conditions.push(`a ${arrayName} item exists`);
      current = current?.items;
      continue;
    }
    if (!current) return undefined;
    const required = current.required?.includes(segment) ?? false;
    const leaf = index === segments.length - 1;
    readable = readable ? `${readable}.${segment}` : segment;
    const child = current.properties?.[segment];
    if (leaf) {
      if (!required) return undefined;
      return conditions.length ? `Yes when ${conditions.join(" and ")}` : "Yes";
    }
    const followedByItem = child?.type === "array" && segments[index + 1] === "*";
    if (!required && !followedByItem) conditions.push(`${readable} exists`);
    current = child;
  }
  return undefined;
}

function comparisonText(predicate: ConditionalRulePredicate): string {
  if (predicate.operator === "Is one of") return predicate.comparisons?.map(({ value }) => String(value)).join(" or ") ?? "";
  return predicate.comparison ? String(predicate.comparison.value) : "";
}

function conditionPath(path: string, targetPath: string): { name: string; context?: string } {
  const predicate = pathSegments(path);
  const target = pathSegments(targetPath);
  const targetWildcard = target.indexOf("*");
  if (targetWildcard > 0
      && predicate[targetWildcard] === "*"
      && predicate.slice(0, targetWildcard).every((segment, index) => segment === target[index])) {
    return {
      name:propertyName(`/${predicate.slice(targetWildcard + 1).join("/")}`),
      context:`the same ${target[targetWildcard - 1]} item`,
    };
  }
  return { name:propertyName(path) };
}

function predicateText(predicate: ConditionalRulePredicate, targetPath: string): string {
  const path = conditionPath(predicate.propertyPath, targetPath);
  const comparison = comparisonText(predicate);
  const relation = predicate.operator === "Exists" ? "exists"
    : predicate.operator === "Does not exist" ? "does not exist"
      : predicate.operator === "Equals" ? `equals ${comparison}`
        : predicate.operator === "Does not equal" ? `does not equal ${comparison}`
          : predicate.operator === "Is one of" ? `is one of ${comparison}`
            : predicate.operator === "Matches pattern" ? `matches ${comparison}`
              : `${predicate.operator.toLowerCase()} ${comparison}`;
  return `${path.name} ${relation}${path.context ? ` for ${path.context}` : ""}`;
}

function conditionText(group: ConditionalRuleConditionGroup, targetPath: string): string {
  return group.predicates.map((predicate) => predicateText(predicate, targetPath))
    .join(group.operator === "All" ? " and " : " or ");
}

function requiredFor(path: string, document: JsonSchema, rules: readonly EffectiveAttachedSchemaRule[]): string {
  const requiredRules = rulesFor(path, rules)
    .filter((rule) => rule.operator?.replaceAll("_", "-").toLowerCase() === "required");
  if (requiredRules.some(({ conditionGroup }) => !conditionGroup)) return "Yes";
  const structural = structuralRequirement(path, document);
  if (structural) return structural;
  const conditional = requiredRules.filter((rule): rule is EffectiveAttachedSchemaRule & { conditionGroup: ConditionalRuleConditionGroup } => Boolean(rule.conditionGroup));
  return conditional.length
    ? conditional.map(({ conditionGroup }) => `Yes when ${conditionText(conditionGroup, path)}`).join("; ")
    : "No";
}

function uniqueValues(values: readonly (string | number | boolean | null)[]): (string | number | boolean | null)[] {
  return values.filter((value, index) => values.findIndex((candidate) => Object.is(candidate, value)) === index);
}

function allowedFor(path: string, rules: readonly EffectiveAttachedSchemaRule[]): {
  values: (string | number | boolean | null)[];
  groups: string[];
  choices: SpecificationAllowedValueChoice[];
} {
  const relevant = rulesFor(path, rules)
    .filter((rule) => rule.operator?.replaceAll("_", "-").toLowerCase() === "allowed-values" && rule.allowedValues);
  const unconditional = relevant.filter(({ conditionGroup }) => !conditionGroup);
  const conditional = relevant.filter((rule): rule is EffectiveAttachedSchemaRule & { conditionGroup: ConditionalRuleConditionGroup } => Boolean(rule.conditionGroup));
  let intersection = unconditional.length ? uniqueValues(unconditional[0]!.allowedValues!) : [];
  for (const rule of unconditional.slice(1)) {
    intersection = intersection.filter((value) => rule.allowedValues!.some((candidate) => Object.is(candidate, value)));
  }
  const conflict = unconditional.length > 1 && !intersection.length;
  const groups = [
    ...(conflict ? ["Conflict: no values satisfy all effective rules"] : intersection.length ? [intersection.join(" | ")] : []),
    ...conditional.map((rule) => `${uniqueValues(rule.allowedValues!).join(" | ")} when ${conditionText(rule.conditionGroup, path)}`),
  ];
  const choices: SpecificationAllowedValueChoice[] = [];
  if (!conflict) {
    for (const value of intersection) {
      const inherited = unconditional.some((rule) => rule.inherited && rule.allowedValues!.some((candidate) => Object.is(candidate, value)));
      choices.push({ value, label:`Allowed value ${String(value)}${inherited ? " · inherited" : ""}` });
    }
    for (const rule of conditional) for (const value of uniqueValues(rule.allowedValues!)) {
      if (choices.some((choice) => Object.is(choice.value, value))) continue;
      choices.push({ value, label:`Allowed value ${String(value)} · when ${conditionText(rule.conditionGroup, path)}${rule.inherited ? " · inherited" : ""}` });
    }
  }
  return {
    values:choices.map(({ value }) => value),
    groups,
    choices,
  };
}

export function specificationExampleChoices(row: SpecificationRow, selection: SpecificationExampleSelection): SpecificationExampleChoice[] {
  const documentationAvailable = row.example !== undefined;
  const allowedAvailable = row.allowedValueChoices.length > 0;
  return [
    { id:"documentation", label:documentationAvailable ? `Documentation ${row.example}` : "Documentation", available:documentationAvailable, selected:selection.source === "documentation", ...(row.example !== undefined ? { value:row.example } : { explanation:"No documented example exists" }) },
    ...(allowedAvailable
      ? row.allowedValueChoices.map(({ value, label }) => ({ id:`allowed:${String(value)}`, label, value:String(value), available:true, selected:selection.source === "allowed" && selection.value === String(value) }))
      : [{ id:"allowed", label:"Allowed value", available:false, selected:false, explanation:"No effective allowed values exist" }]),
    { id:"custom", label:"Custom value", available:true, selected:selection.source === "custom", ...(selection.source === "custom" && selection.value !== undefined ? { value:selection.value } : {}) },
    { id:"blank", label:"Blank", available:true, selected:selection.source === "blank" },
  ];
}

export function typeSpecificationExampleSelection(row: SpecificationRow, choiceId: string, customValue = ""): SpecificationExampleSelection {
  if (choiceId === "documentation") return row.example === undefined ? { source:"blank" } : { source:"documentation", value:row.example };
  if (choiceId.startsWith("allowed:")) return { source:"allowed", value:choiceId.slice("allowed:".length) };
  if (choiceId === "custom") return { source:"custom", value:customValue };
  return { source:"blank" };
}

export function specificationProperties(
  schema: SchemaDefinition,
  allSchemas: readonly SchemaDefinition[] = [schema],
): SpecificationProperty[] {
  const parents = parentChain(schema, allSchemas);
  return schemaPropertyRows(schema.document, parents.map(({ document }) => document))
    .filter(({ canonicalPath, origin }) => !canonicalPath.endsWith("/*") && !(origin === "inherited" && overrideDisabled(schema, canonicalPath)))
    .map((row) => {
      const container = row.schema.type === "object" || row.schema.type === "array";
      return {
        canonicalPath:row.canonicalPath,
        propertyName:propertyName(row.canonicalPath),
        origin:row.origin,
        container,
        selectedByDefault:true,
      };
    });
}

export function deriveSpecificationRows(
  schema: SchemaDefinition,
  selectedPaths: readonly string[],
  allSchemas: readonly SchemaDefinition[] = [schema],
): SpecificationRow[] {
  const documentation = resolveEffectiveSchemaDocumentation(schema, allSchemas);
  const rules = effectiveRules(schema, allSchemas);
  return selectedPaths.map((canonicalPath) => {
    const document = owningDocument(schema, canonicalPath, allSchemas);
    const property = schemaAt(document, canonicalPath);
    const resolvedDocumentation = resolvePropertyDocumentation(documentation, canonicalPath);
    const documented = resolvedDocumentation?.inherited && overrideDisabled(schema, canonicalPath)
      ? undefined
      : resolvedDocumentation;
    const example = documented?.example?.value;
    const allowed = allowedFor(canonicalPath, rules);
    return {
      canonicalPath,
      propertyName:propertyName(canonicalPath),
      description:documented?.description ?? "",
      comments:documented?.comments ?? "",
      mandatory:requiredFor(canonicalPath, document, rules),
      type:typeLabel(property),
      ...(example !== undefined ? { example:String(example) } : {}),
      allowedValues:allowed.values,
      allowedValueChoices:allowed.choices,
      allowedValueGroups:allowed.groups,
      ...(allowed.groups.length ? { allowedValuesText:allowed.groups.join("; ") } : {}),
    };
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function plainCell(value: unknown): string {
  return String(value ?? "").replace(/[\t\r\n]+/gu, " ");
}

export function renderSpecificationClipboard(
  rows: readonly SpecificationRow[],
  options: SpecificationClipboardOptions = {},
): SpecificationClipboard {
  const richTableStyle = "table{border-collapse:collapse}th,td{border:1px solid #8a8a8a;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f2f2f2;font-weight:700}";
  const columns = options.columns ?? defaultSpecificationColumns;
  const includeHeadings = options.includeHeadings !== false;
  const style = options.style;
  const value = (row: SpecificationRow, column: SpecificationColumn): unknown => column === "propertyName" ? row.propertyName
    : column === "description" ? row.description
      : column === "mandatory" ? row.mandatory
        : column === "type" ? row.type
          : column === "example" ? row.example ?? ""
            : column === "allowedValues" ? row.allowedValueGroups.join("; ")
              : row.comments;
  const htmlCell = (row: SpecificationRow, column: SpecificationColumn): string => column === "allowedValues"
    ? row.allowedValueGroups.map(escapeHtml).join("<br>")
    : column === "comments"
      ? escapeHtml(row.comments).replaceAll("\n", "<br>")
      : escapeHtml(value(row, column));
  const tableStyle = style && style !== "plain" ? ' style="border-collapse:collapse"' : "";
  const cellStyle = style && style !== "plain" ? ' style="border:1px solid #666;padding:4px"' : "";
  const headingStyle = style === "highlighted" ? ' style="border:1px solid #666;padding:4px;font-weight:bold;background:#eee"' : cellStyle;
  const htmlRows = rows.map((row) => `<tr>${columns.map((column) => `<td${cellStyle}>${htmlCell(row, column)}</td>`).join("")}</tr>`).join("");
  const heading = includeHeadings ? `<thead><tr>${columns.map((column) => `<th${headingStyle}>${escapeHtml(specificationColumnLabels[column])}</th>`).join("")}</tr></thead>` : "";
  const legacyStyle = style === undefined ? `<style>${richTableStyle}</style>` : "";
  const html = `<table${tableStyle}>${legacyStyle}${heading}<tbody>${htmlRows}</tbody></table>`;
  const plainRows = rows.map((row) => columns.map((column) => value(row, column)));
  const plain = [...(includeHeadings ? [columns.map((column) => specificationColumnLabels[column])] : []), ...plainRows]
    .map((line) => line.map(plainCell).join("\t"))
    .join("\n");
  return { html, plain };
}
