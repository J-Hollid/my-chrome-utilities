# Verification registration and review preflight R01

Status: user-approved on 2026-09-12; implementation activation follows the
reviewed modal repair's QA integration and preserves product delivery priority.
Task: `verification-registration-review-preflight`.
Prepared: 2026-09-12.

## Source and purpose

Preserve the recommendations in coder note
`20260912T151605Z_000063_from_coder`, which was processed and closed. The user
clarified that the note was sent to retain the recommendations and prepare a
process fix. Closing the queue item did not complete that specification duty.

The note concerns `live-property-declaration-modal-recovery`, candidate
`00e87bf846`. Its recorded evidence contains 945 passing tasks across ten packs,
with base `f0570e3780`. The candidate has review-ready evidence; this document
does not grant QA integration or change that record. The later approved
`live-add-all-schema` specification at `806ad82f` remains active.

Three failures were reported:

1. Three existing Shell features lacked acceptance step registration:
   `modular-acceptance-execution`, `modular-browser-runtime-adapters`, and
   `modular-chrome-utility-architecture`.
2. The added registration regression appeared in current manifests but not in
   the historical-conservation task population. Its expected execution fields
   then needed a separate manual update.
3. A receipt produced with `--changed-since f0570e3780` was initially offered for
   recording and handoff with base `19aee85aa1`. Those ranges have different
   changed paths because the earlier base includes the specification document.
   Existing recording checks correctly rejected the mismatch, but only after
   the expensive review run.

The precise discovery and repair durations are not available in this note.
Do not invent rerun counts, elapsed savings, or claim that the successful run
was invalid. The evidence was recorded against its actual base.

## Preserved recommendations and proposed disposition

| Coder recommendation | Proposed response |
| --- | --- |
| Check current and historical populations together when acceptance tasks change | Add a bounded registration/conservation check to existing preflight for the affected packs and tasks. |
| Use one task identity constructor | Reuse or extract the existing `commandTask` normalization for approved declarations and execution. Retain independent historical expectations and authority. |
| Separate implementation base, specification commit, and verification base | Represent these distinct values in review preparation. Keep the existing handoff `base` bound to the receipt range; do not introduce an unreviewed wire-format migration. |
| Use the same base for final verification and review-ready handoff | Print one exact binding and matching commands from preparation; validate it again at launch, recording, and handoff. |
| Compare planned receipt paths with future handoff paths before the long run | Extend existing read-only plan/preflight checks to compare both explicit ranges before any build, browser, acceptance session, or package work. |

## Bounded outcome

Extend existing verification planning and review preparation. Add no daemon,
mandatory background service, new incident lifecycle, or separate verification
framework. The contract is
`features/verification-registration-review-preflight.feature`.

### Registration and identity

- For changed or explicitly activated acceptance features in the selected plan,
  verify registration against the handler set actually loaded by the owning
  pack. Importing a module or finding a source string is not sufficient. Resolve
  each scenario's executable step route without running the product check.
  Detect absent and ambiguous routes, and identify the feature, scenario or
  step, and pack. Reuse existing parser/dispatcher facilities.
- Compare the selected current task identities with the retained historical
  projection and explicitly authorized additions. Detect missing, duplicate,
  extra, and altered identities. Name the exact differing fields.
- Reuse the current canonical command construction for key, stage, pack,
  executable, arguments, target, environment, capabilities, temporary-path
  class, and display. Preserve all existing optional identity fields too.
  Do not maintain a second manually formatted execution identity.
- Keep old registry snapshots, evidence, digests, and independent conservation
  expectations unchanged. A current declaration is not its own authority to
  change history. Missing authorization fails with a clear message; no automatic
  historical rewrite is permitted. Additions must use the existing governed
  authority route. Negative fixtures must reject an unauthorized extra task and
  an altered historical executable even when both consumers share the builder.
- Limit the check to the affected plan and its required historical projection.
  Do not run all acceptance suites merely to classify one changed registration.

### Review preparation and handoff base

- Identify the received work base, specification commit, intended evidence base,
  and candidate commit/tree separately in review preparation. The specification
  commit is context, not an automatic substitute for the evidence base. The
  received work base and evidence base may legitimately differ.
- Resolve supplied references to exact commits, check ancestry, and derive the
  candidate change set through the existing canonical function. Include
  documentation paths when the evidence range contains them.
- Compare the intended `--changed-since` range with the intended handoff range.
  On a mismatch, stop before expensive tasks and show both bases and path
  differences. Do not silently choose a base or omit specification paths.
- On success, print one binding and matching verification, record-review, and
  handoff inputs. Use existing plan/evidence data structures where possible.
  A plan-only result remains read-only and is not review-ready proof.
- Check the exact binding again immediately before review execution. A changed
  candidate or base requires fresh preparation. Late recording and handoff
  validation remain authoritative and continue to reject stale or mismatched
  evidence. Never relabel a completed receipt to match a new base.
- Preserve historical handoffs. Propose any necessary clarification of the
  constitution's `base` wording for explicit review before activation. This
  draft does not change role prompts, queue parsing, wire fields, or authority.

## Scope, implementation shape, and verification forecast

Start from current QA after the modal repair is reviewed and integrated. Preserve
its product remainder, exact evidence, and the approved Add all feature. This
proposal is not a prerequisite for either product task and does not delay them.

