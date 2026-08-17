# QA feature-mode deferred-incident boundary R01

Status: QA-integrated at `66dcdfd5d6`; Flow relationship port snapping resumed

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

## Same-target boundary expansion repair-preflight correction

An inherited incident that already has an eligible repair and a
`terminal-verification-deferred` disposition must not prevent an unrelated
current incident's governed repair merely because the inherited incident's one
diagnosed target now has an expanded canonical task boundary. Treat that case
as pending a fresh focused reassessment of the inherited incident rather than
as proof of same-target equivalence or task succession.

This exception applies only while unresolved task succession is validating a
repair-focused plan and all of these conditions are established:

- the inherited incident has both an eligible repair and a
  `terminal-verification-deferred` disposition;
- its governed receipt diagnoses exactly one target;
- exactly one current canonical task contains that target; and
- its otherwise verified same-target planner projection fails specifically
  because the historical and current target boundary digests differ.

The inherited incident and its history remain unchanged and unresolved. Direct
same-target projection must continue to reject the changed boundary, and the
validator must not infer equivalence, a succession edge, passing evidence, or a
repair transition. Missing or ambiguous current targets, noneligible repairs,
nondeferred incidents, unverified source receipts, unrelated succession errors,
and current-candidate incidents remain blocking. The current repair continues
to require its own exact causal regression, repair-focused receipt, review
evidence, and package proof.

Implement only the smallest classification and regression-test changes in
`scripts/verification-task-succession.mjs`, its direct test, the shell process
contract, and this process specification. Do not change
`scripts/verification-same-target-planner-projection.mjs`,
`scripts/run-focused-acceptance.mjs`, `verification/packs.json`, product files,
or incident records. No all-20 checkpoint is authorized.

Use the direct succession test during development:

```sh
node scripts/verification-task-succession-test.mjs
```

After the candidate is settled, produce one shell-only review-ready receipt:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack shell \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence deferred-same-target-preflight
```

That evidence invocation includes package proof. Any plan expansion beyond the
shell pack is a blocking scope defect. The elapsed implementation expectation
is one hour, with an analysis update after thirty minutes. These are reporting
expectations, not intervention gates. No Gherkin mutation is authorized.

## Monotonic acceptance-session expansion repair-preflight correction

User-approved task `deferred-acceptance-session-preflight` corrects the remaining
task-scoped counterpart without broadening the same-target exception. An
inherited incident with an eligible repair and a
`terminal-verification-deferred` disposition must not prevent an unrelated
current incident's governed repair merely because new feature contracts were
added to the same canonical acceptance session. Treat the inherited incident as
pending its existing terminal assessment when, and only when, all of these
conditions are proved:

- its diagnosed boundary and retry scope are the complete task, not a browser
  target;
- its immutable source receipt and historical pack registry bind the exact
  former task identity;
- exactly one current task has the same stable key, stage, pack, executable,
  environment, required capabilities, and acceptance-pack runner identity;
- both identities are acceptance sessions for the same pack; and
- every historical feature and its generated/IR artifact pair remains present
  exactly once in the current session, with the current difference consisting
  only of additional complete feature/artifact pairs.

This is a repair-preflight classification, not inferred task succession. It
returns no succession mapping, passing evidence, repair transition, deferral,
or incident mutation. Direct task-succession resolution remains fail-closed and
still requires an explicit conserved graph edge. The current incident still
requires its own causal regression, repair-focused receipt, fresh review
evidence, and package proof.

Reject missing or unverifiable source history; removal, replacement, or
duplication of a historical feature or artifact; changed task key, stage, pack,
runner, executable, environment, or capability; non-acceptance tasks;
ambiguous current identities; noneligible or nondeferred incidents; and any
current-candidate incident. These cases remain blocking rather than being
treated as monotonic expansion.

The deterministic regression uses inherited incident
`d723a7c4-1116-4887-b60a-21aded1ab5d8`: its four-feature `flow_export`
acceptance session remains intact while the six Documentation-template
contracts are added. It must permit governed repair of current incident
`0f9c4990-a10a-47ef-878b-fcceff3a690f`, while fixtures for each rejection above
remain blocked. Do not read either live incident as mutable test setup or write
an incident transition; reproduce their immutable shapes in deterministic test
fixtures.

Implement only the smallest classification and regression changes in
`scripts/verification-task-succession.mjs`, its direct test, and the Shell
process contract. Do not change
`scripts/verification-same-target-planner-projection.mjs`,
`scripts/run-focused-acceptance.mjs`, `verification/packs.json`, product code,
or incident records. No all-20 checkpoint is authorized.

Use these direct development checks:

```sh
node scripts/verification-task-succession-test.mjs
node test/verification-process-contract-test.mjs
```

After the candidate is settled, produce one Shell-only review-ready receipt:

```sh
node scripts/run-focused-acceptance.mjs \
  --pack shell \
  --property \
  --changed-since <approved-specification-commit> \
  --prepare-evidence deferred-acceptance-session-preflight
```

The evidence invocation includes package proof. Any expansion beyond the Shell
pack is a blocking scope defect. The elapsed implementation expectation is one
hour, with a checkpoint after thirty minutes. Continue while the rule remains
fail-closed and a bounded completion path exists; stop for user direction if it
would weaken incident evidence or require product, runner, pack, or incident
state changes.

After architect `qa-ready` integration, record the correction scorecard and
automatically reissue stable product task `documentation-templates` from that
exact QA descendant. Candidate `00f3e45d` remains a patch reference only.

### Settled monotonic acceptance-session correction

Specification `8c7ce5ea75` was handed to the coder at 14:08:12Z on
2026-08-17 and received at 14:08:22Z. Candidate `03e4157b83` reached the
refactorer at 14:23:51Z, the architect at 14:31:07Z, and QA at 14:39:43Z. The
handoff-to-integration interval was about 31 minutes 30 seconds, inside the
one-hour expectation. Architect `qa-ready` coincided with the thirty-minute
reporting point, with no scope variance or remaining implementation work.

The final candidate changes only the succession implementation and its direct
and Shell process-contract tests. Its fresh review checkpoint selected exactly
the `shell` pack and passed all 72 tasks, properties, acceptance, and package
proof in 4 minutes 42 seconds. There was no failed evidence run and no all-20
attempt.

The deterministic matrix proves the exact historical `flow_export` session may
remain pending when its four feature/artifact pairs occur unchanged and in order
inside the current ten-feature session. It rejects missing history, incomplete
registry sessions, removed, replaced, duplicated, or reordered historical
features, malformed artifact pairs, changed runner or task contracts, ambiguous
identities, and noneligible or nondeferred incidents. Direct task succession
still rejects the expansion without an explicit edge. Neither inherited
incident `d723a7c4-1116-4887-b60a-21aded1ab5d8` nor current incident
`0f9c4990-a10a-47ef-878b-fcceff3a690f` was mutated or resolved.

Recommendation: resume `documentation-templates` from the exact QA scorecard
descendant of `03e4157b83`, using `00f3e45d` only as a patch reference. Its
governed repair-focused receipt, fresh 10-pack review evidence, and package proof
remain product obligations; this correction supplies no passing product claim.
