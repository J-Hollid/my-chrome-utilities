# Feature-development throughput course adjustment R01

Status: approved by the user and committed at `2b093eec4f`; bounded VTD-017 is
integrated at `723ebf6eb5`; bounded VTD-018 was approved on 2026-08-12 and its
settled scorecard is required before another enabling slice

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

The workspace-tabs final checkpoint exposed a more immediate limitation. Although
the browser-observation scheduler reported two workers, several second workers
waited for an exclusive `dist` artifact lock while the first browser task ran. The
largest wait was 195.4 seconds inside a 231.9-second task. The nominal two-worker
setting therefore did not provide two-way execution for that part of the stage.
VTD-017 subsequently separated exclusive build or promotion writes from safe
read-only use of one validated immutable artifact. It retained two workers because
three did not receive qualifying normal-and-loaded evidence.

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

### Workspace-tabs transition scorecard

The installed workspace-tabs controller is technical debt, so it adds zero to the
completed-feature count. It is recorded as the transition baseline for judging the
new course.

- The specification was approved and committed at 16:29:47. The implementation
  integrated at 17:58:50: 89 minutes 3 seconds later.
- The elapsed role intervals were 27 minutes 18 seconds to the coder candidate,
  33 minutes 10 seconds through refactoring, 10 minutes 22 seconds through
  architecture review, and 18 minutes 13 seconds for handoff review and
  integration. These intervals include the work and checks performed by each
  role; automatic finer-grained activity timing is not installed yet.
- This handoff straddled approval of the new course. Its settled all-20 checkpoint
  therefore finished after the merge, at 18:25:26. Approval to safety completion
  was 1 hour 55 minutes 39 seconds. Future slices must finish this checkpoint
  before integration.
- The coder ran all 20 packs and 838 tasks successfully in 21 minutes 21 seconds.
  The refactorer then changed production code and the architect changed test code,
  so that successful full result was no longer final-tree proof. Their focused
  Shell checks took 4 minutes 14 seconds and 4 minutes 18 seconds respectively.
- The settled tree then ran all 20 packs and 838 tasks successfully in 21 minutes
  42 seconds, including the package check. Durable evidence is recorded against
  `7868ac99de` and every task passed.
- No completed checkpoint failed in the final lineage, no failure was hidden by a
  retry, and no repair-triggered all-20 rerun occurred. Review still had to correct
  verification inventory accounting and replace brittle source-text checks, which
  is maintenance cost rather than product value.

The immediate VTD-015 opportunity is concrete: the coder's 21-minute successful
full run was invalidated by expected later review changes. Moving the one required
full run to the settled tree should avoid that pass on a comparable slice without
dropping the final safety gate. This saving remains provisional until the next
approved slice records its own before-and-after role lineage. The user approved
bounded VTD-017 as that live payback candidate on 2026-08-11.

## Order by direct value and enabling value

A slice has enabling value when completing it makes several later slices cheaper
or faster. This matters because saving ten minutes from every later VTD gate can be
worth more than saving ten minutes only from one feature type.

| Slice | Later work it should speed up | Why it belongs where it does |
|---|---|---|
| VTD-015 | Every later VTD slice and feature | Prevents review roles from repeatedly invalidating successful full runs |
| VTD-017 | VTD-018, later VTD slices, multi-observation focused work, and feature final gates | Removes measured artifact-lock serialization before conditionally adding one useful browser worker |
| VTD-018 | Later broad and feature-heavy focused plans plus every final gate | Replaces repeated whole-receipt rewrites with small durable incremental records |
| VTD-012 first slice | Later verification maintenance and product work | Splits the large process contract only after broader measured gate costs are reduced |
| VTD-016 | Later Shell features and any future VTD-008 controller slice | Narrows Shell-focused work, but does little for non-Shell VTD slices |
| VTD-014 audit | Later work only if measurement finds duplicated enforcement | Its possible payoff is broad, but currently less certain than the measured bottlenecks above |

VTD-017 then proved at least a 3-minute-43-second final-gate saving with two
workers. Its scorecard leaves receipt recording as the strongest measured next
bottleneck, while standalone VTD-011 still has negligible immediate value. The
user approved the exact bounded VTD-018 contract on 2026-08-12.

## Ranked course-adjusted work

| Order | Work | Expected value | Expected effort | Main trade-off |
|---:|---|---|---|---|
| 1 | VTD-015: put the full gate after review settles the tree | Very high, broad enablement | Medium | Full-suite-only defects appear later, but still before integration |
| 2 | VTD-017: share one validated artifact across bounded browser workers | Very high, broad enablement | Small–medium | Three workers remain conditional on loaded stability |
| 3 | VTD-018: record verification results incrementally | High, broad enablement | Medium | Crash recovery and exact evidence binding must remain intact |
| 4 | VTD-012: split the long process contract when still material | Medium, broad enablement | Medium | Its immediate saving is smaller than the two measured global waits |
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
| VTD-017 | Browser-stage and complete-gate time at each tested worker bound, separated into normal and loaded environments | Failure pattern, timeout and cleanup incidents, resource contention, and unchanged terminal evidence |
| VTD-018 | Per-stage bookkeeping time, receipt bytes rewritten, and complete-gate time | Every completed task remains crash-recoverable and final evidence binds the same identities |
| VTD-012 | Focused verification-process time and complete unit-stage time before and after separation | Infrastructure changes retain their complete process contracts and the final gate retains every leaf |
| VTD-016 | Focused Shell-product loop time and the later feature's approval-to-integration time | Shared Shell changes remain broad and the all-20 result retains every leaf |
| VTD-014 audit | Measured process overhead removed and diagnosis or repair time changed | Before-and-after bad-candidate examples remain rejected |

Task count is shown only to explain a timing change. The decision is weighted by
elapsed development time, implementation effort, failures and repairs, confidence
in the samples, and preserved regression protection.

### 1. VTD-015 — Review first, run the full gate on the settled tree

Status: integrated at `bdd29f8c87`; implementation authority and outcome
scorecard are in `docs/vtd015-settled-final-verification-workflow-R01.md`

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

### 2. VTD-017 — Share one validated artifact across bounded browser workers

Expected value: very high

Expected effort: small–medium

Use one coordinator-owned artifact lease in focused and final verification so the
coordinator's independent read-only browser children do not take mutually
exclusive locks. Keep outside build and package writers blocked. Establish useful
overlap with the existing two workers before considering a third.

The detailed receipt shows 609.849 seconds in the browser-observation stage and
566.480 seconds of accumulated lock wait. The same observed work models at
320.246 seconds with two genuinely free workers. A balanced third worker models
216.078 seconds, but becomes the default only when the exact
`--pack layered_schema` normal plan is at least 60 seconds faster and a loaded
sample introduces no new failure pattern.

Trade-off: a third Chrome process may create resource-driven timeouts. Keep two
workers when the threshold fails. Every task retains private browser and evidence
state, and a failed parallel run remains failed.

### 3. VTD-018 — Record verification results incrementally

Expected value: high

Expected effort: medium

The detailed run spent about 3 minutes 50 seconds around parse and generation
although their parallel test work took about 8.5 seconds. Store each completed
result once in a small durable record and assemble the complete receipt at the
final boundary instead of rewriting growing receipt and checkpoint documents
after every cheap task.

Trade-off: crash recovery, task identity, failure records, and exact final
evidence must remain unchanged. The approved bounded behavior, target, and stop
conditions are in `docs/vtd018-incremental-verification-receipts-R01.md`.

### 4. VTD-012 — Split the long verification-process contract when still material

Expected value: medium after the broader waits are removed

Expected effort: medium

Split the approximately three-minute verification-process unit by responsibility
so independent parts can use the existing unit workers and focused infrastructure
changes can select their own contracts. Product/process ownership separation is a
secondary later benefit, not the reason to place this work before VTD-017.

Trade-off: the split can save roughly two minutes from the unit stage only if its
parts remain independent without duplicated setup. Reassess it after VTD-017 and
receipt recording reveal the new longest path.

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

With workspace tabs, VTD-015, and VTD-017 now complete:

1. Do not automatically pick another VTD-008 controller.
2. Record VTD-017 as complete with two workers and at least 3 minutes 43 seconds
   saved from its final gate.
3. The user reviewed the VTD-017 scorecard and approved the exact bounded VTD-018
   contract on 2026-08-12. Deliver it before choosing another enabling slice.
4. Follow the new measured longest path. VTD-012 and VTD-016 remain candidates,
   while standalone VTD-011 stays deferred because the current two-worker order
   is already within about six seconds of balanced once lock waiting is removed.
5. Resume product feature delivery when the remaining test-infrastructure cost is
   acceptable to the user, and compare approval-to-integration time with the
   Command Palette and workspace-tabs transition measurements.
6. Continue architecture extraction only where a measured delivery bottleneck
   shows that it is the next limiting factor.

Measure each enabling claim as the sequence proceeds. VTD-017 shortened its own
final gate, but its durable note did not preserve exact coordination wall metrics.
VTD-018 must preserve those metrics, demonstrate the VTD-017 saving on its own
delivery, and remove the measured receipt-writing cost. Later work is
then chosen from the new longest path rather than from the old task order. A
missed payback stops automatic continuation and triggers another bottleneck
review.

After each numbered slice, present its scorecard and recommendation to the user.
Do not approve or hand off the next enabling slice until the user explicitly
chooses to continue or adjust the course.

Every future debt proposal must state expected effort, expected feature-delivery
value, safety trade-off, and the later feature measurement that will confirm or
reject its payoff. If two applicable feature deliveries show no measurable gain,
pause further slices of that approach and reassess.
