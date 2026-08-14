# Feature development focus and advisory scouting R01

Status: approved documentation convention; active for the next ordinary QA
feature after Flow relationship port snapping

Prepared: 2026-08-14

## Purpose

Make the first development loop cheap without turning verification tuning into a
new program. A feature begins with only the checks that directly observe the
behavior under construction, expands once to its bounded presumed impact for QA
sign-off, and leaves the complete 20-pack checkpoint to explicit master
integration.

This convention is documentation, not an executable gate. It adds no runner,
registry, receipt type, telemetry subsystem, mandatory pause, or new handoff
state. Existing changed-path planning, evidence binding, package proof, incident
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
authority conflict. If shared verification work unexpectedly selects all 20
packs, the existing feature-mode scope rule applies: restore a product-only
candidate or seek separate authority for infrastructure work. No feature role
runs the all-20 checkpoint merely to gain confidence.

## Coverage ratchet

When a feature reaches an area whose direct checks or presumed consumers are not
documented well enough to choose these lists, the specifier records the mapping
as part of that feature's specification. This ratchets knowledge up when the
area is touched; it does not require repository-wide classification in advance.

The first implementation is deliberately only this reusable documentation
shape. Do not add verification graph machinery, selection heuristics, wrappers,
or enforcement unless several ordinary features demonstrate a repeated error
that the documentation cannot prevent and the measured saving is likely to
exceed the implementation and maintenance cost.

## Advisory RepoWise scouting pilot

For the next three to five varied ordinary QA features, the specifier uses
RepoWise after likely source files are identified and before the implementation
handoff is finalized. Tool or local-index unavailability is reported but does
not block the feature. Scouting is advisory and telemetry stays disabled. Run
the index update only when status shows that the index is behind current `HEAD`;
an already-current index needs no refresh:

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
continue for one ordinary non-Flow feature, skip no required conditional status
check, and stop the routine pilot if that fourth trial again changes neither
development focus nor QA scope. RepoWise remains optional advisory input in the
meantime; direct inspection and canonical planning remain authoritative.

## Evaluation

Use existing handoff, Git, receipt, and evidence timestamps. For each applicable
feature report the estimate, time to first handoff, repair/review time, final
focused-evidence time, selected packs, full-gate count, and the specific cause of
material variance. The objective is expectation-versus-actual visibility and a
pause for analysis, not an automatic intervention gate.

Reassess this convention after three ordinary feature cycles. Prefer retaining
the cheap generalized convention when it shortens iteration without missing
bounded QA impact. Adjust the documentation when a recurring miss is found. Do
not open another verification-optimization program from a single slow or
unfortunate feature.
