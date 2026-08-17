# QA verification ownership readiness R01

Status: approved by the user on 2026-08-17 and QA-integrated at `b8194b517e`;
standing activation continues for later QA features and the ordered
Documentation-template product stage is active

Prepared: 2026-08-17

## Purpose

Detect a missing bounded verification boundary before a feature spends its
implementation and evidence budget, then establish that boundary as a separate
QA-integrated preparation stage without requiring another routine user
round-trip. Preserve conservative ownership, focused QA evidence, and the one
all-20 master-integration checkpoint.

This program refines the QA-branch release pilot. It does not authorize a
feature-mode all-20 run, let a feature narrow its own evidence, omit an owned
consumer, change product requirements, or promote `qa` to `master`.

Within a selected pack, task granularity follows
`docs/qa-verification-granularity-ratchet-R01.md`. A bounded pack forecast remains
advisory: a wider canonical pack or task plan proceeds automatically unless a
proved `coarse-within-pack` boundary routes the standing-authorized refinement
stage. Pack size or forecast variance alone never blocks product work.

## Observed recurrence

Three completed planning incidents establish that documentation-only forecasting
is no longer sufficient:

- the Project Library architecture-ledger candidate selected 20 packs and 848
  tasks;
- the first installed visual-portability candidate selected 20 packs and 849
  tasks through the global composition root; and
- Documentation-template candidate `7f9c8a1121` passed its forecast
  `flow_export`, `project_management`, and `durable_project_repository` plan of
  64 tasks plus packaging, but review-evidence preflight selected 20 packs and
  868 tasks with a 795,306 ms critical-path estimate.

The current planner is right to conserve current and historical ownership. A
candidate cannot make its own existing paths narrower and immediately use that
narrowing as proof. The defect is that the workflow discovers coarse ownership
only after implementation and repeated diagnostic runs.

## Required feature lifecycle

Each new QA feature has four verification decisions:

1. **Specification forecast.** The specification names the development focus,
   QA-impact packs, and likely existing shared integration surfaces. It also
   names likely new source prefixes when they affect ownership planning.
2. **Intent preflight.** Before product coding, a read-only ownership-readiness
   plan compares those likely paths with the current QA registry. It executes no
   build or test, writes no receipt or incident, and returns one classification.
3. **Exact candidate preflight.** After the first coherent candidate is
   committed and before any settled diagnostic or review-evidence run, a
   plan-only invocation uses the canonical Git change set and the same
   current/base ownership logic as review evidence. It executes no task and
   cannot support a handoff.
4. **One evidence run.** After the exact plan is authorized and the committed
   candidate is settled, one `--property --changed-since --prepare-evidence`
   invocation produces the receipt used for review-ready recording. Preliminary
   focused red/green checks remain allowed, but an identical full planned run is
   not required first.

A wider but bounded exact plan proceeds automatically and records forecast
variance. An all-20 result is classified before deciding what happens next.

## Ownership-readiness classifications

The planner returns exactly one of these results with the approved and planned
packs, task count, critical-path estimate, paths, owner and boundary decisions,
and a concise reason:

- `bounded-ready`: current ownership selects fewer than all runnable packs;
- `coarse-within-pack`: current ownership selects fewer than all runnable packs,
  but a selected pack contains materially unrelated task families and has a
  credible exact subordinate slice;
- `coarse-boundary`: one or more existing shared paths have a credible exact QA
  owner and consumer boundary, but current ownership expands them to all packs;
- `genuinely-global`: the changed behavior or executable contract can affect
  every runnable pack and no truthful bounded QA observation exists;
- `ownership-unavailable`: current or historical ownership is missing,
  malformed, ambiguous, or incompatible; or
- `requirements-expanded`: establishing a boundary would change approved product
  behavior, persistence meaning, security policy, migration semantics, or
  another requirement.

`bounded-ready` proceeds to ordinary implementation. `coarse-within-pack` starts
the granularity-ratchet preparation, and `coarse-boundary` starts the ownership
preparation below. A bounded plan with no proved subordinate slice proceeds with
the conservative parent-pack closure and records deferred refinement. The other
three results stop for current user direction; they cannot be relabelled as
preparation merely to avoid all 20.

## Standing ownership-preparation authority

