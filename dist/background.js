function openSidePanelForActiveTab(tab) {
    if (tab.id === undefined) {
        return;
    }
    void chrome.sidePanel.open({ tabId: tab.id });
}
chrome.action.onClicked.addListener(openSidePanelForActiveTab);
export {};
//# sourceMappingURL=background.js.map