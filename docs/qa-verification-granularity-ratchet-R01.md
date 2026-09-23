# QA verification granularity ratchet R01

Status: the initial ratchet, first-use mapping repair, and durable-runtime
staging repair are QA-integrated at `066ea284de`, `8d3cf5012c`, and
`06222ff00f`; the Documentation-template product resumes automatically from the
staging-repair scorecard descendant; judgment-based deferral and a
pre-promotion observation portfolio are QA-integrated at `0b4f8b4a9d`

Prepared: 2026-08-17

## Purpose

Refine a selected verification pack only when real feature work proves that its
internal task boundary is materially broader than the behavior being changed.
Preserve every existing assertion and exact-pack task while letting later
features select a smaller declared slice with its proven consumers. Under the
user-approved taxonomy evolution in
`docs/qa-verification-pack-taxonomy-evolution-R01.md`, the current twenty-pack
count is derived rather than fixed, and a separately reviewed topology migration
may promote a proved independent boundary without weakening evidence.

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
never causes a split. Semantic mismatch between the product change and selected
behavior, a stable observable sub-boundary, measurable unrelated work, the cost
and risk of extraction, and the evidence needed to conserve the parent boundary
inform agent judgment together. A roadmap or a prediction that the path will be
touched again is neither required nor decisive.

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

These facts expose a bounded refinement opportunity; they do not by themselves
command immediate preparation. The agent compares the semantic size of the
product change, unrelated selected behavior, wall time and failure surface,
seam coherence, and the cost and risk of extraction and conservation proof. A
local UI correction that selects complete unrelated feature families is strong
evidence that verification is materially disproportionate. When immediate
refinement is not worthwhile or cannot yet be proved safely, the canonical
parent-pack plan proceeds and the finding becomes a durable observation. There
is no repository-wide pack-size or elapsed-time threshold. A large pack, an
inaccurate forecast, an unfamiliar path, or an unsupported forecast of future
reuse alone never blocks the approved feature.

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
executes that complete closure. Terminal master integration executes every
runnable pack in the exact candidate registry with properties and package proof.
A slice declaration cannot silently create a new top-level pack, hide an
existing task, duplicate one logical observation, remove a dependency, or make
an assertion optional. A separate reviewed topology migration may promote a
proved independent slice under the taxonomy-evolution conservation contract.

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

## Standing judgment and refinement authority

The bounded classifications are diagnostic inputs, not deterministic commands.
Agent judgment ends in exactly one of these outcomes:

1. use an already reviewed seam or slice;
2. add a small opportunistic seam with the product while the same-range evidence
   remains conservative;
3. start an independent `verification-slice-<feature-task>` preparation now;
4. record a durable granularity observation and proceed with the conservative
   parent-pack plan; or
5. retain an evidence-backed cannot-safely-split parent fallback.

The user's approval is standing authority for outcome 3 when the agent judges
that its verification benefit is proportionate to its implementation and review
cost. No routine approval round-trip is required. The stage:

1. starts from current QA without product behavior from the paused candidate;
2. introduces only slice declarations, planner/runner support, process contracts,
   and direct conservation proof;
3. proves the affected parent-pack task closure is unchanged and that focused
   selection contains every declared direct task, prerequisite, and consumer;
4. receives independent refactorer and architect review and exact QA-ready
   evidence; and
5. reaches QA before the already-approved product restarts from that exact head.

The product candidate cannot introduce a slice and use it to narrow the same
current/base evidence range. If preparation becomes materially more complex,
risky, or time-consuming than the local behavior it is intended to accelerate,
it may stop, record the finding as a durable observation, leave the parent
closure authoritative, and resume the product conservatively. That is a
deferral for portfolio review, not a permanent fallback. It stops for the user
only when product or safety requirements change, pack ownership is unavailable,
the plan is genuinely global, coverage would weaken, or no credible bounded
completion path remains. An all-pack `coarse-boundary` plan cannot use this
deferral to enter QA; its existing ownership-preparation stop remains mandatory
because feature mode forbids an all-20 evidence plan.

### Durable granularity observations

A deferred observation is append-only and records the stable task, exact QA
base, causal paths, semantic product scope, selected packs and task families,
unrelated behavior, candidate seam if known, preparation cost or risk, judgment
rationale, and evidence that would justify reconsideration. Its identity binds
task, base, causal paths, and boundary generation. Re-observing the same identity
increments measured occurrence rather than creating an ambiguous duplicate;
identity collisions are rejected.

Recording is allowed only after read-only judgment and never during plan-only
preflight. It does not change product files, verification ownership, consumers,
pack or task selection, evidence, incidents, or readiness. The conservative
parent remains authoritative for that feature.