The user's approval of this program is standing authority for an
`ownership-prep-<feature-task>` stage when the result is `coarse-boundary`.
Starting that stage requires no additional approval when all of the following
are true:

- the approved externally visible behavior and acceptance criteria are
  unchanged;
- the work only extracts, registers, or validates stable integration seams and
  their verification ownership;
- every former owner remains represented by the conservative current/base union
  until the preparation stage is QA-integrated;
- exact owners, consumers, runtime smoke targets, and any terminal-full
  obligation are declared and independently checked;
- no scenario, assertion leaf, package input, consumer, or master obligation is
  removed, skipped, stubbed, or made optional;
- the preparation plan remains smaller than all runnable packs; and
- the work stays within its approved effort ceiling with a credible bounded
  completion path.

The preparation stage is an independently committed, reviewed, and QA-integrated
candidate. The product candidate never changes ownership and consumes the new
boundary in the same evidence range. After preparation reaches `qa`, the
specifier sends the already-approved feature again from that exact QA base. No
second product approval is required.

Stop for user direction if the consumer set cannot be proved, a proposed repair
weakens coverage, the preparation itself still selects all packs outside the
approved bootstrap, or the seam would change product requirements.

## Stage-aware shared boundaries

A declared shared QA boundary names:

- one stable identity and one owning pack;
- exact source paths or prefixes;
- exact consumer packs;
- a structural class such as registration, packaging, composition, persistence,
  migration, or shared semantics;
- the installed smoke or direct observations that cover the changed boundary;
- whether dependant propagation remains required; and
- whether focused QA records a terminal-full obligation.

A validated exact boundary selects its owner and declared consumers in feature
mode. A boundary whose complete application reach is intentionally deferred
also records a terminal-full obligation. The eventual user-requested master
checkpoint executes all 20 packs on the frozen candidate and consumes matching
obligations only when it passes. A failure or later behavior-bearing change
leaves them active.

Undeclared shared paths retain their current conservative behavior. Missing,
duplicate, conflicting, self-owned, or unobservable declarations block before
task launch. Rename, deletion, ownership change, and compatible history use the
union of old and new owners and consumers. Missing or incompatible history never
narrows evidence.

## Role and handoff rules

- The specifier records likely shared integration surfaces beside development
  focus and QA impact.
- The coder runs intent preflight before behavior work. A missed path found by
  the first coherent exact candidate preflight follows the same classification.
- A `coarse-boundary` result automatically routes the preparation stage under
  this program instead of asking the user again.
- Refactorer and architect review the preparation independently from the product
  candidate and require conservation, exact consumers, runtime observation, and
  package proof.
- The specifier integrates only an architect `qa-ready` preparation candidate,
  then restarts the product task from that exact QA head.
- No role runs all 20 in feature mode or describes a terminal obligation as final
  evidence.

The exact candidate preflight occurs before the first complete planned
diagnostic run. Evidence is produced only from a committed tree, preventing a
passing dirty-tree receipt or ordinary diagnostic receipt from causing a second
identical run.

## One-time workflow bootstrap

The first implementation changes the workflow that authorizes later preparation
stages. It therefore has one bounded bootstrap, modeled on the completed
stage-aware stylesheet bootstrap. Bootstrap authority is valid only when the
base contains this approved program and scenarios but lacks ownership-readiness
implementation, and the candidate adds only:

- intent and exact plan-only preflight;
- classification and diagnostics;
- validated stage-aware shared-boundary and terminal-obligation support;
- role workflow instructions and deterministic process tests; and
- the behavior-preserving first-use integration seams named below.

The bootstrap cannot be reused after its implementation reaches `qa`. It uses
the `shell` process-contract boundary plus the bounded first-use owners and
consumers selected from `flow_export`, `project_management`, and
`durable_project_repository`, with package proof. A bounded additional owner
selected by the exact first-use design is recorded as variance and proceeds.
The bootstrap never launches all 20 and never claims master proof.

## Ordered Documentation-template recovery

The approved batch has two stages:

1. Task `verification-ownership-readiness` implements the bootstrap and
   establishes behavior-preserving seams for project asset-body
   persistence/archive participation, Documentation workspace contribution, and
   build-delivered template dependencies. Current Flow visual assets, project
   archive compatibility, Built-in Documentation output, and installed Studio
   navigation remain unchanged.
