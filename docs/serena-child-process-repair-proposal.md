# Serena child-process failure: approved disposition

Status: approved by the user on 2026-09-06 after the repeated failure report.
This approval permits the bounded investigation and conditional repair below.
It does not declare the cause proved or waive governed repair admission.
Task: `serena-use-assessment`.
Preserved candidate: `8317487fb681806ef3171bc608cb8bf85c72ad9c`.
Base: `6baa019865dfded507a95cc5349a996fb00ca8fb`.

The historical-planning check failed again at its `bb test:unit` child.
Run `c0680f08-c45c-472f-806f-4f7836e85a53` records 72 passed checks,
one failed check, and three cancelled checks. The runner carried 71 earlier
passes. The nested-lock check passed freshly. Review and package proof remain
incomplete. No incident was deferred or resolved.

The original child errors lost stdout, exit code, signal, and killed state.
Short child time limits are a hypothesis. Their role in the failure is not
proved. The one permitted diagnostic retry for each incident has been used.

## Approved work

Authorize one bounded investigation and conditional repair, with a 60-minute
effort estimate and a progress report after 30 minutes. Keep the same task and
preserve the saved candidate and all failure records.

Limit edits to the child-process handling in:

- `test/verification-contracts/historical-planning-contract-test.mjs`
- `test/verification-contracts/execution-resume-contract-test.mjs`
- One small test helper and focused tests, if needed to avoid duplicate code.

First preserve the original child error and its output, exit code, signal,
and killed state. Prove this behavior with controlled failure cases. Then use
bounded diagnostic evidence to identify why the historical child stops.
Keep new development diagnostics distinct from the exhausted incident retry;
do not reset incident state or use diagnostic success as review evidence.

Only after the cause is established, correct it within this test boundary.
Retain actual parent/child lock inheritance and the check that runner-owned
unit and property dispatch does not launch Node. Do not replace these behaviors
with assertions about source text. A time-limit increase alone is insufficient.
Require a deterministic regression for any claimed causal repair.

The complete known finding set is: the original nested-lock child failure,
the repeated historical unit-child failure, and loss of child error details
in both wrappers. The cancelled registry, package, and reliability-prerequisite
checks are incomplete evidence, not established defects. The original
termination cause remains unresolved; discovery is not complete for causal
repair authority.

Do not change runtime locks, general planner or runner policy, product code,
ownership coverage, or evidence rules. If the cause falls outside this boundary
or remains unknown, return the exact findings instead of broadening the work.
Use existing governed repair admission only after its proof requirements are
met. A complete valid focused review and package proof must precede forwarding.

Module declaration ownership, dialog decomposition, and side-panel branding
remain in their approved order. Neither QA nor master advances on this proposal.
