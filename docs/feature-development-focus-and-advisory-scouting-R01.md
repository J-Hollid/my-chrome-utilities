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
the evidence follows that set. If shared verification work unexpectedly selects
all 20 packs, the existing feature-mode scope rule applies: restore a
product-only candidate or seek separate authority for infrastructure work. No
feature role runs the all-20 checkpoint merely to gain confidence.

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
not block the feature. Scouting is advisory and telemetry stays disabled:

```sh
DO_NOT_TRACK=1 tmp/repowise-venv/bin/repowise status . \
  --no-workspace --format json
DO_NOT_TRACK=1 tmp/repowise-venv/bin/repowise update . \
  --index-only --no-workspace --no-agents
DO_NOT_TRACK=1 tmp/repowise-venv/bin/repowise risk \
  --target <likely-path> --format json --full
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
