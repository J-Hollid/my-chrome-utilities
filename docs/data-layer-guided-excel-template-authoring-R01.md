# Data layer guided Excel template authoring R01

Status: QA-integrated at `a8ee95869b` on 2026-08-19

Prepared: 2026-08-18

## Outcome

An operator can turn an ordinary styled Excel range into a repeatable documentation pattern without hidden functional Notes, literal endpoint coordinates, or prior knowledge of template-engine terminology. The product teaches every available value and repeatable collection in the Template Library and in the downloaded starter workbook. Upload findings use the same operator-facing terms and identify a valid repair without guessing how the workbook was edited.

This correction replaces the Excel Note-based contract before adoption. Contract-version-1 Excel workbooks, Note directives, compatibility rendering, and migration are not part of the outcome. The Rich-page contract and the presentation-safe documentation context remain unchanged.

## Guided workbook contract

A guided starter is a valid, unencrypted, macro-free `.xlsx` workbook containing:

- one `Template` worksheet containing the operator's output design;
- one visible `Template Guide` worksheet containing the applicable kind, current contract, editable area setup, binding glossary, and worked examples; and
- workbook named areas that connect styled Template ranges to the visible area setup.

Only the rendered Template worksheet appears in populated output. Template Guide is authoring material and is not copied into output. Worksheet Notes and Comments never declare template behavior.

The Template Guide uses the same vocabulary as the Template Library:

- **single value**: one value inserted by an exact cell placeholder such as `{{project.name}}`;
- **repeatable data**: an ordered collection such as `flow.pages`;
- **repeat area**: the complete named rectangular Template range copied for every item;
- **item prefix**: the fixed prefix made available by a collection, such as `page` for `flow.pages`;
- **direction**: `Across` or `Down`; and
- **nested repeat**: a named repeat area wholly contained by another repeat area.

The functional syntax on Template Guide consists of two visible Excel tables. `TemplateSettings` contains these rows:

| Setting | Value |
|---|---|
| `Contract` | `2` |
| `Kind` | `overview`, `flow`, `matrix`, or `profile` |

`TemplateAreas` has the exact columns `Area`, `Type`, `Source`, and `Direction`. `Area` is an Excel workbook-defined name referring to one rectangular range on Template. The supported rows are:

| Area | Type | Source | Direction |
|---|---|---|---|
| `PageCard` | `Repeat` | `flow.pages` | `Across` |
| `EventRow` | `Repeat` | `page.events` | `Down` |
| `ThemeLogo` | `Image` | `theme.logo` | blank |

The names are examples; operators may use any valid, unique Excel name. `Source` must be a collection or image source shown as available by the kind-specific guide. `Direction` is required for `Repeat` and blank for `Image`. Item prefixes are fixed by the public binding catalogue rather than invented by the operator. A repeat area may contain ordinary text, bindings, supported styling, merges that remain wholly within its boundary, images, and nested repeat areas.

Each copy receives one item in the existing configured collection order. `Across` places copies from left to right and shifts later Template content to the right. `Down` places copies from top to bottom and shifts later content down. An empty collection emits no copy. A nested repeat must be wholly contained by its parent and may select only a collection listed as available inside that parent. Crossing or partially overlapping repeat areas are invalid.

Cutting and pasting a complete named repeat area must retain its name, source, direction, nesting, and dimensions at the new location. The operator does not edit an endpoint or another hidden instruction after moving it.

The saved Theme logo uses a named image area recorded visibly in Template Guide. Rendering preserves the current supported PNG, JPEG, and GIF behavior, fits without enlargement, and leaves the area empty when the theme has no logo.

## Guidance in the Template Library

Excel guidance separates single values from repeatable data. Every value entry contains:

- its exact cell placeholder;
- a plain-language meaning;
- an example value; and
- where it is available.

Every repeatable-data entry contains:

- its collection name and plain-language meaning;
- its fixed item prefix;
- the fields and nested collections available inside it;
- supported directions;
- the fact that the complete named area is copied;
- the empty-collection result; and
- a concrete Template Guide example.

The guide is searchable by exact path and ordinary-language description. It includes one Down repeat, one Across repeat, and one nested repeat. These are examples of the general layout mechanism, not prescribed Flow topology or a new documentation data model.

Selecting an Excel workbook creates an unsaved candidate. Candidate inspection shows its declared kind, binding cells, named image areas, and for every repeat its named range, collection, item prefix, direction, and parent. A valid candidate can produce `Populated preview — output only` from the current immutable section snapshot before saving or assignment. The preview is clearly labelled as generated output rather than a reusable template. Only `Save template` persists the candidate body and template record.

