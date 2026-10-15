# UX implementation — 26 September 2026

The nine recommendation groups are implemented on `decouple-swarmforge`.
The existing package changes and the earlier review files are preserved.
The current extension is built in `dist`.

[Open the screenshot gallery](index.html). [Open the research and recommendations](../ux-review-2026-09-26/REVIEW.md). [Open the design mockups](../ux-review-2026-09-26/mockups/index.html).

## Implementation scorecard

| Recommendation | Result | Main change |
| --- | --- | --- |
| R1: Capture and utility navigation | Implemented | Utility names are visible. Setup shows target, access and path, then Start. Extra Flow and session controls use disclosures. Loading prevents use of controls before mount. An empty capture says Not started. |
| R2: Library, Sessions and Defects | Implemented | Empty Library has guidance. Create and Import stay visible. Export and Clear use Library actions. Each record has one main action and More actions. Defect filters show an active count and Clear. |
| R3: Studio task structure | Implemented | Navigation groups are Project, Define, Connect & check, and Deliver. Checks and release review use disclosures. Navigation closes at narrow widths. Technical Analyst help is closed until requested. |
| R4: Visual system | Implemented | The logo, navy and mustard remain. The paper surfaces are more neutral. Controls use normal case, lighter borders and less shadow. Focus, forced colors and reduced motion remain available. |
| R5: Rule editor | Implemented | Compact overlays stack the menu and full-width editor. Condition fields and pattern test fields stack. Rule actions stay in normal flow. The modal owns scrolling. |
| R6: Flow tools | Implemented | Add Page, Add Event, Connect and common camera controls stay visible. Secondary controls use View options. Outline remains available. Guidance explains construction and connection. |
| R7: Document theme | Implemented | Controls and the sample are beside each other on wide screens and stacked on narrow screens. Unsaved changes and stale previews are explicit. Save and Preview remain separate. Headers do not cover the editor. |
| R8: Hotkeys and commands | Implemented | Record keys supports sequences, Stop, Tab and Escape. Typed sequences and conflict checks remain. Common browser shortcuts are guarded. Command IDs use a disclosure. Commands has a visible label and groups; development commands come last. |
| R9: Tealium | Implemented; live integration proof limited | Setup and controls use the paper theme. The next action depends on state. Filters appear after an observation. Workspace loaded does not imply observation is running. Registered code still does not imply delivery. |

The optional dark concept was not selected as the product default. This change implements the recommended refined paper theme.

## Specification checks

This document updates the presentation contract from the earlier review. It replaces the old fixed navigation order, icon-only utility treatment, fully expanded Flow toolbar, and exact yellow paper color checks. It does not change schema ownership, publication review, import review, or delivery claims.

The shared surface colors are page `#f5f2e9`, raised paper `#fffdf7`, border `#b9b6a9`, navy `#0c3158`, and ink `#17130e`. The Live summary uses the surrounding panel surface. Body text uses Segoe UI or a system sans-serif font at 15 CSS pixels. Utility labels and supporting text can use 13 CSS pixels. Existing checkbox geometry and labels are retained.

The changed render work is split into small modules under `src/interface`, `src/flow-graph`, `src/project-documentation`, and the installed capture directory. The Event Library and saved-session renderers were reduced. New CSS is split by controls, panel, Studio and rules. The stylesheet source manifest and compiled registry both include it.

Checks passed:

- `npm.cmd run typecheck`
- `npm.cmd run build` — includes the normal architecture checks.
- `git diff --check` for the changed source, markup, tests and stylesheet manifest.
- Ten focused Node checks: hotkey bindings, installed hotkey controller, installed command palette, Live guided workflow, Event Library model, saved-session model, Flow workspace, project documentation, Tealium session, and Tealium owner.
- The installed Event Library controller check and utility navigation artwork check also passed.

The Node checks establish code and model behavior. They are separate from browser proof.

## Runtime proof

All browser checks use separate test profiles and local fixture data. No personal browser profile or customer site is used.

| Command | Result and scope |
| --- | --- |
| `node test/ux-recommendations-browser-test.mjs` | Passed. Visible utility labels; empty and populated Library; Duplicate through More actions; saved-session opening; filter count and reset; native key recording and Save; command groups; Tealium setup; theme edit, preview and durable save; narrow navigation. |
| `node test/twatility-side-panel-shell-browser-test.mjs` | Passed. Refined paper colors, containment, names and ARIA references, keyboard focus, forced colors, reduced motion and clean load. |
| `node test/twatility-studio-shell-browser-test.mjs` | Passed. Grouped navigation, routes, narrow layout and Flow surface. |
| `node test/twatility-rules-conditions-browser-test.mjs` | Passed. Wide and narrow canonical rule controls, compact side-panel editor, condition save and Undo. |
| `node test/twatility-workflow-polish-browser-test.mjs` with `BRANDING_WORKFLOW_CHOICES_TARGET` | Passed. All 30 existing choice contracts, including theme options and documentation controls. The old automatic Analyst guidance target was not selected because help is now on demand. |

Browser reports and screenshots are in `evidence/`. The main task check covers widths 360, 420 and 1280. The other suites include wider Studio and intermediate panel sizes. These checks are not a complete screen-reader audit.

The Tealium native observation suite did not pass in this environment. Its first attempt needed an unavailable `unzip` program. With the current `dist` supplied directly, the fixture reached the website permission step, but it did not receive website access. The observed error states that the current address is unavailable. Thus, this delivery has installed setup proof and passing access/session model checks, but no new proof of live Tealium observation or vendor delivery. Temporary fixture investigation changes were removed.

## What went well

The real browser checks confirmed that the layout changes preserve the main workflows. The theme test checks the saved project record, not only a status label. The populated Library test found a pre-existing Duplicate defect: the old action changed editor state without saving a copy or rendering. Duplicate now saves a separate copy and keeps an open draft intact.

## Where the process failed

The first rule test clicked before Data Layer had mounted. The test now waits for startup to finish, and the product prevents interaction during that phase. Old assertions also assumed the previous color values, navigation order and toolbar composition. Those assertions were updated to this contract. A theme style reduced checkbox spacing; the browser check caught it and the spacing was restored. A small DOM test double needed `querySelector` support after empty-state text moved into a focused renderer.

The Tealium native fixture remains an integration proof limit. It is not counted as a passing check.

## Refinement

Run the Tealium observation suite in a profile where the local fixture website has access. Then perform a short keyboard and screen-reader review with representative long project names and rule paths. Keep the refined paper default until there is a separate decision to build and validate a dark theme.
