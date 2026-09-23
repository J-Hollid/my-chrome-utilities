export const COMPLETE_CONFIGURATION_DOMAINS = [
    "projects",
    "savedSchemas",
    "reusableRules",
    "eventLibraries",
    "savedSessions",
    "defects",
    "documentationTemplates",
    "portablePreferences",
    "hotkeys",
];
export function configurationRecordKey(record) {
    if (!record.domain)
        throw new Error("A configuration conflict must name its domain.");
    return `${record.domain}/${record.id}`;
}
export function assertCompleteDomainInventory(sections) {
    const actual = Object.keys(sections).sort();
    const expected = [...COMPLETE_CONFIGURATION_DOMAINS].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new DOMException("The complete configuration domain inventory is incomplete or unknown.", "DataError");
    }
    for (const domain of COMPLETE_CONFIGURATION_DOMAINS) {
        const records = sections[domain];
        if (!Array.isArray(records) || records.some((record) => typeof record?.id !== "string" || !record.id)) {
            throw new DOMException(`The ${domain} configuration section is invalid.`, "DataError");
        }
        if (new Set(records.map(({ id }) => id)).size !== records.length) {
            throw new DOMException(`The ${domain} configuration section has duplicate identities.`, "DataError");
        }
    }
}
//# sourceMappingURL=domain-inventory.js.map