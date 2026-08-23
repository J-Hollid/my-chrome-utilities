# Flow concept-visual asset storage and portability R01

Status: QA-integrated as combined candidate `1b192105a8`

Prepared: 2026-08-15

## Purpose

Allow a full website project to retain a few hundred concept visuals without
making ordinary project loading, editing, publishing, or transport repeatedly
clone every image. Preserve a self-contained, inspectable project archive and
lossless import of the current version 2 JSON bundle.

This is one persistence, migration, security, and packaging slice under the
QA-branch release pilot. It does not authorize master promotion or the all-20
gate.

## Combined delivery sequencing

Implementation candidate `652ca79415` is stopped before review evidence because
its required installed archive callbacks edit the globally impactful
`src/side-panel.ts` composition root. Exact planning selects all 20 packs and 849
tasks; the same candidate without that root change selects the bounded ten-pack
closure and 228 tasks.

The user approved the Project Library transport port on 2026-08-16.
`docs/project-library-transport-port-isolation-R01.md` defines that prerequisite,
and candidate `eb3ada75` proves it can remain bounded without changing
`src/side-panel.ts` or the global architecture ledger. Its selected Project
Management pack also owns the already-active version 3 portability scenarios, so
the port cannot produce truthful standalone review-ready evidence while those
behaviors are deliberately absent.

The user approved combined sequencing on 2026-08-16. Preserve `eb3ada75` as an
internal checkpoint, reconstruct it on the approved combined specification base,
then resume the portability implementation on top. The one review-ready candidate
must satisfy both specifications, keep `src/side-panel.ts` byte-identical to the
base, execute every task and active scenario in the exact bounded changed-path
plan, and provide package proof. No scenario is skipped, tagged out, stubbed, or
unregistered. Run the settled 300-image benchmark once because the combined task
explicitly develops its measured boundary; rerun it only after a later change to
the recorded boundary fingerprint.

## Settled behavior

The original validated PNG, JPEG, or WebP bytes are canonical. Import does not
silently resize, recompress, strip metadata, or transcode them. Small thumbnail
derivatives are bounded, generated on demand, and disposable; they are neither
canonical project content nor portable archive entries.

Project graphs, Saved Drafts, and Published revisions retain lightweight
project-owned asset references and attachment metadata. Original bodies are
stored once per project and shared across current and retained Published
references. Removing a Draft reference cannot remove a body still required by a
Published revision. Project deletion removes bodies owned only by that project.

Opening a project or a Flow in Badges mode does not read or decode complete image
bodies. Thumbnails are prepared only for visible attachments, with bounded cache
retention. Opening the viewer reads and decodes only the selected original. An
ordinary metadata or graph edit writes no unchanged body, and Publish creates
references rather than another image copy.

The existing 5 MiB source, 4096-pixel-side, and 16-megapixel validation limits
remain. The fixed 25 MiB project aggregate is replaced by available durable
storage preflight and atomic quota-failure handling after the scalable store is
installed. The interface reports project asset count, original bytes, thumbnail
cache bytes, and estimated export size without claiming unlimited disk.

## Durable representation

IndexedDB remains the durable repository. Asset metadata and original Blob bodies
occupy separate project-scoped records; no base64 data URL is stored in a project
root, graph, Draft, or Published record. Attachment lookup uses an indexed
identity boundary rather than scanning every asset for every rendered item.

Body identity is content-addressed within one project. Cross-project physical
deduplication is deferred because it complicates ownership, deletion, recovery,
and privacy. Every asset mutation, attachment reference, and required body write
commits atomically. Garbage collection includes current Draft, retained Published,
recovery, and in-progress transport references.

## Portable archive

Normal export produces a version 3 ZIP-compatible project archive with only
widely supported entry methods. Its manifest declares the format version,
required features, Draft and Published records, and every asset's safe entry
name, media type, dimensions, byte length, and SHA-256 digest. Draft and Published
JSON refer to the same digest-addressed raw asset entry. Blob URLs, IndexedDB keys,
thumbnail caches, base64 image data URLs, and transient Flow state are excluded.

Export streams entries to a user-selected writable file when that capability is
available. The normal browser-download fallback remains supported and presents
an estimated size before materializing a bounded fallback Blob. Already-compressed
image entries are stored without wasteful recompression; JSON entries may be
compressed.

