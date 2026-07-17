import type { ValidationState } from "./utilities/data-layer/capture.js";
import type { JsonSchema } from "./data-layer-schema-document.js";
import { normalizeCanonicalSchemaDocument } from "./data-layer-schema-canonical-document.js";
import { urlConditionsMatch, type PathCondition } from "./data-layer-path-conditions.js";
import { canonicalNestedPath, resolveNestedValues, type NestedValueMatch } from "./data-layer-schema-nested-path.js";
import type { ValidationEvaluation } from "./data-layer-validation-model.js";
import {
  conditionGroupAppliesToConsequence,
  conditionGroupAppliesToValue,
  conditionalRuleSummary,
  type ConditionalRuleConditionGroup,
} from "./data-layer-conditional-validation-rules.js";
import {
  resolveEffectiveSchemaDocumentation,
  type ResolvedSchemaDocumentation,
  type SchemaDocumentation,
} from "./data-layer-schema-documentation.js";
import {
  assignmentDataConditionSummary,
  evaluateAssignmentDataConditions,
  type AssignmentDataConditionEvidence,
  type AssignmentDataConditionGroup,
  type AssignmentConditionTarget,
} from "./data-layer-schema-assignment-data-conditions.js";
import { normalizeAllowedValuesRule } from "./data-layer-allowed-values-rule.js";
import {
  cardinalityComparisonPasses,
  cardinalityConstraint,
  type CardinalityComparison,
} from "./data-layer-cardinality.js";

export type ValidationTarget = "payload" | "raw input";
export type { JsonSchema } from "./data-layer-schema-document.js";
export type { CardinalityComparison } from "./data-layer-cardinality.js";
export interface AttachedSchemaRule { id: string; name?: string; version: number; propertyPath?: string; operator?: string; parameters?: string; allowedValues?: readonly (string | number | boolean | null)[]; migrationIssue?: string; applicableType?: "string" | "number" | "array" | "object" | "boolean"; severity?: string; message?: string; enabled?: boolean; conditionGroup?: ConditionalRuleConditionGroup; comparison?: CardinalityComparison; limit?: number; }
export interface SchemaWorkingDraft {
  name?: string;
  baseVersion: number;
  sourceVersion: number;
  document: JsonSchema;
  assignments: readonly SchemaAssignment[];
  attachedRules?: readonly AttachedSchemaRule[] | undefined;
  parentSchemaId?: string | undefined;
  inheritedRuleOverrides?: Readonly<Record<string, "inherit" | "enabled" | "disabled">> | undefined;
  documentation?: SchemaDocumentation | undefined;
  pendingChanges: readonly string[];
}
export interface SchemaDefinition { id: string; name: string; version: number; document: JsonSchema; assignments: readonly SchemaAssignment[]; attachedRules?: readonly AttachedSchemaRule[]; parentSchemaId?: string; inheritedRuleOverrides?: Readonly<Record<string, "inherit" | "enabled" | "disabled">>; documentation?: SchemaDocumentation; revisionHistory?: readonly SchemaDefinition[]; workingDraft?: SchemaWorkingDraft; published?: boolean; }
export interface SchemaRenameInspection { ready: boolean; proposedName: string; assistance: string; }
export interface SchemaAssignment {
  sourceId: string;
  eventName: string;
  target: ValidationTarget;
  id?: string;
  name?: string;
  priority?: number;
  domainCondition?: string;
  pathnameCondition?: string;
  pathConditions?: readonly PathCondition[];
  enabled?: boolean;
  versionPolicy?: "pinned" | "follow latest";
  schemaId?: string;
  schemaVersion?: number;
  conditionTarget?: AssignmentConditionTarget;
  dataConditionGroup?: AssignmentDataConditionGroup;
}
export interface ValidationIssue { instancePath: string; templatePath?: string; message: string; expected: string; actual: string; schemaName: string; schemaVersion: number; schemaLocation: string; rule?: string; severity?: string; origin?: string; allowedValues?: readonly (string | number | boolean | null)[]; conditionSummary?: string; }
export interface ValidationResult { state: ValidationState; issues: readonly ValidationIssue[]; evaluations?: readonly ValidationEvaluation[]; schema?: Pick<SchemaDefinition, "id" | "name" | "version">; documentation?: ResolvedSchemaDocumentation; target?: ValidationTarget; assignment?: Pick<SchemaAssignment, "id" | "name" | "sourceId" | "eventName" | "target" | "priority" | "domainCondition" | "pathnameCondition" | "versionPolicy" | "enabled" | "conditionTarget" | "dataConditionGroup">; assignmentEvidence?: AssignmentResolutionEvidence; inheritedFrom?: readonly Pick<SchemaDefinition, "id" | "name" | "version">[]; }
export interface ValidatableEvent { sourceId: string; eventName: string; payload: unknown; rawInput: unknown; }
export interface AssignmentCandidateEvidence {
  schemaId: string;
  schemaName: string;
  assignmentId?: string;
  assignmentName?: string;
  priority: number;
  enabled: boolean;
  sourceMatch: boolean;
  eventNameMatch: boolean;
  domainMatch: boolean;
  pathnameMatch: boolean;
  urlMatch: boolean;
  dataCondition?: AssignmentDataConditionEvidence;
  conditionSummary: string;
  matched: boolean;
}
export interface AssignmentResolutionEvidence { candidates: readonly AssignmentCandidateEvidence[]; selectedAssignmentId?: string; summary: string; }
export interface AssignmentResolution { schema?: SchemaDefinition; assignment?: SchemaAssignment; error?: string; evidence: AssignmentResolutionEvidence; }

