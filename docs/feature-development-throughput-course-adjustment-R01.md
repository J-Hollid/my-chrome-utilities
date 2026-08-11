# Feature-development throughput course adjustment R01

Status: approved by the user and committed at `2b093eec4f`; each bounded enabling
slice still requires its own scorecard and explicit approval

Prepared: 2026-08-11

## Decision to make

The technical-debt program exists to shorten the time needed to deliver safe new
features. Finishing debt items, reducing planned task counts, or moving code into
smaller files is useful only when it helps that outcome.

The headline measure therefore changes from verification-task count to completed
feature delivery:

- Count user-approved, externally visible feature slices integrated into
  `master`.
- For every completed feature, measure elapsed time from user approval of its
  specification to accepted integration.
- Show how that elapsed time was divided among product implementation, review and
  refactoring, planned verification, and repair or rerun work.
- Report a rolling group of the last five completed features: feature count,
  typical approval-to-integration time, slowest approval-to-integration time,
  final full-regression runs, and verification repairs.

At each course review, the top line is how many features were integrated since the
previous review and how long each took. A period with no approved feature request
is labelled as no feature demand rather than counted as slow delivery.

A VTD slice is not a completed feature because it deliberately preserves product
behavior. It records an expected payback and is judged against the next applicable
feature deliveries. Task counts, pack counts, lines moved, and modeled time remain
diagnostic clues; none is an outcome claim by itself.

## Safety promise

The course adjustment does not reduce final regression confidence.

1. Development and review use the smallest checks that directly cover the current
   change while the candidate tree is still changing.
2. The final candidate tree runs all 20 packs with properties and the package
   check once before integration.
3. If that final run fails, the failure is recorded. The exact cause is repaired
   and proved with the smallest relevant check. The changed candidate then runs
   all 20 packs again from a fresh valid checkpoint.
4. A passing full result becomes invalid when production, test, build, registry,
   or verification behavior changes afterward. Documentation-only recording does
   not create another product run when the recorded identities remain unchanged.
5. No active behavior check, assertion, browser observation, property test,
   package check, or failure record is deleted or bypassed to make delivery faster.

Parallel execution does not weaken this promise. One coordinator prepares one
canonical all-20 plan and one build candidate, then assigns only independent work
to a bounded number of workers. Every required evidence leaf still runs exactly
once and contributes to one combined result. Work that shares writable state or
has an ordering dependency remains in one lane or runs sequentially.

This preserves the intended flaky-test rule: a failure cannot disappear through a
blind retry. The repair causes a fresh full run because the code changed. The rule
is not permission to run the full suite after every edit or before later roles have
finished changing the candidate.

## Current evidence

### Feature throughput has not yet been proved

The recent VTD work delivered useful infrastructure and refactors, but those are
not new feature deliveries under the new measure. The program has mostly measured
future opportunity rather than actual approval-to-integration improvement on
ordinary features.

The installed Command Palette slice is the clearest warning:

- The approved specification committed at 12:06 and the product implementation
  committed at 12:17.
- Final completion occurred at 15:39.
- Three successful checkpoints each ran all 20 packs and 837 tasks. Failed or
  diagnostic work is additional.
- Four incident-bound verification repairs were required even though the product
  behavior was sound.

The product change was small compared with the time spent settling verification.
The durable repairs may help later work, but their payback has not been measured on
a later feature.

### A smaller task count is not the same as a fast loop

At the current baseline, a workspace-tabs controller change selects only `shell`
and 59 property-enabled tasks. The latest comparable receipt shows that scope still
contains approximately:

- 173 seconds in `test/verification-process-contract-test.mjs`;
- 92 seconds in a combined Schema-view and workspace-panel browser observation;
- 32 seconds in the Shell acceptance session; and
- smaller build, browser, parser, property, and checkpoint work.

Those expensive stages do not all overlap. The resulting focused loop is roughly
five minutes on that measured environment before ordinary diagnosis or editing.
The planned-task reduction is real, but the claimed development benefit would be
misleading without elapsed-time measurement.

### The final full run is dominated by a few checks

In the latest Command Palette checkpoint, the 13 browser-observation tasks
contained 1,187 seconds of aggregate work and ran with two observation workers.
The largest individual tasks were approximately:

- 228 seconds for layered-schema composition and Page Group evidence;
- 205 seconds for layered-schema editor evidence;
- 111 seconds for branding workflow evidence;
- 93 seconds for defect evidence;
- 92 seconds for Shell Schema-view and workspace-panel containment; and
- 87 seconds each for the large Schemas and Live-session batches.