2. After that candidate is architect `qa-ready` and integrated into `qa`, task
   `documentation-templates` resumes automatically from the new QA head under
   `docs/data-layer-documentation-template-program-R01.md`. Candidate
   `7f9c8a1121` is a patch reference only; reconstruct task-owned behavior rather
   than merging its stale lineage wholesale. Its prior 3-pack diagnostic pass is
   useful local evidence but not review-ready evidence for the reconstructed
   commit.

The first stage must not implement the Template Library, Excel rendering, rich
editor, or new user-visible documentation behavior. The second stage must not
change the ownership-readiness policy merely to obtain a smaller plan.

## Verification and effort boundary

**Development focus:** deterministic planner tests for the five readiness
classifications, plan-only no-execution behavior, conservative history,
preparation eligibility, stage-aware consumers, terminal obligations, and
one-time bootstrap eligibility. Add direct conservation checks for each first-use
seam.

**QA impact:** `shell`, `flow_export`, `project_management`, and
`durable_project_repository`, plus package proof. The approved bootstrap may add
one bounded exact owner selected by the settled seam design. It may not select
all 20.

The bootstrap implementation-and-review effort ceiling is six hours from coder
receipt to architect `qa-ready`. At three hours report classification and
plan-only status, first-use seam status, current exact plan, terminal-obligation
status, failures, variance, remaining work, confidence, and forecast. Continue
while the scope is unchanged and a bounded safe completion path remains.

The resumed Documentation-template stage retains its existing twelve-hour
ceiling and six-hour checkpoint. Its new timer begins at the renewed coder
handoff; the earlier stopped candidate interval remains separately visible in
the combined scorecard.

## Scorecard

Report, for both stages, approval and handoff times, time to first intent and
exact plan, time spent before any fan-out discovery, selected packs and tasks,
diagnostic and evidence runs, failures, retries, package proof, review intervals,
QA queue time, terminal obligations, and all-20 attempts. The target is zero
all-20 feature runs and zero ownership fan-out discoveries after the first
complete planned diagnostic run.

### Settled bootstrap stage — 2026-08-17

- The approved specification was committed at 06:26:15 UTC, handed to the coder
  at 06:26:37, received at 06:27:45, and QA-integrated at 08:37:18. Elapsed
  handoff-to-integration time was 2 hours 10 minutes 41 seconds, below the
  six-hour ceiling; the three-hour checkpoint was not reached.
- Plan-only commands intentionally create no receipt. The earliest preserved
  preflight artifacts are at 06:47:43, and the first exact evidence launch at
  07:00:00 proves the settled four-pack boundary was known before task launch.
  No late ownership fan-out occurred after that point.
- Every complete plan selected exactly `shell`, `flow_export`,
  `project_management`, and `durable_project_repository`: 129 tasks with
  properties and package proof. No additional owner was needed. Three accepted
  coder/refactorer/architect checkpoints ran for 7:38, 7:35, and 7:37,
  respectively; all 129 tasks passed each time and package proof passed.
- Two earlier coder review-evidence candidates each passed 127 tasks and failed
  the Shell acceptance session. The first exposed retry-handler scope in
  scenario 019; the amended candidate then exposed the declared prepared task
  in scenario 016. Both acceptance-support defects were repaired on changed
  candidates before the final exact pass. Their failed-candidate incidents
  remain durable history and do not weaken the integrated evidence.
- One terminal-mode planning attempt selected all 20 packs but launched zero
  tasks. There were zero all-20 feature runs, zero invalidated passing runs, and
  no product-behavior or requirement expansion.
- Coder receipt to handoff was 1:23:36; refactorer receipt to handoff was 16:54;
  architect receipt to QA-ready handoff was 24:05; QA-ready receipt to
  integration was 4:31. The integrated tree records terminal-full obligations
  for build-delivered dependencies, project asset bodies, and the Documentation
  workspace contribution for the eventual master checkpoint.
- Recommendation: continue with the already-approved Documentation-template
  product stage. For later workflow slices, exercise newly added acceptance
  handlers with the direct development check before the first
  evidence-producing run so an acceptance-support correction does not consume a
  complete focused checkpoint.
