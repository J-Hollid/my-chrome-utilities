function templatePointer(pointer) {
    return pointer.replace(/\/\d+(?=\/|$)/g, "/*");
}
function samePointer(concrete, candidate) {
    return templatePointer(concrete) === templatePointer(candidate);
}
function valueConstraint(evaluation) {
    const operator = evaluation.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase();
    return (operator === "allowed-values" || operator === "exact-value")
        && Boolean(evaluation.allowedValues?.length)
        && evaluation.notApplicableReason !== "condition-not-satisfied";
}
function sameValue(left, right) {
    return Object.is(left, right);
}
export function resolveRequiredPropertySchemaChoices(input) {
    const { id, name, version } = input.assignedSchema;
    const constraints = input.evaluations
        .filter(valueConstraint)
        .filter((evaluation) => samePointer(input.issuePointer, evaluation.propertyPath));
    const values = constraints.length
        ? constraints.slice(1).reduce((common, evaluation) => common.filter((candidate) => evaluation.allowedValues.some((value) => sameValue(candidate, value))), [...constraints[0].allowedValues])
        : [];
    const uniqueValues = values.filter((value, index) => values.findIndex((candidate) => sameValue(candidate, value)) === index);
    const rules = constraints.map((evaluation) => ({
        id: evaluation.ruleId ?? evaluation.rule,
        name: evaluation.rule,
        version: evaluation.ruleVersion,
        schemaId: evaluation.schemaId ?? input.assignedSchema.id,
        schemaName: evaluation.schemaName,
        schemaVersion: evaluation.schemaVersion,
    })).filter((rule, index, all) => all.findIndex((candidate) => candidate.id === rule.id && candidate.version === rule.version && candidate.schemaId === rule.schemaId) === index);
    return {
        values: uniqueValues,
        provenance: { schema: { id, name, version }, rules },
        ...(constraints.length > 1 && uniqueValues.length === 0
            ? { conflict: `Effective value constraints conflict: ${rules.map(({ name }) => name).join(" and ")}.` }
            : {}),
    };
}
//# sourceMappingURL=data-layer-defect-schema-choices.js.map