The final full gate should remain broad. Its elapsed time should be reduced by
making these checks do the same work more efficiently, not by dropping behavior.

### Reliable parallel execution is partly installed, but not yet fully used

The runner already executes unit, property, parse, generate, and acceptance-session
work with bounded workers. Browser observations normally use two workers. Chrome
processes receive private profiles and automatically selected debugging ports,
and browser evidence has a task-specific output directory. Ordinary browser
adapters still run sequentially.

This makes measured parallel scheduling a realistic improvement rather than a new
infrastructure program. The safe form is one coordinator distributing independent
work from one deduplicated plan. Starting 20 separate pack runners would rebuild
or contend over shared artifacts, duplicate common checks, and fragment the final
evidence record.

The remaining risk is resource contention. Isolated Chrome processes can still
become unreliable when too many compete for processor time or memory and hit
deadlines. Increase browser concurrency one worker at a time, using focused normal
and loaded stability samples plus one ordinary final gate. Do not add repeated
all-20 rehearsals, silently retry a failed parallel run, or accept a higher worker
count merely because its best run is faster.

### Shared verification files are development bottlenecks

- `test/verification-process-contract-test.mjs` is 8,570 lines, is registered as
  an ordinary Shell unit, and took about 173 seconds in the latest checkpoint.
- `verification/packs.json` is 5,974 lines.
- `scripts/verification-packs.mjs` is 1,527 lines.
- `src/side-panel.ts` remains 6,345 lines compared with 6,536 at the audit
  baseline.

A workspace presentation change therefore pays for verification-process contracts
that cannot observe workspace behavior, while verification maintenance edits a
shared file that selects every pack. This is coupling, not safety.

## Order by direct value and enabling value

A slice has enabling value when completing it makes several later slices cheaper
or faster. This matters because saving ten minutes from every later VTD gate can be
worth more than saving ten minutes only from one feature type.

| Slice | Later work it should speed up | Why it belongs where it does |
|---|---|---|
| VTD-015 | Every later VTD slice and feature | Prevents review roles from repeatedly invalidating successful full runs |
| VTD-012 first slice | VTD-011, VTD-017, VTD-016, later verification maintenance, and product work | Splits the large process contract into smaller responsibilities and removes process-only checks from product loops |
| VTD-011 | VTD-017, VTD-016, VTD-014, and every later terminal gate | Balances the workers already paid for and supplies measured deterministic weights for later parallel scheduling |
| VTD-017 | VTD-016, VTD-014, later VTD slices, and feature final gates | Shortens the complete browser-heavy safety gate without dropping evidence |
| VTD-016 | Later Shell features and any future VTD-008 controller slice | Narrows Shell-focused work, but does little for non-Shell VTD slices |
| VTD-014 audit | Later work only if measurement finds duplicated enforcement | Its possible payoff is broad, but currently less certain than the measured bottlenecks above |

This changes the recommendation: take VTD-011 and VTD-017 before VTD-016. That
lets VTD-016 itself benefit from the faster final gate, and the same improvement
then compounds through every later slice. It adds two debt slices before the first
real-feature payback check, so each must demonstrate elapsed-time value on the
next slice rather than waiting until the end of the sequence.

## Ranked course-adjusted work

| Order | Work | Expected value | Expected effort | Main trade-off |
|---:|---|---|---|---|
| 1 | VTD-015: put the full gate after review settles the tree | Very high, broad enablement | Medium | Full-suite-only defects appear later, but still before integration |
| 2 | VTD-012 first slice: separate product and verification-process checks | High, broad enablement | Medium | Requires careful ownership and historical mapping |
| 3 | VTD-011: balance terminal lanes using measured task weights | High, broad enablement | Medium | Lane speed depends on indivisible long tasks and available runners |
| 4 | VTD-017: add bounded isolated browser parallelism | High, broad enablement | Medium, incremental | More workers save time only while the machine has enough capacity |
| 5 | VTD-016: divide Shell checks by observable behavior | High for Shell work | Medium | Shared Shell changes must remain broad |
| 6 | VTD-014 simplification audit | Potentially high | Medium–high | Removing duplicate enforcement needs strong negative tests |

## User decision gate for every enabling slice

No enabling slice silently activates the next one. Each uses the normal approved
specifier, coder, refactorer, architect, and settled-final-gate process, followed
by a plain-language outcome review for the user.

