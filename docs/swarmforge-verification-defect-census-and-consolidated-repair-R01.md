# SwarmForge defect consolidation R01

Status: user-approved scope reset on 2026-08-30. The unintegrated persistent
census and diagnostic-lifecycle implementation is rejected. This document
replaces its requirements with the minimum process needed to avoid repairing
related defects one at a time.

## Intended effect

When ordinary development exposes related defects, SwarmForge performs one
short discovery pass, repairs the known in-scope set under one stable task, and
runs focused evidence after the coherent repair is ready.

The rule prevents a first symptom from becoming a one-defect repair. It does
not attempt to prove that every hypothetical defect has been found, and it does
not create a second verification platform.

## Fixed discovery boundary

Before repair authorization, record:

- one stable repair task and one causal repair family;
- the failed behavior and exact changed-path or selected focused-check boundary;
- every defect currently observed inside that boundary; and
- a declaration that the one bounded discovery pass is complete.

The pass may inspect the failed behavior, its changed paths, the already
selected focused checks, and failures those checks directly expose. It does not
expand into hypothetical state matrices, every transitive consumer, unrelated
verification infrastructure, all registered packs, or an all-repository audit.

An unresolved observation inside the fixed boundary prevents repair authority.
A finding outside the boundary is recorded as nonblocking follow-up. Only a
material product, safety, authority, or cost expansion requires a user decision.

## One continuous repair

One valid repair authorization covers the complete named family until review:

1. Repair every defect listed by the discovery pass in one coherent
   implementation pass.
2. If implementation or focused review directly exposes another defect in the
   same family and boundary, add it to the final defect list and continue under
   the same task and authority.
3. Do not stop for another specification, census generation, repair task,
   unblocker, or diagnostic design pass for that finding.
4. When the implementation is coherent, run the smallest focused evidence that
   observes the changed behavior and the final defect list.
5. The review handoff reports the initial list, any findings added during the
   repair, and the focused result. A known in-boundary omission blocks review.

Repeated focused failure without a complete causal explanation, or a finding
that materially crosses the fixed boundary, stops for a user decision. It does
not authorize more enforcement machinery.

## Minimal structured gate

A newly issued verification-repair unblocker declares these authored fields:

- `intent: verification-repair`;
- `repair-family: <canonical-family>`;
- `repair-boundary: <canonical-boundary>`;
- `repair-defects: <comma-separated canonical defect IDs>`; and
- `discovery-complete: true`.

The unblocker sender rejects missing fields, an empty or duplicate defect list,
or an incomplete discovery declaration. Existing ordinary unblockers remain
compatible and do not acquire repair fields.

These fields authorize later same-family findings inside the fixed boundary;
they are not an immutable defect database. Descriptions and the final combined
list may remain in the normal handoff detail and review result.

## Explicit non-goals

This feature does not add or require:

- a persistent census store, generations, digests, leases, or crash recovery;
- diagnostic executors, controllers, receipts, state matrices, or case maps;
- specification or diagnostic-boundary succession;
- registry compilation, migration conservation, generated snapshots, or a new
  verification pack;
- propagation through runners, evidence, reliability, campsite, QA, or product
  resumption; or
- exhaustive adversarial hardening before ordinary product work resumes.

The abandoned coder candidate and its ignored diagnostic artifacts are audit
history only. They are not implementation or acceptance authority and must not
be merged into the clean replacement lineage.

## Development focus and QA impact

Development focus is limited to the structured unblocker validator, the shared
role rule, and focused tests for the repair fields and ordinary-unblocker
compatibility.

Proposed source prefixes:

- `swarmforge/scripts/unblocker-` — parent pack `shell`, slice `unblocker
  authority`, consumers `unblocker_send.sh`, delivery, claim, and completion;
- `swarmforge/constitution/` and `swarmforge/roles/` — parent pack `shell`,
  slice `SwarmForge role process`, consumers regular role sessions.

No `verification_process` ownership or production runner path is expected. The
coder performs the read-only intent check from the clean specification base and
reports any forecast variance without widening the feature.

Implementation has a 90-minute effort ceiling with a progress report after 45
minutes. If a clean minimal candidate is not credible at the ceiling, return
the exact blocker instead of expanding scope. Use focused unblocker/process
tests and package proof; do not run an all-runnable-pack checkpoint.

## Process-impact pilot

Do not add telemetry. For resumed Event Library work and the next two ordinary
product tasks, use existing handoff, receipt, and Git timestamps to report:

- discovery returns;
- repair authorizations and implementation passes;
- focused evidence reruns; and
- active time spent on process work versus product work.

The feature is useful only if same-family findings stay in one continuous repair
without nested repair tasks or verifier expansion and product work resumes with
fewer stop/start cycles. After three tasks, retain, simplify, or remove it based
on that observed impact. Lack of improvement cannot justify another hardening
cycle.
