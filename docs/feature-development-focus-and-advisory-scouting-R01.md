# Feature development focus and advisory scouting R01

Status: approved convention refined by QA verification ownership readiness;
routine RepoWise scouting stopped after Trial 4

Prepared: 2026-08-14

## Purpose

Make the first development loop cheap without turning verification tuning into a
new program. A feature begins with only the checks that directly observe the
behavior under construction, expands once to its bounded presumed impact for QA
sign-off, and leaves the complete 20-pack checkpoint to explicit master
integration.

Development focus and QA impact remain documentation. The later user-approved
ownership-readiness program adds a canonical read-only intent and exact plan-only
gate for shared integration surfaces; it does not make RepoWise or another
advisory tool controlling. Existing evidence binding, package proof, incident
handling, and master-integration authority remain controlling.

## Two declared verification scopes

Each new implementation handoff records two short lists:

- **Development focus** names the smallest leaves that directly observe the
  behavior being changed. One to three unit, acceptance, or browser targets is
  the normal starting point. The coder uses these during red/green iteration and
  does not repeatedly run the whole presumed-impact set.
- **QA impact** names the bounded packs and consumers reasonably expected to be
  affected by the settled candidate. It includes the direct behavior and known
  integration surfaces. It is run or verified once for review-ready/QA-ready
  evidence after the candidate has settled, subject to the repository's exact
  changed-path planner.

The specification also records likely existing shared integration paths and
likely new ownership prefixes. They are evaluated under
`docs/qa-verification-ownership-readiness-R01.md` before product coding; they are
not a third test list and cannot override canonical ownership.

The development focus expands during implementation only when a direct check
fails causally, a changed dependency or public surface adds an observable
consumer, or review finds a concrete missing boundary. Elapsed time alone does
not expand verification or halt work. A time expectation triggers a brief
variance report and process analysis while bounded work continues.

The QA-impact list is an informed forecast, not permission to hide planner-owned
coverage. If exact changed paths select a wider but still bounded consumer set,
the evidence follows that set without waiting for another user decision. An
underdeclared evidence invocation may stop before launching tasks, but that is a
cheap correction signal: rerun once with every pack named by the canonical plan
and record the forecast variance. It is not an implementation blocker or
authority conflict. If exact planning selects all 20 packs,
ownership-readiness classification decides whether the feature is bounded,
needs a standing-authorized preparation stage, or requires user direction. No
feature role runs the all-20 checkpoint merely to gain confidence.

The same rule applies to task scope inside selected packs. A wider exact task
plan than forecast is recorded and proceeds; it is not a new product scope or a
reason to request another verification specification. When actual work proves a
stable materially narrower task boundary, follow
`docs/qa-verification-granularity-ratchet-R01.md`. That standing campsite ratchet
adds a subordinate slice through an independent QA-integrated preparation stage.
If a safe slice is not yet provable, use the conservative parent-pack closure and
defer refinement instead of blocking the feature.

## Coverage ratchet

When a feature reaches an area whose direct checks or presumed consumers are not
documented well enough to choose these lists, the specifier records the mapping
as part of that feature's specification. This ratchets knowledge up when the
area is touched; it does not require repository-wide classification in advance.

The original implementation deliberately stopped at this reusable documentation
shape. Later Project Library, visual-portability, and Documentation-template
fan-out incidents demonstrated the repeated late ownership error required by its
ratchet. The user approved the bounded executable correction in
`docs/qa-verification-ownership-readiness-R01.md` on 2026-08-17. That program is
limited to canonical ownership readiness; it does not reactivate routine
RepoWise scouting or authorize unrelated verification optimization.

The later user-approved granularity ratchet makes this coverage ratchet
executable within packs. It refines only a boundary encountered by actual work,
keeps the 20 top-level packs stable, and preserves each exact-pack and terminal
task closure.

## Advisory RepoWise scouting pilot

The first three trials used RepoWise through the specifier after likely source
files were identified and before the implementation handoff was finalized. The
user approved moving Trial 4 to the coder because an actual candidate diff may
provide stronger changed-file signal than speculative pre-implementation paths.
Tool or local-index unavailability is reported but does not block the feature.
Scouting is advisory and telemetry stays disabled. Run the index update only
when status shows that the index is behind current `HEAD`; an already-current
index needs no refresh:

