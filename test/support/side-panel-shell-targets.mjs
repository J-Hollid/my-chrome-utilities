import { createExecutableTargetDefinitions } from "./side-panel-browser-target-contract.mjs";
import { containmentFixturePrograms } from "./side-panel-containment-fixtures.mjs";
import { liveTargetPermissionRecoveryWiringRuntime } from "./side-panel-capture-fixtures.mjs";
import {
  guidedTransportProjectRestoreRuntime,
  guidedTransportProjectSetupRuntime,
} from "./side-panel-browser-project-fixtures.mjs";

async function executeFixture({ context, fixturePrograms, target }) {
  return context.executeFixture({ fixturePrograms, target });
}

const workspacePanelContainmentRuntime = `(() => {
  const dataLayerPanel = document.querySelector("#workspace-panel-data-layer");
  const hotkeysPanel = document.querySelector("#workspace-panel-hotkeys");
  const hotkeysTab = document.querySelector("#workspace-tab-hotkeys");
  const utilityItems = [...document.querySelectorAll("#utility-directory > li")];
  const ownedPanels = [...document.querySelectorAll("[data-utility-owner]")];
  const peers = dataLayerPanel.parentElement === hotkeysPanel.parentElement;
  const nested = dataLayerPanel.contains(hotkeysPanel) || hotkeysPanel.contains(dataLayerPanel);
  hotkeysTab.click();
  const heading = hotkeysPanel.querySelector("h2");
  const search = hotkeysPanel.querySelector("#hotkey-editor-filter");
  const groups = [...hotkeysPanel.querySelectorAll("#hotkey-editor-commands > section")];
  const observation = {
    peers,
    nested,
    storageOwnership:{
      dataLayer:Boolean(localStorage.getItem("my-chrome-utilities.data-layer")),
      shell:Boolean(localStorage.getItem("my-chrome-utilities.shell")),
      legacyWorkspace:localStorage.getItem("my-chrome-utilities.workspace-tab.v1"),
    },
    utilityDirectory:{
      ids:utilityItems.map(({dataset})=>dataset.utilityId),
      labels:utilityItems.map(({textContent})=>textContent),
      visible:utilityItems.every((item)=>item.checkVisibility()), hidden:utilityItems.length===3&&utilityItems.every((item)=>!item.checkVisibility()),
    },
    panelOwnership:{
      count:ownedPanels.length,
      commandPalette:document.querySelector("#palette")?.dataset.utilityOwner,
      hotkeys:hotkeysPanel.dataset.utilityOwner,
      dataLayer:dataLayerPanel.dataset.utilityOwner,
    },
    afterActivation:{
      dataLayerHidden:dataLayerPanel.hidden,
      hotkeysHidden:hotkeysPanel.hidden,
      hotkeysVisible:hotkeysPanel.checkVisibility(),
      headingVisible:heading.checkVisibility(),
      searchVisible:search.checkVisibility(),
      registeredGroupCount:groups.length,
      registeredGroupsVisible:groups.length > 0 && groups.every((group) => group.checkVisibility()),
    },
  };
  document.querySelector("#workspace-tab-data-layer").click();
  return observation;
})()`;

export const fixturePrograms = Object.freeze({
  ...containmentFixturePrograms,
  guidedTransportProjectRestoreRuntime,
  guidedTransportProjectSetupRuntime,
  liveTargetPermissionRecoveryWiringRuntime,
  workspacePanelContainmentRuntime,
});
export const definitions = createExecutableTargetDefinitions("shell", fixturePrograms, { observe:executeFixture });
