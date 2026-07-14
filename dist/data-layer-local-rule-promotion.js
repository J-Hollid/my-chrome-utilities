import { createSchemaWorkingDraft } from "./data-layer-schema-verification.js";
function clone(value) { return structuredClone(value); }
function normalizePath(path) {
    const segments = path.trim().split("/").filter(Boolean);
    return `/${segments.join("/")}`;
}
function normalizedName(name) {
    return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
function normalizedOperator(operator) {
    return operator?.trim().replaceAll("_", "-").replaceAll(" ", "-").toLocaleLowerCase() ?? "";
}
function configuredRule(rule) {
    return {
        id: rule.id,
        ...(rule.name !== undefined ? { name: rule.name } : {}),
        version: rule.version,
        ...(rule.operator !== undefined ? { operator: rule.operator } : {}),
        ...(rule.parameters !== undefined ? { parameters: rule.parameters } : {}),
        ...(rule.allowedValues !== undefined ? { allowedValues: clone(rule.allowedValues) } : {}),
        ...(rule.applicableType !== undefined ? { applicableType: rule.applicableType } : {}),
        ...(rule.severity !== undefined ? { severity: rule.severity } : {}),
        ...(rule.message !== undefined ? { message: rule.message } : {}),
        ...(rule.conditionGroup !== undefined ? { conditionGroup: clone(rule.conditionGroup) } : {}),
        ...(rule.enabled !== undefined ? { enabled: rule.enabled } : {}),
    };
}
function semanticConfiguration(rule) {
    return {
        operator: normalizedOperator(rule.operator),
        parameters: rule.parameters ?? null,
        allowedValues: rule.allowedValues === undefined ? null : clone(rule.allowedValues),
        applicableType: rule.applicableType?.toLocaleLowerCase() ?? null,
        severity: rule.severity ?? null,
        message: rule.message ?? null,
        conditionGroup: rule.conditionGroup === undefined ? null : clone(rule.conditionGroup),
        enabled: rule.enabled !== false,
    };
}
function semanticallyEquivalent(left, right) {
    return JSON.stringify(semanticConfiguration(left)) === JSON.stringify(semanticConfiguration(right));
}
function sourceRule(input) {
    if (input.editorContext === "read-only")
        return undefined;
    const path = normalizePath(input.propertyPath);
    const matchingRule = (rules) => rules?.find((rule) => rule.id === input.sourceRuleId && normalizePath(rule.propertyPath ?? "") === path);
    const draftRule = matchingRule(input.schema.workingDraft?.attachedRules);
    if (draftRule)
        return { rule: draftRule, origin: "working-draft" };
    if (input.schema.workingDraft)
        return undefined;
    const currentRule = matchingRule(input.schema.attachedRules);
    if (!currentRule)
        return undefined;
    return {
        rule: currentRule,
        origin: input.editorContext === "new-schema" ? "new-schema" : "current-revision",
    };
}
export function localRulePromotionAvailability(input) {
    const source = sourceRule(input);
    if (!source)
        return { available: false, reason: "The local rule is no longer attached at this property path" };
    if (input.reusableRules.some(({ id }) => id === source.rule.id))
        return { available: false, reason: "The attachment already refers to a reusable rule" };
    return { available: true };
}
export function reviewLocalRulePromotion(input) {
    const availability = localRulePromotionAvailability(input);
    if (!availability.available)
        throw new Error(availability.reason);
    const source = sourceRule(input);
    const rule = source.rule;
    return {
        source: {
            schema: { id: input.schema.id, name: input.schema.name, version: input.schema.version },
            propertyPath: normalizePath(input.propertyPath),
            rule: configuredRule(rule),
            ...(source.origin === "current-revision" ? { createsWorkingDraft: true } : {}),
        },
        equivalentRules: input.reusableRules.filter((candidate) => semanticallyEquivalent(rule, candidate)).map(clone),
        reusableRules: input.reusableRules.map(clone),
    };
}
export function validateLocalRulePromotion(review, selection) {
    if (selection.action === "use-existing") {
        const candidate = review.equivalentRules.find(({ id }) => id === selection.reusableRuleId);
        return candidate
            ? { ready: true, assistance: `Use equivalent reusable rule revision ${candidate.version}`, duplicateDefinitionWarning: false }
            : { ready: false, assistance: "Select a semantically equivalent reusable rule" };
    }
    const name = selection.name.trim();
    if (!name)
        return { ready: false, assistance: "Enter a reusable rule name" };
    const sameName = review.reusableRules.find((candidate) => normalizedName(candidate.name) === normalizedName(name));
    if (sameName && !semanticallyEquivalent(review.source.rule, sameName)) {
        return { ready: false, assistance: "Open or use the existing differently defined rule" };
    }
    return {
        ready: true,
        assistance: "Review and confirm promotion",
        duplicateDefinitionWarning: review.equivalentRules.length > 0,
    };
}
function kindForOperator(operator) {
    const normalized = normalizedOperator(operator);
    const labels = {
        "allowed-values": "Allowed values",
        "numeric-range": "Numeric range",
        "regular-expression": "Regular expression",
        required: "Required",
    };
    return labels[normalized] ?? (normalized ? normalized.split("-").map((word, index) => index ? word : `${word[0]?.toLocaleUpperCase() ?? ""}${word.slice(1)}`).join(" ") : "Validation");
}
function reusableConfiguration(rule) {
    return {
        ...(rule.operator !== undefined ? { operator: rule.operator } : {}),
        ...(rule.parameters !== undefined ? { parameters: rule.parameters } : {}),
        ...(rule.allowedValues !== undefined ? { allowedValues: clone(rule.allowedValues) } : {}),
        ...(rule.applicableType !== undefined ? { applicableType: rule.applicableType } : {}),
        ...(rule.severity !== undefined ? { severity: rule.severity } : {}),
        ...(rule.message !== undefined ? { message: rule.message } : {}),
        ...(rule.conditionGroup !== undefined ? { conditionGroup: clone(rule.conditionGroup) } : {}),
        ...(rule.enabled !== undefined ? { enabled: rule.enabled } : {}),
    };
}
export function promoteLocalRule(input) {
    const review = reviewLocalRulePromotion(input);
    const validation = validateLocalRulePromotion(review, input);
    if (!validation.ready)
        throw new Error(validation.assistance);
    const source = review.source.rule;
    const reusableRules = input.reusableRules.map(clone);
    let destination;
    if (input.action === "use-existing") {
        destination = clone(review.equivalentRules.find(({ id }) => id === input.reusableRuleId));
    }
    else {
        const id = input.createId?.() ?? `reusable-${crypto.randomUUID()}`;
        destination = {
            id,
            name: input.name.trim(),
            kind: kindForOperator(source.operator),
            version: 1,
            ...reusableConfiguration(source),
            ...(input.description?.trim() ? { description: input.description.trim() } : {}),
            ...(input.examples?.trim() ? { examples: input.examples.trim() } : {}),
            attachments: input.editorContext === "new-schema" ? [] : [input.schema.id],
            revisionHistory: [],
        };
        reusableRules.push(destination);
    }
    const resolved = sourceRule(input);
    const editableSchema = resolved.origin === "current-revision"
        ? createSchemaWorkingDraft(input.schema)
        : clone(input.schema);
    const workingDraft = editableSchema.workingDraft ? clone(editableSchema.workingDraft) : undefined;
    const sourceAttachments = workingDraft?.attachedRules ?? editableSchema.attachedRules ?? [];
    let replaced = false;
    const attachedRules = sourceAttachments.map((candidate) => {
        if (candidate.id !== input.sourceRuleId || normalizePath(candidate.propertyPath ?? "") !== review.source.propertyPath)
            return clone(candidate);
        replaced = true;
        return { ...clone(candidate), id: destination.id, name: destination.name, version: destination.version };
    });
    if (!replaced)
        throw new Error("The local rule is no longer attached at this property path.");
    const pendingChange = `Promote local rule ${source.id} to reusable rule ${destination.id}`;
    if (!workingDraft) {
        return {
            schema: { ...editableSchema, attachedRules },
            reusableRules,
            changed: true,
            replacementRuleId: destination.id,
        };
    }
    return {
        schema: {
            ...editableSchema,
            workingDraft: { ...workingDraft, attachedRules, pendingChanges: [...workingDraft.pendingChanges, pendingChange] },
        },
        reusableRules,
        changed: true,
        replacementRuleId: destination.id,
    };
}
function restoreStoredValue(storage, key, value) {
    if (value === null)
        storage.removeItem(key);
    else
        storage.setItem(key, value);
}
export function persistLocalRulePromotion(storage, values) {
    const previousSchema = storage.getItem(values.schemaKey);
    const previousRules = storage.getItem(values.ruleKey);
    try {
        storage.setItem(values.ruleKey, values.ruleValue);
        storage.setItem(values.schemaKey, values.schemaValue);
    }
    catch (error) {
        try {
            restoreStoredValue(storage, values.ruleKey, previousRules);
        }
        catch { /* Preserve the original persistence error. */ }
        try {
            restoreStoredValue(storage, values.schemaKey, previousSchema);
        }
        catch { /* Preserve the original persistence error. */ }
        throw error;
    }
}
//# sourceMappingURL=data-layer-local-rule-promotion.js.map