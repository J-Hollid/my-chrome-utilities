# SwarmForge active scope

This document is the compact authority and routing manifest for current
SwarmForge work. Read it before data-layer specification work and before making
handoff lineage decisions. After selecting a task, read only its named feature,
program, and verification entries.

The former 4,353-line scope is preserved in
`docs/swarmforge-active-scope-history-2026-08-11.md`. It is historical evidence,
not current authority, and must not be loaded during ordinary role startup or
used to reactivate completed, rejected, or archived work.

## Current program state

The current integrated VTD-008 implementation baseline is
`ad002047a321d58976c0d8cd5c56dde46a1389d0`.
The settled-candidate verification workflow is integrated at
`bdd29f8c87ba04638393e204c3f14a99d9b19201`.

| Program | Current state | Next authority |
|---|---|---|
| Serena development pilot | User-approved on 2026-09-05 for coder implementation | Implement task `serena-development-pilot` under `docs/serena-development-pilot-R01.md`: optional Serena per worktree, bounded startup reading, and the read-only canonical ownership query. Use its three feature contracts, development focus, and `shell` / `verification_process` QA forecast. Run ownership intent before coding; use normal product and process work without repeated comparison tasks. |
| QA-branch release pilot | Active; first cumulative promotion completed at `70c94a8ce6` on 2026-08-21; natural-lull promotion timing is confirmed and artificial task-count or calendar thresholds are prohibited | `docs/qa-branch-release-pilot-R01.md` controls feature integration into `qa`, natural-lull master promotion, the settled first-promotion scorecard, and required pre-promotion checks; `docs/feature-development-focus-and-advisory-scouting-R01.md` controls the lightweight scoping convention and completed Trial 4 decision. |
| Verification temporary data and receipt lifecycle | Drafted from the user-approved `/tmp` lifecycle direction on 2026-08-31; coder handoff awaits explicit approval | Under `docs/verification-temporary-data-and-receipt-lifecycle-R01.md`, keep `/tmp` execution-scoped, clean owned run and role data after durable disposition, let the specifier retain exact receipts only while an authorized consumer or active incident needs them, and remove raw evidence after its last use. Use feature-mode focused evidence only. |
| QA verification ownership readiness | QA-integrated through durable-runtime staging disposition repair `06222ff00f` | Preserve causal `granularity-assessment-required` routing, reviewed seam-or-parent-fallback dispositions, and autonomous product resumption without an all-20 feature run. |
| QA verification granularity ratchet | Judgment-based deferral, append-only observations, explicit pre-promotion portfolio intake, and fail-closed freeze enforcement are QA-integrated at `0b4f8b4a9d` | Apply structured judgment to real bounded coarse findings, retain conservative evidence for deferrals, and review every observation at the next user-requested master promotion; preserve mandatory all-pack preparation and one final all-runnable-pack gate. |
| QA verification pack taxonomy evolution | Bounded focused evidence reaffirmed by the user on 2026-08-21; three mechanical genuinely-global declarations are audit-only and prohibited | Reissue `registry-derived-verification-packs` from the exact correction commit. Keep `scripts/verification-reliability-values.mjs` and `scripts/verification-reliability-receipts.mjs` unchanged; compose terminal-repair defaults under the slice-owned cardinality adapter; retain `scripts/verification-pack-cardinality/` only under the Shell-owned slice with no registry pack consumers; prove executable synthetic registries and the specification-bound focused route; and do not request the same acceptance again while that scope is conserved. |
| SwarmForge outcome-bounded autonomy, priority unblockers, and stacked campsite ratchet | Core mechanics are QA-integrated; specification-only prerequisite ancestry prematurely resumed Event Library generation `56b862f0012f` | Implement `docs/campsite-implementation-prerequisite-gate-R01.md`: require immutable architect-reviewed implementation satisfaction at the exact QA head, append-only quarantine premature result `9273c9c903`, and conserve the original product stack for a successor resumption. |
| Defect consolidation | User-approved scope reset active; the 70k-line coder candidate and diagnostic hardening sequence are rejected and remain unintegrated | Implement only structured repair-family, fixed-boundary, non-empty defect-list, and discovery-complete validation plus shared role rules. Start clean from the replacement QA specification, finish within the 90-minute ceiling, and measure Event Library plus two later product tasks before retaining or expanding it. |
| QA-pilot verification latency correction | Closed after Slice 2 at `e32f9f7c10` by user decision on 2026-08-13 | No coder handoff. Measure the next three ordinary QA product cycles; Slices 3 and 4 remain evidence-triggered backlog items. |
| QA style verification and Flow modularity | Complete on QA; stage-aware style planning is integrated at `d75132daef`, Flow CSS extraction at `ef440b3018`, corrections through `66dcdfd5d6`, and port snap at `89fee7df48` | Preserve the settled scorecard; do not reopen the abandoned mixed lineage or run all 20 before an explicit master-integration request. |
| Flow click and drag-ownership correction | QA-integrated at `2b2cf06b45` on 2026-08-16 | Preserve directional Flow scenarios 043–045 and their runtime partners; cumulative promotion to `master` remains a separate release decision. |
| Flow instance schema route-lifecycle correction | QA-integrated at `aa19396f45` on 2026-08-16 | Preserve directional Flow scenario 046 and its runtime partner, including ordinary route departure, stable contributor reopening, and Return to Flow behavior. |
| Flow instance schema-editor scrolling correction | QA-integrated at `736823be2d` on 2026-08-18 after exact 3-pack/147-task review evidence | Preserve directional Flow scenario 047 and its runtime partner for both Page-instance wheel traversal and Event-occurrence keyboard traversal; cumulative promotion to `master` remains a separate release decision. |
| Flow derived JSON array-example correction | QA-integrated at `b11b4a4356` on 2026-08-22 after exact 4-pack/71-task review evidence | Preserve directional Flow scenario 048 and its runtime partner; wildcard item segments materialize as arrays in derived Page-instance and Event-occurrence JSON, sibling values share one item, and cumulative promotion to `master` remains separate. |
| Flow visual thumbnail save-settlement correction | User-approved for coder handoff on 2026-08-22 | Add directional Flow scenario 049 and its runtime partner under `docs/flow-concept-visual-asset-storage-portability-R01.md` as task `flow-visual-thumbnail-save-race`; keep the just-saved viewer and pending preview operable, settle the same preview automatically after its durable save, preserve one original body and a bounded thumbnail cache, and use the focused `flow_graph`, `flow_export`, `live_flow_testing`, and `property_set_flow_sections` forecast with no all-runnable-pack gate. |
| Flow Page-card effective-name correction | QA-integrated at `d6f44d355e` after the runtime050 prerequisite and exact `flow_graph`/22-task product evidence | Preserve directional Flow scenario 050 and its runtime partner: one visible effective Page name, Flow override precedence, no visible context/source identity lines, accessible source and context semantics, and unchanged readiness/actions/ports/state. Cumulative promotion to `master` remains a separate release decision. |
| Flow nested-Event thumbnail containment correction | QA-integrated at `fa88b18992` after the independent Page-group display-path repair, runtime051 evidence-contract slice, and exact four-pack/71-task product evidence | Preserve directional Flow scenario 051 and its runtime partner: a nested Event thumbnail follows ordinary content without overlap, its Page frame and downstream anchors/bounds expand around it, Badges restores compact geometry, and stored state remains unchanged. Cumulative promotion to `master` remains separate. |
| Data Layer Live target permission recovery | QA-integrated at `896e7a4f32` after both ownership preparations and eleven focused product tasks across five causal owners; the broad side-panel callback remained unchanged and no all-runnable-pack checkpoint ran | Preserve product scenario 009 and runtime scenario 002: a failed exact probe retains the selected target and exposes current-step `Request access`; an exact-origin grant rechecks the configured path on the same tab and restores readiness; slow successful `activeTab` probes never latch into permission recovery. Cumulative promotion to `master` remains a separate user decision. |
| Installed Schema controller helper ownership | User-approved on 2026-09-05; Stage C controller slices are QA-integrated at `cfc3120e19`; the bounded helper follow-up is authorized from that exact QA head | Implement `schema-controller-helper-ownership` under `docs/data-layer-installed-schema-controller-helper-ownership-R01.md` and `features/verification-process-schema-controller-helper-ownership.feature`: give every remaining installed Schema helper one existing behavior-slice owner or one reasoned parent fallback; create no new behavior slice, change no product file or product test, and run no all-runnable-pack gate. |
| Event Library target-page push closure | Original product candidate `0cab2f7b36` remains the authoritative preserved two-commit remainder; premature resumed head `9273c9c903` is quarantined and ineligible | Keep the active product self-task parked and do not change or verify `9273c9c903`. After the legacy satisfaction compatibility reaches QA, record exact satisfaction beside the preserved manifest and reissue the original remainder through its conserved successor transaction. |
| Verification task-checkpoint incident repair | QA-integrated at `ff7a562c27` after exact `shell` plus `verification_process` review-ready evidence passed 90 tasks with package proof | Preserve parent-intent containment, failure quiescence, campsite gate behavior, and the unchanged global helper. The exact receipt remains valid; no all-runnable-pack feature checkpoint ran. |
| Legacy campsite satisfaction compatibility | Coherent candidate `b3ef82623f` is parked after direct contracts passed and its exact Shell evidence exposed a coarse aggregate child failure; all preserved Event Library artifacts remain byte-identical | Preserve the six-file candidate as an immutable remainder. After aggregate child failure routing reaches QA, reissue it on that exact descendant and use only the governed child diagnostic-or-repair route before fresh aggregate review evidence. Scenario 088 remains independent. |
| Aggregate child failure routing | Coherent candidate `777017aae2` is parked because its exact 88-task plan selects the live aggregate whose child routing is not governed until this correction reaches QA | Preserve the eight-file implementation patch byte-for-byte. After blocked-aggregate evidence preparation reaches QA, reissue it on that descendant, record the one exact aggregate obligation while every other task and synthetic proof passes freshly, and integrate only through ordinary review. Then resume the parked campsite candidate and govern the exact child before fresh aggregate evidence. |
| Blocked aggregate evidence preparation | Required to break the exact-plan circularity without rerunning, excluding, or waiving the live aggregate | Implement `blocked-aggregate-evidence-preparation` from exact QA `cc6a216334`: add a verification-process-only, single-target, identity-bound blocked obligation with fresh all-other-task, property, synthetic, and package proof. Preserve both parked candidates, incident `39b11f5e-e0f4-49c0-8709-b9bd6845df29`, and its source receipt unchanged. |
| Blocked aggregate cross-base delta identity | Required after preparation QA exposed Git stable patch-id variance for the unchanged routing edit sequence | Implement `blocked-aggregate-delta-identity-repair` from exact QA `e1cedb450b`: bind source and destination identities, exact paths, per-path ordered changed-line operations, and byte-exact reverse projection. Preserve all preparation bytes and the parked routing delta; do not accept patch-id equality as cross-base proof. |
| Blocked aggregate cross-lineage admission | Required after coherent routing candidate `7edab8a9f7` proved the exact bound incident is intentionally absent from generic candidate-lineage discovery | Implement `blocked-aggregate-lineage-admission-repair` from exact QA `99ee5677c7`: validate the one bound incident directly at every evidence boundary, keep generic blocking authoritative for all other candidate-applicable incidents, and preserve the parked routing candidate and live incident unchanged. |
| Blocked aggregate deferred-only revalidation | Required after coherent routing candidate `5924d455a4` proved 68 unchanged terminal deferrals are admitted initially but rejected by the empty-population fallback | Implement `blocked-aggregate-deferred-revalidation-repair` from exact QA `9ffd81c998`: snapshot and revalidate the complete admitted population by id, admission class, and proof identity even when it contains no repair or flaky candidates. Preserve the parked routing candidate and both stopped prelaunch attempts without reuse. |
| Nested checkpoint capability routing | Reissued four-path remainder `f4045b9236` and separate generated-ledger descendant `46425867a2` are parked after their fresh run passed all selected tasks except the direct registry aggregate; package did not launch | Preserve both nested commits and failed receipt unchanged. After authority-discovery repair reaches QA, reissue the exact remainder and deterministic generation separately and require wholly fresh exact review evidence. |
| Verification contract-conservation transitions | QA-integrated at `9b2bb0d20a` after exact five-task `verification_process.registry_inventory` review evidence and package proof | Preserve immutable baseline, authenticated Scenario 221 transitions, bidirectional current generations, and explicit deterministic refresh. No task-local exception or free-form successor mapping is allowed. |
| Verification conservation authority discovery | Required because the direct registry aggregate hardcodes only `0ff4b09b` and rejects the authorized `ffa69844` appended generation that production check and refresh accept | Implement `verification-conservation-authority-discovery-repair` from exact QA `9b2bb0d20a`: derive the full transition and generation authority population once for CLI, refresh, and direct aggregate; prohibit consumer-local or caller-asserted sets; preserve both nested commits and failed receipt. |
| Documentation property-row presentation | QA-integrated at `47268f930b` on 2026-08-22 after exact `flow_export`/33-task review evidence | Under `docs/data-layer-flow-table-documentation-export-program-R01.md`, export root properties without a leading slash, object members with dot notation, and wildcard array members as `[x]`; preserve canonical paths for stored selection, lookup, diagnostics, provenance, and repairs. No all-runnable-pack or master-integration claim was made. |
| Project Documentation workspace UX correction | Active follow-up approved by the user on 2026-08-16 | Preserve the QA-integrated Build, Preview, and Export workspace while replacing the flat Site Profile property list with the concept-first Profile filtering and ordering control under `docs/data-layer-project-documentation-workspace-program-R01.md` and its product/runtime feature pair; use the focused `flow_export` boundary. This does not resume an older rejected Project Documentation implementation lineage. |
| Compact reorderable editor controls | Schema projection, no-op, and compact-handle presentation corrections QA-integrated through `4d5c420f` after exact six-pack/774-task review evidence; reorderable item row-composition correction QA-integrated at `4ba9905815` after exact 14-pack/514-task review evidence | Preserve the settled handle, movement, and one-primary-row contracts across every migrated consumer, including all four shared Documentation ordered-choice hosts and per-consumer installed geometry evidence. Preserve target size, wrapping, semantics, domain behavior, persistence, impact review, and Undo. Cumulative promotion to `master` remains a separate user decision. |
| Verification run-intent and deferred-incident corrections | Exact-candidate eligible-repair admission is QA-integrated at `183496edb9`; confirmed-flaky feature deferral is QA-integrated at `cf60d5c0f3` and exercised by recovery candidate `08cbfe8fef` | Preserve incident `e5df733f-58e5-45e6-8488-bda10eb58bf4` and every earlier deferred incident as unresolved master-integration obligations; diagnostic passes remain classification-only proof. No feature-mode all-20 run is authorized. |
| Feature-development throughput course adjustment | Approved at `2b093eec4f`; enabling sequence stopped after VTD-018 exceeded its stop threshold | Product-delivery timing is now measured through the QA-branch release pilot. |
| VTD-015 settled-candidate final verification | Complete; first payback mixed | VTD-017 kept coder and refactorer on focused checks, but one architect all-20 pass was invalidated by a later validator correction. |
| VTD-008 side-panel composition-root decomposition | Single-cutover specification and unattended coder handoff explicitly approved on 2026-08-24; ownership preparation is QA-integrated at `7f74443923`; the combined Project Library transport isolation and Flow visual-asset portability delivery remains QA-integrated at `1b192105a8` | Resume stable task `side-panel-single-cutover` from the exact preparation descendant under `docs/side-panel-composition-root-decomposition-R01.md`: construct all controllers on one candidate before one behavior-preserving installed cutover, use controller-local checks during construction and one reviewed causal installed evidence cycle, and continue through focused QA integration without another routine user decision. |
| Documentation template library | Guided Excel template authoring is QA-integrated at `a8ee95869b`; documentation-template recovery is QA-integrated at `08cbfe8fef` after exact 7-pack/210-task review evidence; Contract 3 area properties are QA-integrated at `03d023b039` after exact `flow_export`/34-task review-ready evidence; generated separator presentation and finite output background are QA-integrated in combined candidate `119c25ef7a` after exact six-pack/200-task review-ready evidence | Under `docs/data-layer-guided-excel-template-authoring-R01.md`, preserve the strict combined image `fit`, `position`, and `padding` Properties cell and no-final-separator cardinality while projecting separator presentation through the preceding item's orthogonal nested expansion. Add at most one finite Contract 3 `Output` area with `background-fill: #RRGGBB`, authored margins, explicit-fill precedence, a 250,000-cell generation budget, and no worksheet-wide painting. Preserve Contract 2 and undeclared Contract 3 behavior, fail-closed validation, immutable project data, the unchanged Rich contract, and terminal-deferred incidents. Cumulative promotion to `master` remains a separate user decision. |
| Flow Documentation template instance content | QA-integrated at `a5290029c1` after exact two-pack/119-task review evidence; effective-example candidate-preview projection correction QA-integrated at `ff11b5a7bf` after exact `flow_export`/33-task review evidence; typed `row.example` JSON-literal correction is QA-integrated in combined candidate `119c25ef7a` after exact six-pack/200-task review-ready evidence | Under `docs/data-layer-documentation-template-program-R01.md`, preserve the reported valid workbook ranges while projecting `row.property`, `row.example`, and `row.allowedValues` from one exact effective Page-instance property across direct, inherited, mixed, overridden, and absent examples. Present non-empty `row.example` values as readable single-line JSON so strings remain quoted, numbers, Booleans, and null remain unquoted, and arrays and objects retain recursive type and structure; keep absent examples empty and require installed candidate and assigned-output proof. Retain settled concept, visual, persistence, and output contracts. Cumulative promotion to `master` remains a separate user decision. |
| Layered schema inherited exclusion and Example reconciliation | QA-integrated at `ad9b9276c2` after exact five-pack/113-task review evidence; Page and Flow Page-instance selection UX correction QA-integrated at `d51e55fa7c` after exact focused 291-task review evidence; compiled-tree and inheritance-card consistency correction is QA-integrated in combined candidate `119c25ef7a`, with its task identity independently confirmed on that exact tree by a second six-pack/200-task review-ready record | Preserve first-class inherited-property selection for Pages and Flow Page-instances, omission of exclusions from the effective Table, sparse stable-identity storage, current-parent restoration, unchanged Event-occurrence behavior, and selected/custom Example reconciliation. Remove the redundant compiled property tree across every layered schema host, and use the established Property Set `profile-inheritance-card` interaction for Page and Flow Page-instance without changing their contextual persistence semantics. Cumulative promotion to `master` remains a separate user decision. Rejected candidate `51aa431eb1` remains a patch reference only. |
| VTD-010 duplicate browser-smoke consolidation | Open incremental program | The Event Library slice is complete at `cc2c9a01`; remaining pack slices are inactive until separately approved. |
| VTD-011 terminal shard balancing | Deferred and inactive | The existing two-worker order is within about six seconds of balanced after lock wait is removed; scheduling needed for a possible third worker is bounded inside VTD-017. |
| VTD-012 registry and planner modularization | Technical decomposition QA-integrated through `2759c41a2b`: all 22 packs have one authoritative local fragment, the central base is empty, canonical bytes are unchanged, and exact `shell,verification_process` review passed 108 tasks | Observe payoff across the next five naturally requested product features without adding a separate task or broad run. Preserve the four unresolved terminal-deferred incidents for a later explicitly requested master checkpoint. |
| VTD-017 shared-artifact parallel execution | Complete at `723ebf6eb5` | Review the settled scorecard in `docs/vtd017-shared-artifact-parallel-execution-R01.md`. |
| VTD-018 incremental verification receipts | Stopped and unintegrated | Candidate `c7ad4698f9` exceeded the terminal threshold and remains outside `qa` and `master`; resume only by a separate explicit user decision. |
| Product recovery lineages | Open | Resume in the order listed under **Open product recovery queue**, unless later user direction changes it. |

