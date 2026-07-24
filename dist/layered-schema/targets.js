const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const matches = (predicate, observation) => predicate.operator === "equals" ? same(observation[predicate.field], predicate.value) : new RegExp(String(predicate.value)).test(String(observation[predicate.field] ?? ""));
export function resolveLayeredTarget(targets, observation, options = {}) {
    if (options.manualTargetId) {
        const winner = targets.find(({ id, activation }) => id === options.manualTargetId && activation === "manual");
        return { ...(winner ? { selectionMode: "manual", winner } : {}), candidates: winner ? [{ id: winner.id, name: winner.name, matched: true, priority: winner.priority, reasons: [] }] : [], ties: [] };
    }
    const eligible = targets.filter(({ activation }) => activation === "automatic"), candidates = eligible.map((target) => { const reasons = target.applicability.filter((predicate) => !matches(predicate, observation)).map(({ name }) => `${name} did not match`); return { id: target.id, name: target.name, matched: reasons.length === 0, priority: target.priority, reasons }; }), matched = candidates.filter((candidate) => candidate.matched).sort((left, right) => right.priority - left.priority), highest = matched[0]?.priority, ties = matched.filter(({ priority }) => priority === highest).map(({ id }) => id), winner = ties.length === 1 ? eligible.find(({ id }) => id === ties[0]) : undefined;
    return { ...(winner ? { selectionMode: "automatic", winner } : {}), candidates, ties };
}
//# sourceMappingURL=targets.js.map