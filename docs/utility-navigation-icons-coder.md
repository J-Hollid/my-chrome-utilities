# Utility navigation icons: coder result

Task: `utility-navigation-icons`. Received specification base:
`b26de510fb6cdbae894659c27b62d932bef66a9a`.

The installed workspace now presents the approved local DL, HK key outline, and
original Tealium T vector artwork. The host preserves the existing contribution
order and tab controller. Each icon retains its full accessible name and panel
association. Hover and focus show a full name; future utilities receive a short
label and the same accessible-name treatment. Presentation is split between
small host modules; the broad shell stylesheet is unchanged.

Controls use 44-by-44 CSS pixels, 24-pixel artwork, and an 8-pixel gap. Selected
controls have a border and inset mark; keyboard focus has a separate outer
outline. Forced colors use a double selected border and an outer focus outline.
The new test prefix belongs to the existing utility workspace host slice and
retains every declared host consumer. New feature parse/generate tasks are added
without removing any existing task. No new image request or permission is used.

Specification and runtime proof remain separate. The received product/runtime
contracts have three scenarios each. Unit checks cover the three artwork
identities, accessible names, and readable fallback labels. Installed checks
inspect each selected utility at 320 and 800 CSS pixels in normal and forced
colors, actual hover/focus names, all four tab navigation keys, and screenshots.
Session checks use real Chrome capture and Tealium observation on one website,
check stable session identities and selection, count each arriving event once,
and close/reopen the native host to check restored selection. The existing
Probe fixture checks the rendered fallback control and retains its old checks.

Planning: the host-only path forecast was 31 tasks. Initial complete intent was
bounded-ready at 44 tasks across 13 packs after including registry work. This
is a selection of owned checks and consumers, not 13 complete feature packs.
New acceptance tasks and package proof require a fresh exact count and timing
in the recorded review evidence. No claim of a 31-task result is made.

What went well: the small presentation change preserved existing navigation
and passed actual geometry/appearance checks early. Process failures: the
first build needed Array.from for the configured DOM library; the first native
reopen test confused debugger targets with the native panel lifecycle. The
final check closes the window-level panel through chrome.sidePanel.close, then
reopens it through the installed action. These test issues were corrected
without changing product behavior. Screenshot review also retained the strong
selected background during hover. Refinement: retain explicit
native-target checks and normal/forced-color screenshots with this fixture.
QA review and master promotion remain separate.

Pre-commit installed host verification passed all 12 icon appearance rows and
all six continuity/restoration assertions, together with the existing retained
Probe, startup isolation, and reopening evidence. Screenshots are under
`tmp/utility-icons-images/`; the observation log is
`tmp/utility-icons-host-browser.log`. Product coding and focused development
checks completed within the 30-minute allowance. Exact committed review and
package evidence follow this report.

## Exact verification blocker

Implementation checkpoint: `511bb177`. Exact ownership passed as bounded-ready:
49 checks across 13 declared packs, with a final package check to follow. The
runner stopped before creating an execution receipt or running checks. Log:
`tmp/utility-icons-review.log`. No review-ready or QA-ready claim is available.

`validateGovernedPrelaunchIdentities` compares the current complete Shell plan
with the immutable blocked-aggregate consumer-plan digest. The accepted base
still derives `3cb97eb77daeecee4acb5c465cec1ccd243d0491e8e5be95a61334c841c3e939`;
the candidate derives
`caf11387e0c1b714a26225ff86894557830533b130e3f57258bd62c1c5450296`.
The difference is the four newly approved feature parse/generate tasks and the
corresponding Shell acceptance-session identity. No old executable is removed.
The bounded comparison is in `tmp/utility-icons-governed-blocker.json`.

Keep the original source identity and stopped attempt. The shared engineering
rules require internal specifier routing for this verification-tooling limit;
they do not authorize replacing the historical digest, omitting consumers, or
starting an unrelated verification-framework repair. The implementation and
installed proof are preserved while exact review and downstream integration
remain pending. The active handoff stays open for the authorized repair/resume.

