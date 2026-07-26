import { transactProject, } from "./data-layer-specification-project.js";
export const defaultProjectEventTransport = {
    observationHistoryPath: "queue.history",
    defaultPushPath: "dataLayer",
};
const clone = (value) => structuredClone(value);
const unsafeSegments = new Set(["__proto__", "prototype", "constructor"]);
function pathSegments(path) {
    const segments = path.trim().split(".");
    return segments.length && segments.every((segment) => segment && !unsafeSegments.has(segment))
        ? segments
        : [];
}
function valueAtPath(root, path) {
    const segments = pathSegments(path);
    if (!segments.length)
        return undefined;
    let value = root;
    for (const segment of segments) {
        if (!value || typeof value !== "object" || !Object.hasOwn(value, segment))
            return undefined;
        value = value[segment];
    }
    return value;
}
export function projectEventTransport(project) {
    return clone(project.eventTransport ?? defaultProjectEventTransport);
}
export function configureProjectEventTransport(state, settings) {
    const eventTransport = {
        observationHistoryPath: settings.observationHistoryPath.trim(),
        defaultPushPath: settings.defaultPushPath.trim(),
    };
    return transactProject(state, "Save project event transport settings", (project) => ({
        ...project,
        eventTransport,
    }));
}
export function seedLibraryDestination(project) {
    return project ? projectEventTransport(project).defaultPushPath : "";
}
export function observeProjectHistory(project, page) {
    if (!project)
        return { status: "Waiting for observation path", entries: [] };
    const path = projectEventTransport(project).observationHistoryPath;
    const value = valueAtPath(page, path);
    return Array.isArray(value)
        ? { status: "Observation ready", entries: clone(value) }
        : { status: "Waiting for observation path", entries: [] };
}
export function pushProjectEvent(project, page, eventName, payload, destination = project ? projectEventTransport(project).defaultPushPath : "") {
    if (!destination)
        return { status: "Open a project or enter a Destination", destination, pushed: false };
    const target = valueAtPath(page, destination);
    if (!target || typeof target.push !== "function") {
        return { status: "Push path is not push-capable", destination, pushed: false };
    }
    target.push([eventName, clone(payload)]);
    return { status: `Pushed to ${destination}`, destination, pushed: true };
}
//# sourceMappingURL=data-layer-project-event-transport.js.map