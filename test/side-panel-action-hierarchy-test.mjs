import assert from "node:assert/strict";

import {
  templateActionHierarchy,
  actionTreatment,
} from "../dist/side-panel-action-hierarchy.js";

assert.deepEqual(actionTreatment("primary"), {
  variant: "primary",
  disabled: false,
});

assert.deepEqual(templateActionHierarchy({ dirty: false }), {
  saveRevision: {
    variant: "primary",
    disabled: true,
    disabledReason: "The draft has no unsaved changes.",
  },
  pushDraft: { variant: "primary", disabled: false },
  discardDraft: { variant: "destructive", disabled: false },
});

assert.deepEqual(templateActionHierarchy({ dirty: true }), {
  saveRevision: { variant: "primary", disabled: false },
  pushDraft: { variant: "secondary", disabled: false },
  discardDraft: { variant: "destructive", disabled: false },
});

assert.deepEqual(templateActionHierarchy({ dirty: true, jsonError: "Invalid JSON." }).pushDraft, {
  variant: "secondary",
  disabled: true,
  disabledReason: "The JSON draft must be valid.",
});
