# Tealium Live: first integration stage

Task: `tealium-live`. Incoming review base: `fa8ea6c1ed3561a1aad837acc215de37357144d4`.
Authority: `docs/tealium-live-preparation-acceptance-R01.md`.

## Delivery

The Tealium contribution opens a private retained page. One owner keeps the
website target, document identities, session, filters, selection, and inventory.
The full-width page sends actions to that owner. It does not start a second read
loop. Data Layer startup is not required. Production modules separate page
inspection, browser document checks, session state, controls, and source routing.

The page reader inspects supported runtime properties without calling tracking,
loading, consent, or sender functions. Script and timing entries are request
evidence. They do not establish registered code or successful vendor delivery.
The inventory retains accessible frames and reports incomplete coverage.

The DevTools page reads loaded resource content, finds unique registered code,
and validates the target, session, frame, profile, UID, and document before an
explicit source action. Identical copies of one URL and content share a source
location. Different possible URLs or conflicting content remain ambiguous.
Source operations have an eight-second deadline. Clipboard actions use the
clicking surface and retain visible success or failure feedback.

The build delivers both exact Tealium HTML entry points. **The repository
manifest is unchanged.** Source browser tests extract the actual package and
add only `devtools_page` in that isolated fixture. They report `preview: true`.
This is real source-runtime preview evidence, not final manifest activation
proof. QA must accept this stage before the manifest-only second stage.

## Runtime identity and compatibility

The pinned public Tealium docs runtime is unchanged, gzip-compressed only for
storage. Its uncompressed SHA-256 is
`82882bb70abe78a85629baf4859ce01710fd92d1270b025cfdafd8ef9d324b89`.
The fixture provenance is in `test/tealium/detection/fixtures/provenance.json`.
Chrome loads it from both custom publishing and renamed first-party paths.
The installed inventory observes profile `tealium.docs`, UID `115`.
Fixture CSP blocks external tracking traffic. The sample is not a shipped asset.

A supported real runtime can register sender code before `loader.cfg` exists.
The reader therefore accepts supported sender evidence without inventing tag
configuration. Missing metadata remains unavailable. Unsupported runtime shapes
are reported with retained supported-frame results.

Chrome can omit the new URL after navigation from an optional-origin grant.
Live must not offer access to the old origin as if it were current. In that case
it retains the tab identity, clears the stale address, and explains recovery.
A new extension action supplies activeTab; Check access again restores the same
session intent. Browse all tabs remains an optional way to reveal the address.
A paused or ended session cannot resume from an access grant alone.

## Verification state

Direct model checks cover runtime evidence, getters, stable identities, filters,
session races, source ambiguity, bridge validation, and source deadlines.
Direct Chrome checks cover the native side panel, full-width controls, layout
at 360/520/720/900 CSS pixels, real grants, frame replacement, source editors,
clipboard, startup failure, and concurrent Data Layer capture.

The real Sources editor contains the expected function for separate, custom,
and bundled sources. A repeated action selects the function after Chrome
formatting. Another website's editor is unchanged. Real page reloads, child
replacement, and session replacement reject held old source requests.

These direct checks are development diagnostics. The first exact plan selected 192 checks because the new report lacked a
private ownership entry. Adding that entry reduced selection to 71 checks with
no unresolved expansion. Registry validation then required each executable
leaf to have its own test entry. The corrected plan has 91 checks; acceptance
reads those recorded leaf results instead of rerunning browser groups. The
recorded review receipt must pass before this candidate can be handed off.

