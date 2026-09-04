/**
 * Each stable ID represents one executable assertion from the retired
 * schemas-controller-test.mjs source. Each generated check names the direct
 * owner that executes its behavioral observation.
 */
const ownerPaths = [
  "test/data-layer-installed/schemas-composition-test.mjs",
  "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
  "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
  "test/data-layer-installed/schemas/library-editor-relationship-factory-test.mjs",
  "test/data-layer-installed/schemas/library-controller-test.mjs",
  "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
  "test/data-layer-installed/schemas/canonical-persistence-workflow-test.mjs",
  "test/data-layer-installed/schemas/source-controller-test.mjs",
  "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
  "test/data-layer-installed/schemas/library-deletion-workflow-test.mjs",
  "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
  "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
  "test/data-layer-installed/schemas/property-controller-test.mjs",
  "test/data-layer-installed/schemas/rule-controller-test.mjs",
  "test/data-layer-installed/schemas/rule-attachment-workflow-test.mjs",
  "test/data-layer-installed/schemas/assignment-controller-test.mjs",
  "test/data-layer-installed/schemas/rule-promotion-workflow-test.mjs",
  "test/data-layer-installed/schemas/library-import-workflow-test.mjs",
  "test/data-layer-installed/schemas/library-policy-test.mjs",
  "test/data-layer-installed/schemas/canonical-guided-validation-factory-test.mjs",
  "test/data-layer-installed/schemas/validation-controller-test.mjs",
  "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
  "test/data-layer-installed/schemas/lifecycle-test.mjs",
  "test/data-layer-installed/schemas/project-hydration-test.mjs",
];

