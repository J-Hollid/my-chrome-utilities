export function createProjectsInstalledController(ports) {
    let mounted = false;
    let unsubscribe;
    let projects = ports.loadProjects().map((project) => ({ ...project }));
    let activeProjectId = ports.activeProjectId();
    const refresh = () => { projects = ports.loadProjects().map((project) => ({ ...project })); activeProjectId = ports.activeProjectId(); };
    return {
        mount() { if (!mounted) {
            mounted = true;
            unsubscribe = ports.subscribe(refresh);
            refresh();
        } },
        dispose() { if (mounted) {
            mounted = false;
            unsubscribe?.();
            unsubscribe = undefined;
        } },
        async open(id) {
            if (!projects.some((project) => project.id === id))
                throw new Error(`Unknown project ${id}`);
            await ports.openProject(id);
            activeProjectId = id;
        },
        navigate: ports.navigateToProjectArea,
        state: () => ({ ...(activeProjectId ? { activeProjectId } : {}), projectCount: projects.length }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "projects",
    capabilities: ["Project Library", "active project", "navigation", "coordination"],
});
//# sourceMappingURL=index.js.map