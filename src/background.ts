const INSTALL_STATE_KEY = "myChromeUtilitiesInstalledAt";

function recordInstallation(): void {
  const installedAt = new Date().toISOString();
  void chrome.storage.local.set({ [INSTALL_STATE_KEY]: installedAt });
}

chrome.runtime.onInstalled.addListener(recordInstallation);

export {};
