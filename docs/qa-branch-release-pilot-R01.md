# QA-branch release pilot R01

Status: approved by the user for immediate activation; ownership-readiness and
within-pack granularity refinements approved on 2026-08-17; judgment-based
granularity deferral and pre-promotion portfolio intake approved on 2026-08-18;
first cumulative promotion completed at `70c94a8ce6` and natural-lull promotion
timing confirmed by the user on 2026-08-21

Prepared: 2026-08-12

## Purpose

Reduce development latency by running change-appropriate focused checks while
features accumulate on `qa`, then run the complete end-to-end gate once for an
explicitly requested promotion of the frozen cumulative tree to `master`. The
request is expected at a natural delivery lull chosen from current priorities
and feature momentum, not when an arbitrary task-count or calendar threshold is
reached.

This is a delivery-process pilot, not permission to weaken regression coverage.
`qa` is the frequently integrated development line. `master` remains the exact
release line and advances only to a tree that passed the complete terminal gate.

## Specifier mode selection

At the start of each new request, the specifier determines which of these two
modes the user wants. If the request is ambiguous, ask whether the user wants to
develop or integrate a feature into `qa`, or promote accumulated `qa` work to
`master`.

### Feature integration mode

Use this mode for a new behavior slice, correction, or other independently
reviewable change.

1. Start the specification and implementation lineage from current `qa`. Do not
   inherit an abandoned or unrelated task branch.
2. The specification names the smallest checks that directly observe the change,
   an elapsed effort ceiling, and a checkpoint expected by halfway through that
   ceiling. These are reporting expectations rather than automatic intervention
   gates. At halfway and at the ceiling, report progress, the cause of any
   variance, remaining work, confidence, and current forecast. Continue by
   default while product and requirement scope are unchanged and the completion
   path is bounded and safe. A bounded difference between the forecast QA-impact
   list and the canonical changed-path plan is not a scope expansion requiring a
   user decision: use the complete planned pack set, record the variance, and
   continue. Pause for a user decision when product or requirement scope expands,
   requirements need
   reinterpretation, failures repeat without a causal explanation, no credible
   completion path remains, or another safety boundary requires authority.
   Ownership readiness follows
   `docs/qa-verification-ownership-readiness-R01.md`. Before product coding, a
   read-only intent plan evaluates likely shared integration surfaces. After the
   first coherent commit and before a complete planned diagnostic or evidence
   run, exact plan-only preflight compares the canonical changed paths with the
   approved scope. A `coarse-boundary` all-pack result automatically starts the
   standing-authorized ownership-preparation stage and resumes the already-approved
   product only after that stage is QA-integrated. Genuinely global behavior,
   unavailable ownership, or changed product or safety requirements still stop
   for current user direction. The planner never omits owned packs to preserve
   the smaller scope, and a product candidate cannot narrow its own current/base
   ownership in the same evidence range. Within a bounded pack plan,
   `docs/qa-verification-granularity-ratchet-R01.md` distinguishes ordinary
   forecast variance from a proved `coarse-within-pack` boundary. Forecast
   variance proceeds automatically. A proved bounded boundary invokes agent
   judgment: prepare now when the verification benefit is proportionate, or
   record a durable observation and use the conservative parent-pack plan when
   preparation would be materially broader, riskier, or more time-consuming
   than the approved product behavior. The judgment considers semantic mismatch,
   unrelated selected behavior, measured verification cost, seam coherence, and
   preparation cost and risk. It does not require a roadmap or forecast of future
   touches. An unproved refinement opportunity also uses the conservative parent
   plan. The all-pack `coarse-boundary` stop above remains mandatory.
