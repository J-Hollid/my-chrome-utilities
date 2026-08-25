export interface ProjectEventTransportInstalledPorts {
  root: ParentNode;
  loadPaths(): { observationPath: string; pushPath: string };
  savePaths(paths: { observationPath: string; pushPath: string }): Promise<void>;
  settleTransport(): Promise<void>;
  refreshTargetPath(): Promise<void>;
}

export function createProjectEventTransportInstalledController(ports: ProjectEventTransportInstalledPorts) {
  const observation = ports.root.querySelector<HTMLInputElement>("#history-path");
  const push = ports.root.querySelector<HTMLInputElement>("#default-push-path");
  let mounted = false;
  let paths = { ...ports.loadPaths() };
  const input = (): void => { paths = { observationPath:observation?.value ?? paths.observationPath,
    pushPath:push?.value ?? paths.pushPath }; };
  const change = (): void => { input(); void ports.savePaths(paths).then(ports.settleTransport).then(ports.refreshTargetPath); };
  return {
    mount(): void {
      if (mounted) return; mounted = true;
      if (observation) observation.value = paths.observationPath;
      if (push) push.value = paths.pushPath;
      observation?.addEventListener("input", input); observation?.addEventListener("change", change);
      push?.addEventListener("input", input); push?.addEventListener("change", change);
    },
    dispose(): void {
      if (!mounted) return; mounted = false;
      observation?.removeEventListener("input", input); observation?.removeEventListener("change", change);
      push?.removeEventListener("input", input); push?.removeEventListener("change", change);
    },
    state:() => ({ ...paths }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"project-event-transport",
  capabilities:["observation path", "push path", "settlement", "target refresh"],
});
