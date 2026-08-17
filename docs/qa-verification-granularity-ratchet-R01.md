# QA verification granularity ratchet R01

Status: the initial ratchet is QA-integrated at `066ea284de`; on 2026-08-17 the
user approved an immediate first-use mapping repair after the exact
Documentation-template candidate disproved the 12-task intent forecast. The
product is paused at clean patch reference `e8e5fd48` until that repair reaches
QA, then resumes automatically

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

The active Documentation-template feature is the first observed use. Task
`verification-granularity-ratchet` established:

- the general subordinate-slice contract and conservative fallback;
- direct Documentation-template task slices inside `flow_export`,
  `project_management`, and `durable_project_repository` for the existing
  Documentation contribution, project asset-body, archive, and export seams;
- the Shell process-contract observations needed for automatic routing; and
- exact-pack and terminal conservation.

The preparation implemented no Template Library, template record, workbook
renderer, upload, rich editor, assignment, preview, export, or new product
behavior. Candidate `7f9c8a1121` remains a patch reference only.
`documentation-templates` resumes automatically from the exact QA descendant
that records this scorecard, under its existing product approval.

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

### Settled implementation and first-use result

The approved specification commit `7b7ce01281` was handed to the coder at
2026-08-17 09:53:39Z. The repaired architect candidate `066ea284de` was handed
back at 11:31:53Z and fast-forwarded into QA by 11:34:40Z: about 1 hour 41
minutes from handoff to integration, inside the eight-hour ceiling and before
the four-hour checkpoint.

Four exact focused review runs passed with properties and package proof: coder,
refactorer, initial architect, and repaired architect evidence each selected the
same four packs and 129 tasks and took about 7 minutes 39 seconds to 7 minutes
44 seconds. Their measured verification time was about 30 minutes 49 seconds in
total. The initial architect pass was correctly invalidated when independent
specifier review found three operational contract gaps: the CLI could not emit
`coarse-within-pack`, a proposed prefix incorrectly required an already-
registered slice, and terminal selection-miss quarantine was not durable. The
repair made all three executable and repeated the complete focused evidence.
There were no failed evidence runs and no all-20 attempt.

The exact parent-pack closures and terminal obligations remain unchanged. The
integrated declarations add subordinate Documentation-template slices in
`flow_export`, `project_management`, and `durable_project_repository`, plus the
declared `shell` consumer. Unknown or incompatible paths fall back to the full
parent closure. Terminal selection misses are stored in the durable Git-notes
quarantine and keep later work on that parent fallback until a separately
reviewed mapping repair reaches QA.

The first `documentation-templates` intent from `066ea284de` was
`bounded-ready`. It plans 12 tasks with a 12-second critical-path estimate
across the three forecast product packs and the declared `shell` consumer,
instead of the 129-task bootstrap checkpoints. Its two proposed prefixes resolve
to `flow_export`'s `documentation_template_workspace` slice and the `shell`
`documentation_workspace_consumer`; its three established shared paths remain
terminal full obligations. There are no active quarantines. This is a focused
planning reduction, not an elapsed product-verification claim.

### Exact first-use variance and point of failure

The coherent product candidate based on `1aec21fd2f` disproved that intent-only
result. After its planned-feature registration correction, exact preflight at
`e8e5fd48` selects 13 packs and 601 tasks. The causal paths are
`src/data-layer-durable-project-repository.ts`,
`src/flow-visual-archive-export.ts`, `src/flow-visual-archive-format.ts`,
`src/flow-visual-asset-portability.ts`, and `src/specification-builder.ts`.
Every one is a credible shared boundary, but none is covered by the first-use
slice declarations. The earlier stopped candidate `7f9c8a1121` already changed
the same five paths, so this was a known-input mapping failure rather than an
unpredictable implementation expansion.

The first attempted broad checkpoint selected the same 13 packs and 613 tasks.
It failed the Shell process contract because six future Documentation-template
Gherkin files had incorrectly moved from `plannedFeatures` to executable
features. Incident `ea2899c8-7cb5-40f0-ac93-6a8fa363c704` retains that failed
attempt. Candidate `e8e5fd48` repairs the registration and passes its focused
causal regression, reducing the exact plan to 601 tasks, but it has no accepted
product evidence. No all-20 run occurred. The candidate remains a patch
reference and must not be forwarded as completed product work.

The workflow also failed to route the variance automatically. In the integrated
implementation, `coarse-within-pack` requires caller-supplied `--within-pack`
JSON. Without that optional proof, any plan smaller than all 20 is reported as
`bounded-ready`, even when an unsliced credible boundary adds nine unforecast
packs and hundreds of unrelated tasks. The coder therefore followed the
implemented rule correctly; the specification, first-use mapping, and automatic
assessment trigger were incomplete.

### Approved first-use mapping repair

