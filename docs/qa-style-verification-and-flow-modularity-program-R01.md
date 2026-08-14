# QA style verification and Flow modularity program R01

## Status and authority

This document specifies two ordered, independently reviewable QA infrastructure
slices requested by the user on 2026-08-13. It refines the active QA-branch
release pilot for presentation-only changes and prepares the approved Flow
relationship snap-feedback feature to finish without a feature-mode all-20 run.

It does not authorize a master promotion, remove a terminal evidence leaf,
reactivate VTD-018, or classify every CSS change as local. The one canonical
all-20 checkpoint with properties and package proof remains mandatory only when
the user explicitly requests master integration of the frozen cumulative QA
candidate.

The user's approval of this program approves the complete ordered overnight
batch: Slice 1, Slice 2, then completion of Flow relationship snap feedback.
Each stage still integrates into `qa` only from an exact architect `qa-ready`
handoff with bound focused evidence. The next stage starts from that exact QA
commit and does not require another routine user approval.

Slice 1 is QA-integrated at `d75132daef`, Slice 2 at `ef440b3018`, and the
inter-stage run-intent and deferred-incident corrections through `66dcdfd5d6`.
Stage 3 is QA-integrated at `89fee7df48`. No all-20 checkpoint was run for these
QA stages; terminal integration remains reserved for a later explicit
master-promotion request.

## Baseline

`specification-builder-brand.css` is a 1,991-line, 50,979-byte stylesheet that
contains unrelated Studio styling and several separated Flow blocks. Both it and
`specification-builder.css` are global-impact paths, so a nine-line Flow port
treatment currently selects all 20 runnable packs. `layered-schema.css` and
`specification-builder-guidance.css` demonstrate that exact runtime inputs can be
bounded, but their root Shell ownership and dependency closure still select more
than one declared consumer.

CSS runtime blast radius and QA execution stage are currently conflated:
`globalImpact` expands directly to all runnable packs in every planning mode.
This contradicts the pilot's intended division of responsibility. QA should
prove the changed presentation boundary, while the master-integration checkpoint
proves the complete accumulated application once.

## Shared invariants

- A stylesheet is classified from an explicit declaration, never from a filename
  convention or selector-diff guess.
- A feature-local stylesheet has one owning pack, one stable DOM scope root, and
  an exact consumer set. Its selectors cannot select outside that root.
- A shell-bridge stylesheet may style ancestors or shared route chrome only when
  it declares every affected consumer explicitly.
- Shared tokens, resets, document foundations, and undeclared or invalid style
  boundaries remain global-impact.
- Scoped ownership narrows QA evidence only. It never claims application-wide
  regression proof or removes the all-20 master checkpoint.
- Focused browser evidence observes installed rendered state, computed style or
  SVG presentation, relevant geometry, keyboard/focus behavior, forced colors,
  responsive containment, and packaging where applicable. Source-text presence
  alone is insufficient.
- Exact changed-path history remains conservative for deletes, renames, ownership
  changes, malformed history, and incompatible registries.
- No implementation may hide a planned all-20 feature-mode run by omitting an
  owned pack, relabelling terminal evidence, or bypassing changed-path preflight.

## Slice 1: stage-aware stylesheet ownership and QA planning

### Outcome

Add first-class stylesheet declarations to the canonical verification registry.
Each declaration records its source path, packaged destination, classification,
owning pack, exact consumers, QA smoke targets, and, for local presentation, a
stable scope root. Registry validation rejects missing, duplicate, ambiguous, or
conflicting ownership and rejects local style selectors that escape their
declared root.

Feature-integration planning treats a valid local stylesheet as an exact,
non-propagating presentation boundary. A valid shell bridge selects its owner and
declared consumers. A global stylesheet selects only the exact smoke targets
named by its declaration and records a terminal-full obligation for the next
frozen master candidate; it does not launch all 20 packs in feature mode. Invalid
or undeclared CSS remains a prelaunch block.

The Shell pack owns two installed-browser targets. `STUDIO_GLOBAL_STYLE_SMOKE_TARGET`
checks the common Studio root, navigation/workspace/inspector geometry, visible
focus, responsive containment, and forced-colors presentation.
`SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET` checks the corresponding installed
side-panel shell, navigation, active workspace containment, visible focus, and
forced-colors presentation. A global declaration names one or both targets
according to the documents that load it. These targets are bounded QA integration
evidence, not substitutes for feature behavior or terminal coverage.

Master-integration planning is unchanged: the frozen cumulative QA tree executes
all 20 runnable packs with properties and packaging once. A passing final receipt
consumes every recorded style terminal obligation on that exact candidate; a
failure or changed candidate retains the obligation and follows the existing
repair-and-fresh-terminal-run rules.

The registry and build each consume one canonical static-style declaration so a
new declared stylesheet cannot be silently omitted from the package or separately
invented in a manual copy list. Source-to-destination mapping supports colocated
feature styles while keeping packaged URLs stable. Existing HTML reference
validation remains.

### Evidence conservation

| Boundary | Before | After |
|---|---|---|
| Local product source | Existing owner, boundary, consumer, and dependency rules | Unchanged |
| Feature-local stylesheet | Shell fallback plus runtime consumer/dependants | Exact declared owner and consumers in QA |
| Shell-bridge stylesheet | Global or Shell fallback | Exact owner plus declared shell consumers in QA |
| Global stylesheet | All 20 packs in every mode | Exact declared Shell style-smoke targets in QA plus a durable terminal obligation |
| Master release candidate | All 20 packs, properties, package | Unchanged, and consumes matching style obligations only on pass |
| Rename/delete/history | Current/base registry conservation | Unchanged conservative union using style declarations from both registries |
| Existing evidence leaves | All applicable leaves once | Same leaves once; only stage and target selection change |

### Focused verification

Acceptance authority is Modular verification packs 153 through 156 and Settled
candidate final verification 014 and 015. The exact feature-mode checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack shell \
  --focused-task unit:test/settled-final-verification-workflow-test.mjs \
  --focused-task unit:test/verification-process-contract-test.mjs
node scripts/package.mjs
```

No all-20 checkpoint is authorized in this slice. The implementation-and-review
expectation is 90 minutes from coder receipt to architect `qa-ready`. At 45
minutes, deterministic planner fixtures are expected to prove local, bridge,
global-QA, invalid-boundary, and terminal-master cases before any changed-path
task launches. Timing variance is reported and work continues by default while
the scope remains bounded and the completion path is credible.

This is the bounded standalone infrastructure bootstrap anticipated by the
pilot's fan-out stop. The pre-change planner's all-20 classification of runner,
registry, or build paths is a diagnostic of the behavior being replaced, not
authority to launch that plan. User approval authorizes only the focused Shell
process-contract boundary above, its installed style-smoke targets, and package
proof. Review-ready evidence must bind that approved plan exactly; the bootstrap
cannot claim terminal evidence.

## Slice 2: extract the Flow presentation boundary

### Outcome

Extract Flow styling from the two Studio monoliths into two declared assets:

- a colocated Flow-local stylesheet for canvas, nodes, ports, relationships, transient
  states, component-contained responsive behavior, reduced motion, and forced
  colors; and
- a colocated Flow-shell bridge for rules that deliberately change the Studio body,
  workspace pane, navigation, inspector, sticky tools, or Focus Canvas shell.

The local file is owned only by `flow_graph` and all of its selectors remain
beneath one stable Flow root. The bridge is owned by `flow_graph` with `shell` as
an exact consumer. Shared brand tokens remain in their existing global
foundation. The extraction must not change DOM identity, canonical project data,
Flow behavior, accessibility names, saved bytes, revision, Undo, or the intended
rendered result.

Establish explicit cascade order before moving rules. Where cascade layers are
used, prove computed-style equivalence rather than assuming source movement is
neutral. `@scope` may be used only when the packaged Chrome support policy is
explicit; a stable root selector remains the enforceable ownership boundary.
CSS Modules, Shadow DOM, selector-diff inference, and runtime style injection are
outside this slice.

Focused installed-browser evidence compares representative Flow states before
and after extraction at desktop and 360-pixel widths, ordinary and Focus Canvas,
25, 100, and 200 percent zoom where geometry is scale-sensitive, reduced motion,
and forced colors. It records component geometry and computed or SVG presentation
for the changed boundary. A deterministic static contract proves every moved
selector is accounted for exactly once and that no local selector escapes its
root.

### Focused verification

Acceptance authority is Modular verification packs 157 and 158 plus existing
directional Flow runtime behavior. The exact feature-mode checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph --pack shell
node scripts/package.mjs
```

No all-20 checkpoint is authorized in this slice. The implementation-and-review
expectation is 120 minutes from coder receipt to architect `qa-ready`. At 60
minutes, the new local and bridge assets are expected to build and load with a
complete selector-accounting report and at least one desktop and one 360-pixel
installed equivalence observation. Timing variance is reported and work continues
by default while the scope remains bounded and the completion path is credible.

## Stage 3: complete Flow relationship snap feedback

After Slice 2 is QA-integrated, reconstruct the already approved relationship
snap-feedback implementation on that exact QA base. Do not merge or cherry-pick
its stale implementation lineage wholesale. Port only task-owned behavior and
tests, put the target treatment in the new Flow-local stylesheet, and classify
relationship snap logic as a non-propagating Flow workspace interaction boundary.

The authoritative product behavior remains directional Flow scenarios 028 and
029 and their runtime partners. Its exact feature-mode checkpoint remains:

```sh
node scripts/run-focused-acceptance.mjs --pack flow_graph
node scripts/package.mjs
```

The implementation-and-review expectation remains 60 minutes with the existing
30-minute installed pointer checkpoint. No all-20 checkpoint is authorized. A
fresh exact candidate and receipt are required; the earlier four-pack receipt and
blocked handoff are diagnostic history, not reusable evidence.

## Inter-stage correction: verification run intent

Before Stage 3 starts, implement
`docs/verification-run-intent-correction-R01.md` on the clean Slice 2 lineage.
The correction was user-approved before port snapping. Slice 2 exposed the
reason it cannot wait until after QA integration: current evidence preflight is
blocked by incidents created by ordinary diagnostic and deliberately interrupted
runs. Apply the exact audited compatibility boundary, produce one evidence-mode
checkpoint for the resulting candidate, and then continue to Stage 3 from its QA
integration. Do not substitute an all-20 repair checkpoint.

## Overnight continuation and stopping rule

The coder, refactorer, architect, and specifier continue through repairs,
focused reruns, exact evidence recording, QA integration, and the next approved
stage without routine user intervention. Time-ceiling crossings, first failures,
review findings, causal test repairs, and implementation choices within these
contracts are reporting events rather than permission gates.

Stop only when progress requires authority that has not been granted: scope or
externally visible behavior must expand, a requirement has two materially
different interpretations that cannot be resolved from this authority, an
all-20 feature-mode run or master promotion would be required, destructive or
credentialed action needs approval, lineage cannot be safely reconstructed, or
repeated failures have no causal explanation and no credible bounded completion
path. A role must report the exact blocker, completed evidence, and smallest user
decision needed. It must not label ordinary difficulty, elapsed time, a first
failure, or an available bounded repair as a blocker.

## Batch scorecard

Record each stage's approval-to-QA time, role intervals, time to first passing
candidate, review/repair time, focused verification wall time, selected packs and
tasks, failures, repairs, reruns, package proof, terminal attempts, and QA queue
time. The settled batch report distinguishes time spent establishing the reusable
style boundary from the snap feature's own implementation time. It reports the
full-gate count as zero during QA and leaves master integration to a later
explicit user request.

### Stage 3 settled result

The corrected Stage 3 execution began with the fresh coder handoff at
2026-08-13 22:02:56 UTC and reached architect `qa-ready` at 2026-08-14 00:05:28
UTC: 2 hours 2 minutes 32 seconds against the 60-minute expectation. QA
fast-forward completed at 00:07:21 UTC, making the handoff-to-QA interval 2 hours
4 minutes 24 seconds. This corrected window is reported separately from the
earlier abandoned mixed lineage that consumed roughly eight hours and did not
produce an integrable snap candidate.

The first coder handoff arrived in 50 minutes 1 second. Refactor review rejected
that candidate 6 minutes 52 seconds later because it narrowed ownership to
bypass the normal selected impact. The repair took 15 minutes 25 seconds.
Refactor review of the repaired candidate took 21 minutes 14 seconds, and final
architecture/pointer-lifecycle review took 29 minutes. The exact final focused
evidence ran for 6 minutes 29 seconds and selected the five actual affected packs:
`flow_graph`, `flow_export`, `live_flow_testing`,
`property_set_flow_sections`, and `shell`, with package proof.

There were zero all-20 attempts and zero invalidated all-20 passes. One focused
candidate was rejected, repaired, and replaced. Final installed evidence covers
actual pointer input at 25, 100, and 200 percent zoom; port-only non-color target
emphasis; valid-side snap and transfer; cancel behavior; and persistence. The
final candidate is `89fee7df48`, tree
`fff980e50bf0262c2a288a0d4cc65776f67122a8`, with receipt
`070840da-7bae-4d7f-8450-16fadf23d23d`.

The feature improved markedly over the earlier eight-hour attempt, but it did
not meet the one-hour expectation. The overrun was not caused by a broad gate:
it was one invalid ownership shortcut and its repair, followed by two review
stages that completed missing lifecycle coverage. The course adjustment is to
use the generic development-focus/QA-impact documentation convention and the
short advisory scouting pilot in
`docs/feature-development-focus-and-advisory-scouting-R01.md`, then measure three
ordinary features. Do not activate another verification-infrastructure slice on
the evidence of this single Flow sample.