Before implementation approval, the review states:

- the measured starting point;
- the elapsed-time improvement expected on this slice and later work;
- the estimated effort and main safety trade-off;
- the exact measurement that will count as success; and
- what evidence would cause a stop or course change.

After the slice settles, the review reports:

- actual approval-to-integration time for the VTD slice, divided into product or
  process change, review, planned verification, and repair or rerun work;
- before-and-after elapsed time in the same environment class;
- successful full gates, invalidated full gates, failures, repairs, and reruns;
- confirmation that the terminal evidence and regression protections remain
  complete;
- the observed benefit, remaining uncertainty, and whether the effort was worth
  the result; and
- a recommendation to continue, adjust, or stop, with the trade-off of each
  choice.

The user then explicitly decides whether to approve the next slice. Where an
enabling claim can only be observed on the next applicable slice, label the first
result provisional. The next slice's outcome review must close that payback claim
before any further enabling slice is recommended.

The principal scorecard differs by slice:

| Slice | Primary elapsed-time evidence | Safety and confidence evidence |
|---|---|---|
| VTD-015 | Successful full gates per role lineage and time lost to passes invalidated by later review changes | A repaired failure still forces a fresh settled all-20 run |
| VTD-012 | Focused product-loop time and verification-process diagnosis time before and after separation | Infrastructure changes retain their complete process contracts and the final gate is unchanged |
| VTD-011 | Slowest terminal-lane time, total terminal wall time, and slowest-to-fastest imbalance | Every terminal task remains in exactly one deterministic lane |
| VTD-017 | Browser-stage and complete-gate time at each tested worker bound, separated into normal and loaded environments | Failure pattern, timeout and cleanup incidents, resource contention, and unchanged terminal evidence |
| VTD-016 | Focused Shell-product loop time and the later feature's approval-to-integration time | Shared Shell changes remain broad and the all-20 result retains every leaf |
| VTD-014 audit | Measured process overhead removed and diagnosis or repair time changed | Before-and-after bad-candidate examples remain rejected |

Task count is shown only to explain a timing change. The decision is weighted by
elapsed development time, implementation effort, failures and repairs, confidence
in the samples, and preserved regression protection.

### 1. VTD-015 — Review first, run the full gate on the settled tree

Expected value: very high

Expected effort: medium

Change the role flow so coder, refactorer, and architect can exchange a
review-ready candidate with focused evidence while changes are still expected.
After implementation, refactoring, architecture review, and their focused repairs
settle one tree, run the all-20 checkpoint and package check. A failed final run
still follows the complete repair-and-rerun rule above.

Trade-off: defects that only the full suite can reveal will be found later in the
role chain. No unsafe candidate can integrate because the final tree still needs a
fresh complete pass. The expected gain is avoiding successful full runs that are
immediately invalidated by a later review commit.

Acceptance evidence must show that a replay of the Command Palette role sequence
would request one successful final-tree checkpoint rather than three, while a
failure followed by a repair still requests a fresh all-20 run.

### 2. VTD-012 first slice — Separate product checks from verification-process checks

Expected value: high

Expected effort: medium

Split the verification-process contract by responsibility and register it under a
verification-infrastructure boundary rather than as an ordinary Shell-product
unit. Product changes do not run checks that only validate planning, receipt,
handoff, or reliability machinery. Changes to that machinery run all of their own
contracts. The final all-20 gate still includes the complete verification-process
evidence once.

Trade-off: ownership rules become more explicit and require a safe historical
mapping. This costs implementation effort, but it removes about 173 measured
seconds from the current Shell-product development loop and reduces the chance
that an ordinary feature becomes a verification-tooling repair project.

### 3. VTD-011 — Balance terminal lanes using measured task weights

Expected value: high

Expected effort: medium

Use measured indivisible task durations to rebalance the four terminal lanes. The
current corrected estimates place about 245 seconds in the slowest lane and about
124 seconds in the fastest, so the terminal gate waits on avoidable imbalance.
Keep assignment deterministic and keep every task in exactly one lane.

Trade-off: one very long browser task cannot be divided merely to improve the
numbers, and each isolated terminal runner still needs a safe build. The value is
broad because every later VTD and feature final gate uses these lanes. VTD-017 can
also reuse the accepted weights and deterministic assignment rule instead of
inventing a second scheduling model.

### 4. VTD-017 — Add bounded isolated browser parallelism

