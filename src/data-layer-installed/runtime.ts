export const installedDataLayerControllerOrder = [
  "capture",
  "event-library",
  "schemas",
  "defects",
  "replay",
  "projects",
  "durable-projects",
  "project-event-transport",
  "live-flow-testing",
] as const;

export type InstalledDataLayerControllerId =
  typeof installedDataLayerControllerOrder[number];

export interface InstalledDataLayerControllerLifecycle {
  mount(): void;
  dispose(): void;
}

export type InstalledDataLayerControllers = Readonly<Record<
  InstalledDataLayerControllerId,
  InstalledDataLayerControllerLifecycle
>>;

export function createInstalledDataLayerLifecycle(
  controllers: InstalledDataLayerControllers,
): InstalledDataLayerControllerLifecycle {
  let mounted = false;

  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      for (const id of installedDataLayerControllerOrder) controllers[id].mount();
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      for (const id of [...installedDataLayerControllerOrder].reverse()) {
        controllers[id].dispose();
      }
    },
  };
}

export async function mountInstalledDataLayerRuntime(): Promise<
  InstalledDataLayerControllerLifecycle
> {
  const { installedDataLayerApplication } = await import("./schemas/application.js");
  return installedDataLayerApplication;
}
