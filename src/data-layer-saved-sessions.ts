export interface SavedSessionEvent {
  id: string;
  sourceId: string;
  sourceName: string;
  name: string;
  payload: unknown;
  rawInput: unknown;
  pageUrl?: string;
  captureOrder?: number;
  provenance?: unknown;
  captureTime?: string;
  sourceKind?: string;
  destination?: string;
  validation?: import("./data-layer-source.js").ValidationState;
  validationDetails?: import("./data-layer-live-observer.js").LiveEvent["validationDetails"];
}

export interface CompletedSession {
  id: string;
  pageScope: string;
  startedAt: string;
  endedAt: string;
  events: readonly SavedSessionEvent[];
  provenance?: unknown;
}

export interface SavedSession extends CompletedSession {
  name: string;
  immutable: true;
}

export interface SavedSessionLibrary {
  sessions: readonly SavedSession[];
  deletionConfirmation?: SavedSession;
}

export interface ArchivedSession {
  mode: "Archived";
  session: SavedSession;
  startLiveObserver: false;
}

export interface ResumedCapture {
  activeSession: { id: string; parentSavedSessionId: string; pageUrl: string; events: readonly SavedSessionEvent[] };
}

export interface SavedSessionSummary {
  captureDate: string;
  pageScope: string;
  duration: string;
  sourceCount: number;
  eventCount: number;
  validationSummary: string;
}

function clone<T>(value: T): T { return structuredClone(value); }

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child, seen);
  }
  return value;
}

function immutableClone<T>(value: T): T { return deepFreeze(clone(value)); }

export function createSavedSessionLibrary(): SavedSessionLibrary { return { sessions: [] }; }

export function saveCompletedSession(
  library: SavedSessionLibrary,
  completed: CompletedSession,
  name: string,
): SavedSessionLibrary {
  const session: SavedSession = immutableClone({
    ...completed,
    id: `saved:${completed.id}`,
    name,
    immutable: true,
  });
  return { ...library, sessions: [...library.sessions, session] };
}

export function openSavedSession(library: SavedSessionLibrary, id: string): ArchivedSession {
  const session = library.sessions.find((candidate) => candidate.id === id);
  if (!session) throw new Error(`Unknown saved session: ${id}`);
  return { mode: "Archived", session: immutableClone(session), startLiveObserver: false };
}

export function resumeSavedSession(archived: ArchivedSession, pageUrl: string): ResumedCapture {
  return { activeSession: { id: `resume:${archived.session.id}`, parentSavedSessionId: archived.session.id, pageUrl, events: [] } };
}

export function exportSavedSession(session: SavedSession): string { return JSON.stringify(session); }

function isSavedSession(value: unknown): value is SavedSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<SavedSession>;
  return typeof session.id === "string"
    && typeof session.name === "string"
    && typeof session.pageScope === "string"
    && typeof session.startedAt === "string"
    && typeof session.endedAt === "string"
    && Array.isArray(session.events);
}

export function importSavedSession(library: SavedSessionLibrary, serialized: string): SavedSessionLibrary {
  const parsed: unknown = JSON.parse(serialized);
  if (!isSavedSession(parsed)) throw new Error("Invalid saved session export.");
  const session: SavedSession = immutableClone({ ...parsed, immutable: true });
  return { ...library, sessions: [...library.sessions.filter(({ id }) => id !== session.id), session] };
}

export function serializeSavedSessionLibrary(library: SavedSessionLibrary): string {
  return JSON.stringify({ sessions:library.sessions });
}

export function restoreSavedSessionLibrary(serialized: string | null): SavedSessionLibrary {
  if (!serialized) return createSavedSessionLibrary();
  try {
    const parsed = JSON.parse(serialized) as { sessions?: unknown };
    if (!Array.isArray(parsed.sessions) || !parsed.sessions.every(isSavedSession)) return createSavedSessionLibrary();
    return { sessions:parsed.sessions.map((session) => immutableClone({ ...session, immutable:true })) };
  } catch {
    return createSavedSessionLibrary();
  }
}

export function searchSavedSessions(library: SavedSessionLibrary, query: string): SavedSession[] {
  const needle = query.trim().toLowerCase();
  return library.sessions.filter((session) => {
    const text = [session.name, session.pageScope, ...session.events.flatMap((event) => [event.sourceName, event.name])].join(" ").toLowerCase();
    return text.includes(needle);
  });
}

export function renameSavedSession(
  library: SavedSessionLibrary,
  id: string,
  name: string,
): SavedSessionLibrary {
  return {
    ...library,
    sessions: library.sessions.map((session) => session.id === id
      ? immutableClone({ ...session, name })
      : session),
  };
}

export function savedSessionSummary(session: SavedSession): SavedSessionSummary {
  const durationSeconds = Math.max(0, Math.round(
    (Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 1000,
  ));
  return {
    captureDate: session.startedAt.slice(0, 10),
    pageScope: session.pageScope,
    duration: `${durationSeconds}s`,
    sourceCount: new Set(session.events.map((event) => event.sourceId)).size,
    eventCount: session.events.length,
    validationSummary: "Not checked",
  };
}

export function requestSavedSessionDeletion(library: SavedSessionLibrary, id: string): SavedSessionLibrary {
  const deletionConfirmation = library.sessions.find((session) => session.id === id);
  return deletionConfirmation ? { ...library, deletionConfirmation } : library;
}

export function cancelSavedSessionDeletion(library: SavedSessionLibrary): SavedSessionLibrary {
  const { deletionConfirmation: _confirmation, ...withoutConfirmation } = library;
  return withoutConfirmation;
}

export function confirmSavedSessionDeletion(library: SavedSessionLibrary): SavedSessionLibrary {
  const confirmation = library.deletionConfirmation;
  const { deletionConfirmation: _ignored, ...withoutConfirmation } = library;
  return confirmation
    ? { ...withoutConfirmation, sessions: library.sessions.filter(({ id }) => id !== confirmation.id) }
    : withoutConfirmation;
}