## Authorized historical identity repair

Unblocker `utility-icons-governed-prelaunch-repair`, authority `63327cf00a`,
authorizes the bounded prelaunch gate and its direct contracts. The original
work source, plan digest, stopped log, and implementation checkpoints remain
unchanged. Commit `48b0bd6636976d5c337ee3114447f645cc34a563` introduced the stored
plan digest; its tree is `b23b6d82e691038e71ec24899497126e676cf5c9`. The registry
from that accepted commit reproduces the stored digest exactly. New explicit
plan-source fields bind this proof to the accepted snapshot.

Prelaunch and both blocked-aggregate direct contracts now derive the historical
consumer plan from that snapshot. The gate applies to governed tasks and actual
blocked-aggregate obligations. An unrelated host consumer alone does not apply
it. No current task is removed, and the Phase 2 authority checks remain intact.
The administration, blocked-aggregate, and evidence-promotion direct contracts
pass. Negative checks reject malformed or unavailable source identities, an
incorrect tree, an incorrect digest, and substitution of the current registry.
Existing Phase 2 missing, duplicate, and stale identity checks still pass.

The evidence-promotion contract had the same defect and was repaired in this
pass. Complete repair intent is bounded-ready: 91 tasks across the same 13
packs. This includes the direct contract's owned consumers. Exact committed
review remains the next step; direct checks alone are not review evidence.
Refinement: bind historical task plans to explicit registry snapshots, and
keep current host consumer selection separate from historical authority checks.

## Resumed review: conservation tool limit

Repair checkpoint: `c46ee7b1`. The unblocker completed and returned RESUME for
handoff `20260910T084451Z_000940_from_specifier`. Exact ownership was bounded-ready
at 93 tasks. The focused runner passed prelaunch and then stopped on two
independent contract checks. Failed receipt:
`tmp/verification-receipts/1327482-132aa57b-f256-4007-85c7-4ab0575ea6aa.json`.
Log: `tmp/utility-icons-repaired-review.log`. No review evidence was recorded.

The modularization acceptance check reports stale compact source identity for
`evidence-promotion-blocked-aggregate-contract-test.mjs`. Both modified
blocked-aggregate contracts retain their exact normalized assertion, fixture,
and evidence outputs. Their source records require the normal derived refresh.
The compact conservation contract instead reports an output projection mismatch
for `execution-runner-integration-contract-test.mjs`. That source is unchanged
from accepted base `b26de510fb`; its base and current output digest are both
`b9cc13f5a2c00ff25576644d54e7688cf6e16b8749f2bfedd4cd5746fb0181a4`, while the stored
projection expects
`b3e04e6195a8e4383b86c272e2b44f9060d581ba2deaf3aba034168008402424`.
A bounded comparison of all compact output records finds only this one output
mismatch. The assessment is in `tmp/utility-icons-conservation-assessment.json`
and `tmp/utility-icons-projection-defects.json`.

The supported `generate-compact-conservation.mjs refresh` command fails on that
same inherited projection before writing the required current source records.
See `tmp/utility-icons-conservation-refresh.log`. Thus this is a specific helper
limit for an inherited failure, not a reason to remove checks or alter unrelated
contract behavior. Internal specifier routing is required under the shared
engineering rule. The ordinary task remains open; QA integration remains
pending. A new full review is not started while this input remains invalid.

## Authorized compact correction

Unblocker `utility-icons-compact-record-refresh` applied specification authority
`339c6035a3` by merge, preserving the original candidate and failed receipt.
Snapshot `30bbdbce822311ef96cd17aed0d7627c9a9167d1` records only the authorized
runner output transition and the two required blocked-aggregate source updates.
The runner count rises from 65 to 67. The aggregate count rises from 1455 to
1457. Both blocked-aggregate normalized outputs remain unchanged. Every prior
compact authority entry, legacy baseline, and compatibility record is retained.
The existing chain now authenticates the new snapshot and exact changed-owner
set against its prior accepted head. The subsequent supported refresh changes
only current generator identities. No contract source behavior is changed.

