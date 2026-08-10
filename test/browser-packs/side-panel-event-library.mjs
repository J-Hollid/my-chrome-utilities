import { pathToFileURL } from "node:url";

import {
  createSidePanelTargetRegistry,
  parseSidePanelTargetRequests,
  resolveSidePanelTargets,
} from "../support/side-panel-browser-target-registry.mjs";
import { runSidePanelPack } from "../support/side-panel-browser-entry.mjs";
import { runInstalledSidePanelSession } from "../support/side-panel-browser-session.mjs";
import * as eventLibraryTargets from "../support/side-panel-event-library-targets.mjs";

export async function runEventLibrarySidePanel(environment = process.env) {
  const requests = parseSidePanelTargetRequests(environment);
  if (requests.length === 1 && requests[0].id === "LIBRARY_DIRECT_TEMPLATE_PUSH_BROWSER_ADAPTER") {
    return runSidePanelPack({
      owningPack:"event-library",
      moduleLoaders:{ "event-library":() => import("../support/side-panel-event-library-targets.mjs") },
      environment,
    });
  }
  const registry = createSidePanelTargetRegistry(eventLibraryTargets.eventLibraryTargetContract, {
    requireHooks:false,
  });
  const loadEventLibraryTargets = async () => eventLibraryTargets;
  const definitions = await resolveSidePanelTargets({
    registry,
    owningPack:"event-library",
    requests,
    loaders:Object.fromEntries(requests.map(({ id }) => [id, loadEventLibraryTargets])),
  });
  return runInstalledSidePanelSession({
    definitions,
    fixturePrograms:eventLibraryTargets.fixturePrograms,
    environment,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runEventLibrarySidePanel().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
