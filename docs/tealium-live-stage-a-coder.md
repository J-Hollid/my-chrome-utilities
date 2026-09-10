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

## Accepted QA stage and automatic activation continuation

Architect handoff `20260910T005504Z_000911_from_architect` was accepted on
2026-09-10. QA advanced to `a4dde57040793b64fae99e217b702c854b2cc5ad`.
The specifier validated both exact review notes and verification notes:

| Evidence range | Passed checks | Focused elapsed time |
| --- | --- | --- |
| `fa8ea6c1ed` to `3eca27d59b` | 125 across 14 pack identities | 6 min 19.700 sec |
| `3eca27d59b` to `a4dde57040` | 46 in Shell's Tealium slices | 2 min 39.485 sec |

Product registration, Live behavior, custom-host runtime detection, and source
preview evidence are accepted. Final packaged DevTools activation is pending.
The 30-active-minute integration coding target remains unproved. The accepted
Probe overhead measurement is separate from these product verification times.

Continue the approved task from this accepted QA ancestry. The only production
activation change is `devtools_page: tealium/devtools/index.html`. Preserve
registry, verification policy, delivery policy, build policy, permissions, and
other manifest fields. Adapt the existing registered activation test's Stage A
absence assertion as needed, while preserving proof of the same canonical field
transition. Run real source checks from the delivered manifest with
`preview: false`, fresh properties/package proof, and exact shared consumers.
Use the new activation task base; do not reuse the recovery's old evidence base
for this separate post-QA activation change.

What went well: existing recovery APIs and focused proofs preserved the work.
What failed: lost records, incorrect specifier base instructions, duplicate
recovery documents, and the handler-name collision delayed review. Keep records
in the accepted report, preserve exact source bytes, and check the evidence base
before launching work. The old lost review remains invalid. Both replacement
incidents and all recorded master obligations remain governed by the existing
terminal process; this QA acceptance does not close them.

## Repair-stage QA acceptance and activation resumption

Architect handoff `20260910T025909Z_000913_from_architect` was accepted on
2026-09-10. QA advanced to `47279eb677ebcd7199762f1abcb4b4a3b079748a`.
Exact review and verification notes passed for task `tealium-live` from
`721c0ca298e6f1d75ff771048682343c9df32489`: 77 checks including package
verification, across `shell` and `verification_process`. The review ran from
02:45:36.823 to 02:49:15.524 UTC, or 3 min 38.701 sec.
Receipt `tmp/verification-receipts/450666-c3021917-3d17-4378-a37e-8d58d9f8ff44.json`
has SHA256 `5f846e60cfc2f85713632bb6b1a70a48b2fe2e9dc0c5ff15be72226dcbbc481c`.

The repair preserves original failure bytes and validates receipt-bound recovery.
Historical source, task, session and checkpoint checks retain the old coverage
and verify the exact approved Tealium additions. Incidents `0137bef0`,
`0f434994`, `20f933a0` and `cbf323df` remain unresolved, with eligible repairs
and terminal verification deferred on this exact candidate. All earlier
obligations remain. The two manifests, activation test and preceding report
matched accepted QA bytes in this intermediate stage.

Automatically resume `tealium-live` from the next coder handoff's committed QA
head. That head is the new activation evidence base. Restore the exact three
paths from `3a0607c0b13227fd7d8a6ae56cef66ca0b9014ca`: `manifest.json`,
`dist/manifest.json` and `test/tealium/devtools/activation-test.mjs`. Their saved
binary diff from `721c0ca298` has SHA256
`5c4b11de74377f40bae982d2206e8e748e8af163261970deeeb581bebb726519`.
Verify these bytes before any needed same-task correction. Keep the integrated
repair and selection policy unchanged. Recompute exact committed scope; the
earlier 64-check activation plan is a forecast. Require fresh review, properties,
package binding and real packaged source navigation with `preview: false`.
Existing deferrals remain governed by the normal post-QA rules. The specifier
accepts activation only after the normal downstream review reaches `qa-ready`.

