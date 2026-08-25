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
  let phase: "idle" | "dirty" | "saving" | "saved" | "failed" = "idle";
  let generation = 0;
  const input = (): void => { paths = { observationPath:observation?.value ?? paths.observationPath,
    pushPath:push?.value ?? paths.pushPath }; phase = "dirty"; };
  const change = (): void => {
    input(); const operation = ++generation, snapshot = { ...paths }; phase = "saving";
    void ports.savePaths(snapshot).then(ports.settleTransport).then(ports.refreshTargetPath)
      .then(() => { if (mounted && operation === generation) phase = "saved"; },
        () => { if (mounted && operation === generation) phase = "failed"; });
  };
  return {
    mount(): void {
      if (mounted) return; mounted = true; generation += 1;
      if (observation) observation.value = paths.observationPath;
      if (push) push.value = paths.pushPath;
      observation?.addEventListener("input", input); observation?.addEventListener("change", change);
      push?.addEventListener("input", input); push?.addEventListener("change", change);
    },
    dispose(): void {
      if (!mounted) return; mounted = false; generation += 1; phase = "idle";
      observation?.removeEventListener("input", input); observation?.removeEventListener("change", change);
      push?.removeEventListener("input", input); push?.removeEventListener("change", change);
    },
    state:() => ({ ...paths, phase }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"project-event-transport",
  capabilities:["observation path", "push path", "settlement", "target refresh"],
});
