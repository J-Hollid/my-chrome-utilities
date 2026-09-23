# QA verification ownership readiness R01

Status: approved by the user on 2026-08-17 and QA-integrated at `b8194b517e`;
standing activation continues. Documentation-template mapping repairs are
QA-integrated through durable-runtime staging seam `06222ff00f`

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
advisory: a wider canonical pack or task plan proceeds automatically when every
additional pack is a declared owner or consumer. An unsliced credible boundary
that adds unforecast packs routes the standing-authorized granularity assessment
without blocking for the user. Pack size or forecast variance alone never
weakens or narrows verification.

## Evidence basis

Repeated late fan-out showed that documentation-only forecasts were not enough.
The settled evidence and implementation record are in
`docs/qa-verification-ownership-readiness-history-R01.md`.

## Required feature lifecycle

Each new QA feature has four verification decisions:

1. **Specification forecast.** The specification names the development focus,
   QA-impact packs, and likely existing shared integration surfaces. It also
   names likely new source prefixes when they affect ownership planning. When a
   stopped coherent candidate is a patch reference, the forecast includes its
   existing changed integration paths; it does not merge the candidate or treat
   its product behavior as preparation work.
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
- `granularity-assessment-required`: current ownership selects fewer than all
  runnable packs, but an unsliced credible changed boundary selects packs beyond
  the intent's declared owners and consumers and has no reviewed durable
  disposition yet;
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

`bounded-ready` proceeds to ordinary implementation.
`granularity-assessment-required` and `coarse-within-pack` start the
granularity-ratchet preparation, while `coarse-boundary` starts the ownership
preparation below. The assessment never narrows the paused product. It records
either a reviewed slice/seam or a durable conservative parent-fallback
disposition, then the product resumes automatically. The other three results
stop for current user direction; they cannot be relabelled as preparation merely
to avoid all 20.

The automatic assessment trigger is causal rather than numerical. It compares
the exact planned packs with the intent's declared owners and consumers, then
requires at least one additional pack to be reached through a credible changed
boundary that has neither an applicable reviewed slice nor a current durable
fallback disposition. A 13-pack count is not itself the trigger, and a declared
consumer is not variance. Caller-authored `--within-pack` detail may prove a
specific slice, but its absence cannot suppress the assessment result.

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

## Historical implementation record

The one-time bootstrap is exhausted. Completed Documentation-template stages,
effort data, and settled scorecards are in
`docs/qa-verification-ownership-readiness-history-R01.md`. Those records do not
change the active lifecycle and classification rules above.
