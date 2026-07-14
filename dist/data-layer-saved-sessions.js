function clone(value) { return structuredClone(value); }
function deepFreeze(value, seen = new WeakSet()) {
    if (value && typeof value === "object" && !seen.has(value)) {
        seen.add(value);
        Object.freeze(value);
        for (const child of Object.values(value))
            deepFreeze(child, seen);
    }
    return value;
}
function immutableClone(value) { return deepFreeze(clone(value)); }
export function createSavedSessionLibrary() { return { sessions: [] }; }
export function saveCompletedSession(library, completed, name) {
    const session = immutableClone({
        ...completed,
        id: `saved:${completed.id}`,
        name,
        immutable: true,
    });
    return { ...library, sessions: [...library.sessions, session] };
}
export function openSavedSession(library, id) {
    const session = library.sessions.find((candidate) => candidate.id === id);
    if (!session)
        throw new Error(`Unknown saved session: ${id}`);
    return { mode: "Archived", session: immutableClone(session), startLiveObserver: false };
}
export function resumeSavedSession(archived, pageUrl) {
    return { activeSession: { id: `resume:${archived.session.id}`, parentSavedSessionId: archived.session.id, pageUrl, events: [] } };
}
export function exportSavedSession(session) { return JSON.stringify(session); }
function isSavedSession(value) {
    if (!value || typeof value !== "object")
        return false;
    const session = value;
    return typeof session.id === "string"
        && typeof session.name === "string"
        && typeof session.pageScope === "string"
        && typeof session.startedAt === "string"
        && typeof session.endedAt === "string"
        && Array.isArray(session.events);
}
export function importSavedSession(library, serialized) {
    const parsed = JSON.parse(serialized);
    if (!isSavedSession(parsed))
        throw new Error("Invalid saved session export.");
    const session = immutableClone({ ...parsed, immutable: true });
    return { ...library, sessions: [...library.sessions.filter(({ id }) => id !== session.id), session] };
}
export function serializeSavedSessionLibrary(library) {
    return JSON.stringify({ sessions: library.sessions });
}
export function restoreSavedSessionLibrary(serialized) {
    if (!serialized)
        return createSavedSessionLibrary();
    try {
        const parsed = JSON.parse(serialized);
        if (!Array.isArray(parsed.sessions) || !parsed.sessions.every(isSavedSession))
            return createSavedSessionLibrary();
        return { sessions: parsed.sessions.map((session) => immutableClone({ ...session, immutable: true })) };
    }
    catch {
        return createSavedSessionLibrary();
    }
}
export function searchSavedSessions(library, query) {
    const needle = query.trim().toLowerCase();
    return library.sessions.filter((session) => {
        const text = [session.name, session.pageScope, ...session.events.flatMap((event) => [event.sourceName, event.name])].join(" ").toLowerCase();
        return text.includes(needle);
    });
}
export function renameSavedSession(library, id, name) {
    return {
        ...library,
        sessions: library.sessions.map((session) => session.id === id
            ? immutableClone({ ...session, name })
            : session),
    };
}
export function savedSessionSummary(session) {
    const durationSeconds = Math.max(0, Math.round((Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 1000));
    return {
        captureDate: session.startedAt.slice(0, 10),
        pageScope: session.pageScope,
        duration: `${durationSeconds}s`,
        sourceCount: new Set(session.events.map((event) => event.sourceId)).size,
        eventCount: session.events.length,
        validationSummary: "Not checked",
    };
}
export function requestSavedSessionDeletion(library, id) {
    const deletionConfirmation = library.sessions.find((session) => session.id === id);
    return deletionConfirmation ? { ...library, deletionConfirmation } : library;
}
export function cancelSavedSessionDeletion(library) {
    const { deletionConfirmation: _confirmation, ...withoutConfirmation } = library;
    return withoutConfirmation;
}
export function confirmSavedSessionDeletion(library) {
    const confirmation = library.deletionConfirmation;
    const { deletionConfirmation: _ignored, ...withoutConfirmation } = library;
    return confirmation
        ? { ...withoutConfirmation, sessions: library.sessions.filter(({ id }) => id !== confirmation.id) }
        : withoutConfirmation;
}
//# sourceMappingURL=data-layer-saved-sessions.js.map