Import stages the manifest before asset bodies. It rejects unsupported required
features, unsafe paths, duplicate or missing entries, disallowed signatures,
dimension or per-image violations, declared-length or digest mismatches, excessive
entry count, and excessive aggregate unpacked bytes. Validation and hashing are
incremental, cancellable, and visible. Only a completely validated archive may
commit, and any failure leaves no partial project or asset.

Supported version 2 JSON bundles remain importable. Their embedded data URLs are
decoded, validated, and stored once as original Blob bodies in the same atomic
import-as-new transaction. Later normal export uses version 3; version 2 export is
not retained.

## Performance-proof restriction

Routine correctness uses small deterministic fixtures and repository/decode
traces. Those checks prove structural invariants: zero body reads for metadata-only
route loading, zero unchanged-body writes for unrelated saves and Publish, one
body per digest across Draft and Published references, bounded visible-thumbnail
work, and one selected-body read for a viewer. They belong in ordinary focused
and final correctness coverage because their cost does not grow with the target
project size.

One explicit scale benchmark uses 300 unique valid images averaging 500 KiB,
duplicate attachment references, dimension-limit outliers, and at least three
Published revisions. The approximately 146.5 MiB corpus is generated
deterministically during the run from a small code-owned PNG generator. Storage
and archive-volume images receive valid per-asset ancillary data with distinct
digests; a bounded visible subset receives real varied pixel dimensions for
thumbnail and viewer decoding. No generated image, archive, browser profile, or
asset database is committed to Git.

Generation, hashing, archive writing, import, and cleanup process one asset or
bounded stream window at a time. The run owns an exact temporary directory,
temporary Chrome profile, and task-named IndexedDB database, removes them in a
`finally` path, and reports their exact locations if interrupted. It emits only a
small JSON timing and invariant summary to the console and temporary evidence
area. It records source and stored bytes, body read/write counts, duplicate-body
count, export entry count, bounded streaming window, peak memory, and elapsed
import, export, route-open, thumbnail, viewer, edit, and Publish work.

The command supports a small diagnostic profile of 30 generated images for local
iteration and the required settled profile of 300. On a normal SSD-backed
development workstation, the diagnostic profile is expected to finish within 15
seconds and the settled profile within 60–180 seconds. A five-minute operational
ceiling stops and reports an unfinished phase rather than hanging development.
These are workflow expectations until the first implementation records a real
baseline, not machine-independent product pass thresholds. The deterministic
access, duplication, cleanup, and bounded-memory invariants are the pass
conditions while timings form the reported baseline.

The benchmark is permitted and required when a task explicitly develops the
asset-store, hydration, thumbnail, or archive-transport boundary. The coder may
run it while proving this focused work, normally once after the candidate settles
and again only after a later candidate change affects the measured boundary. It
must not be registered in `verification/packs.json`, `npm test`, routine focused
packs, packaging, or the universal all-20 gate. Unrelated tasks never run it.
Future explicitly approved work on the same boundary names it again in that
task's development focus.

The benchmark is nevertheless conditional release evidence, not evidence that
expires merely because it is outside the all-20 command. Its report records the
benchmark parameters, environment class, result, and a content fingerprint for
the exact asset-store, hydration, thumbnail, archive, durable-backend, and direct
dependency paths declared by the settled implementation handoff. Before a later
`final-ready` release claim, the architect compares the frozen candidate's same
boundary fingerprint with the latest passing benchmark report. An equal
fingerprint reuses that proof without running the benchmark. A changed or missing
fingerprint requires the benchmark on the latest relevant candidate before
`final-ready`; unrelated paths do not invalidate it. This preflight comparison is
fast and does not add the scale workload to the terminal checkpoint.

The new small-fixture unit and acceptance coverage should add no more than ten
seconds to the combined routine owner checks. If it exceeds that budget, move
volume work back to the explicit benchmark and retain only trace-based invariants
in routine coverage. Based on current repository calibration, the existing
`project_management`, `durable_project_repository`, `flow_graph`, and `shell`
owner work is expected to take approximately three to six minutes as one settled
focused checkpoint, depending on the exact changed-path plan and browser
parallelism. The one required settled benchmark therefore puts expected total
task verification around four to nine minutes for this explicit feature, while
adding zero benchmark time to unrelated work.

## Verification scope

**Development focus:** begin with the concept-visual asset model, a memory-backed
repository trace for separate metadata and Blob bodies, version 2 migration, and
version 3 archive round-trip and rejection tests. Add the small-fixture acceptance
partners for Portability 008–010 and Flow 034–037. After a coherent candidate is
green, run the explicit 300-image benchmark as task-local performance proof.