function clone<T>(value: T): T { return structuredClone(value); }
function valueType(value: unknown): string { return Array.isArray(value) ? "array" : value === null ? "null" : typeof value; }
function schemaSlug(name: string): string { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function schemaId(name: string, version: number): string { return `schema:${schemaSlug(name)}:${version}`; }
function stableSchemaId(name: string): string { return `schema-${schemaSlug(name)}`; }

function canonicalAttachedRulePath(path: string): string {
  return canonicalNestedPath(path);
}
function documentContainsPath(document: JsonSchema, path: string): boolean {
  let current: JsonSchema | undefined = normalizeCanonicalSchemaDocument(document);
  for (const segment of canonicalAttachedRulePath(path).split("/").filter(Boolean)) {
    current = segment === "*" || /^\d+$/.test(segment) ? current?.items : current?.properties?.[segment];
    if (!current) return false;
  }
  return true;
}

function schemaDefinitionAtPath(document: JsonSchema, path: string): JsonSchema | undefined {
  let current: JsonSchema | undefined = document;
  for (const segment of canonicalAttachedRulePath(path).split("/").filter(Boolean)) {
    current = segment === "*" || /^\d+$/.test(segment) ? current?.items : current?.properties?.[segment];
  }
  return current;
}

function exactLegacyParameterPrefix(parameters: string, propertyPath: string): string | undefined {
  const canonical = canonicalAttachedRulePath(propertyPath);
  const alternatives = new Set([canonical, canonical.slice(1), propertyPath.trim()]);
  return [...alternatives].find((candidate) => parameters.startsWith(`${candidate}:`));
}

function effectiveAttachedRule(rule: AttachedSchemaRule, document?: JsonSchema): AttachedSchemaRule {
  let propertyPath = rule.propertyPath ? canonicalAttachedRulePath(rule.propertyPath) : undefined;
  let parameters = rule.parameters;
  if (!propertyPath && parameters && document) {
    const separator = parameters.indexOf(":");
    const legacyTarget = separator > 0 ? parameters.slice(0, separator).trim() : "";
    const allowedValues = rule.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase() === "allowed-values";
    if (legacyTarget && (documentContainsPath(document, legacyTarget) || allowedValues)) propertyPath = canonicalAttachedRulePath(legacyTarget);
  }
  if (propertyPath && parameters !== undefined) {
    const prefix = exactLegacyParameterPrefix(parameters, propertyPath);
    if (prefix) parameters = parameters.slice(prefix.length + 1);
    if (rule.operator?.replaceAll("_", "-").toLowerCase() === "required"
      && canonicalAttachedRulePath(parameters) === propertyPath) parameters = undefined;
  }
  const { propertyPath:_propertyPath, parameters:_parameters, ...rest } = rule;
  const canonical = {
    ...rest,
    ...(propertyPath ? { propertyPath } : {}),
    ...(parameters !== undefined ? { parameters } : {}),
  };
  const declaredType = propertyPath && document ? schemaDefinitionAtPath(normalizeCanonicalSchemaDocument(document), propertyPath)?.type : undefined;
  return normalizeAllowedValuesRule(canonical, declaredType);
}

function canonicalSchemaRules(schema: SchemaDefinition): SchemaDefinition {
  const normalized = clone(schema);
  if (normalized.attachedRules) normalized.attachedRules = normalized.attachedRules.map((rule) => effectiveAttachedRule(rule, normalized.document));
  if (normalized.workingDraft?.attachedRules) normalized.workingDraft.attachedRules = normalized.workingDraft.attachedRules.map((rule) => effectiveAttachedRule(rule, normalized.workingDraft?.document));
  if (normalized.revisionHistory) normalized.revisionHistory = normalized.revisionHistory.map(canonicalSchemaRules);
  return normalized;
}

function schemaSnapshot(schema: SchemaDefinition): SchemaDefinition {
  const { revisionHistory: _history, workingDraft: _draft, ...snapshot } = clone(schema);
  return snapshot;
}

function assignmentForSchema(assignment: SchemaAssignment, id: string): SchemaAssignment {
  const { schemaVersion, ...withoutVersion } = clone(assignment);
  return {
    ...withoutVersion,
    ...(assignment.schemaId ? { schemaId:id } : {}),
    ...(assignment.versionPolicy === "pinned" && schemaVersion !== undefined ? { schemaVersion } : {}),
  };
}

export function createSchema(name: string, version: number, document: JsonSchema): SchemaDefinition {
  return { id: schemaId(name, version), name, version, document: clone(document), assignments: [] };
}
export function importSchema(serialized: string): SchemaDefinition { return canonicalSchemaRules(JSON.parse(serialized) as SchemaDefinition); }
export function exportSchema(schema: SchemaDefinition): string { return JSON.stringify(canonicalSchemaRules(schema)); }
export function assignSchema(schema: SchemaDefinition, assignment: SchemaAssignment): SchemaDefinition {
  return { ...schema, assignments: [...schema.assignments.filter((item) => !(item.sourceId === assignment.sourceId && item.eventName === assignment.eventName && item.target === assignment.target)), clone(assignment)] };
}
export function createSchemaWorkingDraft(schema: SchemaDefinition, sourceVersion = schema.version): SchemaDefinition {
  if (schema.workingDraft) return clone(schema);
  const source = schemaRevision(schema, sourceVersion);
  if (!source) throw new Error(`Schema revision ${sourceVersion} does not exist.`);
  return {
    ...clone(schema),
    workingDraft:{
      name:source.name,
      baseVersion:schema.version,
      sourceVersion,
      document:clone(source.document),
      assignments:clone(source.assignments),
      ...(source.attachedRules ? { attachedRules:clone(source.attachedRules) } : {}),
      ...(source.parentSchemaId ? { parentSchemaId:source.parentSchemaId } : {}),
      ...(source.inheritedRuleOverrides ? { inheritedRuleOverrides:clone(source.inheritedRuleOverrides) } : {}),
      ...(source.documentation !== undefined ? { documentation:clone(source.documentation) } : {}),
      pendingChanges:[],
    },
  };
}
export function updateSchemaWorkingDraft(
  schema: SchemaDefinition,
  changes: Partial<Pick<SchemaWorkingDraft, "name" | "document" | "assignments" | "attachedRules" | "parentSchemaId" | "inheritedRuleOverrides" | "documentation">>,
  change?: string,
): SchemaDefinition {
  const withDraft = schema.workingDraft ? clone(schema) : createSchemaWorkingDraft(schema);
  const draft = withDraft.workingDraft as SchemaWorkingDraft;
  return { ...withDraft, workingDraft:{ ...draft, ...clone(changes), pendingChanges:change ? [...draft.pendingChanges, change] : draft.pendingChanges } };
}
export function inspectSchemaRename(
  schema: SchemaDefinition,
  schemas: readonly SchemaDefinition[],
  proposedName: string,
): SchemaRenameInspection {
  const proposed = proposedName.trim();
  if (!proposed) return { ready:false, proposedName:"", assistance:"Enter a schema name" };
  const duplicate = schemas.find((candidate) => candidate.id !== schema.id && candidate.name.trim().toLocaleLowerCase() === proposed.toLocaleLowerCase());
  if (duplicate) return { ready:false, proposedName:proposed, assistance:`A schema named ${duplicate.name} already exists` };
  return { ready:true, proposedName:proposed, assistance:proposed === schema.name ? "Name is unchanged" : "Ready to rename" };
}
export function proposeSchemaWorkingDraftName(schema: SchemaDefinition, proposedName: string): SchemaDefinition {
  const withDraft = schema.workingDraft ? clone(schema) : createSchemaWorkingDraft(schema);
  const draft = withDraft.workingDraft as SchemaWorkingDraft;
  const proposed = proposedName.trim();
  const previousRenameIndex = draft.pendingChanges.findIndex((change) => change.startsWith("Rename schema from "));
  const pendingChanges = draft.pendingChanges.filter((change) => !change.startsWith("Rename schema from "));
  if (proposed && proposed !== schema.name) {
    const rename = `Rename schema from ${schema.name} to ${proposed}`;
    pendingChanges.splice(previousRenameIndex < 0 ? pendingChanges.length : previousRenameIndex, 0, rename);
  }
  const nextDraft = { ...draft, pendingChanges };
  if (proposed !== schema.name || draft.name !== undefined) nextDraft.name = proposed;
  return { ...withDraft, workingDraft:nextDraft };
}
export function discardSchemaWorkingDraft(schema: SchemaDefinition): SchemaDefinition {
  const { workingDraft: _draft, ...current } = clone(schema);
  return current;
}
export function publishSchemaWorkingDraft(schema: SchemaDefinition): SchemaDefinition {
  const draft = schema.workingDraft;
  if (!draft) throw new Error("Schema has no working draft to publish.");
  const snapshot = schemaSnapshot(schema);
  const { attachedRules: _attachedRules, parentSchemaId: _parentSchemaId, inheritedRuleOverrides: _overrides, documentation: _documentation, ...current } = snapshot;
  return {
    ...current,
    name:draft.name ?? schema.name,
    version:schema.published === false ? 1 : schema.version + 1,
    published:true,
    document:clone(draft.document),
    assignments:clone(draft.assignments).map((assignment) => assignmentForSchema(assignment, schema.id)),
    ...(draft.attachedRules ? { attachedRules:clone(draft.attachedRules) } : {}),
    ...(draft.parentSchemaId ? { parentSchemaId:draft.parentSchemaId } : {}),
    ...(draft.inheritedRuleOverrides ? { inheritedRuleOverrides:clone(draft.inheritedRuleOverrides) } : {}),
    ...(draft.documentation !== undefined ? { documentation:clone(draft.documentation) } : {}),
    revisionHistory:schema.published === false ? [] : [...(schema.revisionHistory ?? []).map(schemaSnapshot), snapshot],
  };
}
export function schemaRevision(schema: SchemaDefinition, version: number): SchemaDefinition | undefined {
  if (schema.version === version) return schemaSnapshot(schema);
  const match = schema.revisionHistory?.find((revision) => revision.version === version);
  return match ? schemaSnapshot(match) : undefined;
}
export function schemaRevisionChoices(schema: SchemaDefinition): number[] {
  return [...new Set((schema.revisionHistory ?? []).map(({ version }) => version))].sort((left, right) => right - left);
}
export function restoreSchemaRevisionDraft(schema: SchemaDefinition, version: number): SchemaDefinition {
  const withoutDraft = discardSchemaWorkingDraft(schema);
  const restored = createSchemaWorkingDraft(withoutDraft, version);
  return { ...restored, workingDraft:{ ...restored.workingDraft as SchemaWorkingDraft, pendingChanges:[`Restore revision ${version}`] } };
}
export function duplicateSchemaRevision(schema: SchemaDefinition, version: number, schemas: readonly SchemaDefinition[] = []): SchemaDefinition {
  const source = schemaRevision(schema, version);
  if (!source) throw new Error(`Schema revision ${version} does not exist.`);
  const { revisionHistory: _history, workingDraft: _draft, ...duplicate } = duplicateSchema(source, `${schema.name} revision ${version} copy`, schemas);
  return { ...duplicate, version:1, published:false, assignments:[] };
}
export function reviseSchema(schema: SchemaDefinition, document: JsonSchema): SchemaDefinition {
  return publishSchemaWorkingDraft(updateSchemaWorkingDraft(schema, { document }, "Update schema document"));
}
export function duplicateSchema(schema: SchemaDefinition, name: string, schemas: readonly SchemaDefinition[] = []): SchemaDefinition {
  const duplicate = { ...clone(schema), id:schemaId(name, schema.version), name };
  if (!schemas.length) return duplicate;
  const effective = resolveEffectiveSchemaDocumentation(schema, schemas);
  const properties = Object.fromEntries(Object.entries(effective.properties).map(([path, entry]) => [path, {
    displayName:entry.displayName,
    description:entry.description,
    ...(entry.comments ? { comments:entry.comments } : {}),
  }]));
  return {
    ...duplicate,
    ...(effective.description || Object.keys(properties).length ? {
      documentation:{
        ...(effective.description ? { description:effective.description } : {}),
        ...(Object.keys(properties).length ? { properties } : {}),
      },
    } : {}),
  };
}
export function assignableSchemas(schemas: readonly SchemaDefinition[]): SchemaDefinition[] {
  return schemas.filter(({ published }) => published !== false).map(clone);
}
export function schemaInheritanceError(schema: SchemaDefinition, schemas: readonly SchemaDefinition[]): string | undefined {
  if (!schema.parentSchemaId) return undefined;
  if (schema.parentSchemaId === schema.id) return "A schema cannot inherit from itself";
  const parents = new Map<string, string | undefined>(schemas.map((item) => [item.id, item.parentSchemaId]));
  if (!parents.has(schema.parentSchemaId)) return "The selected parent schema does not exist";
  let current: string | undefined = schema.parentSchemaId;
  while (current) { if (current === schema.id) return "Schema inheritance cannot contain a cycle"; current = parents.get(current); }
  const parent = schemas.find((candidate) => candidate.id === schema.parentSchemaId);
  const childTarget = schema.assignments[0]?.target;
  const parentTarget = parent?.assignments[0]?.target;
  if (childTarget && parentTarget && childTarget !== parentTarget) return "Parent and child validation targets must match";
  return undefined;
}
export function schemaInheritanceConflict(schema: SchemaDefinition, schemas: readonly SchemaDefinition[]): string | undefined {
  let parentId = schema.parentSchemaId;
  while (parentId) {
    const parent = schemas.find((candidate) => candidate.id === parentId);
    if (!parent) return undefined;
    for (const [property, localRule] of Object.entries(schema.document.properties ?? {})) {
      if (schema.inheritedRuleOverrides?.[property] === "disabled") continue;
      const inheritedRule = parent.document.properties?.[property];
      if (localRule.type && inheritedRule?.type && localRule.type !== inheritedRule.type) return `Inheritance conflict: ${property} is ${inheritedRule.type} in ${parent.name} but ${localRule.type} locally`;
    }
    parentId = parent.parentSchemaId;
  }
  return undefined;
}
export function searchSchemas(schemas: readonly SchemaDefinition[], query: string): SchemaDefinition[] { const q = query.toLowerCase(); return schemas.filter((schema) => [schema.name, schema.version, ...schema.assignments.flatMap((a) => [a.sourceId, a.eventName, a.target])].join(" ").toLowerCase().includes(q)); }

export function resolveSchemaAssignment(
  event: Pick<ValidatableEvent, "sourceId" | "eventName"> & Partial<Pick<ValidatableEvent, "payload" | "rawInput">>,
  pageUrl: string | undefined,
  schemas: readonly SchemaDefinition[],
): AssignmentResolution {
  const candidates = schemas.flatMap((schema) => schema.assignments.map((assignment) => {
    const enabled = assignment.enabled !== false;
    const sourceMatch = assignment.sourceId === event.sourceId;
    const eventNameMatch = assignment.eventName === event.eventName;
    const domainMatch = pageUrl === undefined
      ? true
      : urlConditionsMatch(pageUrl, { ...(assignment.domainCondition ? { domainCondition:assignment.domainCondition } : {}) });
    const pathnameMatch = pageUrl === undefined
      ? true
      : urlConditionsMatch(pageUrl, {
        ...(assignment.pathnameCondition ? { pathnameCondition:assignment.pathnameCondition } : {}),
        ...(assignment.pathConditions ? { pathConditions:assignment.pathConditions } : {}),
      });
    const urlMatch = domainMatch && pathnameMatch;
    const conditionValue = (assignment.conditionTarget ?? assignment.target) === "raw input" ? event.rawInput : event.payload;
    const dataCondition = assignment.dataConditionGroup
      ? evaluateAssignmentDataConditions(conditionValue, assignment.dataConditionGroup)
      : undefined;
    const evidence: AssignmentCandidateEvidence = {
      schemaId:schema.id,
      schemaName:schema.name,
      ...(assignment.id ? { assignmentId:assignment.id } : {}),
      ...(assignment.name ? { assignmentName:assignment.name } : {}),
      priority:assignment.priority ?? 0,
      enabled,
      sourceMatch,
      eventNameMatch,
      domainMatch,
      pathnameMatch,
      urlMatch,
      ...(dataCondition ? { dataCondition } : {}),
      conditionSummary:assignmentDataConditionSummary(assignment),
      matched:enabled && sourceMatch && eventNameMatch && urlMatch && (dataCondition?.matched ?? true),
    };
    return { schema, assignment, evidence };
  }));
  const matches = candidates.filter(({ evidence }) => evidence.matched);
  const baseEvidence = candidates.map(({ evidence }) => evidence);
  if (matches.length === 0) return { evidence:{ candidates:baseEvidence, summary:"No assignment matched source, event name, URL, and data conditions" } };
  const highest = Math.max(...matches.map(({ assignment }) => assignment.priority ?? 0));
  const selected = matches.filter(({ assignment }) => (assignment.priority ?? 0) === highest);
  const matchingNames = matches.map(({ assignment }) => assignment.name ?? assignment.id ?? "unnamed assignment");
  if (selected.length !== 1) {
    const names = selected.map(({ assignment }) => assignment.name ?? assignment.id ?? "unnamed assignment");
    return {
      error:`Assignment error: ${names.join(", ")}`,
      evidence:{ candidates:baseEvidence, summary:`${names.join(" and ")} match at equal highest priority ${highest}` },
    };
  }
  const resolved = selected[0];
  if (!resolved) return { evidence:{ candidates:baseEvidence, summary:"No assignment selected" } };
  const pinnedVersion = resolved.assignment.versionPolicy === "pinned" ? resolved.assignment.schemaVersion : undefined;
  const selectedSchema = pinnedVersion ? schemaRevision(resolved.schema, pinnedVersion) : resolved.schema;
  const winner = resolved.assignment.name ?? resolved.assignment.id ?? "unnamed assignment";
  const summary = matches.length > 1
    ? `${matchingNames.join(" and ")} both match and priority ${highest} wins for ${winner}`
    : `${winner} matched at priority ${highest}`;
  const evidence: AssignmentResolutionEvidence = {
    candidates:baseEvidence,
    ...(resolved.assignment.id ? { selectedAssignmentId:resolved.assignment.id } : {}),
    summary,
  };
  return selectedSchema
    ? { schema:selectedSchema, assignment:resolved.assignment, evidence }
    : { error:`Assignment error: schema revision ${pinnedVersion} is unavailable`, evidence };
}

export const SCHEMA_LIBRARY_STORAGE_KEY = "my-chrome-utilities.schema-library.v1";
export function serializeSchemaLibrary(schemas: readonly SchemaDefinition[]): string { return JSON.stringify(schemas.map(canonicalSchemaRules)); }
export interface SchemaLibraryExport<TRule> { version: 1; schemas: SchemaDefinition[]; rules: TRule[]; }
export function schemaLibraryExportIdentitySnapshot<T extends { id: string }>(items: readonly T[]): string[] { return items.map(({ id }) => id); }
export function createSchemaLibraryExport<TRule>(schemas: readonly SchemaDefinition[], rules: readonly TRule[]): SchemaLibraryExport<TRule> {
  return { version:1, schemas:schemas.map(canonicalSchemaRules), rules:rules.map(clone) };
}
export function serializeSchemaLibraryExport<TRule>(schemas: readonly SchemaDefinition[], rules: readonly TRule[]): string { return `${JSON.stringify(createSchemaLibraryExport(schemas, rules), null, 2)}\n`; }
export function migrateSchemaLibrary(schemas: readonly SchemaDefinition[]): SchemaDefinition[] {
  const groups = new Map<string, SchemaDefinition[]>();
  for (const schema of schemas) {
    const key = schema.name.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), canonicalSchemaRules(schema)]);
  }
  return [...groups.values()].map((group) => {
    if (group.length === 1) return group[0] as SchemaDefinition;
    const ordered = [...group].sort((left, right) => left.version - right.version);
    const current = ordered.at(-1) as SchemaDefinition;
    const stableId = stableSchemaId(current.name);
    const revisions = ordered.slice(0, -1).flatMap((schema) => [...(schema.revisionHistory ?? []), schema]).map(schemaSnapshot);
    const assignments = ordered.flatMap(({ assignments }) => assignments).map((assignment) => {
      const pinnedVersion = assignment.schemaVersion ?? Number(assignment.schemaId?.match(/(?:^|:)(\d+)$/)?.[1] ?? current.version);
      return assignmentForSchema({ ...assignment, ...(assignment.versionPolicy === "pinned" ? { schemaVersion:pinnedVersion } : {}) }, stableId);
    });
    return {
      ...schemaSnapshot(current),
      id:stableId,
      assignments,
      revisionHistory:[...new Map(revisions.map((revision) => [revision.version, { ...revision, id:stableId }])).values()].sort((left, right) => left.version - right.version),
    };
  });
}
export function restoreSchemaLibrary(serialized: string | null): SchemaDefinition[] {
  if (!serialized) return [];
  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    const schemas = parsed.filter((schema): schema is SchemaDefinition => !!schema && typeof schema.id === "string" && typeof schema.name === "string" && typeof schema.version === "number");
    return migrateSchemaLibrary(schemas);
  }
  catch { return []; }
}

