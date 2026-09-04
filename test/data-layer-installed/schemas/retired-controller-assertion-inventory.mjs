/**
 * Every range names the one surviving direct owner for assertions retired with
 * schemas-controller-test.mjs. Counts include assertions in repair probes so
 * the complete 325-call source inventory is conserved.
 */
export const retiredSchemaControllerAssertionInventory = [
  { group:"public composition, persistence, and remount", lines:"1-49", count:8,
    owner:"test/data-layer-installed/schemas-composition-test.mjs" },
  { group:"installed dialogs, library projection, and relationship routing", lines:"210-246", count:16,
    owner:"test/data-layer-installed/schemas/relationship-tree-controller-test.mjs" },
  { group:"source drafts, revision lifecycle, publication, and close routing", lines:"247-396", count:69,
    owner:"test/data-layer-installed/schemas/installed-editor-workflow-test.mjs" },
  { group:"property filtering, removal, copy, manual paths, and specific index", lines:"397-463", count:23,
    owner:"test/data-layer-installed/schemas/property-controller-test.mjs" },
  { group:"rule choice, parameters, predicates, preview, and reusable metadata", lines:"464-560", count:26,
    owner:"test/data-layer-installed/schemas/rule-picker-views-test.mjs" },
  { group:"rule revision, attachment, sync, and deletion", lines:"561-620", count:31,
    owner:"test/data-layer-installed/schemas/rule-controller-test.mjs" },
  { group:"assignments and conflicts", lines:"621-638", count:6,
    owner:"test/data-layer-installed/schemas/assignment-controller-test.mjs" },
  { group:"library import review", lines:"639-645", count:3,
    owner:"test/data-layer-installed/schemas/library-import-workflow-test.mjs" },
  { group:"library deletion review", lines:"646-651", count:4,
    owner:"test/data-layer-installed/schemas/library-deletion-workflow-test.mjs" },
  { group:"library export choice, compatibility, IO, status, and focus", lines:"652-675", count:16,
    owner:"test/data-layer-installed/schemas/library-export-workflow-test.mjs" },
  { group:"guided selection, declaration, continuation, promotion, retry, and rejection", lines:"676-793", count:43,
    owner:"test/data-layer-installed/schemas/guided-validation-controller-test.mjs" },
  { group:"canonical saved editing, history, settlement, and overlays", lines:"794-911", count:46,
    owner:"test/data-layer-installed/schemas/canonical-editor-controller-test.mjs" },
  { group:"allowed-value expansion return and cleanup", lines:"912-926", count:4,
    owner:"test/data-layer-installed/schemas/guided-validation-controller-test.mjs" },
  { group:"canonical stale-work and aggregate lifecycle disposal", lines:"927-946", count:10,
    owner:"test/data-layer-installed/schemas/lifecycle-test.mjs" },
  { group:"project hydration slot and durable persistence recovery", lines:"947-1040", count:17,
    owner:"test/data-layer-installed/schemas/project-hydration-test.mjs" },
  { group:"installed repair-regression probes", lines:"1041-1186", count:3,
    owner:"test/data-layer-installed/schemas/property-controller-test.mjs" },
];
