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