VTD-008 remains active as a program. Completion of the installed Hotkeys, Command
Palette, and workspace-tabs controllers completes three slices only, not VTD-008.
The completed workspace-tabs slice covers only the existing controller lifecycle
in `src/workspace-tabs-ui.ts`. The combined Project Library transport-port and
Flow visual-asset portability delivery is integrated at `1b192105a8`. It supplies
the current typed transport, project-scoped content-addressed visual bodies, and
version-3 archive baseline. This does not activate a broader utility registry,
shell DOM adapter, observation-target, live-session, or another Data Layer
controller extraction.

Within VTD-008, task `side-panel-single-cutover` is approved for unattended coder
handoff and focused QA integration. Its source, ownership, one-candidate
execution, automatic ownership preparation and resumption, unattended repair,
and fail-closed boundaries are defined by
`docs/side-panel-composition-root-decomposition-R01.md`. The separately
approved Project Documentation workspace UX correction and Documentation
template library are ordinary QA features. The template task may generalize the
settled project-body and archive internals for Excel bodies without activating
another VTD-008 controller slice or an older Project Documentation recovery
lineage. The user
stopped autonomous VTD-018 repair after its repeated final failure and approved a
QA-branch release pilot. At the start of the next request, the specifier
distinguishes feature integration into `qa` from an explicit cumulative promotion
to `master`. Do not inherit VTD-018 candidate `c7ad4698f9`, select another VTD
item, or start master integration without the corresponding user instruction.
The first cumulative promotion completed at `70c94a8ce6` on 2026-08-21. Future
promotions occur when the user identifies a natural delivery lull from priorities
and feature momentum. Accumulated task count and elapsed QA waiting time are
scorecard evidence only: do not impose a minimum, maximum, target batch size, or
fixed schedule. Before freezing the next user-requested promotion, apply the
focused preflight and exact promotion task/base evidence-binding corrections in
`docs/qa-branch-release-pilot-R01.md`.

