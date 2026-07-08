function openSidePanelForActiveTab(tab: chrome.tabs.Tab): void {
  if (tab.id === undefined) {
    return;
  }

  void chrome.sidePanel.open({ tabId: tab.id });
}

chrome.action.onClicked.addListener(openSidePanelForActiveTab);

export {};
