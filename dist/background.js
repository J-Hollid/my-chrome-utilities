import { openIndexedDbProjectRepository } from "./utilities/data-layer/schemas.js";
const OPEN_SIDE_PANEL_COMMAND = "open-side-panel";
const FOCUS_APP_HOTKEYS_MESSAGE = { type: "focus-app-hotkeys" };
void openIndexedDbProjectRepository().catch((error) => console.error("Durable project repository unavailable", error));
function focusSidePanelHotkeys() {
    void chrome.runtime.sendMessage(FOCUS_APP_HOTKEYS_MESSAGE).catch(() => { });
}
function openSidePanelForActiveTab(tab) {
    if (tab.id === undefined) {
        return;
    }
    void chrome.sidePanel.open({ tabId: tab.id }).then(focusSidePanelHotkeys);
}
async function openSidePanelForCurrentActiveTab() {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (tab) {
        openSidePanelForActiveTab(tab);
    }
}
chrome.action.onClicked.addListener(openSidePanelForActiveTab);
chrome.commands.onCommand.addListener((command, tab) => {
    if (command === OPEN_SIDE_PANEL_COMMAND) {
        if (tab) {
            openSidePanelForActiveTab(tab);
        }
        else {
            void openSidePanelForCurrentActiveTab();
        }
    }
});
//# sourceMappingURL=background.js.map