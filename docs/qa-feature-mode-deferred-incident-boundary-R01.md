# QA feature-mode deferred-incident boundary R01

Status: user-approved for delivery before Flow relationship port snapping resumes

Prepared: 2026-08-13

## Problem

The release pilot correctly preserves unresolved reliability incidents for the
frozen master-integration checkpoint, but feature candidates have repeatedly
been forced to re-audit and re-defer every ancestor incident whose recorded
inputs overlap their changed paths. That turns a small feature into unrelated
incident repair, expands its verification scope, and can trigger the all-20 gate
that the pilot reserves for master integration.

## Required behavior

- An eligible `terminal-verification-deferred` incident remains durable on its
  recorded candidate and remains a master-integration obligation. That candidate
  may be an ancestor of current QA or an abandoned parallel descendant of an
  earlier QA base.
- A later feature preflight and handoff ignore that incident when the only
  relationship is inherited failure lineage, changed-path overlap, or a shared
  disposition recorded on an abandoned parallel candidate. They do not audit,
  reverify, mutate, copy, carry forward, or re-defer it on the later candidate,
  and they do not require the abandoned candidate to be merged.
- The later feature still requires exact focused review-ready evidence and
  package proof for its own approved scope.
- If ordinary focused development or review naturally reproduces an earlier
  incident's diagnosed failure boundary, handle that incident case by case at
  the smallest causal boundary before the feature proceeds.
- If the approved slice intentionally changes an earlier incident's repair,
  regression, task-succession, runner, or evidence semantics, classify that work
  as explicit verification-infrastructure scope. Apply the release-pilot scope
  choice before evidence if it would expand a product slice.
- Incidents not naturally surfaced remain unchanged until master integration.
  The frozen cumulative candidate is where the architect evaluates whether each
  diagnosis and any repair recorded on another lineage still apply, then runs
  the one authorized terminal all-20 checkpoint.

Path overlap and repository-common visibility are routing metadata, not proof
that an incident contract changed or that a parallel candidate belongs in the
current feature lineage.

## Implementation boundary

Implement only the smallest feature-mode reliability-store, handoff-gate,
focused-policy planner classification, and process-test changes needed for the
behavior above. Preserve terminal checkpoint resolution, current-candidate
incident handling, immutable incident history, run-intent semantics, exact
focused evidence, and package validation.

For specification, review-ready, and QA-ready feature routes, an otherwise
eligible deferred incident is nonblocking whether its disposition candidate is
exact, ancestral, or parallel to the current candidate. Final-ready remains
blocked until the terminal checkpoint. Do not weaken the separate handoff checks
for sender, recipient, readiness, exact review evidence, specification-only
paths, or current-candidate incidents.

The existing global-impact classification would otherwise make this correction
execute all 20 packs before it could establish the new feature-mode boundary.
Add one closed process-policy path set containing only
`scripts/settled-final-verification-policy.mjs`,
`scripts/verification-packs.mjs`,
`scripts/verification-reliability-runtime.mjs`, and
`scripts/verification-reliability-store.mjs`. For an explicitly authorized
focused checkpoint, these paths stay visible in changed-path evidence but add no
product-pack owner. Prove that any accompanying product path still selects every
declared owner and consumer normally. This is not an open-ended process-path
prefix and does not apply to the central command runner.

Do not:

- change `scripts/run-focused-acceptance.mjs`, `verification/packs.json`, product
  pack ownership, or terminal all-20 planning;
- migrate, rewrite, resolve, or add transitions to existing incident records;
- enumerate or re-run inherited incidents as part of this correction; or
- include Flow product or styling changes in the correction candidate.

The abandoned mixed candidate `011e351178` may be inspected only as a diagnostic
reference. Reimplement this correction from current `qa`; do not merge or
cherry-pick its mixed policy and product lineage.

## Acceptance and effort

Acceptance authority is Modular verification packs 152 and Settled candidate
final verification 013. Tests must prove that:

- an eligible deferred ancestor with overlapping paths does not block a later
  feature's evidence or review-ready/QA-ready handoff and receives no mutation;
- an eligible disposition recorded on an abandoned parallel candidate does not
  block a new specification or feature from current QA and does not force that
  candidate into the new lineage;
- the later candidate must still provide its own exact evidence and package
  proof;
- a current-candidate unresolved, unrepaired, stale, or identity-mismatched
  incident still blocks; and
- terminal master-integration resolution behavior is unchanged.

Use the two directly relevant process tasks during implementation:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack shell \
  --focused-task unit:test/settled-final-verification-workflow-test.mjs \
  --focused-task unit:test/verification-process-contract-test.mjs
```

After the candidate is settled, produce its one review-ready receipt with the
shell pack only:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack shell \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence qa-feature-mode-deferred-incident-boundary
```

That evidence invocation includes package proof. It must remain a shell-only
plan; any expansion to all 20 is a blocking scope defect, not an authorized run.

The elapsed implementation expectation is two hours, with an analysis update at
one hour. These are reporting expectations, not intervention gates. No Gherkin
mutation or all-20 run is authorized.

After this correction reaches `qa`, reconstruct Flow relationship port snapping
from that exact QA head. Reuse the mixed candidate only as a patch reference and
keep the reconstructed feature candidate limited to its approved Flow product,
focused test, generated bundle, and evidence paths.
