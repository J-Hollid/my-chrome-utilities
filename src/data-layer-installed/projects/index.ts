export interface ProjectsInstalledPorts {
  activeProject(): Readonly<Record<string, unknown>> | undefined;
  listProjects(): readonly Readonly<Record<string, unknown>>[];
  openProject(id: string): Promise<void>;
  navigateToProjectArea(area: string): void;
}

export const installedControllerDefinition = Object.freeze({
  id:"projects",
  capabilities:["Project Library", "active project", "navigation", "coordination"],
});