3. Coder and refactorer run focused checks and record review-ready evidence. The
   architect completes architecture and quality review and runs focused checks
   for any changes or repairs. No role runs the all-runnable-pack gate in this mode.
   A reliability incident with an eligible causal repair, deterministic
   regression, exact focused review-ready evidence, and passing package proof is
   recorded as `terminal-verification-deferred`. That unresolved disposition
   permits focused review and QA integration only; it is neither resolution nor
   abandonment. Missing, failing, stale, or identity-mismatched proof remains
   blocking.
   The same bounded route applies when one exact governed diagnostic retry passes
   and is durably classified `confirmed-flaky`: that diagnostic remains
   classification proof only, the complete canonical owned-pack review and
   package must pass freshly, and atomic deferral records no invented repair.
   Reproduced, changed, unclassified, stale, multiply retried, uncovered, or
   identity-mismatched failures remain blocking. The incident is resolved only
   by matching passing evidence in the later explicitly requested all-runnable-pack
   checkpoint; terminal recurrence blocks final-ready recording.
   A later independently approved slice may start from that QA descendant. Its
   feature-mode roles do not audit, reverify, mutate, or re-defer every earlier
   incident, including one whose shared disposition was recorded on an abandoned
   parallel candidate. Failure-lineage ancestry and changed-path overlap alone
   create no incident proof obligation, do not attach the disposition to the
   later candidate, and do not require the parallel candidate to be merged. The
   later slice still needs its own exact focused evidence and package proof. Reopen one
   incident case by case only when ordinary focused work naturally reproduces
   its diagnosed failure boundary, or when the approved slice intentionally
   changes that incident's repair, regression, task-succession, runner, or
   evidence contract. Shared-infrastructure expansion remains subject to the
   preflight scope-choice rule in step 2. Otherwise leave the recorded incident
   unchanged for the frozen master-integration assessment.
4. The architect sends the exact candidate to the specifier with
   `readiness: qa-ready` and `verified: review-ready`. That claim must have bound
   focused evidence for the exact task, base, commit, tree, changed paths, and
   receipt.
5. The specifier may fast-forward `qa` to that exact candidate. QA integration is
   not master integration, release completion, or final regression proof.

After the architect's last candidate change, the required focused check is run
once in evidence-producing mode. Its receipt records review-ready evidence for
that exact tree; an ordinary preliminary run of the same plan on the same tree is
not required. A later change requires one new evidence-producing run.

### Development-focus and QA-impact convention

For ordinary features beginning after Flow relationship port snapping, use the
documentation-only convention in
`docs/feature-development-focus-and-advisory-scouting-R01.md`. The implementation
handoff distinguishes a minimal **development focus** for red/green iteration
from a bounded **QA impact** for the settled candidate. This is a knowledge
ratchet, not a new verification mechanism or intervention gate. Existing exact
changed-path planning remains authoritative, and the all-runnable-pack checkpoint remains
exclusive to explicit master integration.

The same document records the completed telemetry-disabled RepoWise scouting
pilot. Trial 4 changed neither development focus nor QA impact and its stale-index
refresh impeded the workflow, so routine checkpoints are stopped for now. Do not
add RepoWise to ordinary feature handoffs or make it a delivery condition. It may
still be selected explicitly for unfamiliar-code or known-hotspot investigation
when its existing index is already current; it cannot block work, widen evidence
on its own, or override the canonical registry.

The ownership-readiness program is the required non-advisory pre-coding check for
likely shared integration paths. It is distinct from stopped RepoWise scouting:
it evaluates the canonical verification registry, executes no product task, and
can route a standing-authorized preparation stage under its approved safeguards.
The granularity ratchet applies the same lifecycle inside a selected pack while
preserving complete exact-pack and terminal execution.

### Verification run intent

An ordinary focused invocation is `development-diagnostic` unless it carries
explicit review-evidence, governed repair-focused, or terminal-checkpoint
authority. A diagnostic receipt retains task output, timing, and local failure
detail, but it never creates or mutates repository-common incidents, retry
allowances, terminal deferrals, or handoff debt. It cannot support review-ready,
QA-ready, or final-ready evidence and cannot be retrospectively upgraded.

`--prepare-evidence` is explicit review-evidence authority. A failure during that
run creates the normal durable reliability incident. Governed repair-focused and
terminal invocations retain their existing durable semantics. Evidence recording
must validate the receipt's immutable run intent and reject a missing, mismatched,
diagnostic, or retrospectively upgraded intent. Later diagnostic success does not
erase an earlier diagnostic receipt.

