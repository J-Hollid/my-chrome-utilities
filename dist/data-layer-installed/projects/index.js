export function createProjectsInstalledController(ports) {
    let mounted = false;
    let unsubscribe;
    let projects = ports.loadProjects().map((project) => ({ ...project }));
    let activeProjectId = ports.activeProjectId();
    let openingProjectId;
    let generation = 0;
    const refresh = () => {
        if (!mounted)
            return;
        projects = ports.loadProjects().map((project) => ({ ...project }));
        activeProjectId = ports.activeProjectId();
    };
    const projectLibraryUi = {
        render: refresh,
        library: () => ({ activeProjectId, projects: structuredClone(projects) }),
        activate: async (projectId) => { await ports.openProject(projectId); activeProjectId = projectId; },
    };
    function activeTransportProject() {
        return projects.find(({ id }) => id === projectLibraryUi.library().activeProjectId);
    }
    return {
        mount() { if (!mounted) {
            mounted = true;
            generation += 1;
            unsubscribe = ports.subscribe(refresh);
            refresh();
        } },
        dispose() { if (mounted) {
            mounted = false;
            generation += 1;
            openingProjectId = undefined;
            unsubscribe?.();
            unsubscribe = undefined;
        } },
        async open(id) {
            if (!projects.some((project) => project.id === id))
                throw new Error(`Unknown project ${id}`);
            const operation = generation;
            openingProjectId = id;
            try {
                await projectLibraryUi.activate(id);
                if (mounted && operation === generation)
                    activeProjectId = id;
            }
            finally {
                if (operation === generation)
                    openingProjectId = undefined;
            }
        },
        navigate: ports.navigateToProjectArea,
        activeTransportProject,
        state: () => ({ ...(activeProjectId ? { activeProjectId } : {}), ...(openingProjectId ? { openingProjectId } : {}),
            projectCount: projects.length, mounted }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "projects",
    capabilities: ["Project Library", "active project", "navigation", "coordination"],
});
//# sourceMappingURL=index.js.map