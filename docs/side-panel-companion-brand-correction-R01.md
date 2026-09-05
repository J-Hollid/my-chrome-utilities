# Side-panel companion brand correction R01

Status: approved by the user for coder handoff on 2026-09-06 (Europe/Amsterdam).
Approval recorded at 2026-09-05T22:47:30Z.

Stable task: `side-panel-companion-brand-correction`.
Baseline inspected: QA `3f3953dcf72d74c1c9c4324b46f9cdb2a7549a78`.
Delivery mode: feature integration into QA. This is a functional presentation
correction. It is not a master promotion or a verification maintenance program.

## Outcome and priority

Make the side-panel a readable companion to Specification Studio at side-panel
widths. Correct text contrast first. Then align surfaces, control shape, header,
navigation, and project hierarchy. Keep all existing product actions and effects.
Do not add comic decoration or compress the Studio desktop layout into the panel.

The approval includes the ownership recommendation: keep the complete product
scope, assess the exact selected checks before implementation, and identify
unrelated parent-pack coverage. Use a small independently reviewed ownership
preparation only when a safe separation has clear benefit. Otherwise retain
conservative coverage and record the limitation under the existing process.
Pack count alone does not justify preparation, omitted checks, or a smaller
redesign. This is not approval for a separate verification hardening program.

This correction supersedes only the older paper-first contract's powder-blue
nested surface, filled selection at both navigation levels, decorative utility
directory, repeated project presentation, and fixed presentation inventory.
Storage, action callbacks, state ownership, keyboard operation, accessibility,
local artwork, and the existing stylesheet decomposition remain required.

## Rendered comparison

The current built extension was opened in an isolated Chrome profile. Three
projects were saved through the production IndexedDB repository. The same active
project was opened in Studio. No user's project data was used or changed.
The evidence directory is `docs/side-panel-companion-evidence/before/`.

- Projects was captured at 360, 420, and 512 CSS px.
- Live, Library, Sessions, Defects, Schemas, and Hotkeys were captured at 420 px.
- Studio Project overview was captured at 1280 by 900 px.
- These are baseline observations, not approved redesign images or passing
  acceptance evidence. Non-Projects views were initial/empty states; populated
  workflow details and recovery states remain implementation verification work.

| Observation | Evidence and cause |
|---|---|
| Active metadata is almost invisible | Cream text on blue paper: 1.07:1 contrast. `projects-repository.css` keeps the old foreground while `shared.css` replaces its parent's background. |
| Saved project names and metadata look disabled | The combined text paragraph has 1.20:1 contrast on its grey card. The cards remain usable. |
| Active label is weak | Gold text on blue paper: 1.41:1. It needs dark text and an explicit status label. |
| Header repeats navigation | Informational utility badges repeat Commands and workspace names. A second Data Layer heading precedes pill tabs. |
| Narrow navigation displaces content | At 360 px the six section tabs become six full-width rows. Projects begins almost halfway down the captured viewport. |
| Project identity consumes space | The same active project occurs in the context strip, featured card, and list. The raw identifier wraps across the context strip. |
| Other views retain dark surfaces | Library has dark empty/status bars; Sessions and Defects have dark empty cards; Schemas has slate filter and validation surfaces. |
| Studio gives useful direction | Warm canvas and content surfaces, dark text, rectangular navigation, and navy primary actions establish its hierarchy. Its decorative extras are not required in the panel. |

Contrast values use computed foregrounds and composited ancestor backgrounds.
The measured project targets have no background images. The operation-message
host was empty during capture; its 4.17:1 colour pair is a risk, not proof of an
unreadable visible operation message. Test a populated message during correction.

## Visible contract

1. Use dark ink for ordinary names, metadata, status labels, help, and placeholder
   text on warm paper. Every visible text target in this correction has at least
   4.5:1 contrast, including the active label and disabled control labels.
   Measure the rendered pair after alpha composition, not only token values.
   An enabled record has full opacity and does not use disabled styling.
2. Use a warm paper canvas and raised warm paper for content and editable fields.
   Use spacing, a divider, or a small warm tonal change for related groups.
   Remove powder-blue card fills, grey record fills, and slate neutral status
   panels across all seven views. Keep error, warning, success, focus, and
   selection meanings with text or another non-colour cue.
3. Retain the existing logo in a simple navy masthead with one Commands launcher.
   Remove the decorative utility badges from the visible header. The command
   inventory stays available through Commands. Do not add a mascot, pattern,
   star, ribbon, illustration, or extra shadow to the panel.
4. Keep the two workspace choices, Data Layer and Hotkeys. Use a compact,
   rectangular workspace selector. Keep the six Data Layer section tabs as a
   distinct subordinate row with dark labels and a gold underline or rule for
   selection. Do not repeat the selected workspace name as a visible heading
   immediately above its tabs. Preserve accessible names and tab relationships.
   At 360 through 512 px, arrange the section tabs in one or two rows. Do not
   stack six full-width tabs. Keep labels and focus visible without document
   scrolling in the horizontal direction.
5. Use shared small corner radii (at most 4 CSS px for ordinary controls and
   navigation) and flat ordinary controls. Use one restrained outer boundary
   where needed. Reserve elevation for overlays. Keep usable hit areas and text
   wrapping; do not obtain compactness by shrinking control labels or hit areas.
6. Use navy with light text for the main action, paper with navy text for ordinary
   actions, and a restrained gold rule for selection and active context. Create
   project is navy, not another gold selected control. Retain explicit destructive
   labels and their red treatment. Keyboard focus stays distinct from selection.