Task `verification-slice-documentation-templates` starts from clean QA at
`1aec21fd2f`. It is an independently reviewed preparation; `e8e5fd48` and
`7f9c8a1121` are design and patch references only. It implements no Template
Library, Excel renderer, rich editor, assignment, export, or other new product
behavior.

The repair must establish all of the following:

1. **Known-candidate replay.** When a stopped coherent candidate is available,
   specification intent includes the union of its existing changed integration
   paths and the newly proposed prefixes. A deterministic fixture using the five
   paths above must reproduce the 13-pack variance before any product evidence
   can launch. An intent-only three-seam simulation cannot settle first-use
   readiness again.
2. **Automatic variance assessment.** Intent and exact preflight distinguish
   declared owners and consumers from unforecast packs reached through an
   unsliced credible boundary. Such a result returns
   `granularity-assessment-required` and automatically routes a preparation
   without caller-authored `--within-pack` JSON, even when fewer than all 20
   packs are selected. It is not a user blocker and it does not narrow evidence
   by itself. `coarse-within-pack` remains the result only after the assessment
   proves a safe subordinate slice.
3. **Durable disposition and loop prevention.** The assessment records either
   an independently reviewed integrated slice/seam or a reviewed conservative
   parent-fallback disposition for the exact causal paths. A resumed product
   consumes that disposition and cannot loop through the same preparation or
   silently relabel the same variance `bounded-ready`.
4. **Safe seam repair.** Assess the repository, three archive/portability, and
   application-controller paths from the real candidate. A whole broad source
   file may not receive a Documentation-only slice unless its selected tasks and
   consumers are sufficient for every valid change to that file. Otherwise
   extract a behavior-preserving, reusable asset-body/archive or Documentation
   composition seam on QA, or retain conservative parent fallback. In
   particular, prefer the installed Documentation contribution seam over a new
   product edit to the global `specification-builder.ts` controller.
5. **Conservation.** Existing exact-pack closures, assertions, properties,
   package proof, terminal-full obligations, quarantine behavior, and the final
   all-20 master gate remain unchanged. The preparation uses its canonical
   affected plan and never runs the all-20 gate.
6. **Executable routing.** Update coder, refactorer, architect, and specifier
   instructions plus deterministic process tests so the automatically detected
   assessment pauses the product, preserves its commit as a patch reference,
   reaches QA independently, and reissues the same stable product task from the
   new exact QA head without another user decision.

The repair effort ceiling is eight hours from coder receipt to architect
`qa-ready`. At four hours report the replayed pack/task plan, causal paths,
automatic classification, seam-versus-fallback decisions, conservation proof,
actual preparation plan, failures, remaining work, confidence, and forecast.
Continue while product behavior is unchanged and the repair remains bounded;
stop for the user only if a safe seam would change persistence or product
meaning, coverage would weaken, ownership is unavailable, or no credible
bounded completion path remains.

After QA integration, reissue `documentation-templates` automatically. Rebuild
from that QA head and use `e8e5fd48` only as a patch reference. The resumed
candidate must use the integrated seams or explicit parent-fallback disposition,
must run a fresh exact preflight before evidence, and receives no fixed 12-task
promise. Its measured exact result replaces the disproved intent forecast.

### Settled first-use mapping repair result

Repair authority `d8e1a31025` was handed to the coder at 12:28:20Z on
2026-08-17 and received at 12:28:28Z. Candidate `8d3cf5012c` reached the
refactorer at 13:21:33Z, the architect at 13:27:30Z, and QA at 13:37:23Z. The
handoff-to-integration interval was 1 hour 9 minutes 3 seconds, inside the
eight-hour ceiling and before the four-hour checkpoint.

The deterministic known-candidate replay now maps the five existing product
paths to 13 packs and 534 intent tasks and returns
`granularity-assessment-required` without caller-authored materiality JSON.
Every causal path has one durable disposition. The global
`src/specification-builder.ts` edit is replaced for resumed Documentation work
by the installed `src/project-documentation/workspace-contribution.ts` seam and
the reusable project asset-body store. The durable repository and three Flow
archive/portability paths retain reviewed conservative parent fallbacks because
their complete compatibility consumers remain valid.

The repair candidate's canonical evidence plan selected 12 packs and 583 tasks,
including properties and package proof. Its first complete evidence attempt
passed 581 tasks and exposed one stale Shell evidence-shape contract; no product
or runtime check failed. After the deterministic evidence shape was corrected,
the 69-task focused Shell session passed and the fresh complete plan passed all
583 tasks in 14 minutes 10 seconds. Independent review proved all 20 exact-pack
closures and the 853-task terminal closure unchanged. Two terminal-full
obligations remain for the asset-body and Documentation contribution seams. No
all-20 feature run occurred.

Recommendation: proceed with the already-approved `documentation-templates`
product from the exact QA scorecard descendant of `8d3cf5012c`. Its exact
changed-path plan is the next measurement. The four parent fallbacks authorize
truthful broad evidence when those shared files really change; they do not cause
another assessment loop, promise a narrow count, or authorize all 20.