const groups = [
  {
    group:"public composition, persistence, and remount", lines:"1-49",
    prefix:"public-composition-persistence-remount", methods:[
    "equal", "equal", "equal", "equal", "equal", "ok", "equal", "equal",
    ], owners:[
    0, 0, 0, 0, 0, 0, 0, 0,
    ],
  },
  {
    group:"installed dialogs, library projection, and relationship routing", lines:"210-246",
    prefix:"installed-dialogs-library-relationship-routing", methods:[
    "ok", "equal", "equal", "deepEqual", "deepEqual", "equal", "deepEqual", "equal", "ok", "deepEqual",
    "equal", "equal", "deepEqual", "equal", "match", "equal",
    ], owners:[
    1, 2, 2, 1, 3, 2, 4, 1, 1, 5, 2, 2, 6, 1, 1, 2,
    ],
  },
  {
    group:"source drafts, revision lifecycle, publication, and close routing", lines:"247-396",
    prefix:"source-drafts-revision-publication-close", methods:[
    "deepEqual", "deepEqual", "equal", "equal", "equal", "equal", "deepEqual", "deepEqual", "equal",
    "deepEqual", "equal", "equal", "equal", "deepEqual", "equal", "equal", "equal", "equal", "deepEqual",
    "deepEqual", "equal", "equal", "deepEqual", "equal", "deepEqual", "equal", "equal", "equal", "equal",
    "deepEqual", "equal", "equal", "equal", "equal", "equal", "deepEqual", "equal", "deepEqual", "equal",
    "equal", "equal", "equal", "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal", "equal",
    "equal", "deepEqual", "equal", "equal", "equal", "match", "equal", "match", "equal", "equal", "equal",
    "equal", "equal", "equal", "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal", "equal",
    "equal", "equal", "equal", "equal", "equal", "ok", "equal", "equal", "ok", "equal", "equal",
    ], owners:[
    7, 7, 7, 7, 4, 2, 7, 7, 7, 4, 8, 7, 7, 7, 8, 7, 7, 7, 7, 8, 2, 4, 4, 4, 8, 4, 4, 2, 8, 4, 7, 4, 4, 8, 8, 8,
    8, 4, 4, 4, 8, 8, 8, 8, 8, 4, 4, 4, 4, 8, 8, 4, 8, 8, 8, 9, 8, 10, 8, 8, 8, 4, 8, 4, 8, 4, 8, 8, 8, 8, 4,
    8, 4, 4, 8, 8, 8, 4, 4, 8, 5, 8, 4,
    ],
  },
  {
    group:"property filtering, removal, copy, manual paths, and specific index", lines:"397-463",
    prefix:"property-filter-removal-copy-manual-index", methods:[
    "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "match", "equal", "equal", "equal",
    "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "match", "equal", "match", "equal",
    ], owners:[
    11, 8, 11, 11, 12, 8, 8, 8, 12, 11, 11, 8, 8, 8, 11, 11, 11, 8, 11, 8, 12, 11, 12, 11,
    ],
  },
  {
    group:"rule choice, parameters, predicates, preview, and reusable metadata", lines:"464-560",
    prefix:"rule-choice-parameters-predicates-preview", methods:[
    "equal", "equal", "equal", "equal", "equal", "equal", "match", "deepEqual", "equal", "ok", "deepEqual",
    "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal", "equal", "deepEqual", "deepEqual", "ok",
    "ok", "equal", "equal", "ok",
    ], owners:[
    13, 11, 13, 13, 13, 13, 13, 13, 13, 11, 11, 13, 13, 11, 13, 11, 13, 13, 13, 11, 13, 11, 11, 11, 11, 11,
    ],
  },
  {
    group:"rule revision, attachment, sync, and deletion", lines:"561-620",
    prefix:"rule-revision-attachment-sync-deletion", methods:[
    "ok", "equal", "equal", "equal", "equal", "ok", "equal", "equal", "equal", "equal", "equal", "equal",
    "equal", "equal", "match", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "match",
    "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal",
    ], owners:[
    5, 13, 14, 14, 13, 15, 13, 14, 13, 16, 13, 13, 13, 14, 13, 14, 13, 16, 13, 13, 13, 13, 13, 13, 13, 14, 13,
    13, 13, 13, 13,
    ],
  },
  {
    group:"assignments and conflicts", lines:"621-638",
    prefix:"assignment-conflicts", methods:[
    "equal", "equal", "match", "equal", "match", "equal",
    ], owners:[
    15, 15, 17, 15, 13, 15,
    ],
  },
  {
    group:"library import review", lines:"639-645",
    prefix:"library-import-review", methods:[
    "equal", "equal", "equal",
    ], owners:[
    17, 17, 6,
    ],
  },
  {
    group:"library deletion review", lines:"646-651",
    prefix:"library-deletion-review", methods:[
    "equal", "match", "equal", "equal",
    ], owners:[
    9, 9, 9, 9,
    ],
  },
  {
    group:"library export choice, compatibility, IO, status, and focus", lines:"652-675",
    prefix:"library-export-choice-compatibility-io", methods:[
    "equal", "equal", "equal", "equal", "equal", "deepEqual", "equal", "equal", "equal", "equal", "match",
    "equal", "deepEqual", "equal", "equal", "equal",
    ], owners:[
    10, 10, 10, 10, 10, 10, 10, 10, 18, 10, 18, 18, 18, 18, 18, 18,
    ],
  },
  {
    group:"guided selection, declaration, continuation, promotion, retry, and rejection", lines:"676-793",
    prefix:"guided-selection-continuation-promotion", methods:[
    "equal", "deepEqual", "ok", "ok", "equal", "equal", "equal", "match", "equal", "equal", "equal", "equal",
    "equal", "ok", "equal", "equal", "deepEqual", "equal", "ok", "deepEqual", "equal", "equal", "equal",
    "equal", "equal", "equal", "equal", "equal", "ok", "equal", "equal", "deepEqual", "equal", "equal",
    "equal", "equal", "equal", "match", "equal", "equal", "equal", "equal", "equal", "match", "equal",
    ], owners:[
    19, 19, 5, 5, 19, 20, 5, 5, 5, 20, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 20, 5, 20, 5, 20, 20, 5, 5, 5, 20,
    20, 5, 5, 5, 5, 20, 16, 16, 16, 20, 20, 21, 20,
    ],
  },
  {
    group:"canonical saved editing, history, settlement, and overlays", lines:"794-911",
    prefix:"canonical-edit-history-settlement-overlay", methods:[
    "equal", "ok", "equal", "equal", "deepEqual", "equal", "equal", "equal", "match", "equal", "equal",
    "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "equal", "match", "deepEqual",
    "equal", "equal", "ok", "equal", "deepEqual", "equal", "equal", "equal", "equal", "equal", "equal",
    "equal", "equal", "equal", "equal", "ok", "ok", "equal", "equal", "equal", "equal", "equal", "equal",
    "deepEqual", "equal", "equal", "equal", "deepEqual",
    ], owners:[
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 18, 22, 21, 21, 21, 21, 15,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 13, 21, 6, 1, 17,
    ],
  },
  {
    group:"allowed-value expansion return and cleanup", lines:"912-926",
    prefix:"allowed-value-expansion-return-cleanup", methods:[
    "equal", "deepEqual", "deepEqual", "equal",
    ], owners:[
    15, 7, 23, 15,
    ],
  },
  {
    group:"canonical stale-work and aggregate lifecycle disposal", lines:"927-946",
    prefix:"canonical-stale-work-lifecycle-disposal", methods:[
    "equal", "equal", "equal", "notEqual", "match", "equal", "equal", "equal", "equal", "deepEqual",
    ], owners:[
    22, 22, 22, 22, 22, 22, 22, 22, 22, 15,
    ],
  },
  {
    group:"project hydration slot and durable persistence recovery", lines:"947-1040",
    prefix:"project-hydration-durable-recovery", methods:[
    "equal", "equal", "notEqual", "equal", "equal", "deepEqual", "deepEqual", "equal", "equal", "equal",
    "deepEqual", "equal", "equal", "equal", "equal", "deepEqual", "equal", "equal",
    ], owners:[
    23, 23, 23, 23, 4, 4, 4, 4, 4, 4, 18, 4, 4, 4, 4, 18, 4, 4,
    ],
  },
  {
    group:"installed repair-regression probes", lines:"1041-1186",
    prefix:"installed-repair-regression-probes", methods:[
    "deepEqual", "match", "match",
    ], owners:[
    12, 12, 12,
    ],
  },
];

export const retiredSchemaControllerAssertionInventory = groups.map(
  ({ group, lines, prefix, methods, owners:ownerIndexes }) => ({
    group,
    lines,
    checks:methods.map((method, index) => ({
      id:`${prefix}-${String(index + 1).padStart(3, "0")}`,
      method,
      owner:ownerPaths[ownerIndexes[index]],
    })),
  }),
);
