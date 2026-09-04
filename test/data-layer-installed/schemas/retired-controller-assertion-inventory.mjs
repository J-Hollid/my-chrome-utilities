/**
 * Each stable ID represents one executable assert call from the retired
 * schemas-controller-test.mjs source. The method sequence prevents a physical
 * line count from hiding multiple checks on one line.
 */
const definitions = [
  { group:"public composition, persistence, and remount", slug:"public-composition-persistence-remount",
    lines:"1-49", owner:"test/data-layer-installed/schemas-composition-test.mjs", methods:[
      "equal", "equal", "equal", "equal", "equal", "ok", "equal", "equal",
    ] },
  { group:"installed dialogs, library projection, and relationship routing", slug:"installed-dialogs-library-relationship-routing",
    lines:"210-246", owner:"test/data-layer-installed/schemas/relationship-tree-controller-test.mjs", methods:[
      "ok", "equal", "equal", "deepEqual", "deepEqual", "equal", "deepEqual", "equal", "ok", "deepEqual", "equal", "equal",
      "deepEqual", "equal", "match", "equal",
    ] },
  { group:"source drafts, revision lifecycle, publication, and close routing", slug:"source-drafts-revision-publication-close",
    lines:"247-396", owner:"test/data-layer-installed/schemas/installed-editor-workflow-test.mjs", methods:[
      "deepEqual", "deepEqual", "equal", "equal", "equal", "equal", "deepEqual", "deepEqual", "equal", "deepEqual", "equal", "equal",
      "equal", "deepEqual", "equal", "equal", "equal", "equal", "deepEqual", "deepEqual", "equal", "equal", "deepEqual", "equal",
      "deepEqual", "equal", "equal", "equal", "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal", "deepEqual",
      "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal", "deepEqual", "equal", "equal", "equal", "equal",
      "equal", "equal", "equal", "deepEqual", "equal", "equal", "equal", "match", "equal", "match", "equal", "equal",
      "equal", "equal", "equal", "equal", "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal", "equal",
      "equal", "equal", "equal", "equal", "equal", "ok", "equal", "equal", "ok", "equal", "equal",
    ] },
  { group:"property filtering, removal, copy, manual paths, and specific index", slug:"property-filter-removal-copy-manual-index",
    lines:"397-463", owner:"test/data-layer-installed/schemas/property-controller-test.mjs", methods:[
      "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "match", "equal", "equal", "equal",
      "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "match", "equal", "match", "equal",
    ] },
  { group:"rule choice, parameters, predicates, preview, and reusable metadata", slug:"rule-choice-parameters-predicates-preview",
    lines:"464-560", owner:"test/data-layer-installed/schemas/rule-picker-views-test.mjs", methods:[
      "equal", "equal", "equal", "equal", "equal", "equal", "match", "deepEqual", "equal", "ok", "deepEqual", "equal",
      "deepEqual", "equal", "equal", "equal", "equal", "equal", "equal", "deepEqual", "deepEqual", "ok", "ok", "equal",
      "equal", "ok",
    ] },
  { group:"rule revision, attachment, sync, and deletion", slug:"rule-revision-attachment-sync-deletion",
    lines:"561-620", owner:"test/data-layer-installed/schemas/rule-controller-test.mjs", methods:[
      "ok", "equal", "equal", "equal", "equal", "ok", "equal", "equal", "equal", "equal", "equal", "equal",
      "equal", "equal", "match", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "match",
      "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal",
    ] },
  { group:"assignments and conflicts", slug:"assignment-conflicts",
    lines:"621-638", owner:"test/data-layer-installed/schemas/assignment-controller-test.mjs", methods:[
      "equal", "equal", "match", "equal", "match", "equal",
    ] },
  { group:"library import review", slug:"library-import-review",
    lines:"639-645", owner:"test/data-layer-installed/schemas/library-import-workflow-test.mjs", methods:[
      "equal", "equal", "equal",
    ] },
  { group:"library deletion review", slug:"library-deletion-review",
    lines:"646-651", owner:"test/data-layer-installed/schemas/library-deletion-workflow-test.mjs", methods:[
      "equal", "match", "equal", "equal",
    ] },
  { group:"library export choice, compatibility, IO, status, and focus", slug:"library-export-choice-compatibility-io",
    lines:"652-675", owner:"test/data-layer-installed/schemas/library-export-workflow-test.mjs", methods:[
      "equal", "equal", "equal", "equal", "equal", "deepEqual", "equal", "equal", "equal", "equal", "match", "equal",
      "deepEqual", "equal", "equal", "equal",
    ] },
  { group:"guided selection, declaration, continuation, promotion, retry, and rejection", slug:"guided-selection-continuation-promotion",
    lines:"676-793", owner:"test/data-layer-installed/schemas/guided-validation-controller-test.mjs", methods:[
      "equal", "deepEqual", "ok", "ok", "equal", "equal", "equal", "match", "equal", "equal", "equal", "equal",
      "equal", "ok", "equal", "equal", "deepEqual", "equal", "ok", "deepEqual", "equal", "equal", "equal", "equal",
      "equal", "equal", "equal", "equal", "ok", "equal", "equal", "deepEqual", "equal", "equal", "equal", "equal",
      "equal", "match", "equal", "equal", "equal", "equal", "equal", "match", "equal",
    ] },
  { group:"canonical saved editing, history, settlement, and overlays", slug:"canonical-edit-history-settlement-overlay",
    lines:"794-911", owner:"test/data-layer-installed/schemas/canonical-editor-controller-test.mjs", methods:[
      "equal", "ok", "equal", "equal", "deepEqual", "equal", "equal", "equal", "match", "equal", "equal", "equal",
      "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "match", "deepEqual", "equal", "equal",
      "ok", "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal",
      "equal", "ok", "ok", "equal", "equal", "equal", "equal", "equal", "equal", "deepEqual", "equal", "equal",
      "equal", "deepEqual",
    ] },
  { group:"allowed-value expansion return and cleanup", slug:"allowed-value-expansion-return-cleanup",
    lines:"912-926", owner:"test/data-layer-installed/schemas/guided-validation-controller-test.mjs", methods:[
      "equal", "deepEqual", "deepEqual", "equal",
    ] },
  { group:"canonical stale-work and aggregate lifecycle disposal", slug:"canonical-stale-work-lifecycle-disposal",
    lines:"927-946", owner:"test/data-layer-installed/schemas/lifecycle-test.mjs", methods:[
      "equal", "equal", "equal", "notEqual", "match", "equal", "equal", "equal", "equal", "deepEqual",
    ] },
  { group:"project hydration slot and durable persistence recovery", slug:"project-hydration-durable-recovery",
    lines:"947-1040", owner:"test/data-layer-installed/schemas/project-hydration-test.mjs", methods:[
      "equal", "equal", "notEqual", "equal", "equal", "deepEqual", "deepEqual", "equal", "equal", "equal", "deepEqual", "equal",
      "equal", "equal", "equal", "deepEqual", "equal", "equal",
    ] },
  { group:"installed repair-regression probes", slug:"installed-repair-regression-probes",
    lines:"1041-1186", owner:"test/data-layer-installed/schemas/property-controller-test.mjs", methods:[
      "deepEqual", "match", "match",
    ] },
];

export const retiredSchemaControllerAssertionInventory = definitions.map(
  ({ group, slug, lines, owner, methods }) => ({
    group, lines, owner, count:methods.length,
    checks:methods.map((method, index) => ({
      id:`${slug}-${String(index + 1).padStart(3, "0")}`, method,
    })),
  }),
);
