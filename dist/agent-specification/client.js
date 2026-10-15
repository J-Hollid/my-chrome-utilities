export function companionEndpoint(input) {
    const url = new URL(input.trim());
    if (url.username || url.password || url.search || url.hash)
        throw new Error("Use an endpoint URL without credentials, query, or fragment.");
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
        throw new Error("Use HTTP for localhost or HTTPS for a remote companion.");
    return url.href.replace(/\/$/u, "");
}
export class CompanionClient {
    token;
    endpoint;
    constructor(endpoint, token) {
        this.token = token;
        this.endpoint = companionEndpoint(endpoint);
    }
    async request(path, body) {
        const response = await fetch(this.endpoint + path, { method: body === undefined ? "GET" : "POST",
            headers: { Authorization: `Bearer ${this.token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(120000), credentials: "omit", redirect: "error" });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: `Companion returned HTTP ${response.status}` }));
            throw new Error(error.error);
        }
        return response.json();
    }
    health() { return this.request("/v1/health"); }
    inspect(files) { return this.request("/v1/inspect", { files }); }
    create(request) { return this.request("/v1/tasks", request); }
    task(id) { return this.request(`/v1/tasks/${encodeURIComponent(id)}`); }
    stop(id) { return this.request(`/v1/tasks/${encodeURIComponent(id)}/stop`, {}); }
    revise(review, revision, feedback, context) { return this.request(`/v1/tasks/${encodeURIComponent(review.taskId)}/revise`, { review, revision, feedback, context }); }
    sources(id) { return this.request(`/v1/tasks/${encodeURIComponent(id)}/sources`); }
    template(id, plan, context) { return this.request(`/v1/tasks/${encodeURIComponent(id)}/template`, { plan, ...(context ? { context } : {}) }); }
    async artifact(id, artifactId) {
        const response = await fetch(`${this.endpoint}/v1/tasks/${encodeURIComponent(id)}/artifacts/${encodeURIComponent(artifactId)}`, { headers: { Authorization: `Bearer ${this.token}` }, credentials: "omit", redirect: "error", signal: AbortSignal.timeout(30000) });
        if (!response.ok)
            throw new Error("The workbook artifact is unavailable.");
        return response.blob();
    }
}
export async function requestCompanionPermission(endpoint) {
    if (typeof chrome === "undefined" || !chrome.permissions)
        return;
    const url = new URL(companionEndpoint(endpoint)), origins = [`${url.protocol}//${url.hostname}/*`];
    if (!await chrome.permissions.request({ origins }))
        throw new Error("Allow access to this companion address to connect.");
}
//# sourceMappingURL=client.js.map