Supported refresh and check pass. Both formerly failed direct checks pass:
compact conservation and registry/planner modularization acceptance. The compact
check retains forged-authority, candidate-parent, deleted-check, and unexplained
drift rejection. The expected authorized replacement count is now 21.
Direct logs: `tmp/utility-icons-compact-direct.log` and
`tmp/utility-icons-modularization-direct.log`.

Maintenance coding and direct checks used about six active coder minutes,
separate from icon coding and final review. Complete intent is bounded-ready
at 254 checks across the same 13 packs because compact authority changes have
broad verification consumers. The current supported framework is used without
an override. Fresh exact focused review and package proof remain required.

The first resumed full review stopped before execution because the two earlier
failures have durable incidents `63200393-f3a3-4138-9338-c876bc52bac8` and
`f7bbdc72-e0ae-4761-a213-12fcb2833bd6`. The failed receipt remains unchanged.
A small icon-maintenance proof helper now uses the immutable failed fixture
at `c46ee7b1` to reproduce each exact mismatch and validate the current record.
For source proof, it isolates the two stale source identities from the separately
corrected projection and current generator binding. For projection proof, it
compares current outputs with the original projection. Both direct proof paths
pass. The existing runner-owned repair mode must admit these proofs before the
fresh review can launch. This is incident proof, not another product change.

Both compact incidents obtained eligible runner-owned repair proof (eight checks
each). Fresh review on `c65fafd8` then passed 151 checks before a companion browser
measurement failed. Receipt:
`tmp/verification-receipts/1365810-0ca16d81-ff8f-428a-9bcd-6ee23ee03b3b.json`.
Incident: `36505795-545e-47c9-8825-3f5eac687211`.

The companion check counted the visible absolute tooltip as clipped button
content and applied the old ordinary-control radius limit to the approved
8-pixel icon controls. Product geometry matches the approved preview. Bounded
test maintenance now checks icon artwork inside its button and the visible
name inside the viewport. Ordinary controls retain their old clipping and
4-pixel radius checks; icon controls retain the approved 8-pixel limit. No
product source was changed. Immutable old measurement source at `c65fafd8`
reproduces the clipping report on the same installed page. The corrected
measurement passes. The installed Projects check passes 21 populated views,
four accessibility modes, dialog closure, long records, recovery, and studio
checks. Log: `tmp/utility-icons-companion-direct.log`. This test maintenance
used about four additional active minutes under the original icon outcome;
compact maintenance remained within its reported allowance.

The companion repair plan selected the host source-inventory check, which still
expected the pre-icon module list. Its bounded maintenance adds exactly
`navigation-icons.ts` and `navigation-style.ts` to that list. Both modules are
checked against the same retained host boundary and all 13 host consumers.
The old paths and their checks remain present. The direct Shell ownership
contract passes the icon inventory assertion, then stops on an inherited Tealium
source-list mismatch. The earlier statement of a complete pass was premature.
No product or manifest boundary is changed.

## Inherited source-list tool limit

The direct source check and the companion incident repair are blocked by six
Tealium modules omitted from `source-conservation.mjs`: DevTools `connection`,
`definitions`, `lexical-context`, and `template-expression`, plus live metadata
`owner` and `request`. All six files and that declaration are byte-identical
between accepted base `b26de510fb` and this candidate. Their exact blob comparison
is saved in `tmp/utility-icons-inherited-source-assessment.json`.

Bounded discovery compares all 19 existing and omitted Tealium sources. Every
current task plan equals the declared accepted registry plan at `721c0ca298`.
See `tmp/utility-icons-inherited-source-plans.json`. Thus no owner/consumer or
execution-plan drift was found behind the missing list entries. Negative checks
for arbitrary additions, deletions, owner moves, and consumer changes must remain.
This inherited source declaration is outside the compact correction boundary.
The runner-owned companion repair cannot complete its required ownership check
and cannot produce eligible proof. Its failed run is preserved in
`tmp/utility-icons-companion-repair.log`; direct confirmation is in
`tmp/utility-icons-source-inventory-direct.log`. The supported route has no
partial admission for this failure, so shared engineering requires bounded
internal specifier routing. The task remains open and review-ready evidence is
pending. Both compact incidents retain their eligible repair proof.

