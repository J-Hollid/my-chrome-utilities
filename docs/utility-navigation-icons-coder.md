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
