# SwarmForge ordinary-note delivery lineage R01

## Status and authority

The user directed this process correction on 2026-09-03. It requires no later
user decision while it stays inside this contract.

This is a Shell transport correction in QA feature-integration mode. It does
not change product behavior, evidence meaning, review authority, or candidate
acceptance. It does not authorize a global or all-runnable-pack feature run.

Stable task: `ordinary-note-delivery-lineage`.

## Observed failure

A refactorer used an older worktree transport to return a bounded repair note.
That transport did not add the current immutable lineage headers. The current
daemon delivered the note to the coder without them.

The coder completed the requested repair and then found a bounded exact-plan
variance. The coder could not send an official reply because current note
transport correctly requires the active note to have an exact handoff, task,
base, commit, and lineage digest. A targeted unblocker could not bind the same
unlineaged active note. The result was a wait for a new carrier that the idle
refactorer had no official way to send.

The safety check was correct. Delivery of the incomplete note was the defect.

## Required behavior

The current handoff daemon must authenticate every ordinary note before it puts
the note in a recipient queue. A note that already has valid current lineage
keeps that lineage unchanged.

For an older note without lineage headers, the daemon must derive lineage from
the sender's durable handoff state. It can use only one of these source states:

1. The sender has exactly one active inbound Git handoff when the note is
   evaluated.
2. The sender has exactly one completed inbound Git handoff whose dequeue and
   completion times prove that it was active when the note was created.

The source handoff must name the sender as its recipient and must contain one
exact task, base commit, and candidate commit. The base must be ancestral to the
candidate. The daemon must record the full source handoff, task, base, commit,
and canonical lineage digest on the delivered note before queue insertion or
notification.

The completed-handoff fallback exists only for the race in which the sender
finishes its inbound handoff after it creates the note but before the daemon
reads the outbox. File order, nearest timestamp, branch head, note body, commit
message, and candidate names are not lineage authority.

If there is no exact source, more than one possible source, a missing identity,
an invalid digest, or a non-ancestral base, the daemon must fail closed. It must
move the note to the sender's normal failed-delivery state with the exact reason.
It must notify the sender role of that exact failure, including when that role
became idle after it created the note. It must not change or notify the
recipient queue.

A successfully delivered older note has the same current form and behavior as
a note created by current transport. A reply inherits the recorded source
lineage. A valid specifier unblocker can bind the active note. Neither action
needs a replacement Git handoff, a new user decision, or inference from the
free-form note body.

## Current incident disposition

The already delivered unlineaged refactorer note remains unchanged audit data.
The specifier supplied one bounded monitored recovery instruction for stable
task `verification-prelaunch-identity-integrity`: keep both exact owners, run
the canonical `shell` plus `verification_process` plan, and return normal
review-ready evidence. This correction must not rewrite that active note or its
history.

## Scope limits

Implement delivery compatibility in the existing handoff identity and daemon
boundary. Do not change ordinary note content rules, unblocker authority,
handoff readiness, role ownership, candidate evidence, or queue priority.

Do not add lineage inference to the recipient reply path. The delivered note
must already contain authenticated lineage. Do not accept a source from note
body text, the sender's current branch head, an unrelated completed handoff, or
a best-effort timestamp match.

Keep identity parsing and digest calculation in
`swarmforge/scripts/role-handoff-identity.mjs`. Put completed-source lookup,
delivery-time lineage resolution, and its command adapter in one focused
`swarmforge/scripts/ordinary-note-delivery-lineage.mjs` module. Add only a
small adapter call to `swarmforge/scripts/handoffd.bb`; do not add identity
policy to that multi-purpose daemon file. Use existing atomic queue,
failed-delivery, and role-notification operations. Do not hand-edit runtime
state.

The implementation must include the existing safe daemon reload or restart
step after QA integration. It must preserve all queued, active, sent, failed,
and completed handoff files during that restart.

## Development focus and QA impact

Development focus is:

- `test/swarmforge-role-delivery-runtime-test.mjs` for delivery-time lineage,
  completion-race fallback, rejection order, and recipient queue conservation;
- `swarmforge/scripts/unblocker-taskless-note-contract.mjs` only to prove that a
  delivered compatible note supports a reply and a targeted unblocker; and
- parse and generate checks for
  `features/swarmforge-role-liveness-and-legacy-unblockers.feature`.

QA impact starts with the existing Shell `swarmforge-handoff-control` slice.
Its already declared exact consumers are the `verification_process`
`reliability_run_intent` and `evidence_promotion` slices. This is bounded
two-pack process scope. It is not global.

Likely existing integration surfaces are:

| Existing path | Parent pack | Existing slice | Exact consumers |
|---|---|---|---|
| `swarmforge/scripts/role-handoff-identity.mjs` | `shell` | `swarmforge-handoff-control` | ordinary note sender and delivery daemon |
| `swarmforge/scripts/handoffd.bb` | `shell` | `swarmforge-handoff-control` | sender outbox, recipient queue, and notification |
| `swarmforge/scripts/unblocker-note-lineage.mjs` | `shell` | `swarmforge-handoff-control` | lineage-bound note replies |
| `swarmforge/scripts/unblocker-adapters.mjs` | `shell` | `swarmforge-handoff-control` | targeted unblocker binding |
| `test/swarmforge-role-delivery-runtime-test.mjs` | `shell` | `swarmforge-handoff-control` | direct delivery contract |

There is no proposed new source prefix. The coder must run read-only intent
classification before coding. A bounded exact consumer or prerequisite can
proceed as forecast variance. A product pack, browser pack, parent-pack
fallback, or all-runnable-pack result is a scope defect.

## Causal proof

Deterministic temporary repositories must prove:

1. Current valid lineage passes through unchanged.
2. An older unlineaged note gets exact lineage from one active source handoff.
3. The same note gets identical lineage when its exact source completed after
   note creation and before daemon delivery.
4. The compatible delivered note supports one lineage-bound reply.
5. A valid targeted unblocker binds the compatible active note.
6. Missing, ambiguous, incomplete, or non-ancestral source state rejects the
   note before recipient queue insertion and notification.
7. Rejection leaves recipient active and queued work byte-identical and sends
   one exact failure notice to the sender, even when the sender is idle.
8. Daemon restart preserves all durable handoff state.

Use direct checks during development. After the candidate is settled, run one
canonical exact focused evidence operation and package proof. An unchanged
reviewer reuses that receipt. Do not run legacy verification, mutation, a
parent pack, a product or browser pack, or an all-runnable-pack checkpoint.

## Effort limit

The implementation ceiling is 90 active minutes. At 45 active minutes, report
the exact plan, completed behavior, failures, process friction, remaining work,
confidence, and current forecast. If the task needs a new identity store,
general queue migration, or broad daemon redesign, stop and report the exact
scope defect instead of expanding the task.