```sh
DO_NOT_TRACK=1 tmp/repowise-venv/bin/repowise status . \
  --no-workspace --format json
# Only when the preceding status is behind current HEAD:
DO_NOT_TRACK=1 tmp/repowise-venv/bin/repowise update . \
  --index-only --no-workspace --no-agents
DO_NOT_TRACK=1 tmp/repowise-venv/bin/repowise risk \
  --target <likely-path> --changed-file <likely-path> \
  --format json --full
DO_NOT_TRACK=1 tmp/repowise-venv/bin/repowise context <likely-path> \
  --include callers \
  --include callees --include metrics --include health --path . \
  --no-workspace --format json --full
```

The handoff's **Scouting considerations** note may identify likely source
companions, direct tests or browser targets, registry/integration surfaces, and
the dependency, caller, co-change, or risk signal behind each. The specifier
rejects obvious false positives cheaply. RepoWise output cannot block a handoff,
widen QA by itself, override the verification registry, create an all-20 run, or
require local indexes and virtual environments to become tracked assets.

Record for each pilot feature whether scouting found a relevant file or check
that ordinary inspection missed, produced material false positives, changed the
development-focus or QA-impact lists, and cost enough time to matter. After
three to five varied features, continue only if it improves scoping cheaply. A
thin local wrapper is a later option only if repeated command friction is
observed; it is not part of this documentation-only activation.

The initial Flow scout is the baseline, not proof of general usefulness. For
`src/data-layer-flow-graph-ui.ts` it surfaced the direct model and shell
integration files, the focused Flow unit and browser checks,
`verification/packs.json`, and downstream Live Flow and documentation consumers.
It also produced hotspot and historical co-change signals that warranted
inspection but did not independently authorize wider QA. Later pilot entries
compare their useful and false-positive results with that baseline.

### Trial 1 — Flow Section pointer continuity

The first post-activation feature settled on QA at `79e4aeb053`. Plain
target-risk and context scouting confirmed
`src/flow-graph/workspace-section-ui.ts`, its workspace caller, the direct unit
test, and installed Flow runtime support, but ordinary inspection had already
found the relevant development focus and QA impact. Scouting therefore changed
neither list. The read-only queries took about four seconds; the unnecessary
index update also created untracked VS Code integration files that were removed.

The plain target-risk result incorrectly reported a test gap and included
irrelevant historical co-change suggestions. A post-settlement comparison showed
that adding `--changed-file` would have produced the more useful PR-mode blast
radius: it elevated the direct unit and runtime companions and the property test
that the implementation later changed. It still did not identify the Flow
evidence reporter or the exact `verification/packs.json` registration work.
RepoWise exposes that registry only as an unsymbolized JSON file, so direct
registry inspection and the canonical changed-path planner remain mandatory.

Trial 2 therefore uses the conditional update and PR-mode risk command above.
Per-test coverage ingestion remains optional only when a suitable report already
exists; this pilot does not create a coverage-generation program. Record whether
the revised command discovers a relevant file or check before ordinary
inspection, reduces false positives, or changes either declared verification
scope.

### Trial 3 — Flow contextual action consistency

The third trial used PR-mode target and changed-file risk for
`src/data-layer-flow-graph-ui.ts`, `src/flow-graph/workspace-ui.ts`, and
`src/flow-graph/workspace-section-ui.ts`, followed by caller, callee, metric, and
health context for the workspace owner. It surfaced the direct Flow browser
pack, workspace unit, and installed runtime companions and reinforced a small
shared menu-lifecycle boundary because all three production files are active
hotspots. Ordinary source and registry inspection had already found those
companions and the exact four-pack, 51-task QA forecast, so scouting changed
neither development focus nor QA impact.

The PR directive also listed unrelated downstream semantic consumers, reported
no runnable tests while separately identifying the direct tests as co-change
partners, and continued to claim that the index was at `980c8b81` after the
conditional update processed through `39660e0a`. The update again created
untracked `.vscode` integration files, which were removed. Status, update, risk,
context, and cleanup cost roughly 35 seconds. After three Flow-heavy trials the
signal is useful but not yet varied enough for a final keep-or-stop decision:
continue with the coder-timed Trial 4 below and stop the routine pilot if that
trial again changes neither implementation focus nor QA scope. RepoWise remains
optional advisory input in the meantime; direct inspection and canonical
planning remain authoritative.

### Trial 4 — coder-timed actual-diff scouting

