import { stableJson } from "./contract.js";
import { changeRecord, entityRecord } from "./records.js";
const normalized = (text) => text.trim().toLocaleLowerCase().replace(/[\s_-]+/gu, " ");
export const historyFor = (project) => project.agentHistory ?? { mappings: [], applied: [] };
export function sourceMappingKey(sourceKey, change) {
    return `${sourceKey}|${change.kind}|${normalized(change.name)}|${[...new Set(change.sources.map(source => source.sheet))].sort().join("|")}`;
}
function similarity(left, right) {
    const a = new Set(normalized(left).split(" ")), b = new Set(normalized(right).split(" "));
    return [...a].filter(value => b.has(value)).length / Math.max(1, new Set([...a, ...b]).size);
}
export function findDefinitionMatches(project, change, sourceKey = "") {
    const desired = changeRecord(change), mapping = sourceKey ? historyFor(project).mappings.find(item => item.key === sourceMappingKey(sourceKey, change)) : undefined;
    return project.collections[change.kind].flatMap(entity => {
        if (mapping?.targetId === entity.id)
            return [{ id: entity.id, name: entity.name, kind: "previous-import", explanation: "This source was mapped to this definition in an earlier import." }];
        const actual = entityRecord(entity, project);
        if (stableJson(actual) === stableJson(desired))
            return [{ id: entity.id, name: entity.name, kind: "exact", explanation: "The exported definition and proposed definition are equal." }];
        if (normalized(entity.name) === normalized(change.name) || (desired.eventName && desired.eventName === actual.eventName))
            return [{ id: entity.id, name: entity.name, kind: "name", explanation: "The name matches. Review the schema and trigger before reuse or update." }];
        if (similarity(entity.name, change.name) >= 0.5)
            return [{ id: entity.id, name: entity.name, kind: "similar", explanation: "Some name terms match. This is a candidate, not proof of equivalence." }];
        return [];
    }).sort((a, b) => ({ "previous-import": 0, exact: 1, name: 2, similar: 3 }[a.kind] - { "previous-import": 0, exact: 1, name: 2, similar: 3 }[b.kind]));
}
//# sourceMappingURL=matching.js.map