Existing discovery found:

- `scripts/verification-planner/tasks/planner.mjs` already has `commandTask`.
- `scripts/verification-planner/manifest-declarations/historical-conservation.mjs`
  already compares historical execution identities.
- `scripts/settled-final-verification-review.mjs` already checks receipt candidate
  identity and changed paths during recording.

Use small modules and existing entry points. Do not extend large planning or
verification files with unrelated orchestration. Forecast owners:
`verification_process/task_batching` for identity and conservation,
`verification_process/evidence_promotion` for review binding, and the Shell
parent fallback for isolated acceptance handler audit. The current path query
for `acceptance/src/acceptance/verification_support/isolated_handler_audit.clj`
selects only `shell`, with 192 tasks and no declared external consumers. Use
that existing boundary as the registration forecast. The generic
`acceptance/src/acceptance/steps/support.clj` selects every runnable pack;
do not edit it merely to attach the new check. If a necessary change reaches
that boundary, apply the standing preparation rules before launching evidence.
Proposed new paths are narrow helpers beside the
existing owners, with the same direct consumers as those owners; avoid a new
global helper classification.

Development focus: synthetic registration/dispatch fixtures, task-conservation
negative fixtures, and the existing evidence receipt/conservation contract
tests. Include the exact f0570e3780 versus 19aee85aa1 range distinction in a
small repository fixture. Prove that mismatches launch zero expensive tasks and
create no receipt, incident, or portfolio record. Test the existing final
validators independently of the new early check.

QA-impact forecast: `verification_process` and `shell`, subject to canonical
read-only intent before edits and exact changed-path preflight on a coherent
candidate. No whole-suite feature checkpoint. Follow the existing ownership
preparation rules for a demonstrated coarse boundary; do not narrow ownership
inside the product range to keep the forecast small.

## Proposed baseline, target, and effort

Baseline: missing registration and historical identity were found during review;
the handoff-base mismatch was found at recording. Exact elapsed costs remain
unmeasured. The current successful evidence must be preserved.

Target: all three reproduced failure classes stop before expensive verification.
A valid unchanged preparation launches the same task population as before, with
no second full planned run and no relaxed final validator.

Expected effort: one bounded tooling slice, four hours to a review-ready
candidate, with a two-hour assessment. At each point report remaining work,
selected scope, runtime overhead, and confidence. Continue bounded safe work
under the existing autonomy rules. Stop only the affected expansion if the fix
requires a new authority system or a broad handoff-format migration; retain the
usable smaller result for scope review.

Safety trade-off: earlier checks add startup work, but must not derive historical
truth from current output. Measure their actual added time on the existing
fixtures and on the next three naturally requested tasks. No synthetic delivery
program is needed to collect this measurement. Report later whether the checks
prevented a late failure and whether their cost justified retention.

## Approval and next action

The user approved the baseline, target, effort, safety trade-off, scope, and
bounded stop conditions on 2026-09-12. No repeat approval is required for this
correction. The dialog repair is QA-integrated at `a79b169d01`. Issue this same
stable task from its accepted specification-recording descendant, at lower
priority than `live-add-all-schema`. Preserve later accepted QA ancestry when
starting or forwarding this work. Do not make this process work a prerequisite
for the product feature or interrupt its active implementation.

Keep role prompts, constitution wording, and wire fields unchanged in this
implementation. A specific later wording change must still be presented for
review as stated above; the approved preparation metadata does not silently
change the existing handoff protocol. Do not start a second enabling slice
before its settled scorecard is reviewed.

Use the accepted starting commit as `<base>` in the existing read-only intent
and exact checks. Include actual additional owned paths and all packs reported
by the canonical planner:

```sh
node scripts/verification-ownership-readiness.mjs intent --base <base> \
  --task verification-registration-review-preflight \
  --pack verification_process --pack shell \
  --path scripts/settled-final-verification-review.mjs \
  --path scripts/verification-planner/manifest-declarations/historical-conservation.mjs \
  --path acceptance/src/acceptance/verification_support/isolated_handler_audit.clj
node scripts/verification-ownership-readiness.mjs exact --base <base> \
  --changed-since <base> --task verification-registration-review-preflight \
  --pack verification_process --pack shell
node scripts/run-focused-acceptance.mjs --pack verification_process --pack shell \
  --property --changed-since <base> \
  --prepare-evidence verification-registration-review-preflight
node scripts/verification-evidence.mjs record <printed-pending-file>
```

The last two commands require a settled committed implementation, the complete
exact selected pack list, and package proof. They are not startup checks.

## Specification scorecard

The draft preserves all five recommendations and defines six regression
scenarios. The vendored Gherkin parser passed. The IR DRY checker reported one
possible synonym: the Background declares the available preparation identities,
while scenario 004 sets two of them equal to reproduce the mismatch. They are
different setup conditions and remain separate. Example parameters vary and are
used; common setup is in Background. No acceptance mutation was run.

Runtime proof for this proposed correction: none. Existing candidate evidence is
source context, not proof of this new preflight behavior.

What went well: direct inspection found reusable command construction and late
identity checks, so the proposal can extend existing mechanisms.
Process failure: the initial note was closed without a durable recommendation
record or a proposed correction. This document closes that recording gap.
Recommendation: review this bounded draft before implementation; keep historical
truth independent and measure preflight cost before considering wider changes.