## Validation language

Primary findings are written for an operator and contain:

1. the affected Template worksheet cell or named area;
2. what cannot be used;
3. the applicable authoring rule; and
4. one or more valid repair actions.

They do not infer whether the operator cut, pasted, copied, typed, or used another editor action. They use `repeat area`, `available inside`, `Across`, and `Down`, matching the guides. Internal terms such as rectangle, scope-owner resolution, package part, or parser directive appear only in initially collapsed technical details when they add diagnostic value.

An invalid parent repeat suppresses dependent binding findings until the parent is valid. This prevents one root problem from appearing as unrelated errors. Examples include:

- `Template B6 cannot use event.eventName here. Put B6 inside a repeat of page.events or choose a field shown as available here.`
- `EventRow must fit completely inside its parent area PageCard. Resize EventRow or PageCard so the smaller area is completely contained.`
- `Repeat area PageCard cannot be found. Select the intended Template cells and define the named area PageCard.`

Package, active-content, size, and Excel-limit failures retain their existing fail-closed behavior. Invalid candidates cannot be previewed, saved, assigned, or rendered. Project values remain literal and cannot create formulas, placeholders, workbook instructions, relationships, or additional layout.

Standard printer-settings parts written by Excel are inert package metadata, not
macros or template behavior. A printer-settings binary is accepted only when it
uses the standard printer-settings content type, has one safe internal
relationship from an existing `Template` or `Template Guide` worksheet, and is
the target of that relationship. Arbitrary binary parts, external targets,
macros, ActiveX controls, embedded packages, signatures, and broken or ambiguous
printer-settings relationships remain rejected. Accepted printer settings do
not add bindings, repeat areas, instructions, project fields, or output behavior;
only the already supported `Template` page setup, headers, and footers can affect
populated output. Saving retains the exact selected workbook bytes and their
matching digest and byte length.

## Preserved boundaries and exclusions

The template remains a presentation-only consumer of the existing immutable documentation snapshot. It cannot select, sort, filter, query, regroup, or mutate documentation data. The configured kinds, roots, collections, order, privacy boundary, incomplete-Draft behavior, output scopes, portability, assignment, staleness, and Built-in fallback remain unchanged.

The correction does not add a branch-specific Flow structure, conditional expressions, formulas, scripts, macros, queries, external content, DOCX output, multiple output worksheets per section, or a general spreadsheet programming language.

## Development focus and QA impact

Stable task name: `guided-excel-template-authoring`.

Development focus is the contract-2 workbook parser, starter, renderer, candidate inspection, guide, preview, and operator-facing findings. Red/green iteration should begin with `test/data-layer-documentation-template-excel-test.mjs` and `test/data-layer-documentation-template-library-test.mjs`, then cover the installed Flow-documentation adapter once the contract and Library flow are coherent.

The expected implementation effort ceiling is 12 active hours. At six active hours, report whether generated starters round-trip through `TemplateSettings`, `TemplateAreas`, and workbook-defined ranges; whether a selected workbook remains an unsaved inspectable candidate; the cause of any variance; remaining renderer, validation, guide, installed-evidence, and packaging work; confidence; and the current completion forecast. These are reporting expectations rather than automatic stop conditions while the approved behavior and safety boundary remain unchanged.

The coder must perform the governed read-only intent classification from the current QA head before product coding. A `coarse-boundary` result requires an independently reviewed ownership-preparation stage. `granularity-assessment-required` and `coarse-within-pack` require structured judgment and do not automatically start preparation.

Likely existing integration surfaces are:

| Proposed source prefix | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `src/documentation-templates/` | `flow_export` | `documentation_template_workspace` | Documentation Template Library, Documentation preview/export, and `shell/documentation_workspace_consumer` |
| `src/project-documentation/workspace-template-` | `flow_export` | `documentation_template_workspace` | Documentation workspace contribution and `shell/documentation_workspace_consumer` |

Expected focused evidence covers the two revised Excel product/runtime features, template Excel and Library unit tests, installed Flow-documentation browser behavior, starter OOXML inspection, movement through an Excel-compatible editor, accessible findings and guide controls, immutable candidate preview, literal-value safety, and package proof when delivered dependencies change.