The ordered Documentation-template batch is complete on QA outside VTD-008. Its
behavior-preserving ownership readiness and campsite ratchet are QA-integrated
through `066ea284de`; first-use mapping repair `8d3cf5012c` adds causal automatic
assessment, five durable seam-or-fallback dispositions, and a reusable
Documentation asset-body contribution. Reissued candidate `00f3e45d` confirms a
bounded 10-pack/247-task exact plan, but its attributable Shell incident cannot
yet launch governed repair because inherited deferred `flow_export` acceptance
session history predates the six newly activated template contracts. Correction
`03e4157b83` recognizes only verified monotonic expansion during repair
preflight, but its deterministic fixture missed the valid difference between
declaration-ordered pack features and runtime-first planner identity. Candidate
`f2f598d4` confirms that live mismatch without changing product scope. Order
correction `cad10c898c` is now QA-integrated and preserves strict planner
identity while treating registry completeness as an exact set. `f2f598d4`,
`00f3e45d`, `e8e5fd48`, and `7f9c8a1121` remain patch references only. Stable
product candidate `d139725a1a`, reconstructed from that scorecard descendant,
passed its direct product and browser checks but exact readiness correctly
stopped before a 13-pack/617-task run. Its only undisposed causal paths are
`src/data-layer-durable-project-runtime.ts` and
`src/durable-project/runtime-core.ts`, where the completed product repair adds
generic project asset-body staging. The standing campsite rule therefore
activated a second `verification-slice-documentation-templates` preparation
from QA `1f68d463d7`. Candidate `06222ff00f` is now QA-integrated: it extracts
generic staging into `src/durable-project/project-asset-body-staging.ts`, binds
bytes to one Draft operation through queueing, retry, rejection, and conflict
resolution, and records integrated-seam dispositions for both broad runtime
paths. A future seam-only change selects `durable_project_repository`,
`flow_export`, and `shell`; arbitrary changes to the broad runtime files remain
conservative. The stopped product commit remains a patch reference only and
resumes automatically from the exact scorecard descendant. No all-20 feature
checkpoint is authorized.