**QA impact:** combined transport and portability planning is expected to select
the bounded ten-pack closure: `project_management`,
`durable_project_repository`, `project_event_transport`, `flow_graph`,
`flow_export`, `live_flow_testing`, `layered_schema`,
`property_set_flow_sections`, `guided_test_cases`, and `shell`. The exact
changed-path planner remains authoritative and may make a bounded adjustment for
the settled reconstruction; it does not add the scale benchmark to unrelated
packs or authorize an all-20 feature-mode run. Package proof remains required.

The canonical task name is `flow-visual-asset-portability`. Routine RepoWise
scouting remains stopped. The implementation-and-review elapsed effort ceiling is
360 minutes from coder receipt to an architect `qa-ready` candidate. At 180
minutes, report migration and archive round-trip status, whether route loading and
unrelated saves record zero body work, benchmark readiness or result, variance
cause, remaining security and installed-flow work, confidence, and forecast.
Continue bounded work unless product scope, requirements, safety, or the credible
completion path changes.

## Deferred decisions

Cross-project body deduplication, remote asset hosting, cloud synchronization,
multiple-image galleries, image editing, OCR, AI interpretation, and OPFS storage
are excluded. OPFS may be reconsidered only if the explicit benchmark shows that
project-scoped IndexedDB Blob records cannot meet this workload without changing
the portable contract.

## Flow visual thumbnail save-settlement correction

The user reported that selecting Thumbnails immediately after saving a Flow
concept visual can leave the item at Preparing preview and reject background
hydration with `NotFoundError: Original visual body ... is unavailable`, while
activating the same placeholder or fallback badge still opens the correct image
in the viewer. The current paths explain that split: the viewer can resolve the
just-staged bytes from the active project projection, while visible-thumbnail
hydration launches an unobserved durable body read before the corresponding
Draft transaction is guaranteed to have committed. A rejected hydration is
removed from the in-flight map without settling or retrying its rendered
placeholder.

Directional Flow scenario 049 and its runtime partner correct this
save-settlement race for both Page-instance and Event-occurrence attachments.
The pending placeholder and labelled fallback badge remain operable from the
staged image. Once the matching Draft commits, the same visible attachment
automatically becomes a contained 16-to-10 thumbnail without another mode
change, reload, or user action. Promise rejection is observed rather than left
unhandled. The correction must not disguise a genuinely missing committed
original as success: save failure retains the existing durable failure surface,
and later hydration may succeed only from matching staged bytes or a committed
body for the same project, asset identity, and digest.

The correction preserves the canonical original, attachment metadata, visual
display state, content-addressed body identity, bounded disposable thumbnail
cache, viewer behavior, and storage diagnostics. It does not add a project
command for display-mode changes, duplicate original bytes, create more than one
thumbnail record for the same asset, eagerly hydrate off-screen images, or make
thumbnail cache entries portable project content.

**Development focus:** start in `src/data-layer-flow-graph-ui.ts` at the
visible-thumbnail hydration and durable-save settlement boundary, with
`src/flow-graph/concept-visual-workspace.ts` as the existing presentation
partner. Add deterministic direct coverage that holds one matching visual Draft
save before commit, proves no premature unavailable-body read or unhandled
rejection, releases it, and observes automatic coalesced thumbnail settlement.
Extend the installed `FLOW_WORKSPACE_AUTHORING_TARGET` proof with runtime 049 for
both pending invokers and preserve the existing runtime 034 and 035 storage,
visibility, viewer, and bounded-hydration observations. Do not change durable
repository or archive semantics unless direct evidence disproves the diagnosed
UI settlement race.

**QA impact:** the likely shared integration surfaces are the existing
`flow_graph` boundaries `flow_graph_semantic_model` for
`src/data-layer-flow-graph-ui.ts` and `flow_workspace_surface_composition` for
`src/flow-graph/concept-visual-workspace.ts`. No new source prefix is proposed.
Forecast `flow_graph`, `flow_export`, `live_flow_testing`, and
`property_set_flow_sections`; the coder must run read-only ownership intent
before product coding and the exact changed-path plan remains authoritative.
Because this task explicitly changes the hydration boundary, run the settled
300-image benchmark once after the candidate settles and retain its new boundary
fingerprint. The benchmark remains task-local and outside routine packs.

For the settled candidate, run focused review evidence and package proof with:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack flow_export \
  --pack live_flow_testing \
  --pack property_set_flow_sections \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence flow-visual-thumbnail-save-race
