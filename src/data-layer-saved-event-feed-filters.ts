import {
  eventFeedQueryFields,
  eventFeedQueryOperators,
  eventFeedQuerySuggestions,
  type EventFeedQuery,
  type EventFeedQueryCondition,
  type EventFeedQueryField,
  type EventFeedQueryOperator,
  type EventFeedQueryableEvent,
} from "./data-layer-event-feed-query.js";

export const SAVED_EVENT_FEED_FILTER_STORAGE_KEY = "my-chrome-utilities.saved-event-feed-filters.v1";
export const SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY = "my-chrome-utilities.saved-event-feed-filter-working.v1";

export interface StoredEventFeedFilterCondition {
  id: string;
  field: string;
  operator: string;
  values: readonly string[];
}

export interface SavedEventFeedFilter {
  id: string;
  name: string;
  version: 1;
  match: "all";
  valueMatch: "any";
  conditions: readonly StoredEventFeedFilterCondition[];
}

export interface SavedEventFeedFilterLibrary {
  version: 1;
  filters: readonly SavedEventFeedFilter[];
  defaultFilterId?: string;
}

export interface SavedEventFeedWorkingView {
  version: 1;
  sessionId: string;
  query: EventFeedQuery;
  activeFilterId?: string;
}

function clone<T>(value: T): T { return structuredClone(value); }

function sorted(filters: readonly SavedEventFeedFilter[]): SavedEventFeedFilter[] {
  return [...filters].sort((left, right) => left.name.localeCompare(right.name));
}

function condition(id: string, candidate: Pick<StoredEventFeedFilterCondition, "field" | "operator" | "values">): StoredEventFeedFilterCondition {
  return { id, field:candidate.field, operator:candidate.operator, values:[...candidate.values] };
}

function storedConditions(id: string, query: EventFeedQuery): StoredEventFeedFilterCondition[] {
  return query.conditions.map((candidate, index) => condition(`${id}:condition:${index + 1}`, candidate));
}

function filterById(library: SavedEventFeedFilterLibrary, id: string): SavedEventFeedFilter {
  const filter = library.filters.find((candidate) => candidate.id === id);
  if (!filter) throw new Error("Saved filter was not found");
  return filter;
}

function replaceFilter(library: SavedEventFeedFilterLibrary, filter: SavedEventFeedFilter): SavedEventFeedFilterLibrary {
  return { ...library, filters:sorted([...library.filters.filter(({ id }) => id !== filter.id), filter]) };
}

function semanticConditions(value: SavedEventFeedFilter | EventFeedQuery): unknown {
  return value.conditions.map(({ field, operator, values }) => [field, operator, [...values]]);
}

function validCondition(value: unknown): value is StoredEventFeedFilterCondition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredEventFeedFilterCondition>;
  return typeof candidate.id === "string" && typeof candidate.field === "string"
    && typeof candidate.operator === "string" && Array.isArray(candidate.values)
    && candidate.values.every((item: unknown) => typeof item === "string");
}

function validFilter(value: unknown): value is SavedEventFeedFilter {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedEventFeedFilter>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && candidate.version === 1
    && candidate.match === "all" && candidate.valueMatch === "any" && Array.isArray(candidate.conditions)
    && candidate.conditions.every(validCondition);
}

export function restoreSavedEventFeedFilterLibrary(serialized: string | null): SavedEventFeedFilterLibrary {
  if (!serialized) return { version:1, filters:[] };
  try {
    const parsed = JSON.parse(serialized) as Partial<SavedEventFeedFilterLibrary>;
    if (parsed.version !== 1 || !Array.isArray(parsed.filters) || !parsed.filters.every(validFilter)) return { version:1, filters:[] };
    const filters = sorted(clone(parsed.filters));
    const defaultFilterId = filters.some(({ id }) => id === parsed.defaultFilterId) ? parsed.defaultFilterId : undefined;
    return { version:1, filters, ...(defaultFilterId ? { defaultFilterId } : {}) };
  } catch {
    return { version:1, filters:[] };
  }
}

