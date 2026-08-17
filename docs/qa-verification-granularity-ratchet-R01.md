# QA verification granularity ratchet R01

Status: approved by the user on 2026-08-17 for immediate standing activation;
implementation and the Documentation-template first use are ordered before the
already-approved product resumes

Prepared: 2026-08-17

## Purpose

Refine a selected verification pack only when real feature work proves that its
internal task boundary is materially broader than the behavior being changed.
Preserve each of the 20 packs as a stable QA capability, preserve every existing
assertion and exact-pack task, and let later features select a smaller declared
slice with its proven consumers.

This is the within-pack continuation of
`docs/qa-verification-ownership-readiness-R01.md`. Ownership readiness determines
which packs are affected. This ratchet determines whether every task inside an
affected pack must run for the feature. It does not authorize speculative
repository-wide partitioning, feature-mode all-20 execution, a weaker exact-pack
or terminal plan, or a product candidate narrowing its own evidence range.

## Evidence and design decision

The settled ownership-readiness bootstrap selected four packs but 129 tasks for
each accepted review checkpoint. That result proved the cross-pack boundary but
also showed that pack selection alone can retain substantial unrelated work.

Industry practice supports dependency-selected verification and fine-grained
declared inputs, while retaining a complete fallback. [Google
TestSage](https://lingming.cs.illinois.edu/publications/icst2019industry.pdf)
reports splitting expensive test classes into separately traced groups when
worthwhile, but also reports fixed overhead from excessive granularity.
[Bazel](https://bazel.build/docs/best-practices) and [Gradle](https://docs.gradle.org/current/userguide/best_practices_tasks.html)
recommend fine-grained explicit dependencies for incremental work, and [Azure
Test Impact Analysis](https://learn.microsoft.com/en-us/azure/devops/pipelines/test/test-impact-analysis?view=azure-devops)
retains all-test fallback and periodic full validation. Therefore size alone
never causes a split: actual changed-path evidence, a stable observable
sub-boundary, and measurable unrelated work are all required.

## Readiness result

Intent and exact preflight report pack scope and task scope separately. A plan
classified `bounded-ready` remains authorized when its exact pack or task set is
wider than the forecast. Forecast variance is recorded and never becomes a
scope-expansion blocker by itself.

The additional `coarse-within-pack` result applies only when all of the following
are true:

- fewer than all runnable packs are selected;
- at least one selected pack contributes a complete task family with no changed-
  path, prerequisite, or declared-consumer relation to the changed behavior;
- exact paths, direct observations, prerequisites, and consumer tasks define a
  stable reusable slice inside that pack; and
- selecting that slice reduces the deterministic task count or critical-path
  estimate without dividing an indivisible registered task; and
- establishing that slice changes no product, persistence, migration, security,
  packaging, assertion, or terminal-verification meaning.

This is the complete materiality rule; there is no repository-wide pack-size or
elapsed-time threshold. When those facts are not proved, the canonical parent-
pack plan proceeds and the potential refinement is recorded as deferred. A large
pack, an inaccurate forecast, or an unfamiliar path alone never blocks the
approved feature.

An all-pack result continues to use the existing `coarse-boundary`,
`genuinely-global`, `ownership-unavailable`, and `requirements-expanded`
classifications. `coarse-within-pack` cannot disguise an all-pack plan.

## Verification slice contract

A verification slice is subordinate to exactly one existing pack and declares:

- one stable identity and exact source paths or prefixes;
- the direct registered tasks that observe the boundary;
- every task prerequisite needed to execute those observations;
- exact consuming slices or packs; and
- an observable behavior or structural boundary that explains the grouping.

Slices are additive. The union of a pack's slices and conservative remainder
must equal the pack's former exact task closure. An exact-pack invocation still
executes that complete closure. Terminal master integration still executes all
20 complete packs with properties and package proof. A slice cannot create a new
top-level pack, hide an existing task, duplicate one logical observation, remove
a dependency, or make an assertion optional.

A changed path with a valid slice selects that slice, its prerequisites, and its
declared consumers. A new or unclassified path with a known parent owner selects
the conservative parent-pack closure. A missing, duplicate, conflicting, or
unobservable slice never narrows selection. Compatible base/current history uses
the union of old and new slice closures; unavailable pack ownership retains the
existing `ownership-unavailable` stop.

Proposed new prefixes are intent declarations, not current repository paths.
Intent preflight validates their syntax, proposed parent owner, slice, and
consumers without first sending them through current changed-path ownership.
Their absence from the current tree or registry is not itself an unavailable-
ownership result. Exact candidate preflight later evaluates the committed paths
canonically.

## Standing refinement authority

The user's approval is standing authority for a
`verification-slice-<feature-task>` preparation stage whenever readiness returns
`coarse-within-pack`. No routine approval round-trip is required. The stage:

1. starts from current QA without product behavior from the paused candidate;
2. introduces only slice declarations, planner/runner support, process contracts,
   and direct conservation proof;
3. proves the affected parent-pack task closure is unchanged and that focused
   selection contains every declared direct task, prerequisite, and consumer;
4. receives independent refactorer and architect review and exact QA-ready
   evidence; and
5. reaches QA before the already-approved product restarts from that exact head.

The product candidate cannot introduce a slice and use it to narrow the same
current/base evidence range. If preparation cannot prove a slice within its
bounded effort ceiling, it records the finding, leaves the parent closure
authoritative, and the product resumes conservatively. It stops for the user only
when product or safety requirements change, pack ownership is unavailable, the
plan is genuinely global, coverage would weaken, or no credible bounded
completion path remains.

### Autonomous file-based routing

When intent or exact preflight returns `coarse-within-pack`, the coder does not
report a user blocker and does not broaden the product task. The coder sends one
explicitly authorized file-based `note` to the specifier containing the product
task, QA base, classification, causal paths and task families, proposed slice
boundary, and any stopped coherent product commit as a patch reference. The
coder then closes the paused product handoff without forwarding it as completed.

The specifier immediately sends the derived
`verification-slice-<feature-task>` specification handoff from current QA. After
its architect `qa-ready` integration, the specifier reissues the original stable
product task from the new exact QA head. This is agent-to-agent routing under the
standing user approval: it contains no user wait and no new product decision.
The implementation updates the coder, refactorer, architect, and specifier role
instructions and deterministic handoff/process contracts to make this route
executable rather than advisory.

## Terminal calibration

The user-requested master checkpoint remains the final complete comparison. Its
scorecard compares terminal-only failures with the focused slices selected for
the accumulated QA work. A causal failure outside an applicable focused slice is
a selection miss: the failed release candidate follows the existing focused
repair and fresh all-20 rerun rule, while the implicated slice becomes
ineligible for narrowing until a separately reviewed mapping repair reaches QA.
Later features use the parent-pack closure during that quarantine.

A passing terminal checkpoint records calibration evidence but does not permit
new undeclared narrowing. No separate all-20 calibration run is added.

## Ordered Documentation-template first use

The active Documentation-template feature is the first observed use. Its current
product reconstruction pauses before review evidence while task
`verification-granularity-ratchet` establishes:

- the general subordinate-slice contract and conservative fallback;
- direct Documentation-template task slices inside `flow_export`,
  `project_management`, and `durable_project_repository` for the existing
  Documentation contribution, project asset-body, archive, and export seams;
- the Shell process-contract observations needed for automatic routing; and
- exact-pack and terminal conservation.

The preparation implements no Template Library, template record, workbook
renderer, upload, rich editor, assignment, preview, export, or new product
behavior. Candidate `7f9c8a1121` remains a patch reference only. After the
preparation is architect `qa-ready` and integrated, `documentation-templates`
resumes automatically from that exact QA head under its existing product
approval.

## Verification and effort boundary

**Development focus:** deterministic process tests for pack/task readiness,
proposed-prefix intent, slice validation, dependency and consumer closure,
current/base union, parent fallback, same-range narrowing rejection, automatic
preparation routing, and terminal selection-miss quarantine. Add direct task-set
conservation fixtures for the three Documentation-template first-use packs.

**QA impact:** `shell`, `flow_export`, `project_management`, and
`durable_project_repository`, with properties and package proof. Exact planning
may add one bounded consumer proved by the first-use design. It may not execute
all 20 packs.

The implementation-and-review effort ceiling is eight hours from coder receipt
to architect `qa-ready`. At four hours report the readiness classification,
slice and remainder conservation, proposed-prefix behavior, current exact packs
and tasks, task and critical-path reduction, failures, remaining work,
confidence, and forecast. Continue while scope is unchanged and the completion
path remains bounded and safe.

## Scorecard

Report approval, handoff, implementation and review intervals; before/after pack
and task plans; critical-path estimates and measured verification time; each
slice, remainder, prerequisite, and consumer decision; fallback and forecast
variance; failures, repairs, and reruns; package proof; QA integration time;
terminal obligations; and all-20 attempts. The first-use target is zero
feature-mode all-20 runs, unchanged exact-pack task closures, and an exact
Documentation-template product plan that can proceed without another
verification-ownership specification round-trip.