Final Documentation Templates candidate `a785a83b50` is now QA-integrated. Its
exact 13-pack review executed 619 tasks and passed properties, installed Flow
documentation export, all four starter workbooks, Excel validation and rendering,
Rich preview/clipboard/sanitization/history, project export/import portability,
durable route lifecycle, and package proof. Refactorer review closed the scoped
binding-help, responsive Rich outline/detail, private-ID, and installed-evidence
gaps before architect acceptance. The product task is complete on QA; cumulative
promotion to `master` remains a separate user decision. The later user-approved
`guided-excel-template-authoring` correction supersedes only the unadopted Excel
Note and literal-endpoint authoring contract; it does not reopen the completed
Rich-template or durability lineages.

The QA-integrated `documentation-template-recovery` correction addresses a
post-integration trap in which invalid stored Excel template metadata blocks
every Draft save, including Assign Built-in and removal. Start the correction
from the exact current QA specification descendant. Preserve fail-closed custom
output and strict validation of new or changed template state while allowing
unchanged invalid records to survive unrelated saves, in-place validation of a
readable stored workbook, explicit Built-in/removal recovery, and an
operator-facing `Go to problem` route. A confirmed readable, sample-filled,
unencrypted workbook with a nonfunctional Microsoft Purview label makes stored
record validation—not workbook parsing—the primary diagnosis boundary.

Patch-reference candidate `f6db2c89a9` first implemented that approved recovery
behavior but its seven-pack evidence run encountered incident
`e5df733f-58e5-45e6-8488-bda10eb58bf4`: the grouped `flow_graph` browser task
failed at `FLOW_WORKSPACE_AUTHORING_TARGET`, and its one exact governed retry
then passed as `confirmed-flaky`. Verification-only correction
`confirmed-flaky-feature-deferral` is QA-integrated at `cf60d5c0f3`; it
preserves that classification as a master-integration obligation while
requiring a new complete canonical owned-pack pass and package proof for
review-ready evidence. Reconstructed candidate `08cbfe8fef` is now QA-integrated
after exact seven-pack/210-task review evidence. The incident remains unresolved
under its atomic terminal deferral; the stopped product branch remains a patch
reference only.

The previously approved structural task `swarmforge-outcome-bounded-autonomy`
is QA-integrated at `8f82a6a66f`. Its immutable authority grant, semantic
outcome-boundary rules, trusted priority-unblocker queue, and continuous stacked
campsite preparation are now part of the SwarmForge control surface. The exact
review plan used the `shell` parent with its two focused slices and passed 77
tasks, properties, package proof, queue and crash recovery, full-delta
conservation, and automatic same-task resumption. No all-20 checkpoint ran.

## Feature-development throughput authority

The program's headline outcome is completed user-visible feature slices and their
elapsed time from approved specification to accepted integration. VTD completion,
pack count, task count, file size, and lines moved are diagnostic only. A VTD slice
records an expected payoff and must be checked against later applicable feature
deliveries.

Safety remains non-negotiable. Feature tasks use focused checks while changing and
may integrate into `qa` only through an exact architect `qa-ready` handoff. The
all-runnable-pack gate does not run per QA-integrated task. When the user explicitly
requests master integration, freeze the cumulative QA head; that settled release
candidate runs every runnable pack from its exact registry with properties and the
package check. If it fails, record and repair or revert the exact cause, prove the
change with focused evidence, and rerun every runnable pack on the changed
candidate. Only the exact final-ready tree may advance `master`. Historical
`all-20` wording and receipts describe the current twenty-pack registry and do not
freeze later registry cardinality.

The integrated final-gate speed work uses one coordinator and one deduplicated
plan, not 20 competing pack runners. VTD-017 removed the exclusive artifact wait
that prevented the existing two browser workers from overlapping. It retained two
workers because no qualifying three-worker normal-and-loaded comparison was
durably recorded. A parallel failure remains a recorded failure and cannot be
retried at lower concurrency to turn it green.

The workspace-tabs settled all-20 run measured up to 195.4 seconds of exclusive
`dist` artifact-lock waiting inside a 231.9-second browser task even though two
observation workers were configured. VTD-017 must make validated read-only
artifact use safely shareable, while retaining exclusive build and promotion,
before testing a higher Chrome worker count. Its scorecard must report useful
overlap and lock wait, not configured worker count alone.

VTD-017 is complete and proved at least a 3-minute-43-second final-gate saving.
VTD-018 did not settle: its second terminal occurrence failed 65 Schemas scenarios
and its 16-minute-16-second gate exceeded the 15-minute-43-second stop threshold.
The candidate and repair lineage are inactive. The user approved VTD-012
implementation on 2026-08-26. Its ownership preparation is QA-integrated at
`276db16442`, and its independently reviewed cross-pack causal repair is
QA-integrated at `bb8d05ae64` after a 16-pack/533-task focused plan. Stable task
`verification-registry-planner-modularization` resumes automatically from that
recording descendant with `962affc8c2` retained only as the conserved product
patch reference. VTD-016 and standalone VTD-011 remain deferred while ordinary
product work proves whether batching one terminal gate reduces total delivery
time.

Every enabling slice requires two visible user reviews: a pre-approval baseline,
target, expected effort, safety trade-off, and stop condition; then a settled
plain-language scorecard with actual elapsed-time breakdown, comparable timing,
full gates, invalidated passes, failures, repairs, reruns, preserved evidence,
confidence limits, and a continue/adjust/stop recommendation. Do not approve or
hand off the next enabling slice until the user reviews that scorecard and
explicitly chooses the course. A provisional benefit measured on the next slice
must close before recommending anything beyond that next slice.

The approved course adjustment controls backlog selection and measurement. Each
bounded slice still requires its own explicit user approval. It does not silently
change another role's prompt, handoff validation, verification selection, or
active evidence leaf.

## Authority order

Apply current authority in this order:

1. `swarmforge/constitution.prompt` and its articles;
2. later explicit user direction;
3. this active-scope manifest;
4. the active feature contracts and task program named here;
5. executable verification ownership in `verification/packs.json` and
   architecture ownership in `architecture/data-layer-boundaries.json`;
6. task-scoped Git verification notes and handoffs whose lineage is valid.

A later user-approved feature or correction supersedes earlier wording only for
the behavior it names. A rejected implementation rejects that candidate, not its
approved specification. Completed handoffs, role worktrees, recovery refs,
historical commits, walkthroughs, and the historical scope snapshot are not
authority unless a new user-approved specification explicitly activates them.

## Active product contracts

The following feature files are current externally visible behavior authority.
Their runtime partner is separate technology evidence, not a second product
behavior definition.

### Flow and documentation

