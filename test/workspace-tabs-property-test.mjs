import assert from "node:assert/strict";

import {
  isWorkspaceTabId,
  workspaceTabForNavigationKey,
  workspaceTabs,
} from "../dist/workspace-tabs.js";

const tabIds = workspaceTabs.map(({ id }) => id);
const navigationKeys = ["Home", "End", "ArrowLeft", "ArrowRight", "Escape"];

function expectedTab(current, key) {
  const index = tabIds.indexOf(current);

  switch (key) {
    case "Home":
      return tabIds[0];
    case "End":
      return tabIds.at(-1);
    case "ArrowRight":
      return tabIds[(index + 1) % tabIds.length];
    case "ArrowLeft":
      return tabIds[(index - 1 + tabIds.length) % tabIds.length];
    default:
      return undefined;
  }
}

let seed = 0x5f3759df;

function nextIndex(length) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed % length;
}

for (let sample = 0; sample < 200; sample += 1) {
  let activeTab = tabIds[nextIndex(tabIds.length)];

  for (let step = 0; step < 20; step += 1) {
    const key = navigationKeys[nextIndex(navigationKeys.length)];
    const expected = expectedTab(activeTab, key);

    assert.equal(workspaceTabForNavigationKey(activeTab, key), expected);
    if (expected) {
      activeTab = expected;
    }
    assert.ok(isWorkspaceTabId(activeTab));
  }
}

assert.equal(isWorkspaceTabId(null), false);
assert.equal(isWorkspaceTabId("unknown"), false);
