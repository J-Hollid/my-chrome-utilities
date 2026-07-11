import assert from "node:assert/strict";
import { panelEmptyState } from "../dist/panel-empty-states.js";

assert.deepEqual(panelEmptyState("templates", 0, false), { message: "No templates saved yet", recoveryAction: "Open Live" });
assert.deepEqual(panelEmptyState("templates", 0, true), { message: "No templates match these filters", recoveryAction: "Clear filters" });
assert.deepEqual(panelEmptyState("sessions", 0, false), { message: "No sessions saved yet", recoveryAction: "Import session" });
assert.equal(panelEmptyState("schemas", 1, false), undefined);