## Authorized accepted-source refresh

Unblocker `utility-icons-tealium-source-list-refresh` authorizes the six exact
accepted entries under the existing source-list and direct owner-contract
boundary. The declaration now includes the four accepted DevTools modules and
the two accepted live metadata modules. Existing historical source population,
accepted registry, and negative owner/consumer/addition/deletion checks remain
unchanged. The complete direct Shell ownership contract exits successfully.
Log: `tmp/utility-icons-source-refresh-direct.log`. Complete current intent is
bounded-ready at 299 checks across the same 13 packs. This correction used about
two active coder minutes. The companion incident proof and exact review follow.

The companion repair is now eligible. Fresh review on `12d34304` selected 311
checks and found two remaining causal task-list expectations in manifest
planner isolation and registration. Receipt:
`tmp/verification-receipts/1431834-d5512682-4ec3-41c5-9438-ffc067056573.json`.
Incidents: planner `c19345a0-f9ac-462d-8951-aa4da49d213c`; registration
`823b0a14-ed24-4fe8-aefb-0a85715bc670`.

The bounded test maintenance admits exactly the four approved icon feature
parse/generate tasks from preserved implementation registry `511bb177`. Shell
session arguments retain every historical artifact and add the two approved
features. Exact task identities and rejection checks remain enforced. The
prospective Tealium fixture continues to use its original pre-icon host list.
Both direct checks and their immutable before/after proof paths pass, with one
proof record per incident. No product or registry task definition is changed.
Logs: `tmp/utility-icons-planner-proof-direct.log` and
`tmp/utility-icons-registration-proof-direct.log`. This additional causal test
maintenance used about four active coder minutes; runner repair and review
execution are reported separately.

Planner incident proof is eligible. The registration repair checks all passed,
but its serialized before/after fixture exceeded the 16,384-character bound.
The helper now keeps the full array assertions and emits only counts and
SHA-256 digests. Its direct registration fixture is 777 characters and passes.
The prior oversized proof remains in the failed repair log; no failure is
converted to a pass. A fresh runner-owned registration proof follows this
bounded reporting correction.

All five earlier task incidents now have eligible repair proof. Fresh review on
`899b93f1` then reached the icon browser check and exposed a Chrome setup defect:
the Tealium helper nested another temporary directory beneath the runner's
short Chrome directory. The resulting Unix socket path was 120 bytes, beyond
the 107-byte payload limit. Receipt:
`tmp/verification-receipts/1512081-ef1bb99b-e5f4-473e-9f1a-52f61dabb360.json`.
Incident: `dbfc124c-df1b-4732-a9ef-9d35e5cde9d7`.

The helper now uses the runner-assigned directory directly and leaves its
cleanup to the runner. Standalone runs retain a separate temporary directory
and helper-owned cleanup. An installed direct run under the same root length
passes all existing utility host checks, 12 icon appearance cases, and capture
continuity/restoration checks. The immutable source-based proof compares the
old 120-byte socket path with the corrected 105-byte path after the actual
installed run passes. Log: `tmp/utility-icons-chrome-path-direct.log`. No product
source or permissions changed. This bounded helper repair used about three
active coder minutes, separate from verification execution.

## Final acceptance step-dispatch blocker

The Chrome path repair is eligible. The next full review passed 305 tasks,
then Tealium live lifecycle timed out waiting for its target. The single
runner-owned diagnostic passed and classified incident
`eb4cad49-25fb-455d-8bf9-c9ccead4436d` as confirmed flaky. The runner rejects
ordinary receipt continuation with reliability admissions, so a fresh normal
review was required and run without changing candidate `5eb7aa01`.

