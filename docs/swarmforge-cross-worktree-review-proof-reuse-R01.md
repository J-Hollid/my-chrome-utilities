# SwarmForge cross-worktree review-proof reuse R01

## Status and authority

The user approved this process correction on 2026-09-03 after the
`ordinary-note-delivery-lineage` review. It needs no later user decision while
it stays inside this contract.

Stable task: `cross-worktree-review-proof-reuse`.

This is a handoff-validation correction in QA feature-integration mode. It does
not change product behavior, review authority, evidence meaning, incident
eligibility, package requirements, or terminal verification. It does not
authorize an all-runnable-pack feature run.

## Observed failure

The coder recorded exact review-ready evidence and package proof for candidate
`4a8179f534`. The refactorer accepted that unchanged candidate. Its first
architect handoff failed because the refactorer worktree did not contain the
exact local receipt. After the refactorer copied and checked that receipt, the
same handoff failed because its local package was stale. The refactorer then
copied and checked the coder's 17,711,147-byte package before the unchanged
handoff succeeded.

The current reliability handoff path verifies review-ready evidence, then reads
the current worktree's canonical receipt and package before it calls the
per-incident deferral operation. That later operation can return without a
write when durable incident state already contains the permitted deferral. The
local reads are therefore unnecessary when no applicable incident needs a new
deferral. They make an unchanged reviewer reproduce producer-local artifact
placement without adding evidence.

## Required behavior

Before the existing reliability handoff command reads a local raw receipt or
package, a handoff-only reuse check must determine whether durable state already
satisfies this handoff.

The reuse check can pass only when all of these facts are true:

1. The handoff is a `review-ready` or `qa-ready` route with
   `verified: review-ready`.
2. The exact candidate, base, task, tree, change set, and review-ready Git note
   pass the existing review-ready validator.
3. There is no applicable unresolved incident, or every applicable unresolved
   incident already has a structurally valid `terminal-verification-deferred`
   disposition.
4. The existing handoff candidate-relationship rules permit every retained
   disposition for the requested readiness and sender.
5. The final existing blocking check returns no incident.

When those facts hold, validation must finish without reading, copying,
rewriting, or regenerating a worktree-local receipt or package. It must not
write incident state.

When any applicable incident still needs a new deferral, the reuse check must
decline the fast path. The existing reliability command must then run unchanged.
It must require the current fresh receipt and package proof, record only an
eligible deferral, and fail closed on missing, stale, changed, or conflicting
proof.

Invalid durable state is an error. It must not become a fast-path miss that can
hide corruption. A changed candidate, invalid review note, forbidden lineage
relationship, or blocking incident must remain blocked by the existing
validators.

## Small implementation boundary

Keep the fast path in one new focused
`swarmforge/scripts/review-handoff-proof-reuse.mjs` module. The module can use
the existing review-ready validator, shared reliability incident store, durable
deferral validator, and handoff relationship check. It must not copy their
policy. A valid reuse result completes the reliability gate. A valid
not-applicable result delegates to the existing
`verification-reliability-incidents.mjs assert-handoff` operation. A malformed
or unsafe durable record fails closed.

In `swarmforge/scripts/swarm_handoff.bb`, replace the current reliability
command target with the new helper. Do not add a second decision path or new
policy to that file. Its line count must not increase.

Do not change `scripts/verification-reliability-runtime.mjs`, the incident-store
schema, receipt encoding, package format, Git-note format, handoff fields, or
daemon delivery. Do not create a shared artifact store. Do not add this behavior
to either multi-purpose handoff or reliability file.

Put deterministic proof in one new focused test file. Do not add cases to the
large settled-final or reliability incident-store test files.

Acceptance authority is
`features/swarmforge-cross-worktree-review-proof-reuse.feature`. Register it
through the existing focused SwarmForge role-liveness acceptance handler. Keep
the handler small and reuse the new direct contract test as its production
check.

## Causal proof

Temporary repositories and stores must prove these cases:

1. No applicable incident: a reviewer with no local receipt and no local
   package forwards the unchanged review-ready candidate.
2. Existing permitted deferral: a reviewer with missing or stale local
   artifacts forwards the unchanged candidate without an incident write.
3. New deferral required: the fast path declines and the existing command still
   requires exact fresh local receipt and package proof.
4. Invalid or digest-changed durable state fails closed before handoff output.
5. A forbidden candidate relationship remains blocked.
6. A changed or invalid review-ready Git note remains blocked.
7. The fast path performs no receipt copy, package copy, package build,
   verification run, or incident transition.
8. Ordinary note delivery and queue state remain unchanged.

## Verification and scope limits

The intended owner is the existing Shell `swarmforge-handoff-control` slice.
Its existing exact consumers are the `verification_process`
`reliability_run_intent` and `evidence_promotion` slices. The new helper is one
exact modular first registration. The `swarm_handoff.bb` adapter is already in
that Shell slice.

The new feature belongs to the existing `verification_process`
`swarmforge_role_liveness_acceptance` slice. It is also an exact modular first
registration. The current acceptance handler and its registration test remain
inside that slice.

Before coding, run the read-only intent preflight. After the first coherent
commit, run the exact candidate preflight. Both must remain limited to `shell`
and `verification_process`. A forecast variance inside those two packs proceeds
without another user decision.

If planning selects a product pack, browser pack, parent-pack fallback, legacy
verification, or all runnable packs, stop before task execution and report the
exact mapping defect. Do not repair that result by changing the global
reliability runtime, adding more owners, or creating a general artifact store.

Use direct tests while the candidate changes. After it settles, run one exact
focused review-evidence operation and package proof. Refactorer and architect
must reuse the same bound receipt. Do not run mutation, a full parent pack, or
an all-runnable-pack checkpoint.

## Completion conditions

The slice is complete only when:

- an unchanged downstream reviewer can send an official review-ready handoff
  from a clean or stale-artifact worktree;
- no receipt or package is copied between role worktrees;
- no verification or package command runs during unchanged forwarding;
- a handoff that needs a new deferral still requires the existing fresh local
  proof;
- every unsafe or unclear state still fails closed; and
- the exact two-pack review receipt and package proof reach QA through normal
  coder, refactorer, and architect handoffs.

## Effort limit

The coder implementation ceiling is 90 active minutes. At 45 active minutes,
report the exact plan, completed behavior, failures, process friction,
remaining work, and current forecast. The complete slice should reach QA in two
to four elapsed hours.

Stop instead of expanding if the solution needs a shared artifact store, an
incident schema migration, a general reliability-runtime redesign, or an
all-runnable-pack evidence plan.
