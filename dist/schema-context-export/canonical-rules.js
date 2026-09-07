import { canonicalPropertyPath } from "../data-layer-canonical-schema.js";
import { assertionAt, literalPattern, pointerParts, predicateSchema } from "./predicates.js";
import { assertConditionReferences, assertRuleValidity } from "./canonical-errors.js";
function valueAssertion(rule, node) {
    switch (rule.kind) {
        case "value": return { const: structuredClone(rule.expectedValue) };
        case "allowed-values": return { enum: structuredClone(rule.allowedValues ?? []) };
        case "pattern":
            if (rule.pattern !== undefined) {
                new RegExp(rule.pattern);
                return { pattern: rule.pattern };
            }
            return undefined;
        case "starts-with": return { pattern: `^${literalPattern(rule.literal)}` };
        case "ends-with": return { pattern: `${literalPattern(rule.literal)}$` };
        case "includes": return node.type === "array" ? { contains: { const: rule.expectedValue ?? rule.literal } } : { pattern: literalPattern(rule.literal) };
        case "range": return { ...(rule.minimum !== undefined ? { minimum: rule.minimum } : {}), ...(rule.maximum !== undefined ? { maximum: rule.maximum } : {}) };
        case "cardinality": {
            const suffix = node.type === "string" ? "Length" : "Items";
            return { ...(rule.minItems !== undefined ? { [`min${suffix}`]: rule.minItems } : {}), ...(rule.maxItems !== undefined ? { [`max${suffix}`]: rule.maxItems } : {}) };
        }
        default: return undefined;
    }
}
export function appendCanonicalRules(root, document, review) {
    for (const node of Object.values(document.nodes)) {
        const path = canonicalPropertyPath(document, node.id), parts = pointerParts(path);
        const rules = [...(node.presence.mode !== "optional" ? [{ id: `presence:${node.id}`, kind: "presence", presence: node.presence.mode, ...(node.presence.condition ? { condition: node.presence.condition } : {}), severity: "error" }] : []), ...node.rules];
        for (const rule of rules) {
            if (rule.enabled === false)
                continue;
            if (rule.kind === "reusable" && !rule.reusableOutcome)
                throw new Error(`${path}: repair the missing reusable rule reference.`);
            const active = rule.kind === "reusable" ? { ...rule, ...rule.reusableOutcome } : rule;
            assertConditionReferences(document, active.condition);
            assertRuleValidity(active, path);
            let assertion;
            const arrayIndex = parts.lastIndexOf("*"), base = parts.slice(0, arrayIndex + 1), relative = parts.slice(base.length);
            if (active.arrayScope?.boundaries.some(boundary => boundary.mode === "position")) {
                review.omitted.push({ ruleId: rule.id, ruleName: rule.name ?? rule.kind, propertyPath: path, behavior: "position-specific array rule" });
                continue;
            }
            if (active.kind === "presence") {
                if (active.presence?.startsWith("required"))
                    assertion = assertionAt(relative.slice(0, -1), { required: [relative.at(-1)] });
                else if (active.presence?.startsWith("forbidden"))
                    assertion = { not: assertionAt(relative, {}, true) };
                else if (active.presence === "optional")
                    continue;
            }
            else {
                const value = valueAssertion(active, node);
                if (value)
                    assertion = assertionAt(relative, value);
            }
            if (!assertion) {
                review.omitted.push({ ruleId: rule.id, ruleName: rule.name ?? rule.kind, propertyPath: path, behavior: rule.operator ?? rule.kind });
                continue;
            }
            if (active.condition) {
                try {
                    assertion = { if: predicateSchema(document, active.condition, base), then: assertion };
                }
                catch (error) {
                    if (error instanceof Error && error.message.includes("cross-array")) {
                        review.omitted.push({ ruleId: rule.id, ruleName: rule.name ?? rule.kind, propertyPath: path, behavior: "condition across array boundaries" });
                        continue;
                    }
                    throw error;
                }
            }
            const allOf = (root.allOf ??= []);
            allOf.push(assertionAt(base, assertion));
            if (rule.severity === "warning" || rule.message)
                review.conversions.push({ ruleId: rule.id, propertyPath: path, conversion: `${rule.name ?? rule.kind}: warning severity and custom issue message become a standard pass or fail assertion` });
        }
    }
}
//# sourceMappingURL=canonical-rules.js.map