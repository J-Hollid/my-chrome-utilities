import { createRuleConfiguration } from "../../utilities/data-layer/schemas.js";
import { defineSchemaProperty, schemaDocumentPaths, schemaPropertyAt, schemaPropertyType, storedPromotionRules } from "./schema-model.js";
/** Projects property, rule, and assignment authoring operations. */
export function createSchemaAuthoringPublicOperations(ports, operations) {
    const rule = ports.rule;
    return { ...operations,
        schemaDocumentPaths, schemaPropertyAt, defineSchemaProperty, schemaPropertyType,
        configureRule: (ruleType) => {
            if (!rule.configuration)
                return false;
            rule.configuration = createRuleConfiguration(ruleType, rule.configuration.propertyType);
            ports.renderRulePicker();
            return true;
        },
        compactPropertyAction: (propertyId, action, value) => ports.canonical.propertyAction(propertyId, action, value),
        requestRuleRevision: (id, changes) => rule.requestRevision(id, changes),
        requestRuleUpgrade: (id, schemaIds) => rule.requestUpgrade(id, schemaIds),
        requestRuleSync: (id) => rule.requestSync(id), confirmRuleSync: () => rule.confirmSync(),
        requestRuleDeletion: (id) => rule.requestDeletion(id), editReusableRule: (id) => rule.edit(id),
        rulePickerState: () => ({ path: rule.pickerPath, renderSequence: ports.property.renderSequence,
            ...(rule.configuration ? { configuration: structuredClone(rule.configuration) } : {}) }),
        rules: () => structuredClone(rule.rules),
        ruleState: () => ({ editingReusableSchemaRuleId: rule.editingReusableId,
            approvedRuleRevisionId: rule.approvedRevisionId, approvedRuleAttachmentUpdateId: rule.approvedAttachmentUpdateId,
            pendingRuleSnapshotMetadata: rule.pendingSnapshot ? structuredClone(rule.pendingSnapshot) : undefined }),
        storePromotionRules: storedPromotionRules, };
}
//# sourceMappingURL=authoring-public-operations.js.map