export function serializeSavedEventFeedFilterLibrary(library: SavedEventFeedFilterLibrary): string {
  return JSON.stringify(library);
}

export function restoreSavedEventFeedWorkingView(
  serialized: string | null,
  sessionId: string | undefined,
  library: SavedEventFeedFilterLibrary,
): SavedEventFeedWorkingView | undefined {
  if (!serialized || !sessionId) return undefined;
  try {
    const parsed = JSON.parse(serialized) as Partial<SavedEventFeedWorkingView>;
    if (parsed.version !== 1 || parsed.sessionId !== sessionId || !parsed.query || !Array.isArray(parsed.query.conditions)
      || !parsed.query.conditions.every(validCondition)) return undefined;
    const activeFilterId = library.filters.some(({ id }) => id === parsed.activeFilterId) ? parsed.activeFilterId : undefined;
    return {
      version:1,
      sessionId,
      query:clone(parsed.query),
      ...(activeFilterId ? { activeFilterId } : {}),
    };
  } catch {
    return undefined;
  }
}

export function serializeSavedEventFeedWorkingView(
  sessionId: string,
  query: EventFeedQuery,
  activeFilterId?: string,
): string {
  return JSON.stringify({ version:1, sessionId, query, ...(activeFilterId ? { activeFilterId } : {}) });
}