- `features/data-layer-directional-flow-specification-graph.feature`
- `features/data-layer-directional-flow-specification-graph-runtime.feature`
- `features/data-layer-flow-table-documentation-export.feature`
- `features/data-layer-flow-table-documentation-export-runtime.feature`
- `features/data-layer-project-documentation-workspace.feature`
- `features/data-layer-project-documentation-workspace-runtime.feature`
- `features/data-layer-live-flow-guided-testing.feature`
- `features/data-layer-live-flow-guided-testing-runtime.feature`
- `features/data-layer-property-set-and-flow-section-separation.feature`
- `features/data-layer-property-set-and-flow-section-separation-runtime.feature`

### Documentation templates

- `features/data-layer-documentation-template-library.feature`
- `features/data-layer-documentation-template-library-runtime.feature`
- `features/data-layer-excel-documentation-templates.feature`
- `features/data-layer-excel-documentation-templates-runtime.feature`
- `features/data-layer-rich-page-documentation-templates.feature`
- `features/data-layer-rich-page-documentation-templates-runtime.feature`

### Canonical and layered schema

- `features/data-layer-canonical-shared-profile-schema-authoring.feature`
- `features/data-layer-canonical-shared-profile-schema-authoring-runtime.feature`
- `features/data-layer-layered-schema-constraints.feature`
- `features/data-layer-layered-schema-constraints-runtime.feature`
- `features/specification-studio-selective-profile-inheritance.feature`
- `features/specification-studio-selective-profile-inheritance-runtime.feature`
- `features/data-layer-page-group-structural-authoring.feature`

### Project context and durability

- `features/data-layer-project-library-and-active-context.feature`
- `features/data-layer-project-library-and-active-context-runtime.feature`
- `features/data-layer-project-portability-and-upgrade.feature`
- `features/data-layer-project-portability-and-upgrade-runtime.feature`
- `features/specification-studio-assignment-owned-routing.feature`
- `features/specification-studio-assignment-owned-routing-runtime.feature`
- `features/data-layer-project-event-transport-settings.feature`
- `features/data-layer-project-event-transport-settings-runtime.feature`
- `features/data-layer-library-direct-template-push.feature`
- `features/data-layer-library-direct-template-push-runtime.feature`
- `features/data-layer-project-assurance-severity.feature`
- `features/data-layer-project-assurance-severity-runtime.feature`
- `features/data-layer-side-panel-schema-relationship-tree.feature`
- `features/data-layer-side-panel-schema-relationship-tree-runtime.feature`
- `features/data-layer-durable-project-repository.feature`
- `features/data-layer-durable-project-repository-runtime.feature`

### Specification Studio presentation

- `features/specification-studio-choice-controls.feature`
- `features/specification-studio-choice-controls-runtime.feature`
- `features/specification-studio-technical-analyst-guidance.feature`
- `features/specification-studio-technical-analyst-guidance-runtime.feature`

Do not delete or unregister an active contract while this manifest, its program,
or verification registry still refers to it.

## Active program documents

Read only the program documents relevant to the selected task.

| Area | Current program authority |
|---|---|
| Project Library transport-port isolation | `docs/project-library-transport-port-isolation-R01.md` |
| Canonical authoring and layered schema | `docs/data-layer-canonical-schema-authoring-correction-program-R01.md` |
| Canvas-first Flow workspace | `docs/data-layer-canvas-first-flow-workspace-program-R02.md` |
| Earlier Flow rationale not superseded by R02 | `docs/data-layer-canvas-first-flow-authoring-correction-program-R01.md` |
| Selected-Flow table documentation | `docs/data-layer-flow-table-documentation-export-program-R01.md` |
| Project Documentation workspace | `docs/data-layer-project-documentation-workspace-program-R01.md` |
| Documentation templates | `docs/data-layer-documentation-template-program-R01.md` |
| Documentation template recovery | `docs/data-layer-documentation-template-recovery-R01.md` |
| Operator-guided Live Flow testing | `docs/data-layer-live-flow-guided-testing-program-R01.md` |
| Project library, context, and portability | `docs/data-layer-project-management-program-R01.md` |
| Flow concept-visual asset storage and portability | `docs/flow-concept-visual-asset-storage-portability-R01.md` |
| Project event transport | `docs/data-layer-project-event-transport-settings-program-R01.md` |
| Event Library target-page push closure | `docs/data-layer-event-library-target-page-push-closure-correction-R01.md` |
| Defect consolidation | `docs/swarmforge-verification-defect-census-and-consolidated-repair-R01.md` |
| Verification task-checkpoint incident repair | `docs/verification-task-checkpoint-incident-repair-R01.md` |
| Campsite implementation-prerequisite gate | `docs/campsite-implementation-prerequisite-gate-R01.md` |
| Project assurance severity | `docs/data-layer-project-assurance-severity-program-R01.md` |
| Side-panel schema relationship tree | `docs/data-layer-side-panel-schema-relationship-tree-program-R01.md` |
| Durable project repository | `docs/data-layer-durable-project-repository-program-R01.md` |
| Choice controls | `docs/specification-studio-choice-controls-program-R01.md` |
| Compact reorderable editor controls | `docs/data-layer-compact-reorderable-editor-controls-R01.md` |
| Property Sets and Flow Sections | `docs/data-layer-property-set-flow-section-separation-program-R01.md` |
| Page Group structural authoring | `docs/data-layer-page-group-structural-authoring-correction-program-R01.md` |
| Technical-analyst exact copy | `docs/specification-studio-technical-analyst-copy-R01.md` |
| Generated branding | `docs/twatility-branding-merge-handover-R02.md` and `assets/brand/ARTWORK.md` |
| Verification throughput backlog | `docs/verification-throughput-technical-debt-backlog-R01.md` |
| QA-branch release pilot | `docs/qa-branch-release-pilot-R01.md` |
| QA verification ownership readiness | `docs/qa-verification-ownership-readiness-R01.md` |
| QA verification granularity ratchet | `docs/qa-verification-granularity-ratchet-R01.md` |
| QA verification pack taxonomy evolution | `docs/qa-verification-pack-taxonomy-evolution-R01.md` |
| Feature development focus and advisory scouting | `docs/feature-development-focus-and-advisory-scouting-R01.md` |
| QA-pilot verification latency correction | `docs/qa-pilot-verification-latency-correction-R01.md` |
| QA style verification and Flow modularity | `docs/qa-style-verification-and-flow-modularity-program-R01.md` |
| Verification run-intent correction | `docs/verification-run-intent-correction-R01.md` |
| QA exact-candidate eligible-repair admission | `docs/qa-exact-candidate-eligible-repair-admission-R01.md` |
| QA confirmed-flaky feature deferral | `docs/qa-confirmed-flaky-feature-deferral-R01.md` |
| Stopped VTD-018 experiment | `docs/vtd018-incremental-verification-receipts-R01.md` |
| Feature-development throughput course adjustment | `docs/feature-development-throughput-course-adjustment-R01.md` |

## Live precedence summary

The feature contracts contain the deterministic details. These compact rules
resolve cross-program precedence and prevent older programs from being
accidentally reactivated.

### Schema and inheritance

- Every applied Shared Profile recipe is a fixed allowlist of stable property
  identities. Concepts and branches aid selection and provenance; they are not
  live subscriptions. Parent additions require explicit inclusion.
- Existing selected properties continue to receive compatible parent definition
  and rule changes where no local facet exists. Ordinary sparse local facets are
  valid overrides; genuinely incompatible structure, invariants, dependencies,
  or same-precedence rules require a decision.
- Each fresh selective-inheritance workspace starts collapsed. Starting point is
  `Start empty` or `Everything`; legacy choose-concepts or choose-properties
  recipes reopen as `Start empty` without changing their fixed membership.
