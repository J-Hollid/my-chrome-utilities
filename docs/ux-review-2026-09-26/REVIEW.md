# TWAtility Belt: visual and UX review

Review date: 26 September 2026. Source: `decouple-swarmforge`, commit `c63652e5`, with the existing local package-file changes. This was a review, not feature implementation. No branch change was needed.

The tool has a clear identity and substantial function. The paper-and-navy palette is coherent. The main weakness is action priority: setup, navigation, secondary controls, and decoration compete with the current task. A new user can find the main areas, but must read too much to know what to do next. Some narrow editing states are materially harder to use.

**Overall design assessment: 6/10. Keep the brand. Improve task guidance and control layout first.**

[Open the visual comparison gallery](mockups/index.html). It contains nine recommendations, ten interactive mockup pages, and links to current screenshots. Each mockup uses sample data. It is a design proposal, not an installed feature.

## Scorecard

These are review judgments, not measured user-study results. On this scale, 1 means that the interface obstructs the task; 10 means that it is clear and consistent.

| Area | Score | Evidence |
|---|---:|---|
| Brand and palette | 8/10 | Consistent paper, navy, mustard, and recognizable artwork |
| Visual hierarchy | 5/10 | Many outlined controls and nested sections have similar emphasis |
| First-use guidance | 5/10 | Guidance exists, but competes with optional setup and empty controls |
| Routine task efficiency | 6/10 | Useful direct actions; repeated import, export, and delete controls add scanning cost |
| Narrow layouts | 4/10 | Main panels fit; the rule dialog keeps a narrow two-column layout |
| State and recovery communication | 7/10 | Draft, publication, connection, validation, and recovery states are present |
| Cross-workspace consistency | 5/10 | Tealium controls differ visibly from the main workspaces |

## What was inspected

Fresh browser captures covered Projects, Live, Library, Sessions, Defects, Schemas, Hotkeys, command search, Studio overview, Pages, Flows, rule editing, applicability conditions, documentation, and Tealium's no-target state. Browser tests used separate profiles and synthetic projects. The review saved 72 current interface PNGs; representative states were visually inspected. This is not a claim that every image or control received a manual review.

Main side-panel captures use 360, 420, and 512 CSS px. Studio captures include 360, 920, 1280, 1440, and 1720 px. The evidence includes empty and populated records, long names, a saved session, a defect, and a rule form. Some captures are scrolled states produced by the existing tests.

No real customer site was connected. Tealium's populated tag and load-rule workflows were not tested in this review. The Live population in the Projects suite was seeded test data, not proof of a fresh end-to-end capture from a website. A real user task study and a complete screen-reader audit remain outside the evidence.

## Recommendations and mockups

### R1. Make capture setup a clear sequence — high priority

**Observed:** In the [populated Live view](evidence/projects/populated/companion-live-420.png), the first screen contains two status labels, target details, a details disclosure, Copy page URL, flow instructions, a flow selector, and repeated step wording. The event feed is below these controls. The three utility selectors rely on icons until hover or focus shows their names.

**Change:** Show visible utility names. Use one clear sequence: choose target, check access and source, start capture. Once capture starts, replace setup with compact status and the event feed. Keep optional Flow settings in a disclosure. State which project and target are active.

**Mockups:** [Interactive setup](mockups/01-capture.html), [setup image](mockups/png/01-capture.png), [running image](mockups/png/01-capture-running.png).

**Basis:** Users need visible system status and recognizable actions. The sequence is a design inference for this tool, based on [NN/g's usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

**Acceptance target:** In a 360 × 760 viewport, the next required setup action is visible without scrolling. After capture starts, an event or a specific waiting message appears in the first viewport. Distinguish no target, access unavailable, source missing, ready, capturing, paused, and ended states.

### R2. Simplify empty states and record actions — high priority

**Observed:** The [empty Library](evidence/panel/side-panel-library-empty-420x900.png) shows Search, Add, Export, Import, and a strong red Clear Library control above “0 templates.” The [populated Library](evidence/projects/populated/companion-library-420.png) repeats six actions on a record. Sessions similarly places many buttons beside one name. Defects exposes six filter fields before the first result.

**Change:** Explain what the empty area is for and give one useful next step. Keep Edit or Open beside records. Put transfer actions in a named library menu and less frequent record actions in More actions. Keep destructive actions available, with confirmation, but give them less default emphasis. Keep search visible in Defects; place advanced filters behind a labeled control with an active count.

**Mockups:** [Interactive empty/populated Library](mockups/02-library.html), [empty image](mockups/png/02-library.png), [populated image](mockups/png/02-library-populated.png). The same page shows the proposed Sessions and Defects list pattern under Related list patterns.

**Basis:** [Carbon's empty-state guidance](https://carbondesignsystem.com/patterns/empty-states-pattern/) recommends brief contextual guidance and a direct next action. Its [data-table guidance](https://carbondesignsystem.com/components/data-table/usage/) separates collection actions from record actions and supports overflow menus.

**Acceptance target:** An empty library has no prominent Clear action. Every record has a visible main action. A user can identify active filters and clear them. Keep required safety checks before payload push or deletion.

### R3. Organize Studio around the current task — medium priority

**Observed:** [Pages](evidence/studio/studio-pages-1440x900.png) has eleven peer navigation entries. The global Validate/Release toolbar, a long explanation, and search precede the page content. Publish release has stronger emphasis than Add Page. The [narrow view](evidence/studio/studio-narrow-360x800.png) places a large illustration and stacked controls before the work area.

**Change:** Group the existing concepts under Define, Connect & check, and Deliver. Give the local task the primary action. Keep publication available in Releases and at an explicit review step. Use compact navigation at narrow widths. Keep Technical Analyst help available on demand and retain the artwork in suitable larger help or welcome states.

**Mockups:** [Interactive Studio](mockups/03-studio.html), [desktop image](mockups/png/03-studio.png), [narrow image](mockups/png/03-studio-360.png).

**Basis:** [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) puts secondary options behind a clear request. [NN/g's motion guidance](https://www.nngroup.com/articles/animation-purpose-ux/) ties animation to useful feedback. These principles support calmer routine work; they do not require removing the brand character.

**Acceptance target:** The page title and local action are visible in the first viewport. Help does not interrupt editing. Global status remains visible without repeating technical identity strings.

### R4. Use the brand more selectively — medium priority

**Observed:** The [Studio overview](evidence/studio/studio-overview-1280x900.png) uses a strong masthead, bold headings, outlined buttons, hard shadows, accent rules, and a large illustrated helper. Each element is coherent with the comic style, but repeated emphasis reduces hierarchy. The side panel is already more restrained. The captured main text has good contrast; lack of contrast is not the principal finding.

**Change:** Keep the logo, navy, warm paper, and mustard selection cue. Use lighter dividers around routine content. Reserve shadows for overlays. Use body type for form labels and explanatory text. Start with a 15 px body and 13 px supporting text; these sizes are a design proposal, not a WCAG rule. Keep state labels and symbols with color.

**Mockup:** [Three style options](mockups/04-theme.html) and [comparison image](mockups/png/04-theme.png). Refined paper is the recommended default. Neutral light is an alternative. Dark is an optional future theme, not an existing setting or a required first change.

**Basis:** [Carbon's color guidance](https://carbondesignsystem.com/elements/color/overview/) assigns colors to stable roles across themes. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) requires 4.5:1 for normal text and 3:1 for qualifying large text. Each theme must be tested as a complete set of foreground/background pairs.

**Acceptance target:** Primary, secondary, selected, error, and disabled states remain distinct. Test focus, hover, forced colors, and reduced motion. Do not treat sampled text contrast as full accessibility conformance.

### R5. Repair the narrow rule editor — highest priority

**Observed:** The [360 px rule dialog](evidence/rules/canonical-rules-360x800.png) retains a left navigation column and a narrow form. Inputs truncate their visible values. There are nested scroll areas, and the action area competes with the form. This is the strongest observed layout defect. The rules suite later failed to reach another compact property state; the screenshot was captured before that failure.

**Change:** At narrow widths, use a full-width form with top section controls. Stack condition fields. Keep one main scroll area and ensure the footer does not cover input content. Show a plain-language rule summary, test value, and explicit result. Retain local/shared provenance and promotion behavior.

**Mockups:** [Interactive rule test](mockups/05-rules.html), [wide image](mockups/png/05-rules.png), [360 px image](mockups/png/05-rules-360.png).

**Basis:** [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) addresses content at 320 CSS px. A normal form should reflow instead of keeping unusably narrow columns. This review identifies a defect candidate; it is not a complete WCAG determination.

**Acceptance target:** No horizontal form scrolling at 320 px. At 200% and 400% zoom, labels, field values, focus, and Save remain usable. Desktop layout tests alone are insufficient.

### R6. Reduce the flow toolbar — medium priority

**Observed:** The [flow workspace](evidence/studio/studio-flow-1720x960.png) places many peer controls across one row: navigation, Add, focus, multiple zoom choices, Fit options, Outline, Details, Tidy, Minimap, and Badges. A new user must infer the order of work.

**Change:** Keep Add page, Add event, Connect pages, Zoom, and Fit visible. Put secondary view options in one labeled menu. State the construction order. Let the selected item determine the inspector contents. Preserve ports and keyboard operations; keep Outline as a discoverable alternative.

**Mockup:** [Flow workspace](mockups/06-flow.html) and [image](mockups/png/06-flow.png).

**Basis:** [NN/g's progressive-disclosure guidance](https://www.nngroup.com/articles/progressive-disclosure/) supports deferring secondary controls while retaining essential actions.

**Acceptance target:** A new user can add two pages, add an event, and connect the pages without reading reference documentation. Check this in a task study. The mockup illustrates layout; it is not a working graph engine.

### R7. Keep document theme controls beside their preview — medium priority

**Observed:** The [documentation capture](evidence/workflows/studio-documentation-1280x900.png) has several control regions in a long workspace. Its top document bar overlays part of the global toolbar in this scrolled state. Theme controls and output are not easy to compare in the captured viewport. Source code already includes grouped theme settings, Preview theme changes, and Save theme; these functions should be made clearer, not claimed as missing.

**Change:** Use a dedicated theme workspace with controls beside the preview. Clearly distinguish application appearance from document output styling. Show unsaved changes and stale preview status. Preserve the distinction between preview, saving a theme, export, and publishing a release.

**Mockup:** [Interactive theme preview](mockups/07-document.html) and [image](mockups/png/07-document.png). Change the heading color, then select Refresh preview.

**Basis:** Clear feedback follows [NN/g's system-status principle](https://www.nngroup.com/articles/ten-usability-heuristics/). Side-by-side comparison is the reviewer's proposed application of that principle.

**Acceptance target:** A user can identify which settings are saved and whether the output is current. At narrow widths, stack the preview below controls. Do not let sticky toolbars cover headings or focused fields.

### R8. Explain command and shortcut entry — medium priority

**Observed:** [Hotkeys](evidence/projects/companion-hotkeys-420.png) shows readable titles beside internal command IDs, then text inputs with “Unassigned,” Save, and Clear. Source inspection confirms that these are typed sequence inputs with conflict checks, not a key recorder. The [command palette](evidence/extra/command-palette-420.png) starts with “Say hello” and has no visible search instruction in this capture.

**Change:** Show task names first. Add an explicit Record shortcut state and clear examples for typed sequences. Preserve existing multi-key sequences and conflict checks. Put IDs under Advanced details. Label command search, group useful actions, and move the demo command into a development group.

**Mockups:** [Shortcut setup](mockups/08-hotkeys.html), [recording image](mockups/png/08-hotkeys-recording.png), [command search](mockups/08b-commands.html), [command image](mockups/png/08b-commands.png).

**Basis:** Recognition and error prevention are established [NN/g usability principles](https://www.nngroup.com/articles/ten-usability-heuristics/). Recording is a proposed input aid; the full product must preserve its current keymap semantics.

**Acceptance target:** State the shortcut focus scope. Identify conflicts by readable action name. Check browser-reserved commands and editable fields. The sample recorder is deliberately limited and is not a replacement keymap implementation.

### R9. Give Tealium the same layout quality — high priority

**Observed:** The [Tealium entry state](evidence/extra/tealium-no-target-420.png) uses tightly packed small controls, a very narrow Website selector, four observation buttons, and filters for an empty inventory. The shell says “Tealium is ready” while the workspace says “Checking website access” and “No observation yet.” These describe different layers, but their relationship is unclear.

**Change:** Use shared control sizes, spacing, and typography. Show one next step for each state: choose page, check access, start observation. Display the chosen page and observation status together. Place filters with populated results. Keep the existing distinction between configured tags, registered code, sends, and vendor delivery.

**Mockups:** [Interactive setup](mockups/09-tealium.html), [no-target image](mockups/png/09-tealium.png), [sample inventory image](mockups/png/09-tealium-observing.png).

**Basis:** [Carbon's empty-state guidance](https://carbondesignsystem.com/patterns/empty-states-pattern/) favors context and a specific corrective action. [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) specifies 24 × 24 CSS px with exceptions. For this tool, 36–40 px desktop controls and larger touch targets are a usability proposal, not the WCAG minimum.

**Acceptance target:** Initial, no-access, absent-runtime, ready, observing, paused, and unsupported-runtime states have distinct messages. Test real tag and load-rule workflows before implementation sign-off.

## Specification checks

The review read the repository instructions, README, manifest, paper-first brand contract, theme tokens, Technical Analyst guidance specification, hotkey editor/controller, document theme renderer, and relevant browser-test code.

The paper-first contract explicitly preserves the approved brand and adds no optional dark theme. The current analyst specification explicitly calls for the large character and scheduled hints. R3 and the optional part of R4 therefore require a deliberate design-contract update if selected. The recommendations do not imply that the current implementation failed those contracts.

No product specification or TypeScript was changed. No new feature branch was created. `npm run typecheck` was not needed for this review-only work and was not run. Prototype checks do not prove that the product implements the recommendations.

## Runtime proof and limits

The actual build command was `npm.cmd run build`; it passed. The first `npm run build` attempt was blocked by PowerShell's script policy. No policy setting was changed.

Each branding browser command used `BRAND_EVIDENCE_DIR=docs/ux-review-2026-09-26/evidence/<suite>` to preserve historical evidence.

| Exact check | Result | Limits |
|---|---|---|
| `node test/twatility-side-panel-shell-browser-test.mjs` | Passed | Current shell states, control relationships, keyboard/focus, role colors, containment, accessibility modes; not a user study |
| `node test/twatility-studio-shell-browser-test.mjs` | Passed | Studio shell and sampled widths; does not prove every nested form |
| `node test/twatility-projects-browser-test.mjs` | Passed | Projects, seven companion views, 21 populated observations, dialog/recovery/transfer checks; synthetic data |
| `node test/twatility-workflow-polish-browser-test.mjs` | Passed | Workflow choice controls, documentation theme behavior, and analyst guidance; not all production combinations |
| `node test/twatility-rules-conditions-browser-test.mjs` | Failed | `Installed rules UI did not become ready: compact canonical property`; earlier captures retained; cause not diagnosed |
| `node docs/ux-review-2026-09-26/capture.mjs` | Passed after fixes | Local prototype interactions and page containment at 320/360 px; fresh extension Tealium entry and command palette captures |

The Projects suite reported a minimum sampled text contrast of **5.23:1**. This applies to its inspected text and backgrounds, not every control, icon, focus indicator, or possible theme.

The prototype capture script checked six local interaction paths, ten mockup pages, and the gallery. It produced 16 proposal PNGs, one gallery PNG, and two current-interface PNGs. It checks broken images and document overflow; it does not prove full keyboard or screen-reader access. Buttons with no implemented workflow report their intended action. No prototype saves to the extension or connects to a website.

## What went well

- Current browser evidence was obtained without using the personal Chrome profile.
- Four existing suites passed and supplied broad empty/populated coverage.
- The review found a narrow-form problem that passing shell checks did not reveal.
- All recommendations have an inspectable visual proposal and a linked source.
- The brand can be retained while improving ordinary work controls.

## Where the process failed

- Automatic approval review rejected capture of the existing Chrome window because it showed unrelated content. The review used separate test profiles instead; no access to that page was needed.
- Initial sandbox browser connections failed with `ECONNRESET`. The same isolated tests passed after execution outside that sandbox.
- The rules suite failed to reach one later state. The review preserves this failure rather than treating partial screenshots as a pass.
- The first mockup pass had text-encoding damage, a button text-color error, and document-preview overflow at 320 px. These were corrected and recaptured.

## Refinement order

1. Repair the narrow rule form, then retest focus, zoom, and nested scrolling.
2. Improve Live and Tealium state guidance, plus Library empty-state/action priority.
3. Apply the shared visual treatment to Studio, lists, and document editing.
4. Run short task sessions with new and experienced analysts: capture an event, save it, create a rule, review a defect, edit a theme, and find a command. Record completion, wrong turns, and requests for help.
5. Consider a dark application theme only after the core layouts and semantic color roles are stable.

Product implementation should start from `qa`, in small changes. The review leaves product source unchanged and preserves the existing package-file edits. The generated `dist` changes from the review build are restored after capture.