That fresh receipt records 312 passed tasks with fresh provenance, including
the installed icon checks, companion geometry, all six causal repair boundaries,
package proof, and the previously flaky lifecycle checkpoint. Shell acceptance
then fails on Tealium source navigation 009/example_1:
`Missing example value: run_action`. Receipt:
`tmp/verification-receipts/1603856-b15d6a78-d3c3-4ee9-b9dc-9be6f41a42f0.json`.
Log: `tmp/utility-icons-classified-final-review.log`. Incident:
`bee6b9ea-60a0-4990-98e6-b6d55545b55c` (`acceptance-session:shell`).
No successful review receipt or downstream handoff is claimed.

The feature defines `When the user chooses <action>` with example column
`action` (Go to u.send / Go to u.extend). The shared sequence replay step
`the user chooses <run_action>` reads example key `run_action` and limits it to
Run step / Run all. The observation-target choice handler also has an explicit
run_action branch. The feature, Tealium handler, sequence replay handler, and
observation-target handler are all byte-identical to accepted base `b26de510fb`.
Their bounded comparison is `tmp/utility-icons-step-collision-assessment.json`.
This is an inherited step-dispatch conflict, outside the authorized six-source
list correction. The Shell acceptance incident prevents review evidence and
cannot be omitted or treated as a pass. Shared engineering requires internal
specifier routing for the exact conflict. Preserve the failed session, the
confirmed-flaky lifecycle classification, and all earlier incident proofs.
The ordinary icon handoff remains open for bounded repair or supported disposition.


## Authorized Tealium choice dispatch repair

Specifier correction `5cd7db51` changes only the source-navigation 009 choice
step wording. The two actions, destinations, examples, and assertions remain
unchanged. The direct regression runs the existing Tealium, sequence replay,
and observation-target handler populations in their registered order. It
reproduces the old missing run_action error, selects the Tealium handler for
both source actions, and preserves Run step and Run all with observation-target
mode on and off. Model evidence is supplied by the dispatch fixture; this is
specification dispatch proof, not installed browser proof. The direct protocol
check passes. The normal incident repair and fresh review remain required.

Inspection also found an inherited modular-architecture catch-all handler
before Tealium in the complete feature registry. This is outside the authorized
three-population dispatch boundary. No shared dispatcher or unrelated handler
was changed. The direct regression does not claim that the complete global
registry selects Tealium. Record this finding for later acceptance ownership
review. Existing separate executable model and browser checks remain required.

## Architect review, 2026-09-10

- The production change stays within small utility-host presentation modules.
  Artwork uses fixed local SVG data; labels use text nodes. The existing tab
  controller retains navigation, accessible panel links, and session ownership.
  No product repair was needed in this review.
- Reviewed the installed 320-pixel normal and forced-color screenshots and the
  browser assertions for all 12 appearance cases and six continuity results.
  Incoming exact evidence records 317 passed tasks. These are runtime checks;
  specification parsing and mutation checks are separate evidence.
- Verified that the compact refresh preserves all 46 owners, the complete legacy
  baseline, and compatibility entries. The only added output transition is the
  authorized runner change from 65 to 67 items. The two blocked-aggregate owners
  change only source identities. Historical-plan authentication retains its
  immutable digest and uses its named registry snapshot. New icon feature tasks
  are additive; old consumers and rejection checks remain.
- TypeScript build and module architecture passed. Changed Clojure DRY found no
  duplicate candidates. Differential language mutation killed 11/11 mutants.
  Soft Gherkin mutation of the changed Tealium feature killed 54/54 mutants using
  the feature-owned handler and the incoming model observations. This does not
  claim a new browser run or repair the recorded global catch-all limitation.
- The Gherkin tool added comment metadata. The dispatch conservation check then
  rejected that metadata as an extra contract edit. Its bounded correction
  compares all non-comment contract text; the exact authorized wording change,
  both actions, and Run step/Run all checks remain required. The protocol leaf
  passes with the generated metadata present.
- Keep the inherited catch-all finding, incident history, and confirmed-flaky
  lifecycle disposition. Final focused evidence must bind this review commit
  before QA forwarding. Master integration remains separate.