The first implementation includes an audited compatibility pass for receipts
created before run intent existed. It may make an incident nonblocking only when
the source receipt proves that the invocation had no evidence task, repair
authority, terminal authority, or readiness claim and the disposition retains
the incident and immutable failure history. Missing or ambiguous authority stays
blocking. Existing eligible terminal-verification-deferred incidents remain
unresolved on their recorded candidates, including abandoned parallel
candidates. They do not enter a later
feature evidence preflight merely because changed paths overlap their inputs. No
carry-forward transition is recorded for an unrelated feature candidate; its
exact focused evidence and package proof cover its approved scope only. Master
integration evaluates the accumulated deferred incidents, their diagnoses, and
any repairs from another lineage against the frozen cumulative tree case by case
before the terminal checkpoint.

The following one-time bootstrap is completed and is not a precedent for later
feature work. Because the original correction changed shared runner semantics,
its first checkpoint
cannot satisfy ordinary path-only conservation against older deferred incidents.
One explicit `--run-intent-bootstrap` review-evidence invocation is permitted only
when the approved base contains the run-intent contract but lacks its
implementation and the candidate adds that implementation. Preflight must prove
that every other applicable incident is already eligible and terminal-deferred
and that the exact focused plan selects each deferred failure task or its declared
successor. Pending evidence then requires all of those tasks to pass freshly with
package proof before handoff may re-defer the incidents on the exact candidate.
Any unrelated, ineligible, uncovered, or ambiguous incident blocks. Once the base
contains run-intent implementation, bootstrap authority is exhausted.

Feature candidates must be independently understandable and revertible. Partial,
speculative, or known-failing work stays in task worktrees and never enters
`qa`. Persistence, concurrency, migration, security, packaging, and verification
infrastructure changes should normally occupy a release batch alone.

### Master integration mode

Use this mode only when the user explicitly requests promotion to `master`.
Promotion timing follows natural delivery boundaries: the user may choose a
lull because priorities have settled, active feature work has slowed, or the
accumulated QA state is worth releasing as one coherent tree. There is no target,
minimum, or maximum batch size and no scheduled release interval. Accumulated
task count is measurement context only; it never starts, delays, or accelerates
promotion by itself.

1. The specifier reports the exact `master` base, current `qa` head, accumulated
   QA-integrated tasks, elapsed queue time, and complete durable granularity-
   observation portfolio. No unrelated product handoff enters the pending
   release candidate after portfolio intake begins.
2. The specifier gives every applicable observation one explicit disposition:
   selected for this promotion, combined with selected work, carried visibly to
   the next promotion, or retired with evidence that its premise no longer
   applies. Selected verification-only hardening receives ordinary focused
   coder, refactorer, architect, and QA integration. Unsafe or disproportionate
   work is carried rather than rushed. No item disappears implicitly.
3. After selected hardening is QA-integrated or explicitly carried, the
   specifier freezes the resulting exact QA head and sends it directly to the
   architect with
   `readiness: release-candidate` and `verified: qa-candidate`, using current
   `master` as `base:`. The architect starts a clean release lineage at that
   candidate rather than merging it into stale task ancestry.
4. The architect reviews the cumulative `master..qa` change set, seals one exact
   tree, and runs one fresh canonical all-runnable-pack checkpoint with properties and the
   package check.
   The release-candidate route remains open for terminal-verification-deferred
   incidents so the architect can perform this checkpoint. Its passing receipt
   resolves matching deferred incidents and supplies final-ready evidence; no
   second all-runnable-pack run is required. Any unresolved incident still blocks the
   final-ready handoff and master fast-forward.
5. A pass produces the existing `final-ready` evidence and architect-to-specifier
   handoff. The specifier verifies its exact base, task, commit, tree, plan, and
   package proof, then fast-forwards `qa` and `master` to that exact tested commit.