export function savedEventFeedFilterNameResult(
  library: SavedEventFeedFilterLibrary,
  candidate: string,
  exceptId?: string,
): { accepted: false; assistance: string } | { accepted: true; name: string; assistance: string } {
  const name = candidate.trim();
  if (!name) return { accepted:false, assistance:"Enter a saved filter name" };
  if (library.filters.some((filter) => filter.id !== exceptId && filter.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    return { accepted:false, assistance:"A saved filter with this name exists" };
  }
  return { accepted:true, name, assistance:`Ready to save ${name}` };
}

export function createSavedEventFeedFilter(
  library: SavedEventFeedFilterLibrary,
  candidateName: string,
  query: EventFeedQuery,
  id: string,
): { library: SavedEventFeedFilterLibrary; filter: SavedEventFeedFilter } {
  if (!query.conditions.length) throw new Error("Save current filter is unavailable");
  const result = savedEventFeedFilterNameResult(library, candidateName);
  if (!result.accepted) throw new Error(result.assistance);
  if (library.filters.some((filter) => filter.id === id)) throw new Error("Saved filter identity already exists");
  const filter: SavedEventFeedFilter = { id, name:result.name, version:1, match:"all", valueMatch:"any", conditions:storedConditions(id, query) };
  return { library:replaceFilter(library, filter), filter };
}

export function updateSavedEventFeedFilter(
  library: SavedEventFeedFilterLibrary,
  id: string,
  query: EventFeedQuery,
): { library: SavedEventFeedFilterLibrary; filter: SavedEventFeedFilter } {
  const previous = filterById(library, id);
  const filter = { ...previous, conditions:storedConditions(id, query) };
  return { library:replaceFilter(library, filter), filter };
}

export function renameSavedEventFeedFilter(
  library: SavedEventFeedFilterLibrary,
  id: string,
  candidateName: string,
): { library: SavedEventFeedFilterLibrary; filter: SavedEventFeedFilter } {
  const previous = filterById(library, id);
  const result = savedEventFeedFilterNameResult(library, candidateName, id);
  if (!result.accepted) throw new Error(result.assistance);
  const filter = { ...previous, name:result.name };
  return { library:replaceFilter(library, filter), filter };
}

export function deleteSavedEventFeedFilter(
  library: SavedEventFeedFilterLibrary,
  id: string,
  workingQuery: EventFeedQuery,
): { library: SavedEventFeedFilterLibrary; workingQuery: EventFeedQuery; activeFilterId: undefined } {
  filterById(library, id);
  const { defaultFilterId: _default, ...withoutDefault } = library;
  return {
    library:{ ...withoutDefault, filters:library.filters.filter((filter) => filter.id !== id), ...(library.defaultFilterId && library.defaultFilterId !== id ? { defaultFilterId:library.defaultFilterId } : {}) },
    workingQuery,
    activeFilterId:undefined,
  };
}

export function setDefaultSavedEventFeedFilter(
  library: SavedEventFeedFilterLibrary,
  id: string | undefined,
): { library: SavedEventFeedFilterLibrary } {
  if (id) filterById(library, id);
  const { defaultFilterId: _previous, ...withoutDefault } = library;
  return { library:{ ...withoutDefault, ...(id ? { defaultFilterId:id } : {}) } };
}

export function applySavedEventFeedFilter(_working: EventFeedQuery, filter: SavedEventFeedFilter): EventFeedQuery {
  return { conditions:clone(filter.conditions) as EventFeedQueryCondition[] };
}

export function savedEventFeedFilterQueryEqual(filter: SavedEventFeedFilter, query: EventFeedQuery): boolean {
  return JSON.stringify(semanticConditions(filter)) === JSON.stringify(semanticConditions(query));
}

export function eventFeedFilterDisplayState(
  query: EventFeedQuery,
  activeFilterId: string | undefined,
  library: SavedEventFeedFilterLibrary,
): { label: string; save: "unavailable" | "create" | "none" | "update-or-copy"; modified: boolean } {
  if (!query.conditions.length && !activeFilterId) return { label:"All events", save:"unavailable", modified:false };
  const active = library.filters.find(({ id }) => id === activeFilterId);
  if (!active) return { label:"Custom · Unsaved", save:query.conditions.length ? "create" : "unavailable", modified:false };
  const modified = !savedEventFeedFilterQueryEqual(active, query);
  return { label:`${active.name}${modified ? " · Modified" : ""}`, save:modified ? "update-or-copy" : "none", modified };
}

function supportedCondition(candidate: StoredEventFeedFilterCondition): boolean {
  const field = candidate.field as EventFeedQueryField;
  if (!(eventFeedQueryFields() as string[]).includes(field) && !field.startsWith("Payload · ")) return false;
  return (eventFeedQueryOperators(field) as string[]).includes(candidate.operator as EventFeedQueryOperator);
}

export function inspectSavedEventFeedFilter(filter: SavedEventFeedFilter, events: readonly EventFeedQueryableEvent[]): {
  query: EventFeedQuery;
  ready: boolean;
  conditions: readonly { condition: StoredEventFeedFilterCondition; status: "observed" | "not observed" | "needs repair" }[];
} {
  const conditions = filter.conditions.map((candidate) => {
    if (!supportedCondition(candidate)) return { condition:candidate, status:"needs repair" as const };
    const suggestions = eventFeedQuerySuggestions(events, candidate.field as EventFeedQueryField);
    const observed = candidate.values.some((value) => suggestions.some((suggestion) => suggestion.toLocaleLowerCase() === value.toLocaleLowerCase()));
    return { condition:candidate, status:observed ? "observed" as const : "not observed" as const };
  });
  return { query:applySavedEventFeedFilter({ conditions:[] }, filter), ready:conditions.every(({ status }) => status !== "needs repair"), conditions };
}

export function commitSavedEventFeedFilterLibrary(
  current: SavedEventFeedFilterLibrary,
  proposed: SavedEventFeedFilterLibrary,
  write: (serialized: string) => void,
  failureFeedback: string,
): { committed: boolean; library: SavedEventFeedFilterLibrary; feedback: string } {
  try {
    write(serializeSavedEventFeedFilterLibrary(proposed));
    return { committed:true, library:proposed, feedback:"Saved filter storage updated" };
  } catch {
    return { committed:false, library:current, feedback:failureFeedback };
  }
}
