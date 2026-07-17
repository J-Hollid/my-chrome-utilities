import { createSchemaWorkingDraft, updateSchemaWorkingDraft, } from "./data-layer-schema-verification.js";
import { canonicalRulePropertyPath } from "./data-layer-schema-property-path.js";
function clone(value) { return structuredClone(value); }
function editableRules(schema) {
    return schema.workingDraft?.attachedRules ?? schema.attachedRules ?? [];
}
function validateEditedRule(rule) {
    const operator = rule.operator?.replaceAll("_", "-").toLowerCase();
    if (operator === "regular-expression") {
        try {
            new RegExp(rule.parameters ?? "");
        }
        catch {
            throw new Error("Correct the regular expression");
        }
    }
    if (operator === "allowed-values" && !(rule.allowedValues?.length || rule.parameters?.trim())) {
        throw new Error("Add at least one allowed value");
    }
}
export function inspectLocalRuleEdit(schema, propertyPath, ruleId, reusableRuleIds = new Set()) {
    if (reusableRuleIds.has(ruleId)) {
        throw new Error(`Open ${ruleId} in the reusable Rule Library`);
    }
    const canonicalPath = canonicalRulePropertyPath(propertyPath);
    const rules = editableRules(schema);
    const attachmentIndex = rules.findIndex((rule) => rule.id === ruleId
        && canonicalRulePropertyPath(rule.propertyPath ?? "") === canonicalPath);
    if (attachmentIndex < 0)
        throw new Error(`Rule ${ruleId} does not exist at ${canonicalPath}`);
    return { origin: "Local rule", canonicalPath, attachmentIndex, rule: clone(rules[attachmentIndex]) };
}
export function saveLocalRuleEdit(schema, edit) {
    const inspection = inspectLocalRuleEdit(schema, edit.propertyPath, edit.ruleId);
    validateEditedRule(edit.rule);
    if (edit.rule.id !== edit.ruleId)
        throw new Error("A local rule edit cannot change its stable identity");
    if (canonicalRulePropertyPath(edit.rule.propertyPath ?? inspection.canonicalPath) !== inspection.canonicalPath) {
        throw new Error("A local rule edit cannot change its canonical path");
    }
    const withDraft = schema.workingDraft ? clone(schema) : createSchemaWorkingDraft(schema);
    const draft = withDraft.workingDraft;
    const attachedRules = Array.from(clone(draft.attachedRules ?? withDraft.attachedRules ?? []));
    attachedRules[inspection.attachmentIndex] = {
        ...clone(edit.rule),
        id: inspection.rule.id,
        propertyPath: inspection.canonicalPath,
    };
    const name = edit.rule.name ?? inspection.rule.name ?? edit.ruleId;
    return updateSchemaWorkingDraft(withDraft, { attachedRules }, `Edit ${name} at ${inspection.canonicalPath}`);
}
//# sourceMappingURL=data-layer-local-rule-editing.js.map