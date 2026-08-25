export interface ProjectsInstalledPorts {
  activeProjectId(): string | undefined;
  loadProjects(): readonly Readonly<{ id: string; name: string }>[];
  subscribe(listener: () => void): () => void;
  openProject(id: string): Promise<void>;
  navigateToProjectArea(area: string): void;
}

export function createProjectsInstalledController(ports: ProjectsInstalledPorts) {
  let mounted = false;
  let unsubscribe: (() => void) | undefined;
  let projects = ports.loadProjects().map((project) => ({ ...project }));
  let activeProjectId = ports.activeProjectId();
  let openingProjectId: string | undefined;
  let generation = 0;
  const refresh = (): void => {
    if (!mounted) return;
    projects = ports.loadProjects().map((project) => ({ ...project })); activeProjectId = ports.activeProjectId();
  };
  return {
    mount(): void { if (!mounted) { mounted = true; generation += 1; unsubscribe = ports.subscribe(refresh); refresh(); } },
    dispose(): void { if (mounted) { mounted = false; generation += 1; openingProjectId = undefined; unsubscribe?.(); unsubscribe = undefined; } },
    async open(id: string): Promise<void> {
      if (!projects.some((project) => project.id === id)) throw new Error(`Unknown project ${id}`);
      const operation = generation; openingProjectId = id;
      try { await ports.openProject(id); if (mounted && operation === generation) activeProjectId = id; }
      finally { if (operation === generation) openingProjectId = undefined; }
    },
    navigate:ports.navigateToProjectArea,
    state:() => ({ ...(activeProjectId ? { activeProjectId } : {}), ...(openingProjectId ? { openingProjectId } : {}),
      projectCount:projects.length, mounted }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"projects",
  capabilities:["Project Library", "active project", "navigation", "coordination"],
});
