# Project Library transport-port isolation R01

Status: QA-integrated as part of combined candidate `1b192105a8`

Prepared: 2026-08-15

Approved by the user: 2026-08-16

## Purpose

Create a narrow installed Project Library transport boundary before resuming the
Flow visual-asset portability candidate. The boundary must let project export and
import evolve from version 2 JSON to the approved version 3 archive without
editing the global `src/side-panel.ts` composition root.

This is the internal VTD-008 enabling checkpoint for the approved Flow
visual-asset portability delivery in QA feature-integration mode. By itself it
does not implement the version 3 archive, change stored project bytes, authorize
the 300-image benchmark, promote QA to master, or authorize an all-20 run.

## Observed baseline and stop reason

The approved portability specification is commit `1dc562413b`. Candidate
`652ca79415` implements the archive and passed build, package, five
project-management unit tests, five property tests, and the explicit
300-image/~154 MB benchmark. The benchmark observed a 64 KiB maximum export
chunk. Those results are useful implementation evidence, but no review-ready
receipt exists.

Exact changed-path planning for that candidate selects all 20 packs and 849
tasks. Removing only `src/side-panel.ts` and its generated outputs from the
change set selects the bounded ten-pack closure and 228 tasks. The source root is
therefore the sole all-pack expansion. Its current change is required to pass new
archive callbacks into the installed Projects UI, so neither omitting its owned
packs nor deleting the installed behavior is acceptable.

The original candidate remains stopped and preserved. Transport candidate
`eb3ada75` proved the bounded port without a composition-root or architecture-
ledger change, but cannot truthfully record standalone review-ready evidence:
its selected Project Management pack also executes the already-active version 3
portability scenarios. The user therefore approved combined sequencing on
2026-08-16. Preserve `eb3ada75` as an internal checkpoint, resume the portability
implementation on top, and produce one corrected descendant whose
`src/side-panel.ts` change is absent before review-evidence preflight.

## Settled boundary

The durable Project Library host that is already passed to
`mountProjectLibraryUi` exposes an explicit typed transport capability alongside
its key/value projection operations. No second composition-root argument is
needed. The capability is supplied directly on that injected host; it is not a
global singleton, service locator, module-load side effect, function property,
opaque token registry, DOM lookup, or import of a concrete repository by the UI.

The transport port owns durable transport work:

- prepare one export with its media type, extension, estimated bytes, and a
  bounded cancellable writer;
- inspect and validate one selected import source before presenting its review;
- expose the source format, source name, entity counts, integrity result,
  migrations, and proposed target identity needed by that review; and
- commit one confirmed import atomically while reporting bounded progress.

The Projects UI owns operator interaction: the Export and Import controls,
selected file, status and progress text, writable-file picker, bounded browser
download fallback, target-name field, review and confirmation dialog, error
presentation, cancellation, and focus return. It does not own project
serialization, archive entries, hashing, durable transactions, or asset bodies.

The port uses one prepared operation from inspection through completion. Export
preparation occurs once and its writer starts at most once. Import inspection
occurs once per selected source and confirmation commits that exact staged
operation at most once. Cancelling, rejecting, or closing a review commits
nothing and releases staged resources. A failure cannot fall through to the
legacy path and repeat the operation.

## Compatibility behavior in this slice

The installed durable runtime supplies a version 2 adapter using the existing
repository export and import behavior. The UI prefers that typed port when it is
present. The existing callback options remain as a temporary compatibility path
for isolated fixtures and non-durable hosts that do not expose the capability;
they are never invoked when the installed port is present.

This slice keeps the current version 2 JSON filename, media type, project review,
import-as-new remapping, inactive imported project, status, failure, cancellation,
and focus behavior observably unchanged. It adds no IndexedDB store or migration,
writes no project merely by mounting or inspecting an export, and changes no
Draft, Published revision, Undo history, active identity, storage namespace, or
browser permission.

The port types deliberately admit the already approved version 3 source and
bounded writer shapes, but this slice does not switch normal export to ZIP, accept
ZIP import, implement asset transport, or claim the portability scenarios. Those
changes remain owned by `flow-visual-asset-portability` after this prerequisite
is QA-integrated.

## Architecture and ownership

The reusable contract belongs in a project-scoped module such as
`src/data-layer-project-library-transport.ts`. The durable runtime adapts its
repository to that contract. `src/data-layer-project-library-ui.ts` consumes only
the injected contract and UI/browser adapters. Neither the contract nor the UI
imports `src/side-panel.ts`, a concrete IndexedDB backend, Flow rendering, or
shell composition state.