The governed prelaunch check then found a stale current consumer-plan digest.
`docs/verification-prelaunch-identity-integrity-R01.md` requires this value to
match the current canonical plan. The canonical derivation now yields
`945052b6c6c46896114b26a29d154b1eb5d055db4122b6f396549499a16f06c4`.
Only that derived declaration was refreshed. Bound source commit/tree, consumer
task, patch identity, historical receipts, and succession authority are intact.
The existing Phase 2 destination already matches and was not changed.
The derived-field change selects 29 existing reliability checks, for 120 total
checks with no parent fallback. The first executed run passed product model and
host checks, then found that a historical conservation fixture did not list the
18 newly registered Tealium browser tasks. Their exact keys were added to its
existing approved utility additions. The failing conservation check now passes;
every retained historical identity is still compared in full. No master gate,
reviewer-owned mutation checks, or final activation proof is claimed.

## Cost and process record

The first real runtime checkpoint passed within the four-hour allowance.
A representative local sample with the real runtime and 201 configured or
registered tags measured 12 production reads: mean 3.95 ms, maximum 5.60 ms.
The separate tab/document check measured mean 0.86 ms, maximum 1.00 ms.
This is one local sample, not a cross-machine performance bound. The installed
fixture had three observed resource entries and approximately 200 extra inert
script elements. The checked-in cost runner reports actual counts.

The scheduler waits one second between ticks. Inventory reads do not overlap.
Document checks have their own guard, so a held inventory callback cannot hide
frame replacement. Hidden retained pages remain subject to Chrome scheduling;
this implementation does not promise background real-time cadence.

Task work began at 19:02 UTC on 2026-09-09. The first candidate was prepared
about two hours later. The 30-active-minute ownership-wiring target is not
proved. No prior preparation effort is reset. The previously accepted Probe
measurement of 79.740 seconds extra host-selection cost remains a separate
preparation finding, not the cost of this product verification run.

What went well: real runtime inspection found a valid sender-only state; native
Chrome tests established actual editor, permission, and document behavior.
Failures found and fixed: early native action before listener readiness; an
unusable initial geometry assertion; hidden Chrome addresses after navigation;
source ambiguity in a multi-URL fixture; and an enabled Start control after
owner closure. A TypeScript DOM-iteration error was caught by the build. Some
UI code preceded its browser test, so strict test-first compliance is partial.
Several broad file reads returned too much output; subsequent reads were
narrowed. None of these failed runs is review evidence.

Refinement: retain the small private test groups, use measured browser fields
for runtime claims, and repeat the source tests against the unchanged package
after QA accepts the manifest-only activation stage.

The first fresh runner passed the selected host browser checks, then exposed a
fixture error: a browser check tried to create the archive under a read-only
artifact lease. All 18 Tealium browser leaves now run as explicit checkpoints
after the existing portable-package checkpoint. Each private slice requires
that package checkpoint. Each fixture verifies the extracted archive against
the current source, toolchain, output inventory, and dist success manifest.
Standalone fixture calls can still prepare the package. The production package
script and lease rules are unchanged.

The failed cost check retains its command through one explicit task succession
edge from the browser stage to the post-package checkpoint. Its causal repair
reproduces the denied write and proves that the current archive can be read
under the same read lease. This changes the current Shell consumer digest;
the historical source identities and existing succession edges stay intact.

The package repair also exposed two test setup gaps. The historical pack
comparison needed the same 18 approved checkpoint additions already excluded
from its task comparison. The focused repair runner has no inherited artifact
lease, so its causal fixture now acquires a real lock and supplies read-only
access with that token. A direct diagnostic verified both the denied write and
the unchanged fresh archive. Normal review fixtures use the runner's lease.
These setup failures are recorded separately from product runtime proof.

A later recorded repair reached Chrome and exposed a long temporary socket
path at the checkpoint stage. The private browser helper now uses the existing
short Chrome temporary-directory convention, creates its own child directory,
and removes that child after Chrome stops. It reports pipe and process errors
with Chrome stderr. A diagnostic with the failed long parent path passed after
this correction.