7. Show one full record per project in the unfiltered Projects list. Give the
   active record an explicit Active project label and restrained accent rule.
   Remove the separate featured duplicate and the repeated context strip from
   Projects. Keep Open in Specification Studio, Edit details, Export, and Close
   project on the active record; retain Switch and other existing saved actions.
8. Separate each project name from its supporting metadata. Show the site and
   saved/published state clearly. Put the complete identifier and exact saved
   timestamp in a keyboard-accessible details disclosure. Do not truncate the
   only available copy. Searching and sorting retain their present semantics;
   filtering out the active row does not switch or close the active project.
9. Outside Projects, show a short context line with the active project name and
   relevant save/publication state. Full identity remains available through
   Projects details. No active-project context is required in Hotkeys.
10. Keep populated operation messages and storage state readable on paper. Empty
    outputs occupy no decorated strip. Storage recovery and error controls remain
    visible when their production state requires them.

## Preservation and runtime checks

The acceptance pair is `features/side-panel-companion-brand-correction.feature`
and `features/side-panel-companion-brand-correction-runtime.feature`.
Presentation may regroup existing controls and add details disclosures. Preserve
callbacks, stable project identities, control names, tab selection, focus return,
native disabled state, hidden-state ownership, and live announcements. Do not
hide actionable controls to simplify a screenshot. Do not change Studio styles,
project data, revision, Undo/Redo, import/export, clipboard, or Chrome API effects.

Use the installed product for all visual claims. Test every view at 360, 420,
and 512 px; include populated and empty records, long names, operation messages,
and failed-storage recovery. Compare Studio on the same data at desktop width.
Check 200% zoom, keyboard-only operation, reduced motion, forced colours, no
document overflow, and no clipped label or unreachable action. Measure text,
control boundaries, selected states, and focus on their actual backgrounds.

## Development focus and QA impact

Start with these bounded development checks:

- A focused installed browser contract for project text contrast, single-record
  hierarchy, all view surfaces, Commands, tabs, and disclosure focus.
- Existing `test/twatility-side-panel-shell-browser-test.mjs` and the relevant
  side-panel targets in `test/twatility-workflow-polish-browser-test.mjs`.
- Existing project library and project presentation tests for action preservation.

Read-only ownership lookup found `side-panel-brand/` owned by
`shell.side_panel_brand_presentation`, with conservative parent consumers:
`branding_polish`, `command-palette`, `hotkeys`, `project_management`,
`durable_project_repository`, `capture`, `event-library`,
`project_event_transport`, `schemas`, `defects`, `replay`, `live_flow_testing`,
`layered_schema`, `schema_relationship_tree`, and `guided_test_cases`.
The baseline lookup selected 797 tasks including build. This is a forecast,
not authority to launch the whole selection during specification work.

Follow-up path queries found `side-panel.html` uses the `shell` parent fallback
(117 tasks). The project-library controller uses `project_management` with
dependent consumers (311 tasks across ten packs). If that controller changes,
the forecast also includes `flow_graph`, `flow_export`, and
`property_set_flow_sections`: up to 19 packs in the combined path forecast.
Task counts overlap and must not be added. This is broad existing consumer
ownership, not a confirmed exact candidate plan. Prefer the separate project
presentation module where it can express the approved behavior faithfully;
do not move domain behavior merely to obtain a smaller verification selection.

Likely paths are the existing focused style modules, `side-panel.html`,
`src/data-layer-project-library-presentation-ui.ts`, its model construction in
`src/data-layer-project-library-ui.ts`, and focused browser support. The project
presentation path currently uses the `project_management` parent fallback.
No new production directory is proposed. Proposed test support prefix
`test/support/side-panel-companion/` belongs to parent `shell`, subordinate slice
`side_panel_brand_presentation`, with the same exact consumers listed above.
Keep helpers small and separate fixture, observation, and assertion duties.

The coder must run read-only intent classification before product edits and
include HTML and project-model paths. Exact changed-path planning controls the
settled evidence scope. A bounded coarse result requires structured judgment;
an all-runnable-pack result requires the existing preparation route. Do not
start a new verification hardening program or run the terminal gate here.
Do not weaken old tests: replace only superseded visual expectations and add
descendant text and populated-state coverage. Keep the stylesheet modules;
replace stale rules within their owner instead of adding a blanket override.

The implementation/review estimate is six hours, with a three-hour checkpoint.
By the checkpoint, show Projects contrast and all-view surface captures, report
any forecast variance, and name remaining action-preservation checks. Continue
bounded work under the current mode rules. Review-ready proof, properties, and
package proof precede architect QA-ready integration. Master promotion is separate.

## Specification scorecard

Baseline captures: 10. Confirmed project contrast failures: 3 classes.
Both Gherkin files passed the vendored parser and DRY review after duplicate
wording and an overlapping disclosure check were removed.
Build: passed. Existing shell browser check: Chrome startup timeout on two
attempts, before assertions; no passing test claim. Isolated observation capture:
passed after correcting its extension target. Product acceptance: not run.
Serena helped identify the separate presentation function and its sole production
caller. It should have been used before the initial renderer file read.
Refinement: make descendant contrast and populated Projects mandatory; keep a
visual observation run distinct from acceptance proof. Approval is recorded
above; implementation and delivery intervals remain pending. No QA or master
delivery is claimed.