Stage scorecard: exact evidence passed; original failures preserved; activation
pending; the 30-active-minute integration target remains unproved. The repair
grant was claimed at 01:24:49 UTC and architect QA readiness arrived at 02:59:09,
an elapsed role interval of 94 min 20 sec, including waits and review. This is
not a measurement of coding time. Focused checks and modular repairs worked.
Missing checkpoint fields, stale fixed-population tests and repeated routing
delayed delivery. Keep same-family test maintenance together, check generated
files before evidence runs, and measure these costs in the final delivery report.

## Final activation accepted into QA

Current task status: `tealium-live` is complete for feature integration into QA.
Earlier continuation instructions above record completed stages. Architect
handoff `20260910T031527Z_000914_from_architect` was accepted on 2026-09-10.
QA advanced to `0d6a61bc1e669932cf1510de5ab3799188e9a3f1` from activation base
`64d31a62951f51ce99f0ebc190eb6129f3f6b545`. All three activation files match
saved candidate `3a0607c0` exactly. The integrated repair and selection policy
are unchanged in this range.

| Check | Result |
| --- | --- |
| Approved manifest field and conserved activation files | Passed |
| Exact focused review, properties and package | 65 of 65 passed; 13 pack identities |
| Real package Sources editor | Passed for separate, custom-host and bundled sources; preview false |
| Clipboard, stale-document, wrong-tab and disconnect behavior | Passed |
| Low integration-cost goal | 30-active-minute coding target remains unproved |
| Master integration and terminal obligations | Pending explicit release direction |

Review receipt `tmp/verification-receipts/506646-77fa5aaf-fd89-4c70-acf6-ba2bcc258b53.json`
has SHA256 `28ae18f195216b0cbd2fc06b602944811f8c48005a6c1de28b0915be16f655a9`.
It ran from 03:06:16.476 to 03:09:42.662 UTC: 3 min 26.186 sec. The earlier
64-task plan gained the package evidence task. All 65 recorded tasks passed.
The final activation handoff was queued at 03:03:20 UTC; architect QA readiness
arrived at 03:15:27, an elapsed delivery interval of 12 min 7 sec, including
review and waits. The four accepted product/repair/activation review ranges
recorded here total 313 checks across separate launches and 16 min 4.072 sec.
This total excludes failed attempts, causal repair runs, preparation and role
work; it is not the full development cost.

What went well: exact scope kept final activation bounded, and real packaged
browser checks proved source navigation without a fixture manifest rewrite.
What failed: omitted generated output, incomplete incident identity and old
population assumptions added repair and routing time. Future refinement should
keep approved-addition checks current and check generated output before review.
The manifest terminal obligation and every deferred incident remain preserved.
QA acceptance does not claim master integration, publication or terminal proof.

## Follow-up: open DevTools is reported as unavailable

The user reports the source-status instruction to open DevTools while the
website's DevTools is already open, including after closing and reopening the
extension and DevTools. Whether Chrome's extension-card Reload button was used
after Stage B remains unconfirmed. Preserve the accepted activation and its
evidence; reopen stable task `tealium-live` for a bounded connection correction.

