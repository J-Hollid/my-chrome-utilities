import { createSchemaWorkingDraft, publishSchemaWorkingDraft, updateSchemaWorkingDraft, } from "./data-layer-schema-verification.js";
function clone(value) { return structuredClone(value); }
function attachmentIndexes(schema, rule) {
    return (schema.attachedRules ?? []).flatMap((attachment, index) => attachment.id === rule.id && attachment.version < rule.version ? [index] : []);
}
export function reviewReusableRuleSync(schemas, rule) {
    const affected = schemas.flatMap((schema) => {
        const indexes = attachmentIndexes(schema, rule);
        return indexes.length ? [{ schema, indexes }] : [];
    });
    const blocked = affected.flatMap(({ schema }) => schema.workingDraft ? [{
            schemaId: schema.id,
            schemaName: schema.name,
            assistance: `Publish or discard the ${schema.name} draft first`,
        }] : []);
    const reviewedSchemas = affected.map(({ schema, indexes }) => ({
        schemaId: schema.id,
        schemaName: schema.name,
        currentVersion: schema.version,
        nextVersion: schema.version + 1,
        attachmentCount: indexes.length,
        attachmentIndexes: indexes,
    }));
    return {
        ruleId: rule.id,
        ruleVersion: rule.version,
        ready: blocked.length === 0 && reviewedSchemas.length > 0,
        schemaCount: reviewedSchemas.length,
        attachmentCount: reviewedSchemas.reduce((total, schema) => total + schema.attachmentCount, 0),
        schemas: reviewedSchemas,
        blocked,
    };
}
function syncedAttachment(previous, rule) {
    return {
        id: previous.id,
        version: rule.version,
        ...(rule.name !== undefined || previous.name !== undefined ? { name: rule.name ?? previous.name } : {}),
        ...(previous.propertyPath !== undefined ? { propertyPath: previous.propertyPath } : {}),
        ...(rule.operator !== undefined ? { operator: rule.operator } : {}),
        ...(rule.parameters !== undefined ? { parameters: rule.parameters } : {}),
        ...(rule.allowedValues !== undefined ? { allowedValues: clone(rule.allowedValues) } : {}),
        ...(rule.applicableType !== undefined ? { applicableType: rule.applicableType } : {}),
        ...(rule.severity !== undefined ? { severity: rule.severity } : {}),
        ...(rule.message !== undefined ? { message: rule.message } : {}),
        ...(rule.enabled !== undefined ? { enabled: rule.enabled } : {}),
        ...(rule.conditionGroup !== undefined ? { conditionGroup: clone(rule.conditionGroup) } : {}),
        ...(rule.comparison !== undefined ? { comparison: rule.comparison } : {}),
        ...(rule.limit !== undefined ? { limit: rule.limit } : {}),
    };
}
export function publishReusableRuleSync(schemas, rule, review = reviewReusableRuleSync(schemas, rule), options = {}) {
    if (review.ruleId !== rule.id || review.ruleVersion !== rule.version) {
        throw new Error("The reusable rule sync review is stale");
    }
    if (!review.ready) {
        throw new Error(review.blocked[0]?.assistance ?? "No pinned schema attachments require sync");
    }
    const byId = new Map(review.schemas.map((schema) => [schema.schemaId, schema]));
    const publish = options.publish ?? publishSchemaWorkingDraft;
    return schemas.map((schema) => {
        const reviewed = byId.get(schema.id);
        if (!reviewed)
            return clone(schema);
        if (schema.version !== reviewed.currentVersion || schema.workingDraft) {
            throw new Error(`The sync review for ${schema.name} is stale`);
        }
        const indexes = new Set(reviewed.attachmentIndexes);
        const attachedRules = (schema.attachedRules ?? []).map((attachment, index) => indexes.has(index) ? syncedAttachment(attachment, rule) : clone(attachment));
        const withDraft = createSchemaWorkingDraft(schema);
        const changed = updateSchemaWorkingDraft(withDraft, { attachedRules }, `Sync ${rule.name ?? rule.id} revision ${rule.version}`);
        return publish(changed);
    });
}
//# sourceMappingURL=data-layer-reusable-rule-sync.js.map