The next full focused run passed 75 checks, then three served-host observations
failed at shell startup. A real contribution made the utility host subscribe
to tab removal before Data Layer mounted. The HTTP fixture has no Chrome tabs
API. The host now returns no target and a no-op subscription when that API is
absent. Installed Chrome still selects the website and adds/removes the real
listener. The existing host-message check covers both cases and reproduces
the old missing-API exception for the causal repair.

The next review reached the private runtime checks. Continuity failed because
the HTTP shop.example fixture has no crypto.randomUUID API, which the existing
Data Layer page hook uses. The continuity fixture now uses trusted 127.0.0.1
on its actual IPv4 listener. It waits for one real source subscription before
sending events. The direct check captured all four events exactly once, saw
all four late Tealium tags, and observed zero tracking calls. The causal check
compares the two actual browser contexts; production capture code is unchanged.

## Consolidated review correction

The five findings from handoff `20260909T224347Z_000024_from_refactorer`
are addressed together. The tracked DevTools HTML entry now has the same
source and delivery path. A temporary Git fixture uses the actual candidate
registry and delivery files; adding only `devtools_page` passes the unchanged
canonical declaration guard. The repository manifest stays unchanged.

Start now requires a successful current access probe. Navigation, grant loss,
and reset invalidate that confirmation. Held and rejected probes cannot start
observation. An ended session requires valid access before a new Start.

The source deadline starts before background validation and supplies the
remaining time to DevTools. Expiry and binding changes cancel pending work.
A valid session binding requests source resolution again for the retained
selection. Chrome checks cover a held background validation, late completion,
and real grant loss and recovery with DevTools open. They preserve selection
and observation. These are package preview checks; QA activation remains open.

The acceptance mapping separates geometry and evidence rows. Its focused test
has 25 assertions, including missing evidence and rejected runtime evidence.
Pinned Cloverage measured 100% line coverage and 62.44% form coverage for
`acceptance.steps.tealium-live` on this correction. Results are in
`tmp/tealium-current-coverage/lcov.info` and
`tmp/tealium-current-coverage.log`. This is measured adapter coverage, not
browser proof or a CRAP score. The refactorer still owns final structural scores.

Four private unit tasks were added. The current consumer digest was derived
again; historical source identities and task succession were preserved.
The combined final checks cover all five findings before one fresh focused run.
Development checks passed. One build detected changing inputs and stopped;
another caught TypeScript status narrowing. Both were corrected before final
verification. Some discovery output was too large and some instruction reads
were repeated. Further work must reuse current instructions and keep reads
bounded. Keep these regression cases in the private Tealium slices.

The first final prelaunch found an invalid duplicate registration: the source
inventory only accepts its known source roots. The HTML is owned by the private
DevTools slice, which is sufficient for tracked ownership. The duplicate source
prefix was removed. Full registry validation now passes without a guard change.

The next run passed 115 tasks, then exposed an old reset test sequence: it
clicked Start at Ready before the new access probe completed. The closure test
now holds that probe, proves that the early click does not start observation,
and waits for enabled Start before checking both window closures. The focused
Chrome check passes. Incident `e02b00e7-ccbf-4afb-a443-d0c2b6b74cf6` records the
failed sequence; governed repair evidence and a fresh final run are required.

## Approved one-off evidence recovery and current operator correction

The user approved this route on 2026-09-10 after rejecting the proposed
2–4 hour general evidence-loss implementation. Continue stable task
`tealium-live`. This instruction supersedes the pending general recovery
proposal. There is no new verification framework or preparation task.

### Preserved work and authority

Keep product candidate `37dfa7e574399e17e2501c3004552301824b997a`, tree
`a2653bac3ba96360eb6c7dbf0e250856c9fce0db`, based on `fa8ea6c1ed`.
The refactorer's complete product audit found no additional blocking product
finding. The candidate's old review note remains invalid for admission because
its original incident and transaction records are unavailable. The cause and
time of storage loss are unknown; a Windows restart is only a possible cause.