- Canonical Table, Tree, focused property editing, compiler, validator, JSON
  Schema, inheritance, reload, and Undo share one property model. Concept is an
  optional property annotation and never propagates through the property tree.
- Typed literals, recursive homogeneous Array Items, optional rule conditions,
  flat All/Any conditions, Value operators, Pattern testing, and complete
  property-facet conflict routing follow the latest scenarios in the canonical
  and layered-schema contracts. Earlier narrower rule or conflict wording is
  superseded where those scenarios differ.
- Project Documentation owns operator-facing specification output. Page and
  contributor workspaces retain authoring and provenance, not competing document
  generators.

### Property Sets, Sections, and Flow

- Project-level Property Sets replace the schema-composition meaning formerly
  assigned to Page Groups. A Page owns ordered Property Set applications, and
  applicability belongs to each application.
- Flow Sections are presentation containers only. Section placement, movement,
  resizing, renaming, and removal never change schema, applicability,
  provenance, validation, Assignment targets, or relationship meaning.
- The canvas-first R02 workspace supersedes permanent entity catalogs, raw
  geometry forms, fixed zoom, stacked lanes, and permanently allocated Outline.
  The bounded canvas, Add palette, contextual actions, camera, Details, and
  on-demand Outline are current authority.
- The ordinary Flow canvas consumes the complete route rectangle beneath its
  compact toolbar; Focus Canvas consumes the complete viewport behind overlay
  controls. Required controls are immediately visible and fully contained at
  360px without horizontal toolbar discovery.
- Camera, selection, open surfaces, and navigation visibility are project-scoped
  UI state only. Pan and zoom never move canonical graph items or create project
  history.
- Flow remains documentary. Guided Live Flow testing links observations to Page
  and Event occurrence expectations through the ordinary validation and defect
  surfaces; it does not claim automatic Flow execution.
- Derived Page-instance and Event-occurrence JSON materializes each `*` segment
  in a canonical item path as an array containing an example item. Sibling
  examples at the same item path share that item, recursive item paths create
  recursive arrays, and `*` is never emitted as a JSON member name.
- A visible concept visual saved while its durable Draft is still settling may
  show Preparing preview only for that bounded interval. The pending preview and
  fallback badge remain operable, and the same thumbnail resolves automatically
  after commit without an unavailable-original rejection or another user action.
- A thumbnail on an Event occurrence nested inside a Page frame follows the
  Event's ordinary content without covering it. The Event card and containing
  Page frame expand in sequence, Page anchors and canvas bounds use the enlarged
  frame, and compact modes remove only those view-only height increments.

### Project, assurance, and durability

- Project management authority is limited to the project library, active
  context, Studio routing, named top-level entity collections, guarded removal,
  portability, and singleton migration. It does not reactivate archived release
  or project-foundation programs.
- Event transport settings are project-owned and portable. They govern
  observation and default push routing without reactivating archived Live,
  replay, release, or sequence programs.
- The side-panel Schema tree is relationship-derived. Repeated canonical
  references are projections, not tags or new schema ownership.
- Missing, incomplete, ambiguous, unusable, uncovered, or stale Fixture,
  Assignment, and Coverage states are warnings. Only canonical-schema,
  effective-schema, and submitted-data validation failures block operations.
- IndexedDB is the durable project repository. Ordinary Draft saves use opaque
  concurrency tokens; page Undo/Redo remains in memory; intentional Publish alone
  creates immutable production revisions.
- Supported loads admit journal-free Drafts with no `changes` member. Migration
  preserves stable identities and current publications, verifies durable
  read-back, and does not create a production revision.
- Undo and Redo serialize through the durable save queue. Reload settlement waits
  for history persistence and newly queued feed work, while a latched failed save
  blocks history without consuming an entry or changing durable state.

### Documentation, controls, and branding

- Documentation Sets and structured themes are project-owned and portable.
  Preview, rich copy, plain-text fallback, and Excel use one immutable refreshed
  snapshot, including concept filtering, ordering, headings, Site Profile
  sections, matrix rows, and validated logo data.
- Built-in rendering remains the default. A project may assign one Excel
  prototype worksheet or one rich-page block template per existing documentation
  kind. Templates change presentation only, create no Page documentation kind,
  and consume project asset bodies through the reusable asset-body and v3 archive
  boundary after that prerequisite reaches `qa`.
- Studio checkboxes represent membership, inclusion, acknowledgement,
  confirmation, and staged choices. Switches are reserved for standalone binary
  settings whose effect applies immediately; `Only defined fields` is the
  representative switch.
- The generated R02 assets registered in `assets/brand/ARTWORK.md` supersede R01
  visual-preservation statements. The split Studio masthead, corrected
  `TWAtility Belt` wordmark, packaged side-panel derivative, transparent icons,
  and common analyst pose base are current visual authority.
- Technical-analyst timing, interaction, accessibility, and exact comic copy are
  governed by the active guidance contracts and exact copy catalogue. Guidance
  never covers content, steals focus, or changes project, revision, or Undo state.

## Open product recovery queue

The following product implementation lineages remain open in this order:

1. `project-documentation-workspace`;
2. `durable-project-repository`;
3. `flow-canvas-topology-examples`.

Project-assurance severity remains active contract authority. Starting or
resuming any product recovery item requires current user selection and a new
approved specifier handoff. A later specification does not close an earlier open
lineage, and a rejected candidate does not satisfy it.

When reconstructing these tasks, start from current `master`. Reuse older task
commits only as patch references; do not merge or cherry-pick stale implementation
lineages wholesale. Preserve every current parent file outside the task-owned
implementation and evidence paths.

## Scope and lineage invariants

- Before accepting or rejecting a handoff, compare its commit with current
  `master` and read this file from the newest user-approved specification commit
  in the received lineage.
- A stale role-worktree copy cannot deactivate a later user-approved contract.
- A rejected implementation candidate does not deactivate its specification,
  correction program, verification pack, or later handoff.
- A task-local note cannot overrule a later user-approved specification commit.
- Removing an inherited file is an affirmative task change and requires current
  specification authority; it is not lineage cleanup.
- Never remove an active contract or production capability merely to exclude
  rejected ancestry. Port task-owned changes onto a clean current parent.
- Reject a candidate that deletes an active contract while this manifest, its
  program, or `verification/packs.json` still names it.
- Every Git handoff carries its exact base. Verification evidence may be
  forwarded only while the candidate tree remains unchanged.

## Review batching

For each active candidate, Refactorer and Architect complete a whole-delta audit
before returning implementation work. Findings are returned as one consolidated
inventory. If an exception prevents later checks, the report names the interrupted
phase and every unexecuted downstream phase; unexecuted work is never implied to
have passed. A known-red bounded pre-gate is returned without spending the exact
pack or package command.

## Feature-mode deferred-incident boundary

An eligible terminal-verification-deferred incident stays attached to its
recorded candidate and remains a master-integration obligation, even when that
candidate is an abandoned parallel descendant of an earlier QA base. A later
feature does not audit, reverify, mutate, re-defer, or copy that incident merely
because its failure lineage applies or its changed paths overlap incident inputs.
It does not merge the parallel candidate to inherit the disposition. Its focused
evidence and package proof cover only its approved scope.

Reopen an earlier incident during feature work only when ordinary focused work
naturally reproduces its diagnosed failure boundary, or when the approved slice
intentionally changes its repair, regression, task-succession, runner, or
evidence contract. Otherwise leave it unchanged for case-by-case assessment on
the frozen master-integration candidate. Path overlap alone is not a proof
obligation and does not authorize an all-20 run.

### Exact-candidate eligible-repair admission

