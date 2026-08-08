import {
  createSidePanelTargetRegistry,
  parseSidePanelTargetRequests,
  resolveSidePanelTargets,
} from "./side-panel-browser-target-registry.mjs";
import {
  sidePanelTargetContract,
} from "./side-panel-browser-target-contract.mjs";
import { runInstalledSidePanelSession } from "./side-panel-browser-session.mjs";

const registry = createSidePanelTargetRegistry(sidePanelTargetContract, { requireHooks:false });

export async function runSidePanelPack({ owningPack, moduleLoaders, environment = process.env }) {
  const requests = parseSidePanelTargetRequests(environment);
  const loaders = Object.fromEntries(requests.map(({ id }) => {
    const contract = registry.targets.get(id);
    const loader = contract && moduleLoaders[contract.module];
    return [id, loader];
  }));
  const definitions = await resolveSidePanelTargets({ registry, owningPack, requests, loaders });
  const fixturePrograms = Object.freeze(Object.assign({},
    ...definitions.map((definition) => definition.fixturePrograms)));
  await runInstalledSidePanelSession({ definitions, fixturePrograms, environment });
}
