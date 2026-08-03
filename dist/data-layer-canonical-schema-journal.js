const clone = (value) => structuredClone(value);
const record = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const journalKeys = new Set(["changes", "commandJournal", "patchJournal", "editJournal", "editCountRevision"]);
export function journalFreeCanonicalData(value) {
    const visit = (candidate) => {
        if (Array.isArray(candidate))
            return candidate.map(visit);
        if (!record(candidate))
            return clone(candidate);
        const canonical = candidate.state === "Draft" && record(candidate.nodes) && Array.isArray(candidate.rootIds);
        return Object.fromEntries(Object.entries(candidate).flatMap(([key, entry]) => canonical && journalKeys.has(key) ? [] : [[key, visit(entry)]]));
    };
    return visit(value);
}
//# sourceMappingURL=data-layer-canonical-schema-journal.js.map