import {
  saveCompletedSession,
  type CompletedSession,
  type SavedSession,
  type SavedSessionEvent,
  type SavedSessionLibrary,
} from "./data-layer-saved-sessions.js";
import {
  recordLiveEvent,
  type LiveEvent,
  type LiveObserverState,
} from "./data-layer-live-observer.js";
import type { ValidationState } from "./utilities/data-layer/capture.js";

export const SAVED_SESSION_LIBRARY_STORAGE_KEY = "my-chrome-utilities.saved-session-library.v1";
export const SAVED_SESSION_LIVE_FEED_STORAGE_KEY = "my-chrome-utilities.saved-session-live-feed.v1";

export interface SessionSaveDraft {
  completed: CompletedSession;
  summary: {
    pageScope: string;
    eventCount: number;
    sourceCount: number;
    validationSummary: string;
  };
}
export interface SavedSessionValidationResult {
  state: ValidationState;
  schema?: { name: string; version: number };
}

export interface SavedSessionValidationComparison {
  revisions: readonly number[];
  results: readonly {
    eventId: string;
    original: SavedSessionValidationResult;
    current: SavedSessionValidationResult;
  }[];
}

export interface SavedSessionLiveFeed {
  mode: "Saved session";
  readOnly: true;
  startLiveObserver: false;
  session: SavedSession;
  currentView: LiveObserverState;
  savedView: LiveObserverState;
  currentScrollTop: number;
  savedScrollTop: number;
  backgroundEventCount: number;
  comparison?: SavedSessionValidationComparison;
}

interface SerializedSavedSessionLiveFeed {
  version: 1;
  sessionId: string;
  currentView: LiveObserverState;
  savedView: LiveObserverState;
  currentScrollTop: number;
  savedScrollTop: number;
  backgroundEventCount: number;
  comparison?: SavedSessionValidationComparison;
}

function clone<T>(value: T): T { return structuredClone(value); }

function validationSummary(events: readonly SavedSessionEvent[]): string {
  const checked = events.filter(({ validation }) => validation && validation !== "Not checked");
  if (!checked.length) return "Not checked";
  const valid = checked.filter(({ validation }) => validation === "Valid").length;
  if (valid === checked.length) return `${valid} valid`;
  return `${valid} valid, ${checked.length - valid} with issues`;
}

export function createSessionSaveDraft(completed: CompletedSession): SessionSaveDraft {
  const snapshot = clone(completed);
  return {
    completed:snapshot,
    summary:{
      pageScope:snapshot.pageScope,
      eventCount:snapshot.events.length,
      sourceCount:new Set(snapshot.events.map(({ sourceId }) => sourceId)).size,
      validationSummary:validationSummary(snapshot.events),
    },
  };
}

export function confirmSessionSave(
  library: SavedSessionLibrary,
  draft: SessionSaveDraft,
  name: string,
): SavedSessionLibrary {
  const normalized = name.trim();
  if (!normalized) throw new Error("Saved session name must be non-blank.");
  return saveCompletedSession(library, draft.completed, normalized);
}

export function unsavedEventCount(
  draft: SessionSaveDraft,
  currentEvents: readonly SavedSessionEvent[],
): number {
  return Math.max(0, currentEvents.length - draft.completed.events.length);
}

function captureTime(event: SavedSessionEvent, session: SavedSession): string {
  if (event.captureTime) return event.captureTime;
  const base = Date.parse(session.startedAt);
  return Number.isFinite(base)
    ? new Date(base + Math.max(0, (event.captureOrder ?? 1) - 1)).toISOString()
    : session.startedAt;
}

function liveEvent(event: SavedSessionEvent, session: SavedSession): LiveEvent {
  return {
    id:event.id,
    name:event.name,
    sourceId:event.sourceId,
    sourceName:event.sourceName,
    captureTime:captureTime(event, session),
    pageUrl:event.pageUrl ?? session.pageScope,
    payload:clone(event.payload),
    rawInput:clone(event.rawInput),
    ...(event.sourceKind ? { sourceKind:event.sourceKind } : {}),
    ...(event.destination ? { destination:event.destination } : {}),
    ...(event.validation ? { validation:event.validation } : {}),
    ...(event.validationDetails ? { validationDetails:clone(event.validationDetails) } : {}),
    ...(event.provenance === undefined ? {} : { provenance:typeof event.provenance === "string" ? event.provenance : JSON.stringify(event.provenance) }),
  };
}

function savedObserverView(session: SavedSession): LiveObserverState {
  const sourceNames = new Map(session.events.map((event) => [event.sourceId, event.sourceName]));
  return {
    view:"Live",
    status:"Paused",
    pageUrl:session.pageScope,
    sources:[...sourceNames].map(([id, name]) => ({ id, name, status:"Saved session" })),
    events:session.events.map((event) => liveEvent(event, session)),
    listVisible:true,
  };
}

