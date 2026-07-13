const compatibility = {
    "Required": ["string", "number", "array", "object", "boolean"],
    "Allowed values": ["string", "number", "boolean"],
    "Regular expression": ["string"],
    "Numeric range": ["number"],
    "Item count": ["array"],
};
const builtIns = Object.keys(compatibility).map((name) => ({
    id: `built-in:${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    kind: name,
    operator: name.toLowerCase(),
}));
export function ruleTypeAvailability(propertyType, ruleType) {
    return compatibility[ruleType].includes(propertyType) ? "available" : "unavailable";
}
export function builtInRulesForProperty(propertyType) {
    return builtIns
        .filter(({ name }) => ruleTypeAvailability(propertyType, name) === "available")
        .map((rule) => ({ ...rule, applicableType: propertyType }));
}
function applicableTypes(rule) {
    if (rule.applicableType)
        return [rule.applicableType];
    const metadata = `${rule.kind} ${rule.operator ?? ""}`.toLowerCase();
    if (metadata.includes("string"))
        return ["string"];
    if (metadata.includes("number"))
        return ["number"];
    if (metadata.includes("array"))
        return ["array"];
    if (metadata.includes("object"))
        return ["object"];
    if (metadata.includes("boolean"))
        return ["boolean"];
    const ruleType = Object.keys(compatibility)
        .find((candidate) => metadata.includes(candidate.toLowerCase()));
    return ruleType ? compatibility[ruleType] : [];
}
export function reusableRulesForProperty(rules, propertyType, query, attachedIds) {
    const normalized = query.trim().toLowerCase();
    return rules
        .filter((rule) => rule.enabled !== false && applicableTypes(rule).includes(propertyType))
        .filter((rule) => !normalized || [rule.name, rule.kind, rule.operator, rule.parameters, rule.description, ...applicableTypes(rule), `version ${rule.version ?? 1}`]
        .filter(Boolean).join(" ").toLowerCase().includes(normalized))
        .map((rule) => ({ ...rule, alreadyAttached: attachedIds.has(rule.id) }));
}
//# sourceMappingURL=data-layer-schema-property-rule-picker.js.map