When an ordinary feature evidence run creates an incident and a causal correction
on the same task lineage makes its repair eligible, the unresolved incident must
not create a circular dependency between review-ready evidence and terminal
deferral. Eligibility authorizes one bounded admission into fresh review evidence;
it does not resolve the incident and does not activate terminal verification.

The admission route must:

- require an immutable eligible repair bound to the exact candidate commit and
  tree, including its causal category and explanation, deterministic regression,
  passing focused repair receipt, and causal-protocol result;
- derive the feature's exact owned-pack plan from its canonical change set and
  require that plan to execute the repaired regression, the original governed
  task, or a validated task successor;
- use the persisted eligible-repair record as the admission proof. The failed
  source receipt is not required to anticipate the later incident through a
  bootstrap or deferral declaration;
- record every admitted incident and selected regression or successor in the
  immutable review receipt, while preserving normal candidate, toolchain,
  artifact, plan, and package identities;
- fail closed for an unresolved repair, unclassified diagnostic, reproduced or
  changed failure, stale candidate, identity mismatch, missing selected task, or
  any new failure during the admitted run; and
- after the exact run and fresh package proof pass, record review-ready evidence
  and the matching `terminal-verification-deferred` disposition atomically. A
  crash may leave neither result or a safely resumable transaction, never a
  handoff record without its incident disposition.

The resulting `review-ready` and `qa-ready` handoffs remain focused claims. The
incident stays attached to the candidate and is consumed only by the canonical
all-20 properties and package checkpoint during explicitly requested master
integration. Coder, refactorer, and feature-mode architect work must not run the
all-20 gate to resolve or work around this state. A standalone verification-repair
slice still requires separate user approval and is not implied by eligible-repair
admission.

Until the runner implements this route, encountering the circular state is a
bounded verification-tooling blocker. Report `eligible-repair-admission-needed`
with the incident, candidate, exact pack plan, and regression identity; do not
recommend or launch an all-20 feature checkpoint as the fallback.

## Verification-maintenance ratchet

The user approved this policy on 2026-08-11 for remaining VTD work. When an
approved change exposes a brittle verification check and the product behavior is
sound, repair that attributable check at the same task boundary while preserving
its meaningful invariant.

- Replace exact source-name, magic-text, frozen whole-task-inventory, and
  post-baseline digest assumptions with behavioral or structural coverage, or
  with accounting derived from the canonical registry plus explicit approved
  additions.
- Centralize duplicated verification-task accounting when an active slice
  encounters it. The approved task inventory is the strongest immediate
  candidate; other cleanup remains just-in-time.
- Do not add compatibility shims solely to satisfy source-shape checks, weaken
  runtime evidence, delete active assertions, change unrelated packs, or turn an
  incident repair into repository-wide cleanup.
- Keep each repair subject to VTD-014 incident causality and the active slice's
  exact verification boundary. This policy does not activate another VTD item or
  controller slice.

This brittle-check maintenance rule is distinct from the approved within-pack
campsite ratchet in `docs/qa-verification-granularity-ratchet-R01.md`. The latter
may introduce a subordinate task-selection slice only after actual work proves a
stable observable boundary and must preserve the parent pack's complete closure.

## Task-scoped verification

Use only the exact task pack selected below plus the package command. Do not infer
additional checkpoints from the full dependency graph. The canonical registry
still decides changed-path ownership, required consumers, target batching, and
historical rename/delete handling.

| Task area | Exact focused runner selection |
|---|---|
| Canvas-first Flow workspace | `--pack flow_graph --pack layered_schema` |
| Project Documentation | `--pack flow_export` |
| Documentation templates | `--pack flow_export --pack project_management --pack durable_project_repository` |
| Excel template area properties | Start with `--pack flow_export --pack project_management --pack shell`; exact read-only intent and changed-path planning are authoritative, with properties and package proof and no all-20 feature checkpoint. |
| Flow Documentation template instance content | `--pack flow_export --pack shell` |
| Flow template typed example literals | Start with `--pack flow_export`; exact read-only intent and changed-path planning are authoritative, with properties and package proof and no all-20 feature checkpoint. |
| Guided Live Flow testing | `--pack live_flow_testing` |
| Canonical and layered schema | `--pack layered_schema` |
| Layered schema inheritance-card consistency | Start with `--pack layered_schema --pack flow_graph --pack flow_export --pack live_flow_testing --pack property_set_flow_sections`; exact read-only intent and changed-path planning are authoritative, with properties and package proof and no all-20 feature checkpoint. |
| Project management and portability | `--pack project_management` |
| Project event transport | `--pack project_event_transport` |
| Event Library target-page push closure | Start with `--pack event-library`; exact read-only intent and changed-path planning are authoritative, with properties and package proof and no all-runnable-pack feature checkpoint. |
| Defect consolidation | Use only the `shell` parent for structured unblocker validation and role-process compatibility. No `verification_process` pack, properties, generated fixture, persistent census, diagnostic lifecycle, or all-runnable-pack checkpoint. |
| Verification task-checkpoint incident repair | Start with `--pack shell --pack verification_process`; keep `scripts/shared-artifact-parallel.mjs` unchanged and the fail-fast coordinator under `scripts/verification-execution/`; reject production runner recursion from registered tasks; exact read-only intent and changed-path planning are authoritative, with properties, package proof, preserved incident fixtures, and no all-runnable-pack feature checkpoint. |
| Legacy campsite satisfaction compatibility | Start with `--pack shell`; bind only generation `56b862f0012f` and manifest digest `df3889aae165`, resolve common-project QA-ready authority without copying runtime files, preserve existing campsite bytes, and use properties plus package proof with no all-runnable-pack feature checkpoint. |
| Aggregate child failure routing | Start with `--pack shell --pack verification_process`; preserve the live incident and parked candidate, prove the child-result and legacy-binding paths with synthetic fixtures, and use properties plus package proof with no live incident rerun or all-runnable-pack feature checkpoint. |
| Blocked aggregate evidence preparation | Start with `--pack verification_process`; change only the evidence core and runner, reliability run-intent and local blocked-aggregate helper, and the direct reliability-run-intent and evidence-promotion contracts; require fresh exact six-task evidence plus properties and package proof with no Shell aggregate, Flow child, product path, Gherkin handler, or all-runnable-pack feature checkpoint. |
| Blocked aggregate cross-base delta identity | Start with `--pack verification_process`; change only the blocked-aggregate reliability helper, runner, and direct reliability-run-intent and evidence-promotion contracts; prove canonical operation-sequence and reverse-base conservation with fresh exact six-task evidence, properties, and package proof and do not launch the staged routing candidate, live aggregate, Flow child, or an all-runnable-pack checkpoint. |
| Blocked aggregate cross-lineage admission | Start with `--pack verification_process`; change only the blocked-aggregate helper, runner, evidence core, and direct reliability-run-intent and evidence-promotion contracts; prove direct immutable incident validation plus unchanged generic blocking with fresh exact six-task evidence, properties, and package proof and do not launch the parked routing candidate, live aggregate, Flow child, or an all-runnable-pack checkpoint. |
| Blocked aggregate deferred-only revalidation | Start with `--pack verification_process`; change only the runner, blocked-aggregate helper when needed, and direct reliability-run-intent contract; prove complete admitted-population identity across deferred-only, empty, mixed, and mismatch fixtures with fresh exact five-task evidence, properties, and package proof and do not launch the parked routing candidate, live aggregate, Flow child, or an all-runnable-pack checkpoint. |
| Nested checkpoint capability routing | Start with `--pack verification_process`; change only the verification-process manifest and generated registry, runner output-forwarding seam, execution-checkpoint contract, and registry-inventory contract only when needed; require the exact `registry_inventory` plus `execution_checkpoint` six-task plan, properties, and package proof, with no parked routing candidate, live aggregate, Flow child, product candidate, or all-runnable-pack launch. |
| Schema relationship tree | `--pack schema_relationship_tree` |
| Durable project repository | `--pack durable_project_repository` |
| Property Sets and Flow Sections | `--pack property_set_flow_sections` |
| Project assurance severity | `--pack project_assurance_severity` |
| Choice controls, analyst guidance, and generated branding | `--pack branding_polish` |
| VTD-015 workflow bootstrap | all 20 canonical pack selectors; shared handoff and evidence behavior affects every pack |
| QA release-pilot workflow changes | `--pack shell --focused-task unit:test/settled-final-verification-workflow-test.mjs --focused-task unit:test/verification-process-contract-test.mjs` |
| Verification ownership readiness bootstrap | `--pack shell --pack flow_export --pack project_management --pack durable_project_repository`; include the two focused workflow/process-contract unit targets and package proof; one bounded additional exact owner may be recorded as forecast variance, but all 20 is forbidden |
| Verification granularity ratchet | `--pack shell --pack flow_export --pack project_management --pack durable_project_repository`; include direct slice-planner, conservation, workflow, and process-contract unit targets with properties and package proof; one bounded exact consumer may be recorded as variance, but all 20 is forbidden |
| Registry-derived verification packs | Start from `--pack shell` plus the exact modular-pack, throughput-reporting, reliability-closure, and process-contract targets selected by read-only intent. Keep the reliability-values and reliability-receipts helpers unchanged; inject terminal-repair defaults from a bounded cardinality adapter through store, runner, and closure callers; and register the cardinality prefix only under `verification_pack_cardinality_contract`, with no `globalImpact` entry and no registry pack consumers. Prove all semantic runnable identities through executable synthetic registries, preserve current topology and exact-pack closures, and never run the all-runnable-pack gate in feature mode. |
| Documentation-template mapping repair | Start with `--pack shell --pack flow_export --pack project_management --pack durable_project_repository`; exact preparation ownership is authoritative and may conservatively include the known 13-pack shared-path boundary, with properties and package proof. Never run all 20. Record candidate-path replay, automatic variance routing, slice-or-fallback disposition, exact-pack conservation, and package proof. |
| Outcome-bounded autonomy and stacked unblockers | Start with `--pack shell` and the exact `swarmforge-handoff-control` plus `swarmforge-stacked-ratchet` process slices. Read-only ownership intent is authoritative; aggregate new coarse paths once, apply bounded judgment, preserve deferred observations, and keep all-20 exclusive to the final master gate. |
| Flow verification proof hardening | `--pack flow_graph` |
| Flow browser-program partitioning | `--pack flow_graph --focused-task unit:test/verification-process-contract-test.mjs` |
| Flow relationship snap feedback | `--pack flow_graph` |
| Stage-aware stylesheet ownership | `--pack shell --focused-task unit:test/settled-final-verification-workflow-test.mjs --focused-task unit:test/verification-process-contract-test.mjs` |
| Flow stylesheet extraction | `--pack flow_graph --pack shell` |
| Flow derived JSON array examples | `--pack flow_graph --pack flow_export --pack live_flow_testing --pack property_set_flow_sections` |
| Flow visual thumbnail save settlement | `--pack flow_graph --pack flow_export --pack live_flow_testing --pack property_set_flow_sections` |
| Flow nested-Event thumbnail containment | `--pack flow_graph --pack flow_export --pack live_flow_testing --pack property_set_flow_sections` |
| Flow nested-Event thumbnail evidence contract | `--pack flow_graph --pack shell` |
| Layered Page-group Documentation display-path evidence repair | `--pack layered_schema` |
| Verification run-intent correction | `--pack shell --focused-task unit:test/settled-final-verification-workflow-test.mjs --focused-task unit:test/verification-process-contract-test.mjs` |