`src/side-panel.ts` and its generated output remain byte-identical in this slice.
The resumed portability candidate must also restore them to the approved base.
Direct future changes to the transport contract or adapter retain the declared
project and durable consumers; this slice does not narrow the genuine global
impact of a later direct `src/side-panel.ts` change.

## Evidence conservation and verification scope

One focused unit leaf proves direct capability injection, installed-port
preference, compatibility fallback, exact operation cardinality, cancellation,
failure without fallback, staged-resource release, and absence of composition-root
or global-registry access. Existing Project Library unit, property, acceptance,
and installed browser evidence remains registered and unchanged. No active
portability scenario is tagged out, unregistered, stubbed, or omitted to make the
internal checkpoint appear independently review-ready.

**Development focus:** start with the transport contract, a version 2 in-memory
adapter, and direct UI/runtime tests. Prove one export preparation/write and one
import inspection/commit, plus cancel and failure paths, without constructing the
complete side panel. Then prove the existing version 2 installed export/import
behavior through the project-management browser target.

**QA impact:** ordinary planning for the current Project Library controller and
durable runtime paths selects `project_management`,
`durable_project_repository`, `project_event_transport`, `flow_graph`,
`flow_export`, `live_flow_testing`, `layered_schema`,
`property_set_flow_sections`, `guided_test_cases`, and `shell`. The current
property-enabled plan is 226 tasks before the one new focused unit leaf, so the
expected settled plan is approximately 227 tasks followed by package proof. The
exact changed-path planner remains authoritative. Any `src/side-panel.ts` change
or expansion to all 20 packs stops this slice before task launch.

The transport-only command remains useful as a diagnostic, but it cannot create
review-ready evidence until the portability behavior satisfies every active
scenario in the selected Project Management pack. The combined candidate uses
the exact bounded plan and evidence task defined by
`docs/flow-concept-visual-asset-storage-portability-R01.md`.

The former standalone expected review-ready form was:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack project_management \
  --pack durable_project_repository \
  --pack project_event_transport \
  --pack flow_graph \
  --pack flow_export \
  --pack live_flow_testing \
  --pack layered_schema \
  --pack property_set_flow_sections \
  --pack guided_test_cases \
  --pack shell \
  --property \
  --changed-since <approved-isolation-commit> \
  --prepare-evidence project-library-transport-port-isolation
node scripts/package.mjs
```

The internal checkpoint name is `project-library-transport-port-isolation`; the
combined review-evidence task is `flow-visual-asset-portability`. Routine
RepoWise scouting remains stopped. The 300-image benchmark does not run for the
transport checkpoint alone. It runs once on the settled combined candidate
because that candidate explicitly develops the asset-store and archive boundary,
then reruns only after a change to its measured fingerprint.

## Effort, payoff, and stop condition

The transport checkpoint reached a bounded candidate before standalone evidence
exposed the active-scenario sequencing conflict. Forward work now uses the
360-minute combined ceiling and 180-minute checkpoint in the portability
specification. That report includes whether the installed port remains preferred
without changing `src/side-panel.ts`, current version 2 round-trip and
cancel/failure status, exact planned packs, variance cause, remaining work,
confidence, and forecast.

The expected payoff is immediate: the preserved portability candidate can be
corrected from the 849-task all-pack route to the bounded project/durable closure,
while later Project Library transport changes avoid the global composition root.
This is a structural prediction, not a claimed delivery-time saving. Its payoff
is accepted only if the combined portability candidate has no
`src/side-panel.ts` diff, exact planning remains bounded, and installed version 3
export/import reaches review-ready evidence.

Stop and return for user direction if the capability cannot remain injected
through the existing host without a composition-root change, if a global registry
or hidden side channel becomes necessary, if exact combined planning reaches all
20 packs, or if no credible bounded path remains. The combined portability work
may deliberately migrate version 2 bytes only as specified by its approved
contract. Do not weaken ownership, omit a selected pack or scenario, or call an
all-20 feature run focused.

## Deferred work

Version 3 archive behavior, visual-asset bodies, migration, archive security,
thumbnail/viewer hydration, scale benchmarking, and conditional release
fingerprints remain in
`docs/flow-concept-visual-asset-storage-portability-R01.md`. Broader Project
Library controller extraction, other VTD-008 controllers, registry redesign, and
master integration remain inactive.
