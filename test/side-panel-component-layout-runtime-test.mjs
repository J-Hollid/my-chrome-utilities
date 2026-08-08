import { runDirectSidePanelCompatibility } from "./support/side-panel-browser-direct-compatibility.mjs";

// Supported direct compatibility command. Registered logical targets use their
// owning pack entry programs; no-target mode retains the complete viewport suite.
await runDirectSidePanelCompatibility();
