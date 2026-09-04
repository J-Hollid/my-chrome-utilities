import { createRuleConfiguration, type RuleConfiguration } from "../../utilities/data-layer/schemas.js";
import { defineSchemaProperty, schemaDocumentPaths, schemaPropertyAt, schemaPropertyType,
  storedPromotionRules } from "./schema-model.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import type { SchemaPropertyController } from "./property-controller.js";
import type { SchemaRuleController } from "./rule-controller.js";
import type { ReusableSchemaRule } from "./contracts.js";

export interface SchemaAuthoringPublicPorts {
  property:SchemaPropertyController;
  rule:SchemaRuleController;
  canonical:SchemaCanonicalEditorController;
  renderRulePicker():void;
}

/** Projects property, rule, and assignment authoring operations. */
export function createSchemaAuthoringPublicOperations<T extends object>(ports:SchemaAuthoringPublicPorts, operations:T) {
  const rule=ports.rule;
  return { ...operations,
    schemaDocumentPaths, schemaPropertyAt, defineSchemaProperty, schemaPropertyType,
    configureRule:(ruleType:RuleConfiguration["ruleType"]) => { if (!rule.configuration) return false;
      rule.configuration=createRuleConfiguration(ruleType,rule.configuration.propertyType); ports.renderRulePicker(); return true; },
    compactPropertyAction:(propertyId:string,action:Parameters<SchemaCanonicalEditorController["propertyAction"]>[1],value?:string) =>
      ports.canonical.propertyAction(propertyId,action,value),
    requestRuleRevision:(id:string,changes:Partial<Omit<ReusableSchemaRule,"id"|"version"|"revisionHistory">>) => rule.requestRevision(id,changes),
    requestRuleUpgrade:(id:string,schemaIds:readonly string[]) => rule.requestUpgrade(id,schemaIds),
    requestRuleSync:(id:string) => rule.requestSync(id), confirmRuleSync:() => rule.confirmSync(),
    requestRuleDeletion:(id:string) => rule.requestDeletion(id), editReusableRule:(id:string) => rule.edit(id),
    rulePickerState:() => ({ path:rule.pickerPath,renderSequence:ports.property.renderSequence,
      ...(rule.configuration ? {configuration:structuredClone(rule.configuration)} : {}) }),
    rules:():readonly ReusableSchemaRule[] => structuredClone(rule.rules),
    ruleState:() => ({ editingReusableSchemaRuleId:rule.editingReusableId,
      approvedRuleRevisionId:rule.approvedRevisionId,approvedRuleAttachmentUpdateId:rule.approvedAttachmentUpdateId,
      pendingRuleSnapshotMetadata:rule.pendingSnapshot ? structuredClone(rule.pendingSnapshot) : undefined }),
    storePromotionRules:storedPromotionRules,
  };
}