Specifier inspection found one-shot ports in `devtools/entry.ts` and
`live/source-actions.ts`. A controlled check of the delivered source-actions
module established a connected session, closed its port, then called update and
show: connection attempts remained one, source availability stayed false, and
the tag and session remained selected. This proves missing disconnect recovery;
it does not prove the cause in the user's browser. The installed browser helper
also retains its startup debugger session on the background worker. Chrome's
[worker lifecycle rules](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
require testing termination without a debugger that changes worker lifetime.

First reproduce the reported lifecycle with the real activated package and the
background-worker debugger detached. Exercise DevTools opened before and after
Live, an idle or stopped/restarted worker with DevTools still open, and recovery
of the same selected tag. Correct both connection endpoints as needed: rebind
only the current target/session, cancel old operations and authorizations, reject
late responses, and resolve the current selection again. Never replay an old
open-source action. Stop retries on disposal or invalidated extension context;
avoid tight retry loops, new permissions, forced DevTools opening and artificial
worker keepalive. Retain wrong-tab, stale-document, duplicate-action and genuine
DevTools-close protections. Show connection loss accurately when recovery fails.

Keep the repair in the existing private Tealium modules and registered tests.
Forecast paths: `src/tealium/devtools/entry.ts`, `src/tealium/live/source-actions.ts`,
`src/tealium/live/render.ts`, `test/tealium/devtools/protocol-test.mjs`,
`test/tealium/live/source-actions-test.mjs`, and `test/tealium/browser.mjs`.
The prospective plan selects 45 checks in Shell plus package verification.
Recompute exact committed scope; no registry, manifest or verification-policy
change is planned. Use a 30-active-minute reporting ceiling with a halfway
checkpoint for browser reproduction and the endpoint fix; continue safe bounded
work and report variance. Preserve all earlier incidents and terminal duties.
Use the normal coder/refactorer/architect QA path. Report the actual browser
reproduction and recovery separately from the controlled connection check.

### Connection correction: coder findings

The activated package reproduced loss of source access after worker termination.
The startup worker debugger was detached, the old worker target disappeared,
and the same selected tag did not recover within ten seconds before the fix.
This is a real lifecycle reproduction, separate from the specifier's controlled
port test. The cause in the original user session remains unconfirmed.

Both endpoints now use one small private transport module. Lost ports retry
with delays of 0.5, 1, 2, 4, 8 and 8 seconds. Disposal, invalid context, or six
failed retries stops recovery. Connected ports send no keepalive messages.
Recovery binds the current session and resolves the current selection again.
Old operations and authorizations are cancelled; old port messages are ignored.
Recovery never repeats an old open-source action. Lost transport is shown as a
connection loss. The accepted activation and all terminal obligations remain.

Direct unit checks reproduce the old missing retry and now pass recovery,
current-session replacement, late-result rejection, disposal, invalid-context
and bounded-retry cases. The real package passes both DevTools opening orders,
worker termination with its debugger detached, held-action cancellation,
retained selection, and a new explicit action in the actual Sources editor.
The existing protocol checks also pass with preview false. These are development
checks; exact committed review and package evidence remain required.

The reproduction and endpoint correction took about 12 minutes from mail claim,
including diagnostic runs. The 30-minute reporting ceiling has not reset the
older unproved integration-cost target. Small modules and the actual worker
boundary worked. One new editor assertion used an unavailable Chrome method;
it was corrected to the existing actual-editor observation. Retain lifecycle
coverage with detached worker debugging for later connection changes.

## Automatic metadata: coder implementation

Task `tealium-live-metadata` starts from `c189a7170621c433f542ddb53c8d88349c34220d`.
The local reader uses a valid `cfg.utid` for account, profile display name and
publish identifier, while retaining the runtime key. Explicit runtime environment
wins; a matching standard publishing path can supply dev, qa or prod. Ambiguous
custom paths stay unavailable. A recognized standalone template value supplies
library version; combined `cfg.v` is not a published title or invented version.

One retained metadata owner serves both surfaces. Local rows render immediately.
It joins names by complete utid and UID, never adds unobserved rows, preserves
source evidence, and applies successful names without changing row keys or focus.
Requests use the fixed HTTPS endpoint, omit credentials and referrer, and reject
redirects. The complete known callback argument is parsed as JSON data. Limits
are eight seconds and 1 MiB, with bounded used-field lengths. Failed lookups do
not repeat on polls. Exact-host access and explicit retry preserve the session.
Pause holds the displayed snapshot; document and session replacement, End and
disposal cancel pending results. Responses are not persisted.

Direct checks pass local identity, strict parsing, limits, privacy, exact joins,
late tags, retry, pause, stale frames/documents and session replacement. Installed
checks use intercepted production fetches with real Chrome host grants. They
prove fallback before response, literal titles, source availability, filters,
focus, both surfaces, consent/refusal, failed and empty responses, explicit retry,
reload rejection and a new automatic attempt after full-width Start. Both pinned
real-runtime paths show tealium/docs/202504230113 without metadata access.

A separate public smoke read on 2026-09-10 returned UID 115's title, Tealium
AudienceStream Integration, for tealium/docs/202504230113 without login. This is
one external observation; controlled installed responses remain the repeatable
proof. The public result does not establish access to other profiles.

The intent plan selected 45 Shell checks. Local identity and the first installed
lookup/fallback checks passed within 12 minutes of the mail claim; complete direct
lifecycle checks passed within 18 minutes. These intervals include diagnostics,
not downstream review. Exact committed review and package proof remain required.
Small modules and fixed-endpoint interception worked. A late cancelled result
initially entered retry state; its regression now passes. Type errors, focus
setup and a reload readiness expression caused bounded diagnostic corrections.
Keep these lifecycle checks and compare exact evidence cost with the forecast.
All prior Tealium terminal obligations remain unchanged.

The first exact review stopped at the existing Live acceptance-mapping test.
Its six-row positional assumption and positive runtime fixture omitted the four
new metadata result rows and required metadata evidence. Repair family:
`tealium-metadata-mapping-conservation`; fixed boundary: the existing Live mapping
test and its private causal helper. The complete observed list has those two
items; discovery is complete. The corrected test retains all six prior result
checks, both geometry cases and prior rejection cases, adds all four metadata
rows, and rejects each missing metadata flag. Its 58 assertions pass. The causal
fixture runs the immutable failed test against current handlers before checking
the corrected test. Original incident `2f8b535e-6dcf-44cd-b37b-48ed805e8ddf` and
its failed receipt remain preserved. Focused repair and fresh review are required.

### Missing profile display correction

Refactorer review found one blocker: the inspector substituted the runtime key
when the display profile was absent. The correction shows Unavailable for that
missing field and shows Runtime key separately. A focused rendering test first
reproduced shop.main in the wrong field, then passed the correction. Installed
checks pass absent identity, a supported local profile, valid-utid precedence,
and unchanged runtime identity. This corrects the displayed fallback only.
The original specification base, stable metadata task and prior incident remain.

## Send and extension source targets: coder implementation

Task `tealium-source-targets` starts from `1f38befa8d3f4d3b4b745936c44607fe30d18dbe`.
The selected tag now has Go to u.send and Go to u.extend. Source requests carry
that destination through the broker. Both source fingerprints participate in
current-tag validation and selection invalidation. A new explicit action cancels
older actions; connection recovery resolves current destinations without replay.

The reader copies function text from a readable registered extension array and
never calls it. Missing or unreadable arrays disable only the extension action.
The resolver separates file identity from exact location. An observed loaded tag
URL takes priority; otherwise registered send and extension definitions narrow
candidate files. A small lexical scan excludes strings and comments and checks
same-object, same-scope assignments before associating repeated send code with
an extension array. Unsupported associations retain file-start fallback. Several
possible files or conflicting content at one URL remain ambiguous. The array
assignment is distinct from the loop that invokes extensions inside send.

Direct tests pass repeated code in one bundle, observed separate URLs amid copies,
unique and shared extension evidence, unbound-send distractors, absent/unreadable
and empty arrays, and current-code validation. Installed tests verify actual
editor content and selection for both destinations before and after formatting,
both surfaces, preserved custom URLs, file-start feedback, shared-file ambiguity,
and zero action-induced execution or resource requests. Extension code changes
and End cancel held actions; new explicit actions use the current destination.
Existing real-bundle, clipboard, connection-recovery and document safeguards
remain in the focused plan.

The intent plan selected 45 Shell checks. Matching and first editor destinations
passed about 12 minutes after mail claim, before the 30-minute checkpoint. These
are development checks; fresh exact review and package evidence remain required.
Small resolver modules and independent fixture locations worked. One browser
assertion assumed unformatted source text; it was corrected to inspect Chrome's
actual definition position. Keep formatting, ambiguity and destination-specific
lifecycle cases together for later changes. Metadata and all terminal duties
remain preserved.