Expected value: high

Expected effort: medium and incremental

Use the VTD-011 timing model to balance the workers that already exist. Then audit
the ordinary browser adapters that remain serial and allow two isolated workers
for the adapters proved independent. Trial browser-observation concurrency three
only after the existing two-worker schedule is balanced and focused normal and
loaded evidence shows adequate machine capacity.

Keep one canonical plan, one prepared candidate, one combined result, and the
existing stage and dependency boundaries. Each browser worker must own its Chrome
profile, debugging port, temporary data, evidence directory, and cleanup. A task
without that proof stays serial. Worker assignment must be deterministic from an
accepted timing snapshot so the result is explainable and repeatable.

Trade-off: more isolated processes still compete for processor time and memory.
The measured gain may flatten or reverse at three workers, and overload can create
timeouts. Accept a higher default only when the typical elapsed time improves and
focused loaded samples show no new failure pattern. A parallel failure remains a
real recorded failure; there is no automatic lower-concurrency retry that can turn
it green.

This work follows VTD-011 because adding workers before balancing existing lanes
could add risk without addressing the real waiting path. It precedes VTD-016 so
VTD-016 and every later slice receive its final-gate benefit.

### 5. VTD-016 — Partition Shell product evidence by behavior

Expected value: high for Shell work

Expected effort: medium

Give workspace tabs, general shell presentation, branding, package behavior, and
verification architecture separate focused evidence boundaries. A workspace-tabs
change should run the workspace unit/property evidence, the behavior features that
can observe workspace navigation, and the workspace containment target. It should
not run Schema containment or verification-process behavior merely because both
currently live in `shell`.

Trade-off: the mapping must be proved carefully because Shell behavior is shared.
Shared navigation, accessibility, or platform changes retain every real consumer.
The terminal all-20 plan retains every existing leaf exactly once. This comes
after the broad gate improvements because it mainly accelerates later Shell and
VTD-008 work rather than every VTD slice.

### 6. VTD-014 simplification audit — Keep the failure rule, remove process that has no payoff

Expected value: high if redundant enforcement exists

Expected effort: medium to high

Describe every reliability mechanism in plain terms and map it to one of two
outcomes: it catches a regression, or it avoids repeating already valid work. Keep
failure recording, focused diagnosis, causal repair, repair regression, checkpoint
recovery, and the fresh final all-20 rerun. Consolidate duplicated inventory,
digest, lineage, and fixture checks when one canonical check supplies the same
protection.

Trade-off: simplifying safety machinery carelessly could create false passes. Any
removed or combined check needs a before/after failure example proving that the
same bad candidate is still rejected. Ordinary feature slices may repair a flaky
test, but they may not silently grow new general reliability machinery; a new
general rule requires a separately visible course decision.

## Work-order decision

The installed workspace-tabs slice completed as the last automatic VTD-008
controller slice and integrated at `ad002047a3`. Record its
feature-delivery-style elapsed-time breakdown as a transition measurement. It
remains technical debt and does not increment the completed-feature count.

With it complete:

1. Do not automatically pick another VTD-008 controller.
2. Specify VTD-015 first.
3. Follow with the bounded VTD-012 verification-process separation.
4. Balance terminal lanes through VTD-011 and use its measured scheduling model.
5. If the final gate remains material, take the bounded VTD-017
   isolated-parallelism slice.
6. Partition Shell evidence through VTD-016, now benefiting from the earlier
   workflow and final-gate improvements.
7. Deliver one modest real feature and compare its approval-to-integration result
   with the Command Palette and workspace-tabs transition measurements.
8. Continue architecture extraction only where that real feature proves the
   extraction is the next limiting factor.

Measure the enabling claim as the sequence proceeds. VTD-015 must reduce full
checkpoint count on VTD-012; VTD-012 must make the VTD-011 and VTD-017
verification changes easier to isolate and diagnose; VTD-011 must shorten the
VTD-017 terminal gate; and VTD-017 must shorten the VTD-016 final gate. A missed
payback stops automatic continuation and triggers another bottleneck review.

After each numbered slice, present its scorecard and recommendation to the user.
Do not approve or hand off the next enabling slice until the user explicitly
chooses to continue or adjust the course.

Every future debt proposal must state expected effort, expected feature-delivery
value, safety trade-off, and the later feature measurement that will confirm or
reject its payoff. If two applicable feature deliveries show no measurable gain,
pause further slices of that approach and reassess.
