import { transactProject } from "../data-layer-specification-project.js";
export function normalizeObservationPath(value) {
    const path = value.trim().replace(/^window\./u, "");
    const parts = path.split(".");
    if (!parts.every(part => /^[A-Za-z_$][\w$]*$/u.test(part) &&
        !["__proto__", "prototype", "constructor"].includes(part))) {
        throw new Error("Enter a valid array path");
    }
    return path;
}
export function projectObservationSources(project) {
    if (!project)
        return [];
    const settings = project.eventTransport;
    if (settings?.observationSources)
        return structuredClone([...settings.observationSources]);
    return [{ id: "event-history", name: "History array",
            path: settings?.observationHistoryPath ?? "queue.history", enabled: true }];
}
export function validateObservationSources(sources) {
    const paths = new Set(), ids = new Set();
    return sources.map(source => {
        const name = source.name.trim(), path = normalizeObservationPath(source.path);
        if (!name)
            throw new Error("Enter a source name");
        if (!source.id || ids.has(source.id))
            throw new Error("Observation source identity must be unique");
        if (paths.has(path))
            throw new Error("Observation path already added");
        paths.add(path);
        ids.add(source.id);
        return { ...source, name, path };
    });
}
export function configureObservationSources(state, sources) {
    const observationSources = validateObservationSources(sources);
    return transactProject(state, "Save observation sources", project => ({
        ...project, eventTransport: {
            observationHistoryPath: project.eventTransport?.observationHistoryPath ?? "queue.history",
            defaultPushPath: project.eventTransport?.defaultPushPath ?? "dataLayer",
            observationSources,
        },
    }));
}
export function saveObservationSource(state, source) {
    const sources = projectObservationSources(state.project), index = sources.findIndex(({ id }) => id === source.id);
    if (index === -1)
        sources.push(source);
    else
        sources[index] = source;
    return configureObservationSources(state, sources);
}
export function removeObservationSource(state, sourceId) {
    const sources = projectObservationSources(state.project);
    if (!sources.some(({ id }) => id === sourceId))
        throw new Error("Observation source no longer exists");
    return configureObservationSources(state, sources.filter(({ id }) => id !== sourceId));
}
//# sourceMappingURL=settings.js.map