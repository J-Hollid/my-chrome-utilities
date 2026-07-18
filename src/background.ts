const OPEN_SIDE_PANEL_COMMAND = "open-side-panel";
const FOCUS_APP_HOTKEYS_MESSAGE = { type: "focus-app-hotkeys" };

function focusSidePanelHotkeys(): void {
  void chrome.runtime.sendMessage(FOCUS_APP_HOTKEYS_MESSAGE).catch(() => {});
}

function openSidePanelForActiveTab(tab: chrome.tabs.Tab): void {
  if (tab.id === undefined) {
    return;
  }

  void chrome.sidePanel.open({ tabId: tab.id }).then(focusSidePanelHotkeys);
}

async function openSidePanelForCurrentActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab) {
    openSidePanelForActiveTab(tab);
  }
}

chrome.action.onClicked.addListener(openSidePanelForActiveTab);
chrome.commands.onCommand.addListener((command) => {
  if (command === OPEN_SIDE_PANEL_COMMAND) {
    void openSidePanelForCurrentActiveTab();
  }
});

export {};
