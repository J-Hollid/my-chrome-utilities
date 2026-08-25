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
  const refresh = (): void => { projects = ports.loadProjects().map((project) => ({ ...project })); activeProjectId = ports.activeProjectId(); };
  return {
    mount(): void { if (!mounted) { mounted = true; unsubscribe = ports.subscribe(refresh); refresh(); } },
    dispose(): void { if (mounted) { mounted = false; unsubscribe?.(); unsubscribe = undefined; } },
    async open(id: string): Promise<void> {
      if (!projects.some((project) => project.id === id)) throw new Error(`Unknown project ${id}`);
      await ports.openProject(id); activeProjectId = id;
    },
    navigate:ports.navigateToProjectArea,
    state:() => ({ ...(activeProjectId ? { activeProjectId } : {}), projectCount:projects.length }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"projects",
  capabilities:["Project Library", "active project", "navigation", "coordination"],
});
