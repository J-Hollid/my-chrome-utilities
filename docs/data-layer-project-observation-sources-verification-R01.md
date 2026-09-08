# Project observation sources verification R01

Status: user-approved forecast for `project-multiple-observation-sources`, 2026-09-08.

## Development focus

Start with three small groups. Run only the failing leaf during a repair.

1. Project source settings: validation, stable identity, legacy load, durable
   reload, import/export, and unchanged push routing. Extend the direct
   `test/data-layer-project-event-transport-test.mjs` boundary.
2. Source lifecycle: two arrays, activation races, late callbacks, one-source
   failure, and source-specific event identity. Extend or split the direct
   `test/data-layer-installed/capture-controller-test.mjs` boundary.
3. Installed behavior: source controls, feed labels/filter, target changes,
   settings persistence, and actual page pushes. Add focused installed cases
   through the existing Capture and project-event-transport browser adapters.

Register the new product/runtime feature pair with the appropriate focused pack
and executable handlers. The runtime contract requires installed controls and
the production capture callbacks; flags in an acceptance world are insufficient.
Use a controlled scheduler for activation races. No wall-clock sleep may stand
in for a proved subscription or save boundary.

## QA impact and shared paths

The starting owners are `capture` and `project_event_transport`. Persistence
also reaches `project_management` and `durable_project_repository` as required
by the final touched paths. The conservative Capture consumer forecast is
`event-library`, `schemas`, `defects`, `replay`, `live_flow_testing`,
`project_assurance_severity`, `guided_test_cases`, and `shell`.

Canonical read-only path queries at QA `dce549f1c3` found:

| Existing path | Owner or slice | Exact current consumer packs |
|---|---|---|
| `src/data-layer-installed/capture/index.ts` | `capture.capture_installed_side_panel` | `event-library`, `project_event_transport`, `schemas`, `live_flow_testing`, `shell` |
| `src/data-layer-installed/project-event-transport/index.ts` | `project_event_transport.project_event_transport_installed_side_panel` | `capture`, `event-library`, `shell` |
| `src/data-layer-project-event-transport.ts` | `project_event_transport` parent fallback | none |
| `src/data-layer-live-observation.ts`, `src/data-layer-live-observer.ts`, `src/data-layer-session.ts` | `capture` parent fallback | `event-library`, `project_event_transport`, `schemas`, `defects`, `replay`, `live_flow_testing`, `project_assurance_severity`, `guided_test_cases`, `shell` |
| `src/data-layer-specification-project.ts` | `schemas` parent fallback | `defects`, `live_flow_testing`, `project_assurance_severity`, `guided_test_cases`, `shell` |

Also assess `src/active-page-observation.ts`, the active-project transport
subscription, source presentation, source-based assignment routing, saved
sessions, project import/export and migration, the installed side-panel binding,
and its settings markup/styles if touched. Queries describe the current
registry, not a passing test or permission to narrow existing coverage.
There is no stopped product candidate or inherited implementation patch.

## Proposed new prefixes

These are intent proposals, not installed ownership or required class designs.
Each prefix has one proposed parent, one subordinate slice, and exact consumers.

| Proposed prefix | Parent and proposed slice | Exact proposed consumer packs |
|---|---|---|
| `src/data-layer-project-observation-sources/` | `project_event_transport.project_observation_sources` | `capture`, `project_management`, `durable_project_repository`, `event-library` |
| `src/data-layer-installed/capture/observation-sources/` | `capture.project_observation_sources` | `project_event_transport`, `event-library`, `schemas`, `defects`, `replay`, `live_flow_testing`, `project_assurance_severity`, `guided_test_cases`, `shell` |

The coder must run read-only intent classification before product coding. Include
all likely shared paths and these proposed prefixes. Query actual callers before
splitting a public interface. A new consumer found there updates the complete
forecast. Do not treat an absent proposed prefix as an existing unowned file.

`coarse-boundary` requires independent ownership preparation and QA review.
For bounded `granularity-assessment-required` or `coarse-within-pack`, use
structured judgment under the current granularity rules. Preparation and a
durable conservative observation are distinct outcomes. Do not create new
enforcement or run all packs to resolve a bounded classification.

## Commands and proof

The existing project transport route is:

```sh
node scripts/run-focused-acceptance.mjs --pack project_event_transport
```

That command alone does not cover this multi-source feature. The coder derives
the complete Capture, transport, persistence, and consumer selection from intent
and the exact committed change set. After the first coherent commit, use exact
plan-only preflight before a complete diagnostic or review-evidence run. At the
settled candidate, run that exact selection once with `--property`,
`--changed-since <base>`, and `--prepare-evidence project-multiple-observation-sources`.
Include package proof and record review-ready evidence after the runner exits.
Focused checks do not authorize an all-runnable-pack feature checkpoint.

Coder sends review-ready to refactorer; refactorer sends to architect. Only an
exact architect QA-ready handoff permits the specifier to fast-forward QA.
Preserve any unrelated terminal-deferred incidents for master integration.

## Specification checks and delivery measurements

The specifier uses the locked APS parser and `gherkin-ir-dry-checker` on the two
new contracts, prunes redundant parameters, and moves shared setup into
Background. The specifier does not run acceptance mutation or product quality
tools. Parsing and duplicate-step analysis are specification checks only.

Record approval, first handoff, each role interval, focused verification time,
failures, repairs, reruns, and QA integration from durable records. Full-gate
count in this feature phase must remain zero. Report what worked, where the
process failed, and whether to continue or adjust. Do not claim an elapsed-time
saving from discovery queries alone.

## Draft review result, 2026-09-08

| Item | Result |
|---|---|
| Specification | 13 product scenarios and 12 runtime scenarios |
| Locked APS parsing | Both feature files passed |
| IR-DRY review | Three wording differences normalized; five advisory findings retained after review |
| Shared setup | Project/source setup is in each feature Background |
| Example pruning | No identical columns remain within multi-row example tables |
| Product implementation and runtime proof | Not started; draft awaits user approval |
| Handoffs, QA integration, full-gate runs | None for this draft |

The retained IR findings distinguish setup from an invariant assertion, selecting
from clearing a filter in both contracts, available from unavailable arrays,
and capture while disabled from capture after re-enable. Combining those steps
would remove a behavioral distinction. Reports are in the task's local `tmp/`
directory and are not release evidence.

What worked: Serena outlines and selected symbol bodies exposed the single-path
Capture ports and existing source identity without reading entire controllers.
Canonical ownership queries identified the direct owner and its consumers.
Tool-use assessment: helped; no measured time saving is claimed.

Process issue: some initial document searches returned too much output and one
guessed feature filename did not exist. Smaller reads and filename searches
resolved the discovery errors. No product checks failed because none ran.
There is no queue-issued task, so the progress helper correctly refused to
create a lease without an exact active handoff; no queue state was edited.

Refinement: keep discovery scoped, extract source coordination from the large
Capture controller, and use the first installed two-array case as the
implementation checkpoint. The user confirmed the event-array scope with
"Agreed" on 2026-09-08 after reviewing this draft. The draft measurements above
remain the record from before approval; the coder handoff now has authority.
