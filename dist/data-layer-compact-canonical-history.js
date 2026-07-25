const clone = (value) => structuredClone(value);
export const compactCanonicalPageHistory = () => ({ contributors: {} });
export const compactCanonicalHistorySettlement = (history = compactCanonicalPageHistory()) => ({ history: clone(history) });
export const compactCanonicalHistoryKey = (projectId, editorKey) => JSON.stringify([projectId, editorKey]);
const stack = (history, key) => history.contributors[key] ?? { undo: [], redo: [] };
const sameTransition = (pending, identity) => pending.operationId === identity.operationId && pending.projectId === identity.projectId && pending.editorKey === identity.editorKey;
const semanticDocument = (document) => { const { revision: _revision, changes: _changes, selectedPropertyId: _selectedPropertyId, view: _view, source, ...semantic } = document; return { ...semantic, ...(source ? { source: { ...source, revision: undefined } } : {}) }; };
const sameSemanticDocument = (left, right) => JSON.stringify(semanticDocument(left)) === JSON.stringify(semanticDocument(right));
export function beginCompactCanonicalHistoryTransition(settlement, transition) {
    if (settlement.pending)
        throw new Error(`Canonical history transition ${settlement.pending.operationId} is still awaiting a durable outcome.`);
    return { history: clone(settlement.history), pending: clone(transition) };
}
export function completeCompactCanonicalHistoryTransition(settlement, identity) {
    if (!settlement.pending || !sameTransition(settlement.pending, identity))
        return clone(settlement);
    return { history: clone(settlement.pending.history) };
}
export function rejectCompactCanonicalHistoryTransition(settlement, identity) {
    if (!settlement.pending || !sameTransition(settlement.pending, identity))
        return clone(settlement);
    return { history: clone(settlement.history) };
}
export function recordCompactCanonicalMutation(history, key, before, after) {
    const current = stack(history, key);
    return { contributors: { ...clone(history.contributors), [key]: { undo: [...clone(current.undo), { before: clone(before), after: clone(after) }], redo: [] } } };
}
export function prepareCompactCanonicalUndo(history, key, current, allowSemanticRevision = false) {
    const currentStack = stack(history, key), entry = currentStack.undo.at(-1);
    if (!entry)
        return { status: "empty", message: "No page-scoped canonical command is available to Undo." };
    if (current.revision !== entry.after.revision && (!allowSemanticRevision || !sameSemanticDocument(current, entry.after)))
        return { status: "blocked", message: `Undo blocked: this contributor is at Draft token ${current.revision}, but the page-scoped command expects Draft token ${entry.after.revision}. Review the newer contributor before changing it.` };
    const document = { ...clone(entry.before), revision: current.revision + 1 }, nextEntry = { before: clone(document), after: clone(entry.after) };
    return { status: "ready", document, history: { contributors: { ...clone(history.contributors), [key]: { undo: clone(currentStack.undo.slice(0, -1)), redo: [...clone(currentStack.redo), nextEntry] } } } };
}
export function prepareCompactCanonicalRedo(history, key, current, allowSemanticRevision = false) {
    const currentStack = stack(history, key), entry = currentStack.redo.at(-1);
    if (!entry)
        return { status: "empty", message: "No page-scoped canonical command is available to Redo." };
    if (current.revision !== entry.before.revision && (!allowSemanticRevision || !sameSemanticDocument(current, entry.before)))
        return { status: "blocked", message: `Redo blocked: this contributor is at Draft token ${current.revision}, but the page-scoped command expects Draft token ${entry.before.revision}. Review the newer contributor before changing it.` };
    const document = { ...clone(entry.after), revision: current.revision + 1 }, nextEntry = { before: clone(entry.before), after: clone(document) };
    return { status: "ready", document, history: { contributors: { ...clone(history.contributors), [key]: { undo: [...clone(currentStack.undo), nextEntry], redo: clone(currentStack.redo.slice(0, -1)) } } } };
}
//# sourceMappingURL=data-layer-compact-canonical-history.js.map