6. A failure remains recorded. Diagnose and prove a repair with the smallest
   relevant focused check. Prefer reverting an independently revertible offending
   QA slice when that is faster and safer. Any changed release candidate requires
   one fresh complete gate. No unchanged retry may turn a failure green.

Neither the specifier nor another role starts master integration merely because a
batch reaches a suggested size or age. The user owns the promotion instruction,
and its timing follows priorities and feature momentum rather than an artificial
batch-size rule.

## Branch invariants

- `master` must be an ancestor of `qa` before a release candidate is cut.
- A feature specification base is current `qa`, not current `master`, while the
  branches differ.
- A QA candidate is integrated by fast-forward. A non-fast-forward integration
  stops for lineage correction.
- A master promotion is a fast-forward to the exact final-ready commit. Do not
  squash, rebase, amend, merge another commit, or record behavior-bearing changes
  after the passing gate.
- QA freezes only after the observation portfolio has explicit dispositions and
  selected hardening has either reached QA with focused evidence or been carried.
- After successful promotion, `qa` and `master` point to the same commit before
  the next feature batch begins.
- `qa-ready` can reach only the specifier and can advance only `qa`.
  `release-candidate` can reach only the architect and cannot advance `master`.
  `final-ready` remains the only state that can advance `master`.

## Pilot measurement

Use existing Git, handoff, review receipt, final receipt, incident, and evidence
timestamps. Do not add a telemetry subsystem for this pilot.

For every QA-integrated task report:

- user approval to QA integration;
- implementation and review intervals;
- focused verification wall time;
- repairs and focused reruns; and
- QA integration to master promotion queue time.

For every master promotion report:

- accumulated task count and exact commits;
- observation-portfolio identities and selected, combined, carried, or retired
  dispositions, including focused hardening time and evidence;
- approval of the promotion to master integration;
- complete-gate attempts and wall time;
- final-only failures, repairs, reverts, and reruns;
- approval-to-master time for every included user-visible feature; and
- amortized complete-gate time per included task.

The accepted comparison baseline is VTD-017's conservative 17 minutes 43 seconds
per independently promoted tree. For a release containing `N` QA-integrated
tasks, gross terminal time avoided is `(N - 1) * 17 minutes 43 seconds`; report
actual complete-gate time as well rather than treating the model as observed
saving.

Review the pilot after the first master promotion containing at least two ordinary
product slices, and again after five user-visible feature slices. Continue only
when:

- one exact complete gate still protects every master promotion;
- amortized complete-gate time per task falls;
- active approval-to-QA time falls relative to comparable prior slices;
- median approval-to-master time does not increase;
- final-only failure diagnosis and repair do not consume the gate saving; and
- no feature waits on `qa` longer than the user considers acceptable.

If active time falls but approval-to-master latency rises, report the waiting-time
trade-off and ask whether it remains acceptable in light of current priorities
and feature momentum. Do not respond by imposing a smaller batch, larger batch,
or fixed calendar. If final-only failures dominate, improve the missing focused
or medium integration coverage and the pre-promotion evidence checks. Do not
answer either failure by starting a new broad verification-infrastructure program
automatically.

### First cumulative master-promotion scorecard and decision

The first cumulative promotion completed on 2026-08-21. `qa` and `master` were
fast-forwarded from master base `64e7a43c95` to exact final-ready commit
`70c94a8ce6` and tree `704aba4f903b`. Forty QA-ready handoffs were accumulated.
The observation portfolio was empty at freeze.

Eight complete-gate attempts were started. Four failed and remained recorded;
four passed. Two passing candidates were superseded by later repairs. A third
pass proved the final tree but was bound to the closure task and intermediate
base, so it remained valid terminal proof without being valid promotion evidence.
The promotion-bound final run passed all 884 tasks across every runnable pack,
properties, generated acceptance, browser observations, and package creation in
22 minutes 35.358 seconds. Its durable evidence digest is
`89e730ab85bb71793fa49a6584ff9077ff8325d282588fa229e8ff3b9939f9d8`.

The current release lineage closed 29 incident records through nine corrective
commits or checkpoint adjustments; 19 audited off-lineage records were retired as
nonblocking. Promotion authorization to the master fast-forward took 4 hours
23 minutes 2 seconds. The final gate amortized to 33.9 seconds per accumulated
task. The baseline model reports 11 hours 30 minutes 57 seconds of gross terminal
time avoided relative to forty independent promotions, but this is not claimed as
measured net saving because the four partial failed runs lack reliable completion
timestamps.

The settled recommendation is **adjust**: retain the exact final all-runnable-pack
gate and priority-driven natural-lull promotion timing; improve pre-promotion
checks for branding expectations, generated-test ownership, Flow geometry,
incident-ledger consistency, and exact promotion task/base evidence binding. The
user explicitly rejected an artificial batch-size limit on 2026-08-21. Future
scorecards may use task count to explain amortization and waiting time, but must
not convert it into a release trigger or target.

### Flow schema-editor scrolling QA measurement

Approved task `flow-instance-schema-editor-scrolling` was first dispatched at
11:22:53Z on 2026-08-18. Read-only intent paused product coding, the independently
reviewed route-layout slice reached QA, and the product was reissued from exact QA
at 13:40:43Z. The resumed role intervals were 1 hour 35 minutes 37 seconds from
coder claim to review handoff, 29 minutes 7 seconds in refactorer review, and
15 minutes 8 seconds from architect claim to `qa-ready`. Product reissue to
`qa-ready` was 2 hours 20 minutes 18 seconds; initial approved dispatch through
`qa-ready`, including ownership preparation, was 4 hours 38 minutes 8 seconds.

Coder review evidence ran 147 focused tasks in 8 minutes 31 seconds. Because the
architect refreshed the changed Flow handler mutation manifest, the final tree
received a fresh 147-task proof in 8 minutes 33 seconds, with `flow_graph`,
`layered_schema`, and `shell`, properties, installed scenario-047 browser
evidence, acceptance sessions, and 886-millisecond package proof. No complete
all-20 run occurred, and no pass was represented as master-ready or final
regression proof.

The bounded repairs kept the scrolling assertion in Shell stylesheet ownership,
made the tall Flow evidence fixture compatible with existing example-completeness
contracts, and declared and conserved all eight runtime-047 evidence leaves.
There is no unresolved product failure. Recommendation: **adjust** the next
similar Flow slice by declaring its evidence-leaf partition and tall-fixture
compatibility before the first evidence run, while retaining the focused QA
pilot and exact ownership slice. Do not activate another broad verification
program from this timing variance.

### Guided Excel template authoring QA measurement

Approved task `guided-excel-template-authoring` was first dispatched at
21:16:40Z on 2026-08-18. Product work paused for the independently reviewed
eligible-repair admission prerequisite and resumed from exact QA scorecard
`4be970ec` at 06:03:13Z on 2026-08-19. The resumed product reached `qa-ready` in
2 hours 31 minutes 15 seconds and QA in 2 hours 33 minutes 41 seconds. Initial
dispatch through QA, including the prerequisite, was 11 hours 20 minutes 14
seconds.

Six successful focused checkpoints consumed about 29 minutes 45 seconds. The
settled final three-pack plan selected `flow_export`, `project_management`, and
`shell` with 135 tasks, properties, installed browser evidence, and package
proof. Two earlier `flow_export` acceptance failures received deterministic
repairs and atomic eligible-repair evidence; their exact dispositions remain
`terminal-verification-deferred`. Five passing focused trees were superseded by
later reviewed changes. No all-20 run occurred and no evidence was represented
as final regression or master-ready proof.

Recommendation: **adjust** the next similar authoring slice by settling its
acceptance example relations, installed evidence-key inventory, extracted-source
ownership, and layout properties before the first evidence run. Retain the
focused pilot and automatic eligible-repair route; do not activate a broad new
verification program from this local evidence-ordering variance.

## VTD-018 disposition

VTD-018 remains a stopped, unintegrated experiment. Candidate `c7ad4698f9` and its
descendants are not part of `qa`, the pilot baseline, or a release candidate.
Resuming that implementation requires a separate explicit user decision.
