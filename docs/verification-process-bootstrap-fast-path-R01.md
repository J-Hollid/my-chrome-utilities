# Verification process bootstrap fast path R01

## Status and authority

The user agreed to the verification-throughput recommendations on 2026-09-01
with one controlling constraint: implementation of the replacement must not be
blocked by the expensive verification process that it replaces.

This document defines the first bounded delivery phase. The implementation
handoff remains subject to approval after review of this contract. This phase
does not change product behavior, authorize an all-runnable-pack feature run,
reuse evidence across candidate identities, weaken the master gate, or promote
QA to `master`.

## Measured problem

The completed `verification-administration-preflight` task took 3 hours and 37
minutes from specification handoff to QA integration. The coder used 1 hour and
47 minutes, the refactorer used less than 3 minutes, and the architect used 1
hour and 46 minutes. The first implementation commit was ready after 18 minutes.

The readiness classifier forecast 16 tasks and a 16-second critical path. The
final evidence run executed 42 tasks, took 5 minutes and 52 seconds of elapsed
time, and recorded 9 minutes and 18 seconds of accumulated task time. The two
new direct contracts took 694 milliseconds. Six older process contracts used
about 91 percent of the final accumulated task time.

Across coder and architect work, the registry-planner aggregate ran 13 times
and accumulated about 45 minutes and 36 seconds of task time. A mutation
baseline for the 12-line legacy handler entry point used about 16 minutes even
though it found no applicable mutants. Four ordinary deterministic defects
entered the reliability-repair workflow. One lost output connection also caused
two overlapping 39-task repair runs.

The conservation fixture is 174,005 lines and 8.8 MB. This task added 63,954
lines to it, and one stale generation caused the architect's first evidence
failure.

## Bootstrap safety model

The bootstrap is a one-time transition route for stable task
`verification-process-bootstrap-fast-path` from the exact approved QA base. It
is not a permanent evidence exception.

An independent transition harness must:

- compare the immutable base planner result with the candidate planner result;
- derive exact changed-path owners, slices, prerequisites, consumers, property
  checks, and package work without executing the old parent pack;
- use fixed synthetic registries that cover unit, property, acceptance,
  browser, observation, checkpoint, package, incident, and evidence stages;
- execute selected child contracts directly and at most once;
- bind a receipt to the exact base, candidate, tree, task, plan, toolchain,
  artifact, and task results; and
- fail closed before task launch when closure, identity, capability, or the
  five-minute forecast cannot be proved.

The bootstrap may read the old planner and existing evidence as comparison
data. It must not execute the old `verification_process` parent workload, use a
prior candidate's passing tasks, or accept the candidate's own result without
the independent fixed expectations.

The one-time authority expires after the accepted bootstrap candidate reaches
QA. Future process changes use the integrated fast slice route. The existing
user-requested master integration gate remains authoritative and supplies the
later complete cumulative check.

## Phase 1 required behavior

Phase 1 implements the minimum controls that make later decomposition safe and
fast:

1. Readiness, execution, receipt, and review use one canonical exact task plan.
2. The executor runs the selected process slices, not every task in their parent
   pack.
3. Mutation discovery with zero applicable mutants records an empty successful
   result without starting a test command.
4. A selected aggregate validates child results and never executes a child that
   is already an independent selected task.
5. Durable run lookup prevents a lost client connection from starting a second
   exact run.
6. Conservation freshness, handler command closure, and incident, regression,
   and repair-protocol key alignment run before expensive tasks.
7. Intermediate candidates use direct development checks. One exact bootstrap
   proof runs after the last required code or structure repair.
8. An unchanged reviewer validates the bound receipt instead of repeating its
   tasks.

If the plan exceeds a five-minute calibrated forecast or requires parent-pack
fallback, it launches no task. The coder must decompose the exact reported
boundary under this same approved task. The workflow must not fall back to the
old broad route and must not request another user decision for the same bounded
outcome.

## Delivery phases after bootstrap

After Phase 1 reaches QA, later approved program phases use its fast slice
route:

| Phase | Outcome |
|---|---|
| 2 | Split the registry aggregate and large verification contracts into independently selected child contracts. |
| 3 | Replace full-source conservation snapshots with compact Git-bound generation records while retaining historical validation. |
| 4 | Accept legacy completed unblocker records and align architect follow-up rules with the handoff validator. |

These phases must keep the same no-parent-fallback rule. They must record their
measured specification-to-QA time and compare it with the 30-to-45-minute
process-change target.

## Development focus and QA impact

Phase 1 must not modify the 8.8 MB conservation fixture or add a new top-level
verification pack. It reuses the existing process-slice declarations and adds a
small independent transition harness.

| Prefix | Proposed parent | Slice | Exact consumers |
|---|---|---|---|
| `scripts/verification-bootstrap/` | transition-only | `process_fast_path_bootstrap` | coder proof, reviewer receipt validation, QA integration validation |
| `scripts/verification-planner/` | `verification_process` | existing selected slices | readiness forecast and exact task closure |
| `scripts/verification-execution/` | `verification_process` | existing selected slices | one-start execution and durable run recovery |
| `scripts/verification-evidence/` | `verification_process` | existing selected slices | exact bootstrap receipt and review binding |
| `test/verification-bootstrap/` | transition-only | `process_fast_path_bootstrap` | independent fixed fixtures and candidate comparison |
| `swarmforge/scripts/` | workflow support | targeted mutation discovery | zero-mutant short circuit and target-specific mutation command |

The coder must run read-only intent classification before implementation. A
classification that adds a product pack, browser pack, all-runnable-pack gate,
or full `verification_process` parent closure is invalid for this task and must
stop with zero tasks.

## Review order

The coder must complete direct bootstrap contracts before any final evidence
attempt. Required structure work must finish before the exact final proof. An
unchanged refactorer and architect validate the receipt and code without a new
execution. A required reviewer repair returns one consolidated finding to the
coder; it does not start a second implementation program in the reviewer role.

## Bootstrap proof

The accepted candidate requires:

- the locked toolchain check;
- direct bootstrap unit contracts for plan parity, slice closure, early
  eligibility, aggregate child conservation, mutation short circuit, durable
  run recovery, receipt identity, and expiry of the one-time authority;
- fixed synthetic execution fixtures for every supported verification stage;
- target-specific acceptance checks for the new feature;
- one package build and artifact digest;
- one exact bootstrap receipt for the final settled candidate; and
- independent architect and specifier validation of that receipt.

No old parent-pack execution, product browser pack, all-runnable-pack feature
checkpoint, or cross-candidate task reuse is permitted. A bootstrap failure
authorizes only repair of its exact changed boundary. It does not authorize a
broad fallback run.
