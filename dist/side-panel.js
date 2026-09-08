import { mountInstalledUtilityWorkspace } from "./utility-host/installed-entry.js";
const installedDataLayer = await mountInstalledUtilityWorkspace();
installedDataLayer.mount();
globalThis.addEventListener("pagehide", () => installedDataLayer.dispose(), { once: true });
export { DATA_LAYER_SESSION_STORAGE_KEY, navigateSession, sessionScope, } from "./utilities/data-layer/capture.js";
export { HOTKEY_KEYMAP_STORAGE_KEY } from "./utilities/hotkeys/index.js";
//# sourceMappingURL=side-panel.js.map