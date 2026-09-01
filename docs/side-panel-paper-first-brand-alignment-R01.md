# Side-panel paper-first brand alignment R01

Status: approved

Stable implementation task: `side-panel-paper-first-brand-alignment`

## Outcome

Make the side-panel use the same restrained TWAtility Belt surface language as
Specification Studio. The default side-panel workspace becomes paper-first.
Strong navy remains an important brand color, but it no longer fills the page,
workspace, main panels, nested groups, and ordinary buttons at the same time.

This redesign preserves the approved wordmark, fonts, mustard, red, focus color,
responsive layout, accessible state communication, controls, navigation,
persistence, Chrome APIs, and recovery behavior.

## User decision

The user approved all recommendations from the side-panel and Studio style
comparison. CSS decomposition is a required work item inside this redesign. It
is not a separate pre-redesign refactor, separate product feature, or reason to
delay the visible palette change. The decomposition and paper-first mappings
must reach review in one coherent candidate under the stable task above.

If read-only ownership planning requires a standing-authorized preparation, the
preparation can establish verification ownership only. It must not perform the
CSS decomposition or visible redesign ahead of this task. The product candidate
must keep conservative current/base evidence while it installs the new focused
style ownership.

## Visible design contract

The default surface map is:

| Role | Treatment |
|---|---|
| Application masthead | strong navy with raised-paper text and mustard rule |
| Page and workspace canvas | warm paper with dark ink |
| Main content panel | raised paper with dark ink |
| Nested content group | subtle blue-paper tint with dark ink |
| Ordinary action | raised paper with navy text |
| Primary action | strong navy with raised-paper text |
| Selected state | mustard with navy text |
| Destructive action | deep red with raised-paper text and a non-color cue |
| Dialog, menu, or command palette | contained raised surface with overlay elevation |

Related records, nested forms, and ordinary state groups use spacing or dividers
instead of repeated elevation. Empty and recovery states use an accent rule on a
paper surface. The document root does not force a dark native-control scheme.
No optional dark theme is added by this feature.

## CSS decomposition inside the redesign

`side-panel-brand.css` currently has 1,259 lines and owns shell, shared-control,
and many workflow-specific rules. The redesign must separate these
responsibilities while it moves each rule to its paper-first treatment:

- shell layout, masthead, and top-level navigation;
- shared surface, action, state, and overlay presentation;
- Live and transport workflows;
- Projects and repository workflows;
- Library and Sessions workflows;
- Defects and Schemas workflows; and
- Hotkeys workflow.

The exact filenames are an implementation choice. Each file must have one
coherent purpose. No replacement stylesheet can become another multi-purpose
monolith. Source, built output, package inventory, and stylesheet order must
remain deterministic and local to the extension.

## Preserved behavior

This feature changes presentation only. It does not change:

- control names, types, IDs, roles, or hidden and disabled ownership;
- workspace, view, subview, record, or focus state;
- Live, Projects, Library, Sessions, Defects, Schemas, or Hotkeys actions;
- project, repository, import, export, clipboard, storage, or Chrome API effects;
- validation, recovery, Undo, Redo, conflict, or publication behavior;
- the packaged wordmark or other generated artwork; or
- Specification Studio layout or product behavior.

## Development focus

Use these direct checks during red/green work:

1. a focused stylesheet-role and decomposition contract;
2. `test/twatility-side-panel-shell-browser-test.mjs`; and
3. the side-panel targets in `test/twatility-workflow-polish-browser-test.mjs`.

The first visual comparison must cover Live at 360 CSS px, Library at 420 CSS
px, and Schemas at 512 CSS px. It must record computed role evidence, current
images, approved images, and differences. It must also cover keyboard focus,
reduced motion, forced colors, document overflow, clipped text, and state
readability.

## QA impact and ownership forecast

Likely existing shared integration surfaces are:

- `twatility-brand.css` shared by the side-panel and Studio;
- `side-panel-brand.css` and its current global Shell ownership;
- `side-panel.html` stylesheet order;
- `scripts/build.mjs` and package inventory;
- the brand foundation, side-panel shell, and workflow browser tests; and
- `verification/packs.json` stylesheet and changed-path ownership.

Proposed new source prefix:

- the focused side-panel style-module directory chosen by the coder — parent
  pack `shell`, subordinate slice `side_panel_brand_presentation`, exact pack
  consumers `branding_polish`, `command-palette`, `hotkeys`,
  `project_management`, `durable_project_repository`, `capture`,
  `event-library`, `project_event_transport`, `schemas`, `defects`, `replay`,
  `live_flow_testing`, `layered_schema`, and `schema_relationship_tree`.

The coder must run read-only intent classification before product coding. The
current global stylesheet path and the proposed slice must both be present in
that forecast. Exact planning can widen or reduce the forecast only through the
canonical current/base ownership rules. An all-runnable-pack feature checkpoint
is not authorized.

### Classification correction

The `global` value on the current `side-panel-brand.css` declaration describes
the old stylesheet boundary. It does not classify this product feature as
application-wide. The stylesheet is loaded by the side-panel document and the
approved behavior change is limited to that document.

The canonical feature-mode plan for `side-panel-brand.css` alone selects the
`SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET`, distribution build proof, and a durable
terminal release obligation. It selects no complete verification pack. The
terminal obligation reserves application-wide evidence for a later explicit
master-integration checkpoint; it does not authorize all 21 packs now.

As the candidate replaces the old stylesheet responsibilities, each new focused
stylesheet declaration must select its exact owner and declared side-panel
consumers. Changes to the HTML style order, build inventory, registry, and direct
tests select only their canonical owners, consumers, and task slices. The coder
must not set `genuinely-global` only because the former file has a `global`
declaration or a legacy `globalImpact` entry.

If unrelated accumulated paths cause an all-pack result, the coder must isolate
the bounded product candidate or use the standing ownership-preparation path.
Such a result is not evidence that this side-panel redesign is global.

## Delivery and reporting

The implementation-and-review effort ceiling is eight hours. At four hours,
report completed visible roles, CSS responsibility moves, exact changed paths,
exact planned packs and tasks, visual evidence, failures, remaining work,
confidence, and forecast. Continue while product scope is unchanged and a safe,
bounded completion path remains.

Coder and reviewers must use focused evidence with properties and package proof.
No role runs Gherkin mutation or the all-runnable-pack gate for this feature.

## Acceptance authority

- `features/side-panel-paper-first-brand-alignment.feature`
- `features/side-panel-paper-first-brand-alignment-runtime.feature`
