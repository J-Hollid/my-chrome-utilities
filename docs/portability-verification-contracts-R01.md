# Portability verification contract repair

Task: `portability-verification-contracts`.
Scope: verification tests and acceptance support only.
Authority: the user's 2026-09-21 instruction to resolve the missing coder repair
task, within the existing outcome-bounded autonomy grant. No product behavior,
baseline-admission policy, terminal gate, or new feature contract is changed.
Start from the specification-only descendant of QA `85593fea6c` carrying this
document. Do not inherit the unintegrated portability implementation.

## Bounded planner correction — 2026-09-21

The coder and specifier independently reproduced an actual target omission in
the complete-preparation mixed plan. This supersedes the assertion-only boundary
below solely for the following causal planner correction.

The plan has a Shell parent-pack fallback, but changed adapter paths cause the
browser observation selector in `scripts/verification-planner/tasks/planner.mjs`
to choose only the three side-panel-shell targets. The declared
`REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER` remains in direct Shell planning
and is absent from the mixed plan. No grouped task carries it. Keep the original
conservation check failing until real executable coverage is restored.

Correct browser-observation selection so an adapter-path filter cannot discard
evidence required by the conservative parent fallback in this mixed plan.
Keep narrow adapter-only plans narrow where no such conservative obligation
exists. Preserve exact grouping, alias semantics, once-only execution, explicit
target requests, style obligations, and terminal behavior. Do not force every
plan to select every browser target or weaken the conservation assertion.

The permitted additional boundary is this selector, one small extracted helper
if needed to avoid extending the large planner, and direct existing planner
tests for the mixed-fallback and adapter-only cases. Use canonical ownership
for any extracted helper; do not hide it from its real consumers. No unrelated
planner redesign, registry reassignment, incident-policy change, or new task is
authorized. Keep the independent scenario-042 correction moving.

Add `mixed-parent-fallback-adapter-filter-omission` to the same repair family's
known defect list. Bounded discovery is complete for this selection-precedence
defect. Demonstrate the missing target before correction, once-only execution
after correction, and retained narrow adapter-only selection with deterministic
planner tests. The original failed ownership leaf must pass without dropping
its historical evidence requirement. Then use the actual exact changed-path
review plan; if ownership requires a broader preparation or terminal scope,
report the exact cause before launching it. No all-pack feature run is approved.

## Required result

Correct two recorded contract mismatches without omitting required evidence.
Reuse the existing utility ownership contracts and Modular verification packs
scenario 042. New user-visible behavior and new Gherkin are not required.

1. In `test/utility-tab-expansion/ownership-test.mjs`, conserve every former
   executable check exactly once when the canonical planner groups browser
   observations into a task. Use actual canonical task identities and logical
   target metadata. A changed group key is not a lost executable check. Prove
   that the reported REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER is executed
   once in the current mixed plan before treating it as conserved. Missing
   targets, duplicate execution, or changed executable meaning must still fail.
   Keep non-browser task identity, historical authority, host scope reduction,
   consumer coverage, permissions, and current/base conservation checks.
2. In
   `acceptance/src/acceptance/verification_support/modular_architecture_project_management_handlers.clj`,
   check isolation of the handler actually named and audited by scenario 042.
   The current assertion compares all pack handlers with the isolated subset;
   the pack now includes an additional non-isolated portability handler.
   Preserve the real APS consumer audit, served-feature coverage, owner-only
   planning for the audited handler, and rejection of cross-pack consumers.
   Do not declare the portability handler isolated to make array equality pass.
   Missing isolation for the audited handler must still fail.

The fixed repair family is `verification-contract-identity-drift`. Bounded
discovery is complete for `grouped-browser-task-key-conservation` and
`whole-pack-handler-isolation-equality`. These failures are present on the
accepted base as well as portability candidate `ce598cad9`. Later findings in
these same assertions and their immediate support remain in this repair; record
unrelated findings without creating another task.

## Boundary and verification

Edit the two named assertions and their small test support only. The immediate
`modular_architecture_project_management.clj` helper is permitted only if needed
to carry the audited handler identity. Use an existing canonical identity helper
or a small local helper; do not extend a large test with unrelated code.
Do not change production sources, planner behavior, registry ownership,
historical pins, isolation declarations, receipt schemas, incident policy, or
baseline-admission cardinality. Report an actual executable omission before
expanding from a contract correction to a planner repair.

Development focus: the ownership test and scenario 042 with their existing
prerequisites. Add bounded negative coverage for a missing or duplicated browser
observation and for missing isolation or a cross-pack consumer of the audited
handler. Exercise the actual corrected comparison and APS audit; source-string
checks or expected-value self-comparison are not proof.

Likely owners: Shell for utility ownership and verification_process for modular
verification acceptance support. Before coding, use canonical ownership and
read-only intent for the exact paths and consumers. The settled changed-path
plan is authoritative. Run the failing leaves during correction, then one fresh
exact review-evidence run with required properties and package proof. Apply
Clojure checks to changed acceptance support according to role duties. Do not
run an all-runnable-pack or terminal checkpoint. Do not weaken tests or create
a new verification framework if preflight exposes a wider cause.

Report direct regression results and forecast at 30 minutes; assess cost,
remaining work, and completion path at 60 minutes. These are progress
checkpoints. Follow coder, refactorer, and architect review to QA-ready.

## Preserve and resume the declaration

Preserve original task
`verification-slice-portability-durable-state-declaration`, candidate
`ce598cad9190fe5c04ffca2ef210b48fe789e2d8`, original base `a6bafeb8c1`, and
declaration reference `edd388a02e` with ten-path patch ID
`90a6846571fcca8461798b9681d49cb051e49f01`. Preserve its source-migration and
lifecycle repairs separately from the declaration delta, product remainder
`35c35fc3aff4d377f5e643d73ca974793aab93c4`, and all receipts and incidents.
Do not merge or replay these changes into this standalone verification repair.

The failed review receipt `1500529-f5824450-18aa-471b-b2f6-5ce656124212`
records 1,193 passed results, two failed results, no completion time, and no
package result. Keep it failed and unchanged. The admitted ownership failure
and the additional handler failure remain unresolved; fixing their contracts
does not erase that history.

After this repair receives exact architect QA-ready evidence and reaches QA,
the specifier reissues the original stable declaration task from that accepted
QA descendant. Conserve its retained changes, record overlap resolutions, and
use supported incident and lineage helpers with fresh exact review evidence.
No old receipt becomes proof for changed bytes. Master promotion stays separate.