### Autonomous file-based routing

When agent judgment selects immediate independent preparation, the coder does
not report a user blocker and does not broaden the product task. The coder sends
one explicitly authorized file-based `note` to the specifier containing the
product task, QA base, classification, judgment rationale, causal paths and task
families, proposed slice boundary, and any stopped coherent product commit as a
patch reference. The coder then closes the paused product handoff without
forwarding it as completed.

The specifier sends the derived
`verification-slice-<feature-task>` specification handoff from current QA. After
its architect `qa-ready` integration, the specifier reissues the original stable
product task from the new exact QA head. This is agent-to-agent routing under the
standing user approval: it contains no user wait and no new product decision.
The implementation updates the coder, refactorer, architect, and specifier role
instructions and deterministic handoff/process contracts to make this route
executable rather than advisory.

## Terminal calibration

Before freezing a user-requested master checkpoint, the specifier reviews the
complete durable observation portfolio. Every applicable observation receives
one explicit disposition: selected for this promotion, combined with another
selected refinement, carried visibly to the next promotion, or retired with
evidence that its premise no longer applies. Selection considers measured
occurrence, cumulative unrelated work, seam clarity, implementation and review
cost, coverage risk, and whether several observations share one coherent
boundary. No single count, elapsed-time threshold, roadmap, or prediction of
future reuse dictates the result.

Selected verification-only hardening proceeds through ordinary focused coder,
refactorer, architect, and QA integration while unrelated product handoffs stay
out of the release candidate. Work whose safe completion would endanger the
promotion is carried rather than rushed. Once selected hardening is QA-integrated
or explicitly carried, QA freezes exactly once. The user-requested master
checkpoint remains the final complete comparison. Its
scorecard compares terminal-only failures with the focused slices selected for
the accumulated QA work. A causal failure outside an applicable focused slice is
a selection miss: the failed release candidate follows the existing focused
repair and fresh all-20 rerun rule, while the implicated slice becomes
ineligible for narrowing until a separately reviewed mapping repair reaches QA.
Later features use the parent-pack closure during that quarantine.

A passing terminal checkpoint records calibration evidence but does not permit
new undeclared narrowing. No separate all-20 calibration run is added.

## Continuous stacked-ratchet correction

Documentation Templates ultimately reached QA at `a785a83b50`, but its repeated
manual reconstruction and incident-routing cycles showed that automatic
resumption was only an instruction, not a durable mechanism. User approval on
2026-08-17 therefore strengthens the standing campsite rule for future work.

Assessment remains mandatory and evaluates the union of all newly encountered
coarse paths from one settled candidate. Every path must end in a reviewed seam
or slice, an evidence-backed cannot-safely-split parent fallback, or a durable
granularity observation with conservative parent coverage. The agent judges
semantic mismatch, unrelated work, seam quality, cumulative verification cost,
and preparation cost and risk. Imperfect verification structure, forecast
variance, elapsed time, pack count, different terminology, or an unsupported
prediction of future reuse cannot dictate or restart the assessment.

A preparation now records and preserves the unchanged product remainder as a
first-class stack with its split base, head/tree, ordered commits, stable task,
change-set digest, causal paths, and expected delta. The preparation proceeds
independently while that stack remains intact. After preparation reaches QA, the
system rebases or reapplies the recorded remainder to the exact new QA head,
proves delta conservation, and reissues the same task automatically. Future
implementations must not discard the product candidate and later reconstruct it
from a patch reference.

Disposition identity includes task, causal path, structural boundary, and
boundary generation. The same applicable identity cannot create the same
preparation twice. A new preparation requires a changed generation, consumer
set, or failed premise. Full mechanics and acceptance are controlled by
`docs/swarmforge-outcome-bounded-autonomy-and-unblocker-handoffs-R01.md` and
`features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature`.

Observation identity remains distinct from preparation disposition identity.
Repeated observations accumulate occurrence and measured cost without
implicitly opening preparation. Before master-promotion freeze, the observation
portfolio is reviewed once, every item is selected, combined, carried, or
retired explicitly, and selected hardening reaches QA through focused evidence
before the one final all-20 checkpoint.

## Settled implementation records

Completed implementation plans and scorecards are historical evidence:

- `docs/qa-verification-granularity-ratchet-first-use-history-R01.md`;
- `docs/qa-verification-granularity-ratchet-staging-history-R01.md`;
- `docs/qa-verification-granularity-ratchet-portfolio-history-R01.md`; and
- `docs/qa-verification-granularity-ratchet-flow-history-R01.md`.

These records do not change the active readiness, slice, judgment, observation,
routing, calibration, or stacked-ratchet rules above.
