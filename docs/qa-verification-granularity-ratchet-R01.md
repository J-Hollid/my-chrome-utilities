# QA verification granularity ratchet R01

Status: the initial ratchet, first-use mapping repair, and durable-runtime
staging repair are QA-integrated at `066ea284de`, `8d3cf5012c`, and
`06222ff00f`; the Documentation-template product resumes automatically from the
staging-repair scorecard descendant

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

### Approved durable-runtime staging disposition repair

Independent product review required project asset-body bytes and their matching
Draft metadata to commit atomically. Stopped coherent product candidate
`d139725a1a`, based on exact QA `1f68d463d7`, implements that requirement by
adding staging directly to `src/data-layer-durable-project-runtime.ts` and
`src/durable-project/runtime-core.ts`. Exact readiness correctly returns
`granularity-assessment-required`: those two broad controller paths add the
otherwise unrelated `flow_graph`, `live_flow_testing`, `layered_schema`, and
`property_set_flow_sections` families to a 13-pack/617-task product catalogue.
No task from that catalogue has been launched. Candidate `d139725a1a` remains a
patch reference only.

This is the intended campsite trigger, not a new product decision. Derived task
`verification-slice-documentation-templates` starts from current QA
`1f68d463d7` and establishes the durable prerequisite independently. It must not
merge or cherry-pick the stopped product commit, implement a Template Library or
renderer, or use a same-candidate slice to narrow its own preparation evidence.

The repair must establish all of the following:

1. **Reusable staging seam.** Prefer one independently owned project asset-body
   staging component under the durable-project boundary. The generic runtime may
   expose that component, but the storage keying, pending-body lifecycle, and
   command attachment must live outside the broad runtime controller wherever a
   truthful extraction is possible. The seam is reusable by any project-owned
   binary body; it contains no Excel, Documentation-kind, template-assignment,
   or workspace UI policy.
2. **Atomic command semantics.** A staged body is copied, project- and namespace-
   scoped, and attached only to the matching project Draft command. Matching
   metadata and bytes commit in the repository's one read-write transaction.
   Success clears only committed bodies. Validation failure, transaction abort,
   quota failure, or conflict leaves the exact unsaved command and bodies
   available for the existing retry or conflict-resolution path. Explicit
   rejection or caller discard removes its pending bodies. No successful state
   can contain metadata for a missing body, and no failed upload can leave a new
   durable orphan.
3. **Exact ownership and consumers.** A future seam change is owned by
   `durable_project_repository` and directly observed by the durable runtime
   unit/property contract. Its exact product consumer is `flow_export` through
   the existing `documentation_template_workspace` slice, which continues to
   reach the declared Shell workspace consumer. The slice declaration names the
   exact new source path, tasks, prerequisites, observable boundary, and
   consumers. It does not narrow arbitrary changes to either broad runtime file.
4. **Durable path disposition.** Add one task-scoped disposition for each of
   `src/data-layer-durable-project-runtime.ts` and
   `src/durable-project/runtime-core.ts`. When the reusable extraction is
   proved, each is an integrated-seam disposition whose replacement is the new
   staging seam and the staging capability is already present on QA before the
   product resumes. If complete extraction or exact consumer proof fails within
   the effort boundary, record an explicit reviewed parent fallback for that
   path instead. Either result is final for this product lineage and prevents
   the same assessment from looping again.
5. **Conservative preparation proof.** The preparation's own exact current/base
   plan remains authoritative for changes to the two broad runtime files; the
   newly declared slice cannot narrow that same evidence range. Prove unchanged
   generic save ordering, route hydration, projection notifications, retries,
   rejection, reapply/merge, Undo/Redo, schema saves, visual assets, archive
   compatibility, exact-pack task closures, terminal-full obligations,
   quarantine behavior, and package contents. The preparation may run its
   bounded canonical plan with properties and package proof, but never the
   all-20 gate.
6. **Clean product resumption.** After architect `qa-ready` integration, reissue
   stable task `documentation-templates` from that exact QA head without another
   user decision. Reconstruct `d139725a1a` as task-owned patches only. The
   resumed product must use the integrated staging seam and leave both broad
   runtime files unchanged, unless their recorded decision is the explicit
   parent fallback. It then runs a fresh exact preflight. The earlier exact
   10-pack boundary is the conservation target, not a hard-coded pack-count
   waiver; the measured canonical plan remains authoritative.