function issuesFor(value: unknown, schema: JsonSchema, path: string, schemaPath: string, result: ValidationIssue[], metadata: Pick<SchemaDefinition, "name" | "version">, onlyDeclaredProperties: boolean, undeclaredPropertyExceptions: ReadonlySet<string>, templatePath = ""): void {
  if (schema.type && valueType(value) !== schema.type && schema.typeMismatchTreatment !== "ignore") result.push({ instancePath: path, message: "Type mismatch", expected: schema.type, actual: valueType(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: schemaPath, severity:schema.typeMismatchTreatment ?? "error" });
  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const property of schema.required ?? []) if (!(property in record)) result.push({ instancePath: `${path}/${property}`, message: "Required value", expected: schema.properties?.[property]?.type ?? "value", actual: "missing", schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/required` });
    for (const property of schema.forbidden ?? []) if (property in record) result.push({ instancePath: `${path}/${property}`, message: "Forbidden property", expected: "absent", actual: valueType(record[property]), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/forbidden` });
    if (onlyDeclaredProperties && !undeclaredPropertyExceptions.has(templatePath || "/")) for (const property of Object.keys(record)) if (!(property in (schema.properties ?? {}))) result.push({ instancePath: `${path}/${property}`, message: "Undeclared property", expected: "declared property", actual: valueType(record[property]), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/additionalProperties` });
    for (const [property, child] of Object.entries(schema.properties ?? {})) if (property in record) issuesFor(record[property], child, `${path}/${property}`, `${schemaPath}/properties/${property}`, result, metadata, onlyDeclaredProperties, undeclaredPropertyExceptions, `${templatePath}/${property}`);
  }
  if (schema.type === "number" && typeof value === "number") { if (schema.minimum !== undefined && value < schema.minimum) result.push({ instancePath:path, message:"Value below minimum", expected:String(schema.minimum), actual:String(value), schemaName:metadata.name, schemaVersion:metadata.version, schemaLocation:`${schemaPath}/minimum` }); if (schema.maximum !== undefined && value > schema.maximum) result.push({ instancePath:path, message:"Value above maximum", expected:String(schema.maximum), actual:String(value), schemaName:metadata.name, schemaVersion:metadata.version, schemaLocation:`${schemaPath}/maximum` }); }
  if (schema.type === "array" && Array.isArray(value) && schema.items) value.forEach((item, index) => issuesFor(item, schema.items as JsonSchema, `${path}/${index}`, `${schemaPath}/items`, result, metadata, onlyDeclaredProperties, undeclaredPropertyExceptions, `${templatePath}/*`));
}

function issueFromAttachedRule(
  rule: AttachedSchemaRule,
  schema: SchemaDefinition,
  issue: Pick<ValidationIssue, "instancePath" | "message" | "expected" | "actual"> & Pick<ValidationIssue, "templatePath">,
  allowedValues: readonly (string | number | boolean | null)[] = [],
): ValidationIssue {
  return {
    ...issue,
    message:rule.message ?? issue.message,
    schemaName:schema.name,
    schemaVersion:schema.version,
    schemaLocation:`#/attachedRules/${rule.id}`,
    rule:`${rule.name ?? rule.id} v${rule.version}`,
    severity:rule.severity ?? "error",
    origin:`${schema.name} v${schema.version}`,
    ...(allowedValues.length ? { allowedValues } : {}),
    ...(rule.conditionGroup && rule.propertyPath && rule.operator ? {
      conditionSummary:conditionalRuleSummary({
        conditionGroup:rule.conditionGroup,
        consequence:{ propertyPath:rule.propertyPath, operator:rule.operator, ...(rule.parameters !== undefined ? { parameters:rule.parameters } : {}) },
      }),
    } : {}),
  };
}

function configuredAllowedValues(rule: AttachedSchemaRule): readonly (string | number | boolean | null)[] {
  if (rule.allowedValues) return rule.allowedValues;
  const parameters = rule.parameters ?? "";
  const values = !rule.propertyPath && parameters.includes(":") ? parameters.slice(parameters.indexOf(":") + 1) : parameters;
  return values.split(",").map((item) => item.trim()).filter(Boolean);
}

function ruleAllowsValue(rule: AttachedSchemaRule, value: unknown): boolean {
  return rule.allowedValues
    ? rule.allowedValues.some((candidate) => Object.is(candidate, value))
    : configuredAllowedValues(rule).includes(String(value));
}

function observedValueText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  try { return JSON.stringify(value) ?? String(value); }
  catch { return String(value); }
}

function nestedRuleFailure(rule: AttachedSchemaRule, match: NestedValueMatch): Pick<ValidationIssue, "message" | "expected" | "actual"> | undefined {
  const operator = rule.operator?.replaceAll("_", "-").toLowerCase() ?? "";
  const actual = match.exists ? observedValueText(match.value) : "missing";
  if (operator === "required") return match.exists ? undefined : { message:"Required value", expected:"value", actual };
  if (!match.exists) return undefined;
  if (operator === "exact-value") return match.exists && String(match.value) === (rule.parameters ?? "") ? undefined : { message:"Value is not exact", expected:rule.parameters ?? "value", actual };
  if (operator === "value-type") {
    const valueType = Array.isArray(match.value) ? "array" : typeof match.value;
    return match.exists && valueType === rule.parameters ? undefined : { message:"Type mismatch", expected:rule.parameters ?? "value", actual:match.exists ? valueType : actual };
  }
  if (operator === "non-empty-string") return match.exists && typeof match.value === "string" && match.value.length > 0 ? undefined : { message:"Value is empty", expected:"non-empty string", actual };
  if (operator === "text-length") {
    const limit = rule.limit ?? Number(rule.parameters);
    const comparison = rule.comparison ?? "==";
    const measured = typeof match.value === "string" ? match.value.length : Number.NaN;
    return match.exists && Number.isFinite(measured) && cardinalityComparisonPasses(measured, comparison, limit) ? undefined : { message:"Text length mismatch", expected:rule.comparison ? cardinalityConstraint("text length", comparison, limit) : `text length ${limit}`, actual:Number.isFinite(measured) ? String(measured) : actual };
  }
  if (operator === "digits-only") return match.exists && typeof match.value === "string" && /^\d+$/.test(match.value) ? undefined : { message:"Value contains non-digits", expected:"digits only", actual };
  if (operator === "allowed-values" || operator === "allowed values") {
    const values = configuredAllowedValues(rule);
    return match.exists && ruleAllowsValue(rule, match.value) ? undefined : { message:"Value is not allowed", expected:values.map(String).join(","), actual };
  }
  if (operator === "regular-expression" || operator === "regular expression") {
    try { return match.exists && new RegExp(rule.parameters ?? "").test(String(match.value)) ? undefined : { message:"Value does not match pattern", expected:rule.parameters ?? "pattern", actual }; }
    catch { return { message:"Invalid regular expression", expected:rule.parameters ?? "pattern", actual }; }
  }
  if (operator === "numeric-range") {
    const [minimumText = "", maximumText = ""] = rule.parameters?.split(",") ?? [];
    const minimum = minimumText === "" ? undefined : Number(minimumText); const maximum = maximumText === "" ? undefined : Number(maximumText);
    const value = typeof match.value === "number" ? match.value : Number.NaN;
    const inRange = match.exists && Number.isFinite(value) && (minimum === undefined || value >= minimum) && (maximum === undefined || value <= maximum);
    return inRange ? undefined : { message:"Value is outside range", expected:`${minimumText || "no minimum"} to ${maximumText || "no maximum"}`, actual };
  }
  if (operator === "item-count") {
    const limit = rule.limit ?? Number(rule.parameters ?? 0);
    const comparison = rule.comparison ?? ">=";
    const measured = Array.isArray(match.value) ? match.value.length : Number.NaN;
    return match.exists && Number.isFinite(measured) && cardinalityComparisonPasses(measured, comparison, limit) ? undefined : { message:rule.comparison ? "Item count mismatch" : "Too few items", expected:rule.comparison ? cardinalityConstraint("item count", comparison, limit) : `minimum ${limit} items`, actual:Number.isFinite(measured) ? String(measured) : actual };
  }
  return undefined;
}

function attachedRuleIssues(value: unknown, schema: SchemaDefinition, result: ValidationIssue[], rules = schema.attachedRules ?? []): void {
  const normalizedDocument = normalizeCanonicalSchemaDocument(schema.document);
  for (const storedRule of rules) {
    const rule = effectiveAttachedRule(storedRule, schema.document);
    if (rule.enabled === false) continue;
    if (rule.propertyPath?.startsWith("/")) {
      const definition = schemaDefinitionAtPath(normalizedDocument, rule.propertyPath);
      for (const match of resolveNestedValues(value, rule.propertyPath)) {
        if (rule.conditionGroup && !conditionGroupAppliesToConsequence(value, rule.conditionGroup, match.templatePath, match.concretePath)) continue;
        const failure = nestedRuleFailure(rule, match);
        const declaredTypeMismatch = match.exists
          && definition?.type !== undefined && valueType(match.value) !== definition.type;
        if (failure && !declaredTypeMismatch) {
          const allowedValues = rule.operator?.replaceAll("_", "-").toLowerCase() === "allowed-values"
            ? configuredAllowedValues(rule).map(String)
            : [];
          result.push(issueFromAttachedRule(rule, schema, {
            instancePath:match.concretePath,
            ...(storedRule.propertyPath?.startsWith("/") || match.templatePath.includes("*") ? { templatePath:match.templatePath } : {}),
            ...failure,
          }, allowedValues));
        }
      }
      continue;
    }
    if (rule.conditionGroup && !conditionGroupAppliesToValue(value, rule.conditionGroup)) continue;
    const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
    if (rule.operator === "required") for (const property of rule.parameters?.split(",").map((item) => item.trim()).filter(Boolean) ?? []) if (!record || !(property in record)) result.push(issueFromAttachedRule(rule, schema, { instancePath:`/${property}`, message:"Required value", expected:"value", actual:"missing" }));
    const [property, constraint] = rule.parameters?.split(":", 2) ?? [];
    if (!record || !property || !(property in record)) continue;
    const allowedValues = rule.operator === "allowed-values"
      ? configuredAllowedValues(rule).map(String)
      : [];
    if (rule.operator === "allowed-values" && (constraint || rule.allowedValues) && !ruleAllowsValue(rule, record[property])) result.push(issueFromAttachedRule(rule, schema, { instancePath:`/${property}`, message:"Value is not allowed", expected:allowedValues.map(String).join(","), actual:String(record[property]) }, allowedValues));
    if (rule.operator === "regular-expression" && constraint) { try { if (!new RegExp(constraint).test(String(record[property]))) result.push(issueFromAttachedRule(rule, schema, { instancePath:`/${property}`, message:"Value does not match pattern", expected:constraint, actual:String(record[property]) })); } catch { result.push(issueFromAttachedRule(rule, schema, { instancePath:`/${property}`, message:"Invalid regular expression", expected:constraint, actual:String(record[property]) })); } }
  }
}

function inheritedAttachedRuleIssues(value: unknown, schema: SchemaDefinition, schemas: readonly SchemaDefinition[], result: ValidationIssue[]): void {
  const disabled = new Set(Object.entries(schema.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([path]) => path));
  const visited = new Set<string>([schema.id]); let parentId = schema.parentSchemaId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = schemas.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    attachedRuleIssues(value, parent, result, (parent.attachedRules ?? []).filter((rule) => !rule.propertyPath || !disabled.has(rule.propertyPath)));
    parentId = parent.parentSchemaId;
  }
}

function typedConfiguredValue(rule: AttachedSchemaRule, value: string): string | number | boolean {
  if (rule.applicableType === "number") return Number(value);
  if (rule.applicableType === "boolean") return value === "true";
  return value;
}

function valueChoiceEvaluationEvidence(rule: AttachedSchemaRule, schema: SchemaDefinition, actualValue: unknown): Partial<ValidationEvaluation> {
  const operator = rule.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase();
  if (operator === "allowed-values") return { ruleId:rule.id, operator, schemaId:schema.id, actualValue, allowedValues:configuredAllowedValues(rule) };
  if (operator === "exact-value" && rule.parameters !== undefined) return { ruleId:rule.id, operator, schemaId:schema.id, actualValue, allowedValues:[typedConfiguredValue(rule, rule.parameters)] };
  return {};
}

function attachedRuleEvaluations(value: unknown, schema: SchemaDefinition, rules: readonly AttachedSchemaRule[]): ValidationEvaluation[] {
  return rules.filter(({ enabled }) => enabled !== false).flatMap<ValidationEvaluation>((storedRule): ValidationEvaluation[] => {
    const rule = effectiveAttachedRule(storedRule, schema.document);
    if (rule.conditionGroup && !rule.propertyPath?.startsWith("/") && !conditionGroupAppliesToValue(value, rule.conditionGroup)) {
      const summary = rule.propertyPath && rule.operator
        ? conditionalRuleSummary({ conditionGroup:rule.conditionGroup, consequence:{ propertyPath:rule.propertyPath, operator:rule.operator, ...(rule.parameters !== undefined ? { parameters:rule.parameters } : {}) } })
        : "Conditional rule";
      return [{
        propertyPath:rule.propertyPath ?? "",
        status:"not-applicable",
        message:`Not applicable: ${summary}`,
        expected:summary,
        actual:"condition not satisfied",
        rule:rule.name ?? rule.id,
        ruleVersion:rule.version,
        severity:rule.severity ?? "error",
        schemaName:schema.name,
        schemaVersion:schema.version,
        notApplicableReason:"condition-not-satisfied",
        ...valueChoiceEvaluationEvidence(rule, schema, undefined),
      }];
    }
    if (rule.propertyPath?.startsWith("/")) {
      return resolveNestedValues(value, rule.propertyPath).map((match): ValidationEvaluation => {
        if (rule.conditionGroup && !conditionGroupAppliesToConsequence(value, rule.conditionGroup, match.templatePath, match.concretePath)) {
          const summary = conditionalRuleSummary({ conditionGroup:rule.conditionGroup, consequence:{ propertyPath:rule.propertyPath!, operator:rule.operator ?? "required", ...(rule.parameters !== undefined ? { parameters:rule.parameters } : {}) } });
          return {
            propertyPath:match.concretePath,
            ...(match.templatePath.includes("*") ? { templatePath:match.templatePath } : {}),
            status:"not-applicable",
            message:`Not applicable: ${summary}`,
            expected:summary,
            actual:"condition not satisfied",
            rule:rule.name ?? rule.id,
            ruleVersion:rule.version,
            severity:rule.severity ?? "error",
            schemaName:schema.name,
            schemaVersion:schema.version,
            notApplicableReason:"condition-not-satisfied",
          };
        }
        const failure = nestedRuleFailure(rule, match);
        const operator = rule.operator?.replaceAll("_", "-").toLowerCase() ?? "";
        if (!match.exists && operator !== "required") return {
          propertyPath:match.concretePath,
          status:"not-applicable",
          message:rule.message ?? `${rule.name ?? rule.id} is not applicable because the optional target is absent`,
          expected:rule.parameters ?? "optional value rule",
          actual:"missing",
          rule:rule.name ?? rule.id,
          ruleVersion:rule.version,
          severity:rule.severity ?? "error",
          schemaName:schema.name,
          schemaVersion:schema.version,
          notApplicableReason:"target-absent",
          ...valueChoiceEvaluationEvidence(rule, schema, undefined),
        };
        if (!failure) return {
          propertyPath:match.concretePath,
          ...(match.templatePath.includes("*") ? { templatePath:match.templatePath } : {}),
          status:"pass",
          message:rule.message ?? `${rule.name ?? rule.id} passed`,
          expected:rule.allowedValues?.map(String).join(",") ?? rule.parameters ?? "rule satisfied",
          actual:match.exists ? observedValueText(match.value) : "missing",
          rule:rule.name ?? rule.id,
          ruleVersion:rule.version,
          severity:rule.severity ?? "error",
          schemaName:schema.name,
          schemaVersion:schema.version,
          ...valueChoiceEvaluationEvidence(rule, schema, match.value),
        };
        const issue = issueFromAttachedRule(rule, schema, {
          instancePath:match.concretePath,
          ...(storedRule.propertyPath?.startsWith("/") || match.templatePath.includes("*") ? { templatePath:match.templatePath } : {}),
          ...failure,
        });
        return {
          propertyPath:issue.instancePath,
          ...(match.templatePath.includes("*") ? { templatePath:match.templatePath } : {}),
          status:issue.severity === "warning" ? "warning" : "error",
          message:issue.message,
          expected:issue.expected,
          actual:issue.actual,
          rule:rule.name ?? rule.id,
          ruleVersion:rule.version,
          severity:issue.severity ?? "error",
          schemaName:schema.name,
          schemaVersion:schema.version,
          ...valueChoiceEvaluationEvidence(rule, schema, match.value),
        };
      });
    }
    const issues: ValidationIssue[] = [];
    attachedRuleIssues(value, schema, issues, [rule]);
    const propertyPath = rule.propertyPath ?? rule.parameters?.split(":", 1)[0]?.split(",", 1)[0]?.trim() ?? "";
    const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
    const present = Boolean(propertyPath && record && propertyPath in record);
    const actual = present ? String(record?.[propertyPath]) : "missing";
    const operator = rule.operator?.replaceAll("_", "-").toLowerCase() ?? "";
    if (!present && operator !== "required") return [{ propertyPath, status:"not-applicable" as const, message:rule.message ?? `${rule.name ?? rule.id} is not applicable because the optional target is absent`, expected:rule.parameters?.split(":", 2)[1] ?? "optional value rule", actual, rule:rule.name ?? rule.id, ruleVersion:rule.version, severity:rule.severity ?? "error", schemaName:schema.name, schemaVersion:schema.version, notApplicableReason:"target-absent", ...valueChoiceEvaluationEvidence(rule, schema, undefined) }];
    if (!issues.length) return [{ propertyPath, status:"pass" as const, message:rule.message ?? `${rule.name ?? rule.id} passed`, expected:rule.parameters?.split(":", 2)[1] ?? "rule satisfied", actual, rule:rule.name ?? rule.id, ruleVersion:rule.version, severity:rule.severity ?? "error", schemaName:schema.name, schemaVersion:schema.version }];
    return issues.map((issue) => ({ propertyPath:issue.instancePath, status:issue.severity === "warning" ? "warning" as const : "error" as const, message:issue.message, expected:issue.expected, actual:issue.actual, rule:rule.name ?? rule.id, ruleVersion:rule.version, severity:issue.severity ?? "error", schemaName:schema.name, schemaVersion:schema.version, ...valueChoiceEvaluationEvidence(rule, schema, record?.[propertyPath]) }));
  });
}

function validationEvaluations(value: unknown, schema: SchemaDefinition, schemas: readonly SchemaDefinition[]): ValidationEvaluation[] {
  const result = attachedRuleEvaluations(value, schema, schema.attachedRules ?? []);
  const disabled = new Set(Object.entries(schema.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([path]) => path));
  const visited = new Set<string>([schema.id]); let parentId = schema.parentSchemaId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId); const parent = schemas.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    result.push(...attachedRuleEvaluations(value, parent, (parent.attachedRules ?? []).filter((rule) => !rule.propertyPath || !disabled.has(rule.propertyPath))));
    parentId = parent.parentSchemaId;
  }
  return result;
}

function collectSchemaIssues(value: unknown, schema: SchemaDefinition, schemas: readonly SchemaDefinition[], result: ValidationIssue[]): void {
  const document = normalizeCanonicalSchemaDocument(inheritedDocument(schema, schemas));
  const undeclaredPropertyExceptions = new Set((schema.attachedRules ?? [])
    .filter((rule) => rule.enabled !== false && rule.operator?.replaceAll("_", "-").toLowerCase() === "allow-undeclared-properties" && rule.propertyPath)
    .map((rule) => canonicalAttachedRulePath(rule.propertyPath!)));
  issuesFor(value, document, "", "#", result, schema, document.additionalProperties === false, undeclaredPropertyExceptions);
  attachedRuleIssues(value, schema, result);
  inheritedAttachedRuleIssues(value, schema, schemas, result);
}

function validationStateForIssues(issues: readonly ValidationIssue[]): ValidationState {
  if (issues.length === 0) return "Valid";
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  const errors = issues.length - warnings;
  if (!errors) return `${warnings} warnings`;
  if (!warnings) return `${errors} issues`;
  return `${errors} ${errors === 1 ? "error" : "errors"} and ${warnings} ${warnings === 1 ? "warning" : "warnings"}`;
}

function inheritedDocument(schema: SchemaDefinition, schemas: readonly SchemaDefinition[], visited = new Set<string>()): JsonSchema {
  if (!schema.parentSchemaId || visited.has(schema.id)) return schema.document;
  visited.add(schema.id);
  const parent = schemas.find((candidate) => candidate.id === schema.parentSchemaId);
  if (!parent) return schema.document;
  const inherited = inheritedDocument(parent, schemas, visited);
  const disabled = new Set(Object.entries(schema.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([property]) => property));
  const inheritedProperties = Object.fromEntries(Object.entries(inherited.properties ?? {}).filter(([property]) => !disabled.has(property)));
  return {
    ...inherited,
    ...schema.document,
    required:[...new Set([...(inherited.required ?? []).filter((property) => !disabled.has(property)), ...(schema.document.required ?? [])])],
    properties:{ ...inheritedProperties, ...(schema.document.properties ?? {}) },
  };
}

function inheritedSchemaProvenance(schema: SchemaDefinition, schemas: readonly SchemaDefinition[]): Pick<SchemaDefinition, "id" | "name" | "version">[] {
  const parents: Pick<SchemaDefinition, "id" | "name" | "version">[] = [];
  const visited = new Set<string>([schema.id]); let parentId = schema.parentSchemaId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId); const parent = schemas.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    parents.push({ id:parent.id, name:parent.name, version:parent.version }); parentId = parent.parentSchemaId;
  }
  return parents;
}

function effectiveDocumentation(schema: SchemaDefinition, schemas: readonly SchemaDefinition[]): ResolvedSchemaDocumentation | undefined {
  const documentation = resolveEffectiveSchemaDocumentation(schema, schemas);
  return documentation.description || Object.keys(documentation.properties).length ? documentation : undefined;
}

export function validateEvent(event: ValidatableEvent, schemas: readonly SchemaDefinition[], pageUrl?: string): ValidationResult {
  const resolution = resolveSchemaAssignment(event, pageUrl, schemas);
  if (resolution.error) return { state:"Assignment error", issues:[], assignmentEvidence:resolution.evidence };
  if (!resolution.schema || !resolution.assignment) return { state:"Not checked", issues:[], assignmentEvidence:resolution.evidence };
  const value = resolution.assignment.target === "payload" ? event.payload : event.rawInput;
  const issues: ValidationIssue[] = [];
  collectSchemaIssues(value, resolution.schema, schemas, issues);
  const inheritedFrom = inheritedSchemaProvenance(resolution.schema, schemas);
  const documentation = effectiveDocumentation(resolution.schema, schemas);
  return { state:validationStateForIssues(issues), issues, evaluations:validationEvaluations(value, resolution.schema, schemas), schema:{ id:resolution.schema.id, name:resolution.schema.name, version:resolution.schema.version }, ...(documentation ? { documentation } : {}), target:resolution.assignment.target, assignment:resolution.assignment, assignmentEvidence:resolution.evidence, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validateWithSchema(event: ValidatableEvent, schema: SchemaDefinition, schemas: readonly SchemaDefinition[], target: ValidationTarget = schema.assignments[0]?.target ?? "payload"): ValidationResult {
  const value = target === "payload" ? event.payload : event.rawInput;
  const issues: ValidationIssue[] = [];
  collectSchemaIssues(value, schema, schemas, issues);
  const inheritedFrom = inheritedSchemaProvenance(schema, schemas);
  const documentation = effectiveDocumentation(schema, schemas);
  return { state: validationStateForIssues(issues), issues, evaluations:validationEvaluations(value, schema, schemas), schema:{ id:schema.id, name:schema.name, version:schema.version }, ...(documentation ? { documentation } : {}), target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validationSummary(results: readonly ValidationResult[]): { "Not checked": number; Valid: number; Warnings: number; Issues: number; "Assignment error": number } { return { "Not checked": results.filter((result) => result.state === "Not checked").length, Valid: results.filter((result) => result.state === "Valid").length, Warnings: results.filter((result) => result.state.endsWith("warnings") && !result.state.includes("error")).length, Issues: results.filter((result) => result.state.endsWith("issues") || result.state.includes("error") && result.state !== "Assignment error").length, "Assignment error": results.filter((result) => result.state === "Assignment error").length }; }
export function filterByValidation<T extends { validation: ValidationState }>(events: readonly T[], state: ValidationState): T[] { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event: ValidatableEvent, schemas: readonly SchemaDefinition[], version: number): ValidationResult {
  const revisions = [...new Map(schemas.flatMap((schema) => schemaRevision(schema, version) ?? [])
    .map((schema) => [`${schema.id}|${schema.version}`, schema] as const)).values()];
  return validateEvent(event, revisions);
}