Run the selected packs with:

```sh
node scripts/run-focused-acceptance.mjs <exact-pack-selectors>
node scripts/package.mjs
```

Property tests require the explicit `--property` option. A committed handoff
checkpoint also requires `--changed-since <base>` and uses the two-step evidence
flow:

```sh
node scripts/run-focused-acceptance.mjs <exact-pack-selectors> --property \
  --changed-since <base> --prepare-evidence <task>
node scripts/verification-evidence.mjs record <printed-pending-file>
```

Do not run the terminal suite, broad regression, unrelated packs, or Gherkin
mutation unless the user explicitly authorizes that work. The package command
consumes the already validated `dist` tree and does not widen task scope.

The user approved the VTD-015 bootstrap terminal scope on 2026-08-11. During
implementation and review, use only focused process-contract checks. Each
committed VTD-015 handoff still follows the previously integrated protocol, whose
shared workflow impact requires the canonical all-20 checkpoint. The new
review-ready protocol became active when VTD-015 integrated; VTD-017 is its first
live payback measurement.

For a new VTD-008 or VTD-010 slice, changed-path preflight and the new bounded
specification determine the exact pack set. Do not reuse a completed slice's
one-time broad delivery checkpoint as permanent fan-out authority.

## Verification throughput completion ledger

Detailed contracts, measurements, evidence-conservation tables, and future work
remain in `docs/verification-throughput-technical-debt-backlog-R01.md`. This table
is status only.

| Delivery | Integrated commit | Status |
|---|---|---|
| VTD-001 corrected critical-path estimation | `45731650a2` | Complete |
| VTD-002 canonical timing ledger | `68c8f6369f` | Complete |
| VTD-013 Flow-examples characterization | `c18f305bdb` | Complete |
| VTD-003 explicit pack and target calibration | `7aaab0458c` | Complete |
| VTD-004 project-management presentation | `acfdf39d8d` | Complete |
| VTD-004 durable-repository presentation | `82e704bdc8` | Complete |
| VTD-004 Event Library presentation | `b54e02866f` | Complete |
| VTD-004 Capture presentation | `1105e3e8b6` | Complete |
| VTD-004 Schemas presentation | `daaac105c1` | Complete |
| VTD-005 Layered editor target routing | `caad024a53` | Complete |
| VTD-009 helper and Shell ownership | `60458b958c` | Complete |
| VTD-007 browser readiness and timing | `95c79a42d6` | Complete |
| VTD-006 modular side-panel browser program | `51ef49a2f9` | Complete |
| VTD-014 unreliable-test repair gate | `4e18da3e60` | Complete; later approved closure corrections are integrated in `9808acce74` |
| VTD-010 Event Library launch consolidation | `cc2c9a01b6` | Complete slice; program remains open |
| VTD-008 installed Hotkeys controller | `9808acce74` | Complete slice; VTD-008 remains active |
| VTD-008 installed Command Palette controller | `5ec9ff34f7` | Complete slice; VTD-008 remains active |
| VTD-008 installed workspace-tabs controller | `ad002047a3` | Complete slice; VTD-008 remains active and paused |
| VTD-015 settled-candidate final verification | `bdd29f8c87` | Complete; VTD-017 first payback was mixed |
| VTD-017 shared-artifact parallel execution | `723ebf6eb5` | Complete; two-worker final gate saved at least 3 minutes 43 seconds |

## Historical boundaries

- The archived data-layer R01/R02/R04 and deferred Flow snapshot is anchored at
  `d346e89a4c98376b2e85ec48963c2b07af6fe3c0`. It is reference material, not
  acceptance authority.
- The R01 branding reports and `docs/twatility-branding-evidence/` are historical
  evidence. They cannot overrule active feature contracts,
  `assets/brand/ARTWORK.md`, or the R02 branding handover.
- Unmerged experiments and workspace-local walkthroughs are non-authoritative.
- The historical active-scope snapshot preserves the former narrative for audit
  and archaeology only. If it conflicts with this file or later user direction,
  this file and the later direction win.
