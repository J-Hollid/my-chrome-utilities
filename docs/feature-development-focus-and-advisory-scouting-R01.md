# Feature development focus and advisory scouting R01

Status: approved convention refined by QA verification ownership readiness;
routine RepoWise scouting stopped after Trial 4

Prepared: 2026-08-14

## Purpose

Make the first development loop cheap without turning verification tuning into a
new program. A feature begins with only the checks that directly observe the
behavior under construction, expands once to its bounded presumed impact for QA
sign-off, and leaves the complete all-runnable-pack checkpoint to explicit master
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
authority conflict. If exact planning selects every runnable pack,
ownership-readiness classification decides whether the feature is bounded,
needs a standing-authorized preparation stage, or requires user direction. No
feature role runs the all-runnable-pack checkpoint merely to gain confidence.

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
executable within packs. It refines only a boundary encountered by actual work
and preserves each exact-pack and terminal task closure. The subsequently
approved taxonomy-evolution contract allows a proved independent boundary to be
promoted through a separate conserved migration; it treats the runnable pack
count as registry-derived rather than fixed.

## RepoWise status

Routine RepoWise scouting is stopped. Do not add it to ordinary feature
handoffs or make its availability, index, or output a delivery condition.

RepoWise can be used only for an intentionally selected unfamiliar-code or
known-hotspot investigation when its existing index is current. Its output is
advisory. Direct inspection, ownership readiness, and the canonical changed-path
planner remain authoritative.

The completed trial record and its evaluation are in
`docs/feature-development-focus-and-advisory-scouting-trials-R01.md`.

## Evaluation

Use existing handoff, Git, receipt, and evidence timestamps. For each applicable
feature, report the estimate, time to first handoff, repair and review time,
final focused-evidence time, selected packs, full-gate count, and the cause of
material variance.

Keep this convention when it shortens iteration without missing bounded QA
impact. Adjust it when repeated feature evidence shows a recurring miss. Do not
start another verification-optimization program from one slow feature.
