import { eventFeedQueryFields, eventFeedQueryOperators, eventFeedQuerySuggestions, } from "./data-layer-event-feed-query.js";
export const SAVED_EVENT_FEED_FILTER_STORAGE_KEY = "my-chrome-utilities.saved-event-feed-filters.v1";
export const SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY = "my-chrome-utilities.saved-event-feed-filter-working.v1";
function clone(value) { return structuredClone(value); }
function sorted(filters) {
    return [...filters].sort((left, right) => left.name.localeCompare(right.name));
}
function condition(id, candidate) {
    return { id, field: candidate.field, operator: candidate.operator, values: [...candidate.values] };
}
function storedConditions(id, query) {
    return query.conditions.map((candidate, index) => condition(`${id}:condition:${index + 1}`, candidate));
}
function filterById(library, id) {
    const filter = library.filters.find((candidate) => candidate.id === id);
    if (!filter)
        throw new Error("Saved filter was not found");
    return filter;
}
function replaceFilter(library, filter) {
    return { ...library, filters: sorted([...library.filters.filter(({ id }) => id !== filter.id), filter]) };
}
function semanticConditions(value) {
    return value.conditions.map(({ field, operator, values }) => [field, operator, [...values]]);
}
function validCondition(value) {
    if (!value || typeof value !== "object")
        return false;
    const candidate = value;
    return typeof candidate.id === "string" && typeof candidate.field === "string"
        && typeof candidate.operator === "string" && Array.isArray(candidate.values)
        && candidate.values.every((item) => typeof item === "string");
}
function validFilter(value) {
    if (!value || typeof value !== "object")
        return false;
    const candidate = value;
    return typeof candidate.id === "string" && typeof candidate.name === "string" && candidate.version === 1
        && candidate.match === "all" && candidate.valueMatch === "any" && Array.isArray(candidate.conditions)
        && candidate.conditions.every(validCondition);
}
export function restoreSavedEventFeedFilterLibrary(serialized) {
    if (!serialized)
        return { version: 1, filters: [] };
    try {
        const parsed = JSON.parse(serialized);
        if (parsed.version !== 1 || !Array.isArray(parsed.filters) || !parsed.filters.every(validFilter))
            return { version: 1, filters: [] };
        const filters = sorted(clone(parsed.filters));
        const defaultFilterId = filters.some(({ id }) => id === parsed.defaultFilterId) ? parsed.defaultFilterId : undefined;
        return { version: 1, filters, ...(defaultFilterId ? { defaultFilterId } : {}) };
    }
    catch {
        return { version: 1, filters: [] };
    }
}
export function serializeSavedEventFeedFilterLibrary(library) {
    return JSON.stringify(library);
}
export function restoreSavedEventFeedWorkingView(serialized, sessionId, library) {
    if (!serialized || !sessionId)
        return undefined;
    try {
        const parsed = JSON.parse(serialized);
        if (parsed.version !== 1 || parsed.sessionId !== sessionId || !parsed.query || !Array.isArray(parsed.query.conditions)
            || !parsed.query.conditions.every(validCondition))
            return undefined;
        const activeFilterId = library.filters.some(({ id }) => id === parsed.activeFilterId) ? parsed.activeFilterId : undefined;
        return {
            version: 1,
            sessionId,
            query: clone(parsed.query),
            ...(activeFilterId ? { activeFilterId } : {}),
        };
    }
    catch {
        return undefined;
    }
}
export function serializeSavedEventFeedWorkingView(sessionId, query, activeFilterId) {
    return JSON.stringify({ version: 1, sessionId, query, ...(activeFilterId ? { activeFilterId } : {}) });
}
export function savedEventFeedFilterNameResult(library, candidate, exceptId) {
    const name = candidate.trim();
    if (!name)
        return { accepted: false, assistance: "Enter a saved filter name" };
    if (library.filters.some((filter) => filter.id !== exceptId && filter.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        return { accepted: false, assistance: "A saved filter with this name exists" };
    }
    return { accepted: true, name, assistance: `Ready to save ${name}` };
}
export function createSavedEventFeedFilter(library, candidateName, query, id) {
    if (!query.conditions.length)
        throw new Error("Save current filter is unavailable");
    const result = savedEventFeedFilterNameResult(library, candidateName);
    if (!result.accepted)
        throw new Error(result.assistance);
    if (library.filters.some((filter) => filter.id === id))
        throw new Error("Saved filter identity already exists");
    const filter = { id, name: result.name, version: 1, match: "all", valueMatch: "any", conditions: storedConditions(id, query) };
    return { library: replaceFilter(library, filter), filter };
}
export function updateSavedEventFeedFilter(library, id, query) {
    const previous = filterById(library, id);
    const filter = { ...previous, conditions: storedConditions(id, query) };
    return { library: replaceFilter(library, filter), filter };
}
export function renameSavedEventFeedFilter(library, id, candidateName) {
    const previous = filterById(library, id);
    const result = savedEventFeedFilterNameResult(library, candidateName, id);
    if (!result.accepted)
        throw new Error(result.assistance);
    const filter = { ...previous, name: result.name };
    return { library: replaceFilter(library, filter), filter };
}
export function deleteSavedEventFeedFilter(library, id, workingQuery) {
    filterById(library, id);
    const { defaultFilterId: _default, ...withoutDefault } = library;
    return {
        library: { ...withoutDefault, filters: library.filters.filter((filter) => filter.id !== id), ...(library.defaultFilterId && library.defaultFilterId !== id ? { defaultFilterId: library.defaultFilterId } : {}) },
        workingQuery,
        activeFilterId: undefined,
    };
}
export function setDefaultSavedEventFeedFilter(library, id) {
    if (id)
        filterById(library, id);
    const { defaultFilterId: _previous, ...withoutDefault } = library;
    return { library: { ...withoutDefault, ...(id ? { defaultFilterId: id } : {}) } };
}
export function applySavedEventFeedFilter(_working, filter) {
    return { conditions: clone(filter.conditions) };
}
export function savedEventFeedFilterQueryEqual(filter, query) {
    return JSON.stringify(semanticConditions(filter)) === JSON.stringify(semanticConditions(query));
}
export function eventFeedFilterDisplayState(query, activeFilterId, library) {
    if (!query.conditions.length && !activeFilterId)
        return { label: "All events", save: "unavailable", modified: false };
    const active = library.filters.find(({ id }) => id === activeFilterId);
    if (!active)
        return { label: "Custom · Unsaved", save: query.conditions.length ? "create" : "unavailable", modified: false };
    const modified = !savedEventFeedFilterQueryEqual(active, query);
    return { label: `${active.name}${modified ? " · Modified" : ""}`, save: modified ? "update-or-copy" : "none", modified };
}
function supportedCondition(candidate) {
    const field = candidate.field;
    if (!eventFeedQueryFields().includes(field) && !field.startsWith("Payload · "))
        return false;
    return eventFeedQueryOperators(field).includes(candidate.operator);
}
export function inspectSavedEventFeedFilter(filter, events) {
    const conditions = filter.conditions.map((candidate) => {
        if (!supportedCondition(candidate))
            return { condition: candidate, status: "needs repair" };
        const suggestions = eventFeedQuerySuggestions(events, candidate.field);
        const observed = candidate.values.some((value) => suggestions.some((suggestion) => suggestion.toLocaleLowerCase() === value.toLocaleLowerCase()));
        return { condition: candidate, status: observed ? "observed" : "not observed" };
    });
    return { query: applySavedEventFeedFilter({ conditions: [] }, filter), ready: conditions.every(({ status }) => status !== "needs repair"), conditions };
}
export function commitSavedEventFeedFilterLibrary(current, proposed, write, failureFeedback) {
    try {
        write(serializeSavedEventFeedFilterLibrary(proposed));
        return { committed: true, library: proposed, feedback: "Saved filter storage updated" };
    }
    catch {
        return { committed: false, library: current, feedback: failureFeedback };
    }
}
//# sourceMappingURL=data-layer-saved-event-feed-filters.js.map