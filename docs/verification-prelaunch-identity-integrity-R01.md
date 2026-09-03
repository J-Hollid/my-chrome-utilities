# Verification prelaunch identity integrity R01

## Status and authority

The user approved this specification and its coder handoff on 2026-09-03.

This is a small verification-process correction in QA feature-integration
mode. It does not change product behavior, weaken verification, authorize a
global or all-runnable-pack feature run, or promote `qa` to `master`.

Stable task: `verification-prelaunch-identity-integrity`.

## Problem

The last process delivery found two stale production identities only after
ordinary focused tasks had run:

- the authenticated blocked-aggregate consumer-plan digest; and
- the Phase 2 receipt-bound `verification_process` acceptance-session
  prerequisite identity and its task-succession destination digest.

The direct contracts correctly rejected both stale values. The failure order
was wrong. Each rejection invalidated an otherwise useful verification run and
started an avoidable repair and evidence cycle.

The existing administration preflight already validates candidate-plan
authority before task launch. The missing behavior is two deterministic
identity checks inside that existing boundary.

## Required behavior

For a candidate to which either governed identity applies, the existing
`candidate-plan-authority` administration condition must derive current values
from the canonical planner, registry, and task-succession authority. It must
compare those values with the production declarations before it starts any
planned task, checkpoint attempt, or reliability observation.

The blocked-aggregate check must prove that the declared authenticated consumer
plan is the current canonical plan for its bound consumer task and source
identity. It must compare the complete plan digest. A matching task name or pack
name is not sufficient.

The Phase 2 check must derive the one current
`acceptance-session:verification_process` identity from its canonical change
set, base registry, current registry, prerequisite task set, and property
selection. It must prove that there is one incident-scoped succession edge and
that its destination digest equals that derived task identity. A count-only
check is not sufficient, but the diagnostic must include the expected and
observed prerequisite counts when they differ.

The checks must use the same current production declarations that direct
contracts use. They must not copy the expected digests into a second fixture or
identity store. They are read-only and deterministic. They do not run a child
test, modify a declaration, refresh an identity, or infer a successor.

If a governed identity is stale, missing, malformed, duplicate, or ambiguous,
preflight must:

- fail the `candidate-plan-authority` condition with the identity name, exact
  cause, and expected and observed values where both exist;
- launch zero planned tasks and zero checkpoint-attempt tasks;
- create no receipt, pending evidence, checkpoint, reliability incident, or
  repair-focused obligation; and
- leave all existing receipts, checkpoints, incidents, Git notes, and other
  administration records unchanged.

If both identities are current, the complete canonical focused plan proceeds
without a task removal or waiver. Final evidence derives and validates both
identities again before it records a result, so drift during execution stays
fail-closed.

The new checks apply when the exact plan selects `verification_process` or
consumes one of the governed reliability routes. A plan that does neither uses
the existing administration preflight without a new identity failure.

## Scope limits

This task extends the existing administration boundary. It must not create a
new preflight framework, top-level verification pack, reliability incident
type, repair workflow, identity registry, or general policy engine.

The task does not include:

- portable evidence or receipt sharing;
- checkpoint status or inspection tools;
- changes to review roles, handoff policy, or unblocker policy;
- legacy verification, mutation, browser packs, product packs, or a terminal
  checkpoint;
- changes to blocked-aggregate behavior or task-succession meaning; or
- broad refactoring of unrelated verification infrastructure.

Do not add production logic to the 849-line blocked-aggregate module or add
more cases to its 540-line contract. Consume its existing public identity, or
extract only the identity calculation into a focused module if an existing
public seam is not sufficient. Do not create or add to a new multi-purpose
file.

If the exact read-only plan becomes global, selects a product pack, or needs a
new ownership-preparation stage, stop before task launch and report that as a
scope defect. Do not use the old parent-pack route as a fallback.

## Development focus and QA impact

Development focus is the smallest set of direct checks that proves ordering and
identity comparison:

- `test/verification-contracts/administration-preflight-contract-test.mjs`;
- `test/verification-contracts/reliability-blocked-aggregate-contract-test.mjs`;
- `test/verification-contracts/reliability-succession-contract-test.mjs`; and
- parse and generate checks for
  `features/verification-administration-preflight.feature`.

QA impact is one existing parent pack: `verification_process`. The expected
subordinate slices are `evidence_administration_preflight` and
`reliability_run_intent`. The exact planner can add an existing bounded
`verification_process` prerequisite as forecast variance. It cannot add Shell,
a product pack, or all runnable packs only because the blocked-aggregate
consumer plan is a comparison input.

Likely existing shared integration surfaces are:

| Existing path or prefix | Parent pack | Existing slice | Exact consumers |
|---|---|---|---|
| `scripts/verification-evidence/administration-eligibility.mjs` | `verification_process` | `evidence_administration_preflight` | prelaunch and final-evidence eligibility |
| `scripts/verification-evidence/administration-preflight.mjs` | `verification_process` | `evidence_administration_preflight` | ordered administration conditions and exact failure reporting |
| `scripts/verification-policy/reliability/blocked-aggregate.mjs` | `verification_process` | `reliability_run_intent` | read-only blocked-aggregate identity input |
| `verification/task-succession.json` | `verification_process` | `reliability_run_intent` | read-only Phase 2 succession authority |
| `acceptance/src/acceptance/verification_support/administration_preflight_handlers.clj` | `verification_process` | `evidence_administration_preflight` | acceptance observations for Scenarios 003-006 |
| `test/verification-contracts/` | `verification_process` | both named slices | direct causal contracts only |

There is no proposed new source prefix. Before coding, the coder must run the
read-only intent classification. The expected result is `bounded-ready` for
only `verification_process`.

## Causal proof

Deterministic fixtures must prove:

1. A stale blocked-aggregate consumer-plan digest fails before any planned task
   or reliability observation and creates no incident.
2. A stale Phase 2 prerequisite identity or succession destination digest fails
   at the same boundary and creates no incident.
3. Missing, malformed, duplicate, and ambiguous authority fail closed with the
   exact identity and cause.
4. Current identities pass preflight, preserve the exact task plan, and are
   checked again at final evidence.
5. An unrelated non-`verification_process` plan has no false identity failure.
6. A prelaunch failure does not change existing receipt, checkpoint, incident,
   Git-note, or pending-evidence fixtures.

Use direct checks during red and green development. After the candidate is
settled, use one exact focused evidence run from the canonical plan and one
package proof. Reviewers reuse the bound receipt when the candidate is
unchanged. Do not run the old `verification_process` parent closure, legacy
verification, mutation, a product pack, or an all-runnable-pack checkpoint.

## Effort and reporting limit

The implementation effort ceiling is three active hours. At 90 active minutes,
report completed behavior, current exact plan, failures, process friction,
remaining work, confidence, and current completion forecast. Continue only
while the scope stays inside the two existing slices and the completion path is
bounded. At the ceiling, return the exact blocker instead of adding framework,
ownership, or verification work.
