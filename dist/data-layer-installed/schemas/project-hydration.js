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
//# sourceMappingURL=project-hydration.js.map