**Development focus:** extract and directly test the generic staged-body
lifecycle; connect it to the existing durable Draft transaction; add the exact
slice, two durable dispositions, current/base conservation fixtures, and the
automatic resumption regression. Begin with the runtime unit and property tests,
the ownership-readiness test, and the verification process-contract test.

**QA impact:** forecast `durable_project_repository`, `flow_export`, their
declared `shell` consumer, and package proof. Read-only intent and exact
candidate preflight determine the preparation's complete conservative plan; a
bounded wider result proceeds and is recorded, while an all-20 result, missing
ownership, weakened evidence, or changed persistence meaning stops. Do not run
the stopped product's 13-pack/617-task catalogue as preparation evidence.

The preparation implementation-and-review effort ceiling is four hours from
coder receipt to architect `qa-ready`. At two hours report the chosen seam or
fallback per path, atomic failure/retry status, exact preparation packs and
tasks, conservation status, failures, remaining work, confidence, and forecast.
Continue while the approved behavior is unchanged and a bounded safe completion
path remains.

### Settled durable-runtime staging repair result

Specification `397cdd27de` was handed to the coder at 18:34:55Z on 2026-08-17
and received four seconds later. Final candidate `06222ff00f` reached the
refactorer at 20:02:50Z, the architect at 20:06:33Z, and the specifier at
20:11:50Z; QA fast-forward followed at about 20:13Z. Handoff-to-QA time was about
1 hour 39 minutes, inside the four-hour ceiling and before the two-hour status
checkpoint.

The preparation extracts `src/durable-project/project-asset-body-staging.ts` as
the reusable seam. It records `integrated-seam` dispositions for both
`src/data-layer-durable-project-runtime.ts` and
`src/durable-project/runtime-core.ts`. A seam-only change selects exactly
`durable_project_repository`, its `flow_export` Documentation consumer, and the
existing `shell` consumer. The preparation's own current/base evidence remained
conservative at eight packs and 217 tasks because it changed the broad runtime
and repository paths; it did not use its new slice to narrow the same range.

Independent review found two substantive atomicity defects. Initial candidate
`ebf5fe6033` allowed an already queued unrelated Draft to claim a body staged
later and did not bind selective conflict resolution to the originating
operation. Candidate `7faf9fea61` added operation identity and queue ownership,
but could still retain nonconflicting metadata while discarding its body during
a mixed selective merge. Final candidate `06222ff00f` makes a body-bearing Draft
operation all-or-nothing when conflict selection would drop any of its patches.
It also proves retry, reapply, reviewed rejection, queued ordering, project
isolation, generation safety, transaction rollback after body writes begin, and
the two retained/rejected merge outcomes.

Three complete eight-pack checkpoints passed all 217 tasks with properties and
package proof in about 11 minutes 55 seconds, 11 minutes 51 seconds, and 11
minutes 52 seconds. The first two passing trees were superseded by the review
repairs above. Architect exact-tree refresh reused the final conserved artifacts
in about seven seconds. There was no failed verification run and no all-20
attempt. Exact-pack task closures, existing terminal-full obligations,
quarantine behavior, generic save and route behavior, visual bodies, Undo/Redo,
schema saves, and archive compatibility remain conserved.

Recommendation: automatically reissue stable task `documentation-templates`
from this scorecard's exact QA commit and reconstruct stopped candidate
`d139725a1a` as task-owned patches only. The product must use the integrated
staging capability and leave both broad runtime files unchanged. Its fresh exact
preflight is authoritative; the earlier 10-pack result is a conservation target,
not a numeric waiver.

## Continuous stacked-ratchet correction

Documentation Templates ultimately reached QA at `a785a83b50`, but its repeated
manual reconstruction and incident-routing cycles showed that automatic
resumption was only an instruction, not a durable mechanism. User approval on
2026-08-17 therefore strengthens the standing campsite rule for future work.

Assessment remains mandatory and evaluates the union of all newly encountered
coarse paths from one settled candidate. Every path must end in a reviewed seam
or slice, or an evidence-backed cannot-safely-split parent fallback. Imperfect
verification structure, forecast variance, elapsed time, pack count, or
different terminology cannot bypass or restart the assessment.

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

## Active Flow schema-editor route disposition preparation

Read-only intent for approved product task
`flow-instance-schema-editor-scrolling` started from QA `28e7b2dded` and stopped
before product coding with `granularity-assessment-required`. The causal path is
`src/data-layer-layered-schema-ui.ts`, whose propagating
`layered_schema_composition` boundary selects the otherwise unrelated
`flow_export`, `live_flow_testing`, and `property_set_flow_sections` task
families. The complete conservative intent plan is `flow_graph`,
`layered_schema`, `flow_export`, `live_flow_testing`,
`property_set_flow_sections`, and `shell`, comprising 156 tasks. No coherent
product candidate or product patch reference exists.

Standing authority therefore activates independent task
`verification-slice-flow-instance-schema-editor-scrolling` from exact QA
`28e7b2dded`. It establishes verification ownership only and must not implement
directional Flow scenario 047, change schema composition, or make the editor
scrollable. The preparation must establish all of the following:

1. **Route-layout seam.** Prefer a behavior-preserving extraction at
   `src/layered-schema/flow-editor-route-layout.ts` for the Flow-launched
   editor-host presentation lifecycle: opening the Page-instance or
   Event-occurrence editor, exchanging `#workspace-content` with
   `#layered-schema-editor-host`, closing on ordinary route departure, and
   restoring the recorded Flow context only through Return to Flow. General
   schema compilation, composed-property authoring, persistence, and collection
   editors remain outside this seam.
2. **Conserved behavior.** The extraction preserves scenario 046 for both
   contributor scopes, including stable contributor identity and scope, focus
   return, Flow camera and workspace-scroll restoration, stale-route cleanup,
   and zero project commands on navigation. Existing layered-schema unit and
   property contracts remain unchanged. The currently approved scenario 047
   remains outside the preparation and cannot be claimed satisfied or weakened
   to make preparation evidence pass.
3. **Exact slice and consumer.** Register subordinate slice
   `layered_schema_flow_editor_route` under parent pack `layered_schema` with
   the exact extracted source path, direct
   `unit:test/data-layer-layered-schema-test.mjs` observation,
   `property:test/data-layer-layered-schema-property-test.mjs` prerequisite,
   and `flow_graph` as the installed consumer. Its observable boundary is the
   Flow-launched layered-schema route presentation and active editor-host
   lifecycle. `layered-schema.css` retains its existing shell-to-
   `layered_schema` bridge, and
   `src/flow-graph/flow-workspace-shell.css` retains its existing
   `flow_graph`-to-shell bridge.
4. **Durable disposition.** Record one task-scoped disposition for
   `src/data-layer-layered-schema-ui.ts`. If the extraction is proved, record
   `integrated-seam` with the new route-layout path as its replacement and make
   the resumed product consume that seam without changing the broad file. If
   route presentation cannot be separated without retaining general schema
   composition behavior, record an evidence-backed `parent-fallback` and keep
   the complete conservative owner/consumer closure. Either reviewed result is
   final for this product lineage and prevents the same assessment loop.
5. **Conservative preparation proof.** The preparation cannot use its new slice
   to narrow its own current/base evidence range. Begin with the six-pack,
   156-task conservative forecast above, then use exact changed-path preflight
   as authoritative. Prove unchanged parent-pack task closure, prerequisites,
   consumers, route-lifecycle behavior, CSS bridge ownership, terminal
   obligations, quarantine behavior, and package contents. Run properties and
   package proof, but never the all-20 gate.
6. **Clean product resumption.** After architect `qa-ready` integration, record
   the reviewed quarantine repair if applicable and reissue stable task
   `flow-instance-schema-editor-scrolling` from that exact QA head without
   another user decision. The resumed product runs fresh read-only intent and
   exact candidate preflight, consumes the integrated route seam or its explicit
   parent fallback, and remains bound to scenario 047.

The preparation implementation-and-review effort ceiling is 120 minutes from
coder receipt to architect `qa-ready`. At 60 minutes report the extraction or
fallback decision, exact slice tasks and consumer, scenario-046 conservation,
current exact packs and tasks, disposition status, failures, remaining work,
confidence, and forecast. Continue while product behavior is unchanged and a
bounded safe completion path remains. Stop for user direction only if coverage
would weaken, ownership becomes unavailable, the preparation becomes genuinely
global, or the seam would change product requirements.