export function openSavedSessionLiveFeed(
  currentView: LiveObserverState,
  session: SavedSession,
  options: { scrollTop?: number } = {},
): SavedSessionLiveFeed {
  const archivedSession = clone(session);
  return {
    mode:"Saved session",
    readOnly:true,
    startLiveObserver:false,
    session:archivedSession,
    currentView:clone(currentView),
    savedView:savedObserverView(archivedSession),
    currentScrollTop:Math.max(0, options.scrollTop ?? 0),
    savedScrollTop:0,
    backgroundEventCount:0,
  };
}

function restoreSavedObserverView(
  session: SavedSession,
  persisted: LiveObserverState,
): LiveObserverState {
  const archived = savedObserverView(session);
  const inspectorEventId = persisted.inspectorEventId;
  return {
    ...archived,
    ...(persisted.query ? { query:clone(persisted.query) } : {}),
    ...(inspectorEventId && archived.events.some(({ id }) => id === inspectorEventId)
      ? { inspectorEventId }
      : {}),
    ...(typeof persisted.listVisible === "boolean"
      ? { listVisible:persisted.listVisible }
      : {}),
  };
}

export function updateSavedSessionLiveFeedView(
  feed: SavedSessionLiveFeed,
  update: {
    query?: LiveObserverState["query"];
    inspectorEventId?: string;
    listVisible?: boolean;
    scrollTop?: number;
  },
): SavedSessionLiveFeed {
  const { inspectorEventId: _previousInspector, ...savedView } = feed.savedView;
  return {
    ...feed,
    savedView:{
      ...savedView,
      ...(update.query ? { query:clone(update.query) } : {}),
      ...(update.inspectorEventId ? { inspectorEventId:update.inspectorEventId } : {}),
      ...(update.listVisible === undefined ? {} : { listVisible:update.listVisible }),
    },
    savedScrollTop:Math.max(0, update.scrollTop ?? feed.savedScrollTop),
  };
}

export function recordBackgroundLiveEvent(
  feed: SavedSessionLiveFeed,
  event: LiveEvent,
): SavedSessionLiveFeed {
  const currentView = recordLiveEvent(feed.currentView, event);
  const added = currentView.events.length - feed.currentView.events.length;
  return {
    ...feed,
    currentView,
    backgroundEventCount:feed.backgroundEventCount + Math.max(0, added),
  };
}

export function returnToCurrentLiveFeed(feed: SavedSessionLiveFeed): {
  state: LiveObserverState;
  scrollTop: number;
  newEventCount: number;
} {
  return { state:clone(feed.currentView), scrollTop:feed.currentScrollTop, newEventCount:feed.backgroundEventCount };
}

export function revalidateSavedSessionLiveFeed(
  feed: SavedSessionLiveFeed,
  evaluate: (event: LiveEvent) => SavedSessionValidationResult,
): SavedSessionLiveFeed {
  const results = feed.savedView.events.map((event) => {
    const original = feed.session.events.find(({ id }) => id === event.id);
    return {
      eventId:event.id,
      original:{
        state:original?.validation ?? "Not checked" as ValidationState,
        ...(original?.validationDetails?.schema ? { schema:{ name:original.validationDetails.schema.name, version:original.validationDetails.schema.version } } : {}),
      },
      current:clone(evaluate(clone(event))),
    };
  });
  const revisions = [...new Set(results.flatMap(({ original, current }) => [original.schema?.version, current.schema?.version].filter((version): version is number => version !== undefined)))].sort((left, right) => left - right);
  return { ...feed, comparison:{ revisions, results } };
}

export function serializeSavedSessionLiveFeed(feed: SavedSessionLiveFeed): string {
  const value: SerializedSavedSessionLiveFeed = {
    version:1,
    sessionId:feed.session.id,
    currentView:clone(feed.currentView),
    savedView:clone(feed.savedView),
    currentScrollTop:feed.currentScrollTop,
    savedScrollTop:feed.savedScrollTop,
    backgroundEventCount:feed.backgroundEventCount,
    ...(feed.comparison ? { comparison:clone(feed.comparison) } : {}),
  };
  return JSON.stringify(value);
}

export function restoreSavedSessionLiveFeed(
  serialized: string | null,
  library: SavedSessionLibrary,
): SavedSessionLiveFeed | undefined {
  if (!serialized) return undefined;
  try {
    const parsed = JSON.parse(serialized) as Partial<SerializedSavedSessionLiveFeed>;
    const session = library.sessions.find(({ id }) => id === parsed.sessionId);
    if (parsed.version !== 1 || !session || !parsed.currentView || !parsed.savedView) return undefined;
    const archivedSession = clone(session);
    return {
      mode:"Saved session",
      readOnly:true,
      startLiveObserver:false,
      session:archivedSession,
      currentView:clone(parsed.currentView),
      savedView:restoreSavedObserverView(archivedSession, parsed.savedView),
      currentScrollTop:Math.max(0, parsed.currentScrollTop ?? 0),
      savedScrollTop:Math.max(0, parsed.savedScrollTop ?? 0),
      backgroundEventCount:Math.max(0, parsed.backgroundEventCount ?? 0),
      ...(parsed.comparison ? { comparison:clone(parsed.comparison) } : {}),
    };
  } catch {
    return undefined;
  }
}