The approved product requirements and registration/activation sequence in
`docs/tealium-live-preparation-acceptance-R01.md` remain unchanged. Preserve
the product delta when merging this documentation-only QA descendant. Use the
resulting new candidate for fresh evidence; do not overwrite the old review
note or present its receipt as newly passed evidence.

### New current-time incident, using the existing API

The specifier used `createTimeoutIncidentStore().create()` to record the
preserved failed observation under new incident
`c3ac1af2-5a9b-4fe1-b9b6-34d581bc8451`, created at
`2026-09-10T00:08:17.987Z`. Its state is unresolved. It was read back through
the store and accepted by `timeoutRepairDiagnosedBoundary()` for
`checkpoint:shell:tealium-live-closure`.

The failure receipt's SHA256, failed task, Git tree, and causal key were checked.
The existing failure-contract function derives the same causal key as the old
review admission. Only fields supported by the preserved receipt are recorded.
The record explicitly names the unavailable original incident, transaction,
failure digest, old review, and unknown historical fields. It does not recreate
the original incident envelope, transition history, repair eligibility, or
journal. No tests or package checks have been rerun by this recording action.

The immutable Git object
`5332f1b8da7c3055dba29ec87bd871d769a9c83b:docs/tealium-live-recovery-sources-R01.json.gz`
archives exact UTF-8 bytes and
SHA256 values for the original failed, repair, and review receipts, the old
review note, and the new incident envelope. These copies preserve evidence;
they do not waive any admission check. The original receipts also remain in the
coder worktree's `tmp/verification-receipts/` directory.

### Coder continuation

1. Merge this documentation-only QA descendant into the preserved product
   candidate. Commit only the task's changes. Preserve unrelated worktree files.
2. Read the new incident through the existing store. Run the existing focused
   repair route for `checkpoint:shell:tealium-live-closure`, with the new incident
   ID, full original task base `fa8ea6c1ed3561a1aad837acc215de37357144d4`,
   and stable task `tealium-live`.
   Keep causal category `other:reset access readiness`: the old test clicked
   Start before access confirmation; the repair waits for enabled Start.
   The deterministic held-probe before/after fixture must run again under the
   new incident context. Do not relabel the old repair receipt.
3. Use the same full original base and task for repair, review, record-review,
   verify-review, and unchanged-candidate downstream handoff. QA documentation
   head `5332f1b8da` remains a required ancestor, not the evidence base.
   Use ordinary repair eligibility and exact-candidate admission. Derive and
   inspect the exact focused plan with properties and fresh package proof.
   The prior review had 125 tasks; this is a comparison, not a ceiling or a
   substitute for the actual plan. No all-pack gate is authorized.
4. Record a new review only after the required fresh run passes. Keep the new
   incident unresolved with the normal terminal deferral. Preserve the closure
   obligation and all master obligations for `build-delivered-dependencies.json`
   and `src/background.ts`; record loss does not remove them.
5. Forward through refactorer and architect with the normal exact evidence.
   QA integration remains pending until the architect sends `qa-ready`.

Use existing helpers only. Repair task-caused defects under the existing
authority. If an existing helper cannot complete the bounded route, report
that exact limit and preserve all results. Do not add a new evidence-loss policy, invent
missing historical fields, or start another preparation program. Later
same-task product work and manifest activation remain part of the approved
Tealium delivery.

### Consolidated correction record

The specifier corrected the evidence base in handoff
`20260910T001743Z_000923_from_specifier`. The original base applies end to end;
it conserves the full product range. Do not change immutable incident history.
Handoff `20260910T002451Z_000924_from_specifier` authorizes this consolidation
and the same-task acceptance helper repair. The two standalone recovery files
are redundant current-tree copies. Their removal does not withdraw a contract.
The exact archive remains reachable at the immutable Git object above, with
SHA256 `4d0e32195864871859aa5c3aba9b8c5a2a404ab22af8d3f4f6bd00385084b8ef`.
Its bytes were compared with the worktree archive before consolidation.
Use that object directly; no missing worktree include or recreated archive is
required. Retain the existing source receipts and unknown-history statement.