Trial 4 applies to the next user-approved ordinary QA feature after Flow
contextual action consistency. The specifier performs ordinary inspection,
records the provisional development focus and QA impact before handoff, and
does not run a second speculative RepoWise scan. If the selected feature is
another Flow feature, run the trial as directed but report that the fourth
sample still does not establish usefulness outside the already indexed Flow
area.

After the coder has a coherent committed candidate whose direct checks are
green, and before any `--prepare-evidence` run, the coder performs one RepoWise
checkpoint. Status and a conditional index update use the telemetry-disabled
commands above. Risk uses one representative actual production path as
`--target` and repeats `--changed-file` for every actual changed production
path. Context is limited to the most central changed production path and
includes callers, callees, metrics, and health. A second checkpoint is allowed
only when the first result causes a material implementation change that adds a
new production boundary. The checkpoint has a two-minute wall-time ceiling; at
the ceiling the coder stops further RepoWise work and records the partial result.
RepoWise unavailability, an update failure, or stale metadata never blocks
coding, evidence, or handoff.

Before the checkpoint, preserve the candidate's clean-status observation. After
the checkpoint, inspect status and remove only tool-generated workspace files
that were absent before it; never overwrite or delete an existing user file.
RepoWise findings are leads for direct inspection. They cannot add packs by
themselves, override the canonical changed-path plan, create an all-20 run, or
require a repair without a concrete product or verification consequence.

The coder sends one non-blocking file-based note to the specifier when the
checkpoint finishes, then continues the ordinary coder-to-refactorer Git
handoff without waiting for acknowledgement. The note records:

- the actual changed production paths and representative target;
- a relevant untouched file or check discovered before ordinary candidate
  review, or `none`;
- material false positives, stale-index behavior, and generated workspace
  artifacts;
- whether the result changed implementation, development focus, or QA impact;
- RepoWise wall time, cleanup time, and any resulting implementation or
  verification rerun time; and
- the coder's concise judgment: improved, neutral, or impeded development.

At QA integration the specifier includes those results in the delivery
scorecard, compares them with the pre-coder baseline and canonical final plan,
and recommends one of: retain an optional coder checkpoint, retain RepoWise only
for unfamiliar or hotspot investigation, or stop routine RepoWise use. Missing
feedback is a measurement defect to report, not authority to block an otherwise
exact `qa-ready` candidate.

#### Trial 4 outcome and current decision

Flow concept visuals completed Trial 4 on 2026-08-15. Its first actual-diff
checkpoint cost about 29 seconds, repeated files and consumers already found by
ordinary inspection, made unsupported test-gap claims, continued to report the
stale indexed commit `39660e0a68`, and changed no implementation, development
focus, or QA impact. Its judgment was neutral.

A later checkpoint ran after refactor-driven repairs added another production
boundary. Because the first RepoWise result caused no implementation change,
that rerun was outside the allowed second-checkpoint condition above. Its index
refresh consumed about 110 seconds, remained stale, reached neither risk nor
context analysis, created no Git-visible artifact, and changed no implementation
or verification decision. Its judgment was impeded.

The user accepted the scorecard recommendation to stop routine RepoWise
checkpoints for now. Do not add RepoWise to ordinary feature handoffs or make its
availability, index refresh, or output a delivery condition. It remains
available only for an intentionally selected unfamiliar-code or known-hotspot
investigation when the existing index is already current. Direct inspection and
the canonical changed-path planner remain authoritative. Reconsider routine use
only after a separate decision backed by materially better signal or lower
operational cost.

## Evaluation

Use existing handoff, Git, receipt, and evidence timestamps. For each applicable
feature report the estimate, time to first handoff, repair/review time, final
focused-evidence time, selected packs, full-gate count, and the specific cause of
material variance. The objective is expectation-versus-actual visibility and a
pause for analysis, not an automatic intervention gate.

For Trial 4, also report the pre-coder development-focus and QA-impact baseline,
the actual candidate paths, RepoWise discoveries and false positives, changes
caused by the checkpoint, its wall and cleanup time, any avoided or added rerun,
and the coder's improved/neutral/impeded judgment. Separate a useful new finding
from confirmation of a file or check already identified by ordinary work.

Reassess this convention after three ordinary feature cycles. Prefer retaining
the cheap generalized convention when it shortens iteration without missing
bounded QA impact. Adjust the documentation when a recurring miss is found. Do
not open another verification-optimization program from a single slow or
unfortunate feature.
