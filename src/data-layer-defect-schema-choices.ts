import type { ValidationEvaluation } from "./data-layer-validation-model.js";

export type SchemaChoiceValue = string | number | boolean | null;

export interface SchemaChoiceRuleProvenance {
  id: string;
  name: string;
  version: number;
  schemaId: string;
  schemaName: string;
  schemaVersion: number;
}

export interface SchemaChoiceProvenance {
  schema: { id:string; name:string; version:number };
  rules: SchemaChoiceRuleProvenance[];
}

export interface RequiredPropertySchemaChoices {
  values: SchemaChoiceValue[];
  provenance: SchemaChoiceProvenance;
  conflict?: string;
}

function templatePointer(pointer: string): string {
  return pointer.replace(/\/\d+(?=\/|$)/g, "/*");
}

function samePointer(concrete: string, candidate: string): boolean {
  return templatePointer(concrete) === templatePointer(candidate);
}

function valueConstraint(evaluation: ValidationEvaluation): evaluation is ValidationEvaluation & { allowedValues:readonly SchemaChoiceValue[] } {
  const operator = evaluation.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase();
  return (operator === "allowed-values" || operator === "exact-value")
    && Boolean(evaluation.allowedValues?.length)
    && evaluation.notApplicableReason !== "condition-not-satisfied";
}

function sameValue(left: SchemaChoiceValue, right: SchemaChoiceValue): boolean {
  return Object.is(left, right);
}

export function resolveRequiredPropertySchemaChoices(input: {
  issuePointer:string;
  evaluations:readonly ValidationEvaluation[];
  assignedSchema:{ id:string; name:string; version:number };
}): RequiredPropertySchemaChoices {
  const { id, name, version } = input.assignedSchema;
  const constraints = input.evaluations
    .filter(valueConstraint)
    .filter((evaluation) => samePointer(input.issuePointer, evaluation.propertyPath));
  const values = constraints.length
    ? constraints.slice(1).reduce<SchemaChoiceValue[]>((common, evaluation) =>
      common.filter((candidate) => evaluation.allowedValues.some((value) => sameValue(candidate, value))),
    [...constraints[0]!.allowedValues])
    : [];
  const uniqueValues = values.filter((value, index) => values.findIndex((candidate) => sameValue(candidate, value)) === index);
  const rules = constraints.map((evaluation): SchemaChoiceRuleProvenance => ({
    id:evaluation.ruleId ?? evaluation.rule,
    name:evaluation.rule,
    version:evaluation.ruleVersion,
    schemaId:evaluation.schemaId ?? input.assignedSchema.id,
    schemaName:evaluation.schemaName,
    schemaVersion:evaluation.schemaVersion,
  })).filter((rule, index, all) => all.findIndex((candidate) =>
    candidate.id === rule.id && candidate.version === rule.version && candidate.schemaId === rule.schemaId) === index);
  return {
    values:uniqueValues,
    provenance:{ schema:{ id, name, version }, rules },
    ...(constraints.length > 1 && uniqueValues.length === 0
      ? { conflict:`Effective value constraints conflict: ${rules.map(({ name }) => name).join(" and ")}.` }
      : {}),
  };
}
