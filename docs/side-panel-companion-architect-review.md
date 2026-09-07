# Side panel companion: architect review

Task: `side-panel-companion-brand-correction`.
Mode: feature integration into QA.
Received candidate and review base:
`d8a1bba911c2d4604e0920083a56fb24424e1433`.
Approved specification: `c3f4e6e66c9d3cac51ad703f871f169b9b9b1c1f`.
Review started on 2026-09-07 at 12:54 UTC.

The functional delivery gate passes. The complete candidate diff includes the
project renderer, its coordinator, the panel HTML, seven panel style modules,
and matching delivery assets. These changes implement the approved narrow
companion presentation. Acceptance registration alone is not the implementation.

## Architecture result

| Review phase | Result | Evidence |
|---|---|---|
| UI and core separation | Pass | Presentation builds records; the existing coordinator owns actions and storage calls. |
| Dependency direction | Pass | Presentation calls the supplied action interface. Domain and repository code do not acquire panel dependencies. |
| Information hiding | Pass | Stable project identities stay in the action contract. Full identity and saved time use an explicit details disclosure. |
| Local code quality | Pass | One active record replaces the duplicate card. Native controls retain names, disabled state, and reachable focus. |
| Verification repairs | Pass | Result collection has output and shutdown bounds. Validated results retain their own observation documents. Receipt checks reject altered identities and content. |

The prior dialog split remains in use. The coordinator keeps create, switch,
edit, import, export, close, and recovery behavior. A close action now returns
focus to the saved project's Switch control. Studio styles and domain storage
were not changed. Browser test selector updates follow the new active record;
checks for storage, migration, callbacks, and action results remain present.

The review also covered the approved browser result repair in this lineage.
It preserves a failed target when later target output is missing, delays pass
publication until result validation, and authenticates the original receipt
before it changes the diagnostic boundary. Parent consumer tests retain the
complete parent task set. Compiled registry output matches `verification/packs.json`.

## Runtime evidence

The received review record passed independent validation. Its raw receipt digest
is `ab33ca6fc4ff271acb5de70df4a94ef21f43e367ececa658546c11b1df923595`.
It records 1,115 passing tasks on the received candidate. The installed Projects
browser task ran freshly for 17,336 ms. Its results include all seven views at
360, 420, and 512 CSS pixels, 21 populated observations, four accessibility
modes, 12 dialog closures, and long records at all three widths. The minimum
reported composited text contrast is 5.2349:1. Recovery, archive actions, Studio,
and preservation of the active project during empty filtering all passed.

The architect inspected the actual browser helpers and the saved Projects,
Live, Library, Sessions, Defects, Schemas, Hotkeys, and Studio images. The
helpers use installed production controls or the same production recovery API.
The 200 percent check uses the stated equivalent viewport reflow; it does not
claim operation of Chrome's zoom menu. Receipt reuse during Gherkin mutation
validates acceptance behavior and does not claim a new installed browser run.

## Review changes and checks

The companion acceptance test now requires both its presentation command and
its browser evidence command, exactly once. This closes a real cache test gap:
a mutation of the initial cache flag previously skipped presentation verification.
No additional production change was needed during architecture review.

| Check | Result |
|---|---|
| Build, TypeScript, architecture checks | Pass |
| Companion presentation and acceptance tests | Pass |
| Browser result repair and parent consumer tests | Pass |
| Compiled registry comparison | Pass |
| Differential Clojure mutation | 39 effective mutants rejected; one tool no-op identified |
| Soft Gherkin mutation | 146/146 rejected: companion 33, paper model 65, paper runtime 48 |
| Pinned DRY analysis | No duplicate candidates in the four changed Clojure modules |
| Presentation V8 coverage | 9/11 functions and 15/18 ranges executed in the focused presentation test |

Language mutation ran one file at a time with eight workers. The four modules
selected 8, 17, 11, and 4 sites. Focused survivor checks used the required model
commands, canonical workspace features, existing workspace hardening tests,
repository inspection with a two-observation batch boundary, and the retained
helper inventory handlers. All effective mutations were rejected. Tool-written
manifests and Gherkin metadata are retained without manual edits.

The remaining reported `1 -> 0` site in the VTD-009 helper has the parent
expression's location on line 156, while the constant is on the next line.
The pinned tool's own `mutate-source-text` returned exactly the original bytes.
This is a no-op, not evidence that an altered program passed. Local reproduction:
`tmp/architect-companion/check-mutant.clj`. Do not change tool pins in this task.

The V8 figures cover only the focused presentation test. They are not whole
product coverage. No TypeScript mutation tool is pinned; Clojure tools were not
used as substitutes for TypeScript checks.

## QA evidence and process

Fresh focused proof must bind the final architect candidate to the received
base above. The canonical ownership intent selects 17 packs because the brand
slice declares complete parent consumers and the changed workspace handler
also belongs to Hotkeys. The intent is `bounded-ready`. Preserve this complete
selection; do not narrow it in this review. The final receipt and review record
are attached to the exact commit through the normal verification notes.

Existing eligible reliability repairs remain subject to their recorded
`terminal-verification-deferred` obligations. QA evidence does not resolve them
or authorize master promotion. The specifier remains the next recipient.

What went well: production boundaries stayed small; runtime proof exercised
real controls; negative checks exposed the cache gap and confirmed evidence
integrity. What failed: initial language test selection missed older handler
forms, and one mutation tool location produced no source change. Refinement:
use the existing handler tests at the first mutation pass and fix the tool
location issue in a separate tooling task.

Serena assessment: impeded. Five tools are exposed, but the required
`initial_instructions` tool is absent from the local fixed tool list. No Serena
symbol query was made. Scoped source and diff inspection completed the review.
The user assigned the tool configuration repair for all roles to the specifier
at the next QA integration. This review does not change that configuration.