No stopped coherent candidate exists for this correction, so there are no additional candidate paths to replay. No durable repository, archive, application-composition, or build-delivery change is expected. If intent classification identifies one of those paths, the coder records it as forecast variance before coding and routes it through its existing parent pack or reviewed subordinate slice.

## Settled QA result

The approved feature was first dispatched at 21:16:40Z on 2026-08-18. Its
initial evidence exposed the eligible-repair admission deadlock, so product work
paused while the independently reviewed prerequisite reached QA. The conserved
feature resumed from exact QA scorecard `4be970ec` at 06:03:13Z on 2026-08-19,
reached architect `qa-ready` at 08:34:28Z, and fast-forwarded into QA at
08:36:54Z. Resumption-to-QA took 2 hours 33 minutes 41 seconds; initial dispatch
through QA, including the prerequisite, took 11 hours 20 minutes 14 seconds.

Within the resumed lineage, the first coherent implementation commit arrived
4 minutes 23 seconds after resumption. That commit to the final pre-architect
reviewed head took 1 hour 44 minutes 49 seconds; the reviewed head to architect
handoff took 42 minutes 3 seconds; and handoff to integration took 2 minutes
26 seconds. The main durable channel does not retain separate intermediate claim
timestamps, so these are lineage intervals rather than inferred claim-to-claim
role timings.

Six successful focused checkpoints ran in about 29 minutes 45 seconds total.
The first two selected three packs and 61 tasks in about 2 minutes 41 seconds
each; the next selected two packs and 60 tasks in about 2 minutes 36 seconds;
and the last three selected the settled exact `flow_export`,
`project_management`, and `shell` plan of 135 tasks in about 7 minutes 17
seconds, 7 minutes 16 seconds, and 7 minutes 15 seconds. Each accepted receipt
included properties and package proof. The final tree covers the contract-2
workbook, named repeat and image areas, searchable authoring catalogue,
inspectable unsaved preview, installed Flow export, literal-value safety, and
generated package.

Two earlier evidence runs failed the `flow_export` acceptance session. Incident
`de9ffec1-dd07-4cf4-b91f-f94b59f91fe6` identified stale contract-1 example
relations; exact repair
`d929c43744` passed its deterministic regression and recorded atomic focused
evidence plus terminal deferral. Incident
`f307c5b7-6656-464e-8a29-6d71cfb32025` identified an incomplete
installed-evidence relation after new browser proof keys were added; exact repair
`1792e9fd82` did the same. Both incidents remain unresolved on their recorded
repair candidates for the later master checkpoint. Subsequent review separated
the Excel catalogue and guidance UI, registered their exact ownership, repaired
authoring behavior, added layout property coverage, and refreshed mutation
evidence. Five passing focused trees were superseded by those later reviewed
changes; no all-20 checkpoint or terminal pass ran.

Recommendation: **adjust** the next comparable authoring slice by settling its
acceptance example relations, installed evidence-key inventory, extracted-source
ownership, and layout properties before the first evidence-producing run. Retain
the focused QA pilot and eligible-repair route; do not start another broad
verification program from these task-local repairs.

## Excel printer-settings compatibility correction

Stable task name: `excel-printer-settings-compatibility`.

The current validator rejects every `.bin` package part, including standard
printer settings created when Excel saves an otherwise valid guided workbook.
Correct that false positive without introducing a general binary-content
exception. Cover printer settings related from both `Template` and `Template
Guide`, arbitrary numbering of standard printer-settings parts, exact candidate
inspection and persistence, and unchanged rejection of unrecognized or active
binary content.

**Development focus:** begin with
`test/data-layer-documentation-template-excel-test.mjs` using small actual OOXML
fixtures for accepted worksheet printer settings and rejected binary or
relationship variants. Then cover candidate preview and exact-byte save through
the installed Documentation Template Library.

**QA impact:** forecast `flow_export` and its declared `shell` Documentation
workspace consumer, with package proof if delivered files change. The exact
changed-path plan is authoritative. Likely existing shared integration surfaces
are `src/documentation-templates/excel-workbook.ts`, the Excel template unit
test, the installed Flow-documentation browser target, and generated `dist/`
companions. No new source prefix, persistence behavior, archive behavior, or
all-runnable-pack feature checkpoint is expected.

The implementation-and-review effort ceiling is four active hours. At two active
hours report accepted and rejected package variants, installed preview and save
status, the exact planned packs and tasks, failures, remaining work, confidence,
and completion forecast. Continue while the accepted printer-settings boundary
remains narrow, inert, internally related, and covered by unchanged active-
content rejection.