node scripts/package.mjs
```

The canonical task name is `flow-visual-thumbnail-save-race`. Feature mode does
not authorize an all-runnable-pack checkpoint, and routine RepoWise scouting
remains stopped. The implementation-and-review elapsed effort ceiling is 180
minutes. At 90 minutes report the exact changed-path plan, held-save direct and
installed evidence, runtime 034/035 conservation, benchmark status, any forecast
variance, remaining work, confidence, and completion forecast. Continue while
product requirements and safety remain unchanged and a bounded completion path
exists.

## Flow nested-Event thumbnail containment correction

Status: QA-integrated at `fa88b18992` after exact `flow_graph`, `flow_export`,
`live_flow_testing`, and `property_set_flow_sections` review-ready evidence.

The user reported that a concept-visual thumbnail on an Event occurrence nested
inside a Page frame covers the Event's existing content instead of enlarging its
container. The current presentation path gives thumbnail height to Page-frame
relationship endpoints only. Event occurrences retain their compact fixed height,
so the thumbnail is positioned into the title, interaction detail, and Derived
JSON example disclosure. The Page frame is also projected from that compact child
height and cannot contain a correctly expanded Event card.

Directional Flow scenario 051 and its runtime partner make the nested geometry
explicit. At near semantic detail in Thumbnails mode, the Event card places its
complete 16-to-10 preview after its ordinary content without intersection. The
containing Page frame grows around the complete Event card with its existing
child padding; relationship anchors derive from the expanded Page frame and the
canvas presentation bounds contain it. Returning to Badges removes only the
thumbnail-specific Event and Page height increments. Stored coordinates,
topology, project bytes, Draft revision, and Undo history remain unchanged.

This correction does not change image validation, save settlement, asset-body or
thumbnail-cache storage, attachment metadata, viewer behavior, visual-display
mode persistence, Tidy, or canonical item placement. It preserves scenarios 034,
035, and 049, including complete-image containment and the pending-preview path.

**Development focus:** begin with the presentation geometry shared by
`src/flow-graph/projection.ts`, `src/data-layer-flow-graph-ui.ts`, and
`src/flow-graph/concept-visual-workspace.ts`. Give Event occurrences one
authoritative rendered height, propagate a contained Event's rendered footprint
into its Page frame before Page anchors and canvas bounds are derived, and keep
the stored position and containment model untouched. Add deterministic direct
coverage in `test/data-layer-flow-graph-test.mjs` and
`test/data-layer-flow-workspace-test.mjs`. Extend the installed
`FLOW_WORKSPACE_AUTHORING_TARGET` proof in
`test/support/flow-workspace-r02-runtime.mjs` with runtime 051, measuring
non-intersecting content and thumbnail rectangles, two-level containment, anchor
placement, compact-mode restoration, and serialized-state conservation.

**QA impact:** the likely existing shared integration surfaces are parent pack
`flow_graph` boundary `flow_graph_semantic_model` for
`src/flow-graph/projection.ts` and `src/data-layer-flow-graph-ui.ts`, and parent
pack `flow_graph` boundary `flow_workspace_surface_composition` for
`src/flow-graph/concept-visual-workspace.ts`. The former propagates to the
existing `flow_export`, `live_flow_testing`, and
`property_set_flow_sections` consumers; the latter remains local to
`flow_graph`. No new source prefix is proposed, and no stopped coherent candidate
contributed integration paths at specification time. Stopped coherent product
reference `698d68d2` now contributes known changes in
`src/data-layer-flow-graph-ui.ts`, `src/data-layer-flow-graph.ts`,
`src/flow-graph/concept-visual-workspace.ts`, and
`src/flow-graph/projection.ts`, plus the shared evidence paths dispositioned
below. The coder must run read-only ownership intent before product coding; the
exact changed-path plan remains authoritative, and a `coarse-boundary` result
requires independently reviewed ownership preparation. This geometry-only task
does not rerun the 300-image storage benchmark.

For the settled candidate, run focused review evidence and package proof with:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack flow_export \
  --pack live_flow_testing \
  --pack property_set_flow_sections \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence flow-nested-event-thumbnail-containment
node scripts/package.mjs
```

The canonical task name is `flow-nested-event-thumbnail-containment`. This
feature-mode slice does not authorize the all-runnable-pack gate. Routine
RepoWise scouting remains stopped and is not part of the handoff.

