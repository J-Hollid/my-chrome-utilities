export function createProjectHydrationSlot() {
    let currentProjectId;
    let current;
    return { run(projectId, hydrate) {
            if (current && currentProjectId === projectId)
                return current;
            let resolve, reject;
            const operation = new Promise((accept, decline) => { resolve = accept; reject = decline; });
            current = operation;
            currentProjectId = projectId;
            const clear = () => {
                if (current === operation) {
                    current = undefined;
                    currentProjectId = undefined;
                }
            };
            try {
                void hydrate().then(() => { clear(); resolve(); }, (error) => { clear(); reject(error); });
            }
            catch (error) {
                clear();
                reject(error);
            }
            return operation;
        }, reset() { current = undefined; currentProjectId = undefined; } };
}
/** Owns project identity and stale-result control for schema contributor hydration. */
export class SchemaProjectHydrationCoordinator {
    #ports;
    #slot = createProjectHydrationSlot();
    #hydratedProjectId;
    constructor(ports) { this.#ports = ports; }
    needs(projectId) { return this.#hydratedProjectId !== projectId; }
    hydrate(projectId) {
        const ports = this.#ports, operation = ports.generation();
        if (ports.result)
            ports.result.textContent = "Loading active project schema contributors from durable storage…";
        return this.#slot.run(projectId, () => ports.ensure(projectId)
            .then(({ name }) => {
            if (!ports.isMounted() || operation !== ports.generation() || ports.activeProjectId() !== projectId)
                return;
            this.#hydratedProjectId = projectId;
            ports.invalidate();
            ports.render();
            if (ports.result)
                ports.result.textContent = `Loaded schema contributors for ${name}.`;
        })
            .catch((error) => {
            if (ports.isMounted() && operation === ports.generation() && ports.activeProjectId() === projectId && ports.result) {
                ports.result.textContent = `Schema contributors are unavailable. ${error instanceof Error ? error.message : String(error)}`;
            }
        }));
    }
    hydrateActive() {
        const projectId = this.#ports.activeProjectId();
        return projectId ? this.hydrate(projectId) : undefined;
    }
    reset() { this.#hydratedProjectId = undefined; this.#slot.reset(); }
}
//# sourceMappingURL=project-hydration.js.map