# Complete configuration portability R01

Status: user-approved on 2026-09-13 for implementation and focused QA integration.
Approval includes complete configuration export, one quick setup import, the
existing-flow repairs, and Cancel / Import only non-conflicting items / Replace
all conflicts. No further behavior approval is needed within this scope.
Task: `complete-configuration-portability`. Mode: feature integration into QA.
Start from the specification commit carried by the handoff, above accepted QA
`44bcfa4885`; master promotion is separate.
Evidence: `docs/configuration-portability-review-R01.md`.

Current routing: coder intent on 2026-09-13 selected immediate independent
preparation in note 20260913T071531Z_000077_from_coder. Product coding is paused
with no implementation delta. Follow
docs/configuration-portability-ownership-preparation-R01.md under task
verification-slice-complete-configuration-portability. Resume this same product
task only after architect-reviewed preparation reaches QA; no new behavior
approval is needed. The original specification and all conflict choices remain.

## Outcome

Export the complete portable configuration as one ZIP. A colleague selects the
file and uses one Set up from configuration action to install its complete
contents. No separate imports for each project, library, or asset are required.
The review shows counts, size, included sections, compatibility, and exclusions
without exposing storage internals or requiring per-project choices.

Include all saved projects, their Saved Drafts and retained Published revisions,
Flows, fixtures, project source/transport settings, global saved schemas and
reusable rules, event libraries, saved capture/session archives, documentation
templates and bodies, original images and their references, and portable utility
preferences including hotkeys. Preserve shared dependencies once and all links.
Inventory every persisted application-owned domain before implementation. Each
must have an explicit included representation or a named exclusion with reason;
new or unknown domain data must not silently disappear from a complete export.

Exclude browser-granted permissions, active tab/window identities, live debugger
connections, running capture/replay state, temporary caches, Undo/Redo stacks,
verification artifacts, and raw migration recovery copies. Preserve saved
session data independently of running capture state. Regenerate thumbnails from
originals if needed. Report exclusions in the export preview and archive manifest.
An unsaved failed command must block a claim of complete current configuration
until the operator retries or discards it; never silently label an older snapshot
as the current complete configuration.

## Package and setup

Use a distinct versioned configuration archive format with manifest, producer
build identity, supported feature requirements, domain versions, counts, and
content digests. Reuse the existing archive and asset mechanisms. Keep metadata
and binary bodies separate within the ZIP and deduplicate identical bodies.
Verify a consistent export snapshot across projects and shared libraries. Changes
during export must yield one coherent snapshot or a clear retry, not mixed links.
Provide progress and cancellation with bounded memory use and stated size limits.

A fresh installation shows one Import configuration action in quick setup. File
selection performs inspection without changing local data. A valid archive shows
one Set up from configuration button. Its single click imports all sections;
there are no additional project/library confirmation loops. Opening a file alone
does not mutate data. Invalid input names the failing section and repair action.
After success and reload, all included content is usable. Restore the source
active project on a fresh installation, but do not start capture or request device
permissions automatically.

User-selected conflict policy: offer Cancel, Import only non-conflicting items,
and Replace all conflicts. Cancel writes nothing. Non-conflicting import skips
conflicting records and any dependent items that cannot retain their source
meaning without those records; list the skipped dependency groups. Do not bind
an imported reference to different recipient content merely because its ID matches.
Replace all conflicts uses incoming versions for every reviewed conflict and
imports the non-conflicting items, while preserving unrelated recipient data.
Check references from retained recipient content before commit; block replacement
if it would leave that content invalid. Treat projects and their owned parts as
one conflict unit, shared library records as dependency-aware units, and portable
settings as named keys. Same stable identity with different content is a conflict;
identical content is a no-op. Name collisions must be visible and resolved by the
same review, not silently renamed. Retain recipient active project when valid.
Repeated identical imports offer a no-change result. Replace all conflicts does
not mean delete unrelated recipient configuration. No import-as-copy option is
required by this request.

Validate all versions, feature requirements, digests, assets, references, and
conflicts before commit. Publish no partial setup: interruption, quota failure,
invalid assets, or cancellation leaves the prior visible configuration intact
after reload. Reuse durable staging/transaction patterns. Cross-store visibility
must be one committed configuration, not a sequence of exposed partial imports.
Import writes no data to external services and does not activate imported targets.

## Existing-flow repairs in the same program

- Projects and Studio use the same portable project ZIP writer and import
  inspection. Images alone must trigger complete asset export; do not base ZIP
  selection only on Excel templates. Preserve template bodies on every import.
- All project file pickers advertise supported JSON and ZIP files consistently.
- Recognize existing Studio state JSON, durable project bundles, project ZIP,
  schema library backups, and repository recovery JSON by content, not extension
  alone. Route supported project formats to the appropriate migration/review;
  identify narrower library formats and offer the correct library import flow.
- Existing repository recovery JSON must be inspectable through the unified
  importer. Import available projects and libraries together only when dependency
  validation proves them complete. When an older backup lacks binary bodies,
  block before commit and ask for a new complete export. Never invent lost assets.
- Rename the legacy recovery export to make its recovery-only limits clear;
  present Export complete configuration as the normal all-data transfer action.
  Rename Schema Library Extension backup to Schema Library backup.
- Make schema Append collision behavior explicit in review. Apply the same Cancel,
  Import only non-conflicting items, and Replace all conflicts choices. Any replace
  choice names exactly which records change and requires confirmation.
- Retain standard JSON Schema export as an external interoperability format.
  Explain that it is not a configuration backup and report unsupported rules.

## Implementation and verification boundaries

Use separate modules for archive format/validation, domain adapters, staging and
commit, and UI. Do not expand specification-builder.ts or the durable repository
monolith with the new implementation. Small integration calls may delegate to
new modules; decompose the affected responsibility where needed. No new daemon,
permissions, remote account service, or verification framework is requested.

Likely shared paths: src/durable-project/project-library-transport-v2.ts,
src/data-layer-durable-project-repository.ts, src/data-layer-project-library-ui.ts,
src/specification-builder.ts, src/flow-visual-archive-export.ts,
src/flow-visual-asset-portability.ts, src/data-layer-installed/schemas/library-import-policy.ts,
src/data-layer-installed/schemas/library-export-policy.ts, side-panel.html,
specification-builder.html, and portable library/session/hotkey storage adapters.
Proposed new prefix src/configuration-portability/ is subject to canonical ownership
intent; assign its focused format, repository, and UI responsibilities before code.
Likely parents are durable_project_repository, project_management, schemas,
event-library, capture, hotkeys, shell, and applicable documentation/Flow owners.
Exact consumers and slices must be obtained from canonical path/intent queries,
not inferred from this forecast. Preserve all declared consumers. A mandatory
coarse-boundary result routes independently reviewed ownership preparation first.

Development focus: deterministic archive round trips and malformed-file tests;
two isolated repositories; UI native-input setup and reload. Use a rich fixture
with two linked projects, global schemas/rules, event library, saved session,
image-only project, Excel template, published history, and hotkeys. Compare the
complete included-domain inventory and asset digests, not just object counts.
Permanent browser tests must use actual exported files and the production import
controls on both Projects and Studio. Avoid temporary proof as the sole coverage.

Settled evidence uses the exact focused plan, properties, and package proof through
ordinary coder/refactorer/architect review into QA. No all-pack feature gate.
Initial effort forecast: eight hours to a review-ready candidate, with a four-hour
assessment. This is a reporting estimate; continue bounded work and report variance.
Keep package/asset fixes and setup integration reviewable as separate commits.

Contracts: features/complete-configuration-portability.feature and
features/complete-configuration-portability-runtime.feature. Specification checks
are separate from implementation, fresh-profile runtime proof, and master delivery.

## Initial specification checks

Both contracts passed the vendored Gherkin parser on 2026-09-13. The IR DRY
checker reported zero findings for each. There are eight scenarios across the
two contracts. Shared setup uses Background; every example column varies.
No acceptance mutation, product gate, or runtime proof was run for this proposal.

Initial canonical path queries at QA `44bcfa4885` confirm that the durable project
transport has parent fallback under durable_project_repository. Its current plan
also includes flow_graph, flow_export, live_flow_testing, layered_schema, and
property_set_flow_sections. The schema library import policy has parent schemas,
slice schema_library_lifecycle, with installed-controller consumer slices in
defects, project_assurance_severity, guided_test_cases, and shell. These findings
extend the forecast above; they are not a complete intent plan for all new paths.
Complete the remaining exact intent classification before product coding.

## Approved handoff ownership forecast

Additional canonical queries on the same accepted QA head establish:

| Likely path | Parent and current slice | Required coverage or consumer closure |
| --- | --- | --- |
| src/data-layer-durable-project-repository.ts | durable_project_repository; parent fallback | durable_project_repository, flow_graph, flow_export, live_flow_testing, layered_schema, property_set_flow_sections |
| src/data-layer-project-library-ui.ts and src/flow-visual-archive-export.ts and src/flow-visual-asset-portability.ts | project_management; parent fallback | project_management, durable_project_repository, project_event_transport, flow_graph, flow_export, live_flow_testing, layered_schema, property_set_flow_sections, guided_test_cases, shell |
| src/specification-builder.ts | schemas; schema_builder_reorder_adapters | schemas, defects, live_flow_testing, project_assurance_severity, guided_test_cases, shell |
| src/data-layer-installed/schemas/library-export-policy.ts | schemas; schema_library_lifecycle | Same four installed-controller consumer slices as library-import-policy.ts above |
| side-panel.html | shell; utility_workspace_host | Installed-controller consumers in capture, event-library, schemas, defects, replay, project_management, durable_project_repository, project_event_transport, live_flow_testing; utility_host_consumer in hotkeys and command-palette; utility_entry_consumer in verification_process |
| specification-builder.html | shell; parent fallback | All 21 runnable packs in this query; mandatory preparation if an actual change retains this classification |
| src/hotkey-keymap.ts | hotkeys; parent fallback | hotkeys and shell |

The existing Studio file picker already accepts JSON and ZIP. A template change
is not assumed necessary merely because the source path appeared in investigation.
The coder must identify actual intended edits, retain every required owner, and
run read-only intent before coding. Do not edit an all-pack path and then run all
packs in feature mode. A required all-pack/coarse boundary must first receive
independently reviewed ownership preparation under the standing authority.

Proposed new module ownership, subject to intent validation: configuration archive
format, validation, and domain inventory under project_management with a proposed
configuration_portability slice; durable staging/commit under
durable_project_repository with a proposed configuration_commit slice; quick-setup
UI under shell with a proposed configuration_setup slice. Direct consumers are
the Projects and Studio import/export adapters, global Schema and Event Library
adapters, saved-session adapter, and hotkey settings adapter. Existing parent
closures above remain the conservative forecast until canonical declarations
prove exact consumers and any independently reviewed preparation is accepted.
These proposed names do not claim that those slices already exist.