The implementation-and-review elapsed effort ceiling is 90 minutes from coder
receipt to an architect `qa-ready` candidate. At 45 minutes, report direct and
installed Event-content separation, Event-in-Page containment, relationship and
canvas geometry, compact-mode restoration, current exact packs and tasks,
failures, remaining work, confidence, and forecast. Continue bounded work under
the QA pilot unless product scope, safety, or authority changes.

## Flow nested-Event thumbnail evidence-contract repair stage

Status: QA-integrated at `f831dfc239` after fresh exact `flow_graph` and `shell`
review-ready evidence; the conserved product remainder was subsequently
QA-integrated at `fa88b18992`.

The first coherent product lineage for
`flow-nested-event-thumbnail-containment` reached candidate `c5cacaf242` from
approved QA base `ce7cc6083c`; stopped coherent reference `698d68d2` adds the
generated presentation-height property conservation. Product and installed
runtime evidence now require runtime keys 001 through 051, but the shared Flow
acceptance handler and its complete-evidence fixture still stop at runtime050.
Read-only intent therefore classified the product plan as
`granularity-assessment-required`: these two unrelated evidence-contract paths
add the Shell task family, expanding the original four-pack/71-task forecast to
five packs/153 tasks. The product/runtime boundary is sound, the seam is exact,
and a two-path preparation avoids repeatedly exposing the product review to that
unrelated Shell failure surface.

Standing outcome-bounded authority activates independent task
`verification-slice-flow-nested-event-thumbnail-containment` from current QA.
It advances the handler and fixture exclusive range ends from 51 to 52 so the
acceptance contract requires, and complete evidence contains, exactly
runtime001 through runtime051. Direct assertions must prove complete evidence
passes and that omitting or falsifying runtime051 fails. Existing non-vacuity,
earlier-key rejection, and installed-boundary requirements remain intact; the
repair neither invents runtime052 nor weakens another evidence leaf.

The preparation owns only these two exact causal-path dispositions:

1. `acceptance/src/acceptance/steps/flow_graph.clj` remains the existing
   `flow_graph` acceptance-handler seam and advances only its required-key
   range. Its additional Shell selection is the current process-parent fallback;
   no new source prefix is warranted for a one-line feature-contract boundary.
2. `test/acceptance/flow_graph_steps_test.clj` remains the Shell-owned direct
   fixture for that handler and advances only its matching complete-evidence
   range plus runtime051 omission and falsification assertions. The Shell parent
   fallback is deliberate because this test path introduces no reusable product
   source boundary.

The candidate must retain those one-to-one dispositions for independent review.
It must not include product TypeScript, generated artifacts, the presentation-
height property, browser evidence, feature files, registry changes, or another
verification declaration. All such changes in stopped reference `698d68d2`,
including the `c5cacaf242` product delta, remain the conserved product remainder.
After architect `qa-ready` integration, the specifier records the reviewed slice
repair when applicable, reapplies that exact remainder to the new QA head, and
reissues stable task `flow-nested-event-thumbnail-containment` without another
user decision or duplicate evidence-range edits.

**Development focus:** begin and end with
`acceptance/src/acceptance/steps/flow_graph.clj` and
`test/acceptance/flow_graph_steps_test.clj`. Direct proof runs the
`acceptance.flow-graph-steps-test` namespace and demonstrates that one complete
runtime001-through-runtime051 map passes while omission or falsification of
runtime051 fails. No Gherkin acceptance mutation is authorized.

**QA impact:** the exact preparation surfaces are the existing parent pack
`flow_graph` acceptance handler and the Shell process-parent fixture. No new
source prefix or verification-slice declaration is proposed. Read-only intent
and exact candidate preflight remain authoritative, but the expected focused
preparation plan is `flow_graph,shell` with properties and package proof:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack flow_graph \
  --pack shell \
  --property \
  --changed-since <approved-preparation-specification-commit> \
  --prepare-evidence verification-slice-flow-nested-event-thumbnail-containment
node scripts/package.mjs
```

The preparation implementation-and-review elapsed effort ceiling is 60 minutes
from coder receipt to architect `qa-ready`. At 30 minutes, report the two exact
changed paths, runtime051 inclusion and omission/falsification rejection,
durable path dispositions, exact packs and tasks, product-remainder conservation,
failures, remaining work, confidence, and forecast. Continue while the change
remains evidence-contract-only and coverage is preserved; product scope, weaker
evidence, unavailable ownership, or a genuinely global plan stops for current
direction. No all-runnable-pack feature checkpoint is authorized.
