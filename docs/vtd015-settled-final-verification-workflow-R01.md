# VTD-015 settled-candidate final-verification workflow R01

Status: user-approved bounded specification

Approved: 2026-08-11

## Purpose

Shorten later feature and VTD delivery without reducing regression confidence.
While coder, refactorer, and architect are still expected to change a candidate,
they use focused checks. After the architect settles the final tree, the architect
runs one complete all-20 safety gate. The specifier integrates only that passing
tree.

This is workflow and verification tooling only. It must not change extension
behavior, product acceptance meaning, or any active evidence leaf.

## User stories

- As the product owner, I want one useful full safety run after review settles the
  code so time is not spent proving candidates that normal review will replace.
- As a reviewer, I want focused evidence while I am still changing the candidate
  so I receive fast feedback without claiming the work is integration-ready.
- As the integrator, I want review-ready and final-ready states to be impossible
  to confuse so no candidate can merge without complete regression evidence.
- As the product owner, I want delivery timing and rerun costs reported from
  existing durable records so I can decide whether the process change earned its
  maintenance cost.

## Measured starting point

- The Command Palette controller lineage ran three successful all-20 checkpoints
  before integration.
- The workspace-tabs controller lineage ran two successful all-20 checkpoints.
  The coder's 838-check pass took 21 minutes 21 seconds and became unusable after
  normal refactorer and architect changes. The final settled 838-check pass took
  21 minutes 42 seconds.
- Workspace tabs took 89 minutes 3 seconds from approved specification commit to
  integration and 1 hour 55 minutes 39 seconds to settled safety completion.

The immediate expected saving on a comparable slice is one roughly 20-minute
successful full run. The longer-term value is that the same saving applies to
every later VTD slice and feature whose reviewers change the candidate.

## Roles and states

The workflow has two different claims:

1. **Review-ready** means a committed candidate has fresh focused evidence for
   the current changes and may move only to the next named review role. It is not
   final evidence and cannot authorize integration or completion broadcast.
2. **Final-ready** means the architect has completed every review and quality
   action, sealed one tree, run all 20 packs with properties and packaging, and
   recorded durable evidence for that exact tree and specification base.

The coder sends review-ready work to the refactorer. The refactorer sends
review-ready work to the architect. The architect is the single
final-verification owner. The specifier reviews and integrates a final-ready
candidate but does not substitute another receipt or run a routine second full
gate.

An unchanged reviewer may forward the same bound candidate. A reviewer who
changes production, tests, build inputs, registries, verification behavior, or
workflow behavior must produce new focused evidence before forwarding. No focused
result is promoted into final evidence.

## Final safety gate

After the candidate has settled:

- run one canonical deduplicated plan containing all 20 packs, properties, every
  current terminal evidence leaf, and the package check;
- bind the durable evidence to the approved specification base, task, commit and
  tree, changed paths, plan, artifact, toolchain, receipt, and timing records;
- block completion and integration unless the exact sealed tree passes; and
- invalidate the pass after any behavior-bearing input changes.

If the final run fails, preserve the VTD-014 rule. Record the failure, diagnose
and repair the exact cause, prove it narrowly, then run all 20 packs and packaging
freshly on the changed tree. Do not retry the same candidate, reduce concurrency,
reuse passing leaves, or borrow another task's receipt to obtain a pass.

A documentation-only recording or evidence-promotion step does not require
another product run when every bound product and verification identity remains
unchanged.

## Bounded implementation surface

Implementation may change only the workflow and evidence surfaces needed to make
the states executable and testable:

- coder, refactorer, architect, and specifier role prompts;
- the shared handoff policy and file-based handoff validators, senders, queue
  readers, and completion helpers;
- verification-evidence and timing/reporting code needed to bind final-ready
  proof and derive the scorecard;
- focused process-contract unit and acceptance handlers for this feature;
- verification ownership needed to register this process feature; and
- the VTD-015 program, backlog, and active-scope records.

Do not change product source or generated extension output. Do not redesign the
reliability incident model, parallel scheduler, artifact lease, pack ownership,
or unrelated role behavior. A need for any of those changes stops this slice for
a separate scope decision.

## Bootstrap rule

VTD-015 changes the protocol that carries VTD-015 itself. Its coder, refactorer,
architect, and specifier handoffs therefore continue to obey the previously
integrated protocol until the slice is accepted in `master`. There is no one-time
safety bypass. VTD-012 is the first live use and payback measurement for the new
review-ready flow.

## Success measure

VTD-015 implementation succeeds when its deterministic process fixtures prove the
new states and all existing terminal proof remains required. Its time-saving claim
remains provisional until VTD-012 completes.

VTD-012 will count as evidence of value when:

- coder and refactorer perform no all-20 checkpoint while changes are expected;
- the architect performs exactly one successful final all-20 run after the last
  review change, unless a recorded failure and repair correctly require another;
- no completion or integration is possible from review-ready state;
- the complete terminal plan and package proof are unchanged in meaning; and
- the elapsed role and verification scorecard shows at least one invalidated
  successful full run avoided compared with workspace tabs.

The primary outcome is elapsed delivery time. Task count is diagnostic only.

## Expected effort, value, and trade-off

Expected effort is medium: one explicit workflow state, handoff validation, role
instructions, deterministic process tests, and automatic timing extraction. It
does not require product work.

Expected enabling value is very high because every later slice can avoid full
proof of a candidate that review subsequently changes. The trade-off is that a
defect visible only in the complete suite is discovered later in the role chain.
It is still discovered before integration, and any repair still forces fresh full
proof.

## Stop conditions and user review

Stop and return for user direction if implementation would:

- remove, skip, weaken, or relabel an active regression check;
- allow review-ready work to integrate or broadcast as complete;
- require repeated full-suite rehearsals to prove the workflow;
- weaken VTD-014 failure recording or repair requirements;
- add manual timestamp reporting to every role; or
- expand into scheduler, artifact-lock, pack-partition, or product changes.

After VTD-015 settles, report its actual approval-to-integration time, role
intervals, focused and full verification time, successful and invalidated full
runs, failures, repairs, reruns, and preserved terminal proof. Recommend whether
to begin the VTD-012 payback measurement, but do not activate it without the
user's explicit decision.