Preserve candidate `d84110e447` and all its receipts as history. Receipt
`88214-0a6db186-9cdc-485e-9cdb-763957bdaece.json` passed build and closure but
could not record eligibility with the wrong new-base binding. It is not fresh
review evidence. Original-base receipt
`95392-ab171903-da84-4f8b-9121-d6376d9ea5e5.json` recorded closure eligibility
for that candidate. A corrected descendant requires fresh exact proof and
supported revalidation of that closure repair.

The 245-task review receipt `97606-b60590f1-7b83-41b0-8550-1fa744f9de77.json`
retains 58 passed tasks, one failed loader check, and cancelled work. Its SHA256
is `2393b7c5cb28fe6f5e4ff65fdffa1607c18aac051a6feb419679534db6880c95`.
The loader failure is incident `708a328c-684e-4158-9255-607a6584f086`.
Accepted repair family: `tealium-acceptance-helper-naming`. Fixed boundary:
`tealium_support.clj` and its detection, DevTools, and Live callers. The complete
observed defect list has one item: `reserved-handler-collection-name-collision`.
Discovery is complete. The helper builder is now `build-handlers`; actual
`handlers` collections and the shared loader remain unchanged. The private
mapping test exercises the real loader, reproduces the reserved-name failure
in an isolated process, and proves successful loading after removal of that
collision. The originally failed loader check remains mandatory causal proof.
No registry, manifest, selection rule, or verification policy changes are needed.

The documentation copies caused broader Shell selection. Preview the exact
original-base plan after consolidation; retain product tests, shared consumers,
properties, package proof, and the failed loader check through causal proof.
Counts are advisory. Do not run unrelated Shell programs for duplicate reports.
After narrow repair proof and valid admissions, run one settled focused review,
record its atomic terminal deferrals, and forward through refactorer and
architect. QA integration requires the exact architect `qa-ready` handoff.
Both new incidents and all source-delivery and background master obligations
remain unresolved until the separately authorized terminal process settles them.

What went well: the focused closure fixture and original-base binding proved
repair eligibility without reconstructing history. What failed: incorrect base
instructions, broad report ownership, and the helper-name collision interrupted
review. Refine the process by keeping active instructions on the accepted report
path, using the canonical original base throughout, and retaining the loader
regression. Specification and plan checks are separate from runtime evidence;
this report alone does not claim a passing final review or QA integration.

## Architecture review correction

The architect reviewed the full product range from `fa8ea6c1ed` through
`3eca27d59b`. The incoming 125-task review proof passes validation. This remains
the registration stage; installed source tests use the declared manifest
preview. Final DevTools activation remains the next same-task QA stage.

The source message module now delegates all DOM rendering to the view module.
A new test reproduces a held source action that remained authorized after tag
selection changed. Rebinding the current selection cancels that old action.
The same test checks a different tag, cleared selection, and changed sender
code through the production source controller and broker, then proves that
a current selection remains authorized. Test transport fixtures are separate.

The build, architecture check, and direct selection regression pass. Sequential
differential Clojure mutation killed 41 of 41 mutants across the four Tealium
handlers. The pinned Clojure DRY check found no duplicate candidates. No
TypeScript mutation tool is pinned; the TypeScript compiler and architecture
checker were used. No Gherkin file changed in this review range. Generated
registry content matches the reviewed Shell manifest; other packs are unchanged.

Fresh focused evidence is required for this changed candidate. These quality
results are separate from that checkpoint and from final activation proof.
The original lost review stays invalid, both new incidents remain governed,
and all terminal obligations remain in force.

The regression test and module review found a bounded correction. Broad reads
returned excessive output during review; subsequent inspection used smaller
sections. Use bounded reads and held-action tests for later source changes.
