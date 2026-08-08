import { runInstalledSidePanelSession } from "./support/side-panel-browser-session.mjs";
import { fixturePrograms as capture } from "./support/side-panel-capture-targets.mjs";
import { fixturePrograms as events } from "./support/side-panel-event-library-targets.mjs";
import { fixturePrograms as workspace } from "./support/side-panel-schema-workspace-targets.mjs";
import { fixturePrograms as guided } from "./support/side-panel-schema-guided-targets.mjs";
import { fixturePrograms as validation } from "./support/side-panel-schema-validation-targets.mjs";
import { fixturePrograms as documentation } from "./support/side-panel-schema-documentation-targets.mjs";
import { fixturePrograms as defects } from "./support/side-panel-defect-targets.mjs";
import { fixturePrograms as shell } from "./support/side-panel-shell-targets.mjs";

// Supported direct compatibility command. Registered logical targets use their
// owning pack entry programs; no-target mode retains the complete viewport suite.
await runInstalledSidePanelSession({ fixturePrograms:Object.assign({}, capture, events,
  workspace, guided, validation, documentation, defects, shell) });
