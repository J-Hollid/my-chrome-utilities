# Data layer guided Excel template authoring R01

Status: guided authoring QA-integrated at `a8ee95869b` on 2026-08-19; Contract 3 area-properties correction QA-integrated at `03d023b039` on 2026-08-24 after exact `flow_export`/34-task review-ready evidence; generated separator-presentation and output-background correction QA-integrated in combined candidate `119c25ef7a` on 2026-08-24 after exact six-pack/200-task review-ready evidence

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

## Excel area-properties correction

Stable task name: `excel-template-area-properties`.

This section supersedes the guided starter's contract version and
`TemplateAreas` column shape above. It preserves the earlier Contract 2 behavior
as the compatibility path described below.

### Recommendation and research basis

Add one visible `Properties` column to `TemplateAreas` rather than adding one
column per layout option or introducing expressions in cell placeholders. The
cell uses a strict CSS-inspired declaration list. This follows the useful split
in [CSS Images](https://www.w3.org/TR/css-images-3/#the-object-fit) between
object sizing and positioning, while remaining compatible with Excel's
rectangle-and-anchor image model. Excel's
[IMAGE function](https://support.microsoft.com/en-us/office/image-function-7e112975-5e52-4f2a-b9da-1d913d51f5d5)
and Google Sheets'
[IMAGE function](https://support.google.com/docs/answer/3093333?hl=en) likewise
separate fit behavior from the surrounding cell layout. XlsxWriter documents
[offsets, scaling, and object positioning](https://xlsxwriter.readthedocs.io/worksheet.html#worksheet-insert_image)
as drawing properties rather than cell styles. These practices support explicit
generated-image geometry for behavior that cannot be expressed reliably by
styling the area's cells.

The same column can hold a repeat-only `separator-area` declaration. That solves
the immediate final-delimiter problem without adding lookahead, conditionals,
formula evaluation, or a general template language. The precedent is the
loop-separator/last-item behavior exposed by template systems such as
[Liquid iteration](https://shopify.github.io/liquid/tags/iteration/), but the
workbook contract expresses the outcome through a visible named sub-area rather
than executable syntax.

Cropping is intentionally absent. `cover`, source rectangles, rotation,
opacity, hyperlinks, image replacement rules, per-repeat indexes, lookahead,
conditionals, and arbitrary declarations remain possible future extensions only
when a concrete use case is approved.

### Contract 3 and the Properties grammar

New guided starters declare `Contract` value `3`. Their `TemplateAreas` table
has the exact columns `Area`, `Type`, `Source`, `Direction`, and `Properties`.
Contract 2 workbooks with the exact four existing columns remain accepted,
inspectable, previewable, saveable, assignable, and renderable without migration
or byte rewriting. Contract 1 and Note-based instructions remain rejected.

A Properties cell is blank or contains this declaration list:

```text
declarations = declaration (";" declaration)* [";"]
declaration  = property-name ":" value
```

Whitespace around declarations, colons, and semicolons is insignificant.
Property names and fixed keywords are ASCII case-insensitive; the guides emit
the canonical lowercase forms below. Named-area values follow Excel's defined-
name matching rules. Declaration order does not change the result. Unknown
properties, duplicate properties, missing names or values, and malformed values
are invalid rather than ignored. One cell may combine every property supported
by that row type, for example:

```text
fit: scale-down; position: center; padding: 8px
```

The supported rows are:

| Type | Supported Properties | Blank Properties |
|---|---|---|
| `Image` | `fit`, `position`, `padding` | `fit: scale-down; position: left top; padding: 0px` |
| `Repeat` | `separator-area` | copy the complete repeat area for every item |

An Image row cannot use `separator-area`; a Repeat row cannot use `fit`,
`position`, or `padding`.

### Generated-image layout

Image properties apply only to images generated by a `Type` value of `Image`,
including `theme.logo` and contextual `page.visual.image`. They do not reposition
static images authored directly into the workbook.

Rendering performs these operations in order:

1. resolve the named area's pixel rectangle from its rows and columns;
2. subtract `padding` to produce one usable rectangle;
3. size the image according to `fit`; and
4. place the sized image inside the usable rectangle according to `position`.

`fit` accepts:

- `scale-down`: preserve aspect ratio, fit wholly inside the usable rectangle,
  and never enlarge beyond natural dimensions; or
- `contain`: preserve aspect ratio and use the largest size wholly inside the
  usable rectangle, including enlargement when the source is smaller.

Neither value crops, distorts, or permits pixels outside the usable rectangle.

`position` accepts either `center` or a horizontal value followed by a vertical
value. Horizontal values are `left`, `center`, `right`, or a percentage from
`0%` through `100%`; vertical values are `top`, `center`, `bottom`, or a
percentage in the same range. A percentage positions the image by that fraction
of the free space on the applicable axis: `0%` is the leading edge, `50%` is
centered, and `100%` is the trailing edge.

`padding` accepts one through four nonnegative finite pixel lengths using CSS
shorthand order: all sides; vertical and horizontal; top, horizontal, and
bottom; or top, right, bottom, and left. Fractional pixels are permitted. Padding
that leaves no positive usable width or height is invalid. Padding is the one
supported edge-spacing property; a separate `margin` declaration would produce
the same generated-image geometry and is not added.

For a 100 by 60 pixel area and a natural 40 by 20 pixel image,
`fit: scale-down; position: center; padding: 8px` produces a 40 by 20 image at
offset 30,20 from the area's top-left. A missing image source still leaves the
area empty and preserves surrounding layout.

### Repeat separator areas

A Repeat row may declare one workbook-defined name:

```text
separator-area: PageSeparator
```

The named separator is a rectangular sub-area on `Template`, occurs once, and
is wholly inside its owning repeat area. For an `Across` repeat it consists of
one or more complete rightmost columns spanning the repeat's full height. For a
`Down` repeat it consists of one or more complete bottom rows spanning the
repeat's full width. Removing it must leave one non-empty rectangular item area.

The separator may contain literal cell content and supported cell presentation.
Bindings, generated-image areas, nested repeat areas, drawings, and merges that
cross the item/separator boundary are invalid inside it. Nested repeats remain
supported inside the item area and keep their own independent separator rules.

The renderer emits the item area once for each ordered source item and emits the
separator area only between adjacent items. For source cardinality `N`, output
therefore contains `N` item areas and `max(N - 1, 0)` separator areas. Zero items
emit neither area; one item emits no separator. Later static content shifts by
the exact combined output dimensions, so no blank trailing separator row or
column remains.

For the requested two-column pattern, define `PageStep` as `A1:B1`, define
`PageSeparator` as `B1:B1`, put `{{page.pageName}}` in A1 and `>>` in B1, and
configure this row:

| Area | Type | Source | Direction | Properties |
|---|---|---|---|---|
| `PageStep` | `Repeat` | `flow.pages` | `Across` | `separator-area: PageSeparator` |

Three Pages render as `Page 1`, `>>`, `Page 2`, `>>`, `Page 3` in five columns.
The final Page has neither an arrow nor an empty separator column. Cutting and
pasting the complete owning repeat together with its separator retains both
defined names and the Properties reference at the new location.

### Guidance, inspection, and validation

The downloaded Template Guide and searchable Library guide document the exact
grammar, defaults, combined image example, percentage positioning, one-to-four
value padding, and Across and Down separator examples. Candidate inspection
shows the normalized declarations for Contract 3 areas and describes the
implicit legacy defaults for Contract 2 areas.

An invalid declaration produces one primary operator-facing finding at
`TemplateAreas <Area> Properties`, states the rejected property or geometry,
and offers a supported value or repair. A missing separator name, separator on
the wrong edge, empty item remainder, overlap with another instruction, padding
that consumes the area, row-type mismatch, unknown key, duplicate key, and
malformed value all fail closed. Invalid candidates cannot be previewed, saved,
assigned, or rendered, and leave the candidate, prior preview, stored template,
assignment, and project unchanged. Technical details remain initially collapsed.

### Preserved boundaries and delivery focus

This correction changes presentation metadata and generated workbook geometry
only. It does not change the documentation snapshot, collection order, binding
catalogue, saved image bodies, attachment identity, project schema, template-
body persistence, or publication state. It does not add crop behavior, formulas,
placeholder expressions, indexes, loop metadata, lookahead, or conditional
evaluation.

Development begins with
`test/data-layer-documentation-template-excel-test.mjs` for Contract 2/3 parsing,
image geometry, separator cardinalities, and invalid declarations, followed by
`test/data-layer-documentation-template-library-test.mjs` for guidance,
inspection, and candidate-state safety. Installed Flow Documentation evidence
then covers the combined Properties cell, generated OOXML anchors, the exact
three-item delimiter example, accessible findings, preview, assignment, and
package proof.

The implementation-and-review effort ceiling is 12 active hours. At six active
hours report Contract 2/3 round-trip status; all image geometry examples;
Across, Down, zero-, one-, and three-item separator results; invalid-property
findings; installed guidance and preview status; the exact selected packs and
tasks; failures; remaining work; confidence; and completion forecast. Continue
while the approved syntax and safety boundary remain unchanged.

The coder must perform the governed read-only intent classification from the
current QA head before product coding. A `coarse-boundary` result requires an
independently reviewed ownership-preparation stage. Structured judgment for
`granularity-assessment-required` or `coarse-within-pack` does not itself start
preparation.

Likely existing integration surfaces are:

| Proposed source prefix | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `src/documentation-templates/excel-` | `flow_export` | `documentation_template_workspace` | Template candidate validation and inspection, populated preview, assigned Excel export, and `shell/documentation_workspace_consumer` |
| `src/project-documentation/workspace-excel-template-guidance-ui.ts` | `flow_export` | `documentation_template_workspace` | Searchable Excel authoring guide and `shell/documentation_workspace_consumer` |
| `src/project-documentation/workspace-template-library-ui.ts` | `flow_export` | `documentation_template_workspace` | Candidate Properties inspection, findings, preview, save, and assignment controls |

Forecast QA impact is `flow_export`, `project_management`, and `shell`, with
properties and package proof; the exact changed-path plan is authoritative. No
all-20 feature checkpoint is authorized. No new source prefix, durable
repository, archive, application-composition, or build-delivery boundary is
expected. Any such intent-classification variance is recorded before coding and
routed through its existing parent pack or reviewed subordinate slice.

## Area-properties settled QA result

The approved specification handoff was queued at 20:10:32Z on 2026-08-23. The
first coherent implementation commit arrived 13 minutes 13 seconds later. The
lineage then corrected Contract 3 validation and guide behavior, excluded
separator drawings, and preserved exact workbook contract metadata before the
architect issued the `qa-ready` handoff at 22:02:58Z. QA fast-forwarded to exact
candidate `03d023b039` at 22:05:26Z, 1 hour 54 minutes 54 seconds after the
specification handoff and 2 minutes 28 seconds after the architecture handoff.
Commit timestamps provide the bounded implementation and review intervals where
separate role claim timestamps are not retained.

One final evidence-producing checkpoint ran from 21:58:19Z through 22:01:24Z,
about 3 minutes 5 seconds. The authoritative exact plan selected `flow_export`
alone and passed all 34 tasks, including both revised Excel product/runtime
features, generated acceptance, the installed browser pack, Contract 2 and 3
unit coverage, the dedicated area-properties property target, build, properties,
and package proof. This narrowed the forecast `project_management` and `shell`
impact through exact changed-path ownership rather than omitting planned work.

No task-local evidence run failed, no focused pass was invalidated, and no
reliability repair or rerun was required. The pre-evidence revisions were normal
coder, refactorer, and architect review corrections on the same approved
behavior. No all-20 checkpoint ran. Recommendation: **continue** the focused QA
pilot; preserve the exact planner authority and retain cumulative final
regression and promotion as a separate explicit `master` decision.

## Generated separator presentation and output background correction

Status: QA-integrated in combined candidate `119c25ef7a` on 2026-08-24 after
exact six-pack/200-task review-ready evidence

Stable task name: `excel-template-generated-presentation`

### Outcome and authoring contract

Contract 3 keeps the existing `Properties` declaration grammar and adds one
optional `Output` row type. It does not add a worksheet-wide style, executable
expression, or another configuration table. A workbook that wants a generated
background defines one finite workbook-named range around its prototype output,
including the blank edge rows or columns it wants as margins, and adds this row:

| Area | Type | Source | Direction | Properties |
|---|---|---|---|---|
| `OutputCanvas` | `Output` | blank | blank | `background-fill: #FFFFFF` |

`Output` accepts only `background-fill`. Its value is one opaque six-digit sRGB
hex color in `#RRGGBB` form; matching is ASCII case-insensitive and inspection
normalizes it to uppercase. At most one Output row is allowed. Its `Area` must
resolve to one rectangular range on `Template`, must not be nested in a repeat,
and must completely contain every Repeat, separator, Image, non-empty Template
cell, merge, and drawing that can contribute to output. `Source` and `Direction`
must be blank. Functional content outside the Output range is invalid rather
than silently clipped. Blank presentation cells outside it do not enlarge the
declared output and are not copied when an Output row is present.

The Output range is an envelope, not a copied item. Its source bounds express
the finite prototype document and intentional margins without requiring an
author to paint `A1:Z100`. Rendering projects its right and bottom edges through
every root and nested Across or Down delta, including separator expansion and
empty-repeat contraction. The final projected rectangle therefore contains all
generated cells and retains the blank rows and columns authored inside the
source envelope as margins. The renderer applies the declared solid fill to
every otherwise unfilled cell in that final rectangle after geometry is known.
An explicit Template or separator cell fill remains higher priority; the output
background never overwrites an authored fill, border, number format, font, or
alignment. No value, binding, merge, image, row height, or column width is
created by the background itself.

An omitted Output row means no generated background and preserves the exact
current Contract 3 behavior. Contract 2 remains accepted with its exact
four-column `TemplateAreas` table and has no Output row or generated background.
Existing Contract 3 workbooks are not migrated or rewritten.

### Separator presentation follows generated item geometry

The established separator cardinality and content rules do not change. For `N`
items the renderer still emits `N` item copies and `max(N - 1, 0)` separators,
with no separator slot, content, or empty trailing row or column after the final
item.

Each emitted separator now receives the orthogonal source-to-output projection
of the item immediately before it:

- for an `Across` repeat, the separator keeps its authored column width and its
  presentation expands or contracts through the preceding item copy's nested
  `Down` row transformations so it spans that generated item height; and
- for a `Down` repeat, the separator keeps its authored row height and its
  presentation expands or contracts through the preceding item copy's nested
  `Across` column transformations so it spans that generated item width.

When one source row or column maps to multiple generated coordinates, the
corresponding separator cell's supported presentation is projected to every
coordinate. Newly introduced cells receive presentation only. A separator's
literal value, note, and wholly contained merge are emitted once at their mapped
source position per inter-item separator and are never duplicated merely
because presentation expanded. This makes `D7:D9` inherit the presentation of
the aligned source separator row when a nested `page.rows` repeat expands from
row 6, while a literal `>>` at `D4` still appears only once between Page items.

### Finite generation and validation

Before materializing a declared background, rendering computes its exact final
rectangle. It must remain inside Excel's row and column limits and may cover at
most 250,000 cells per generated worksheet. Exceeding either boundary fails the
preview or export before workbook creation, reports the projected dimensions
and cell count, and recommends reducing the Output range or generated items. No
download, assignment, template, project, Draft, or publication state changes.

The OOXML uses one deduplicated solid-fill definition for the declared color.
It must not create a fill or style definition per generated cell; combinations
with existing authored styles are deduplicated by style value. Candidate
validation fails closed for an unknown or duplicate Output property, malformed
color, multiple Output rows, missing or non-rectangular named range, populated
Source or Direction, nesting, partial containment, or functional content outside
the declared envelope. Findings identify `TemplateAreas <Area> Properties` and
offer a concrete range, color, or row repair.

### Required regression and preserved boundaries

The primary regression uses an actual Contract 3 Flow workbook with
`FlowColumnHeader` repeating `flow.pages` Across in `C2:D6`, Properties
`separator-area: PageSeparator`, `PageSeparator` in `D2:D6`, literal `>>` in
`D4`, `PropertyRow` repeating `flow.rows` Down at `B6`, `PropertyValue`
repeating `page.rows` Down at `C6`, and `PageVisual` at `C3`. It removes the
old broad `A1:Z100` white fill and declares a tight `OutputCanvas` containing
the prototype plus intentional margins with `background-fill: #FFFFFF`.
Multiple Pages have differing non-empty `page.rows` collections that expand
below row 6.

Independent parsing of generated preview and assigned XLSX must prove:

- every emitted separator column carries the aligned source presentation beside
  every generated property row, including coordinates corresponding to
  `D7:D9`, and the symmetric Down/expanded-width fixture behaves identically;
- `>>` occurs once between adjacent Pages, with no value, styled separator slot,
  or empty separator column after the final Page;
- every otherwise unfilled cell in the projected OutputCanvas, including
  generated gaps and declared margins, has solid white fill, while explicit
  authored fills win and cells outside the final envelope are not backgrounded;
- the background target count equals the finite projected rectangle, stays at
  or below 250,000, and OOXML fill/style records remain deduplicated rather than
  growing per cell; and
- bindings, Page-instance image layout, immutable snapshot values, workbook
  template bytes, assignments, schemas, Draft state, and Published state remain
  unchanged.

This correction changes only generated worksheet presentation and finite
geometry bookkeeping. Image `fit`, `position`, and `padding`; separator naming
and no-final-separator behavior; collection order; binding scope; drawing safety;
and Contract 2/3 behavior without an Output declaration remain unchanged. It
does not add cropping, formulas, conditions, lookahead, arbitrary CSS, full-row
or full-column styling, worksheet background pictures, multiple output sheets,
or a general template language.

### Development focus and QA impact

Begin with `test/data-layer-documentation-template-excel-test.mjs`: drive the
exact Contract 3 workbook through nested geometry, separator presentation-only
projection, output-area validation, color normalization, fill precedence, and
the 250,000-cell preflight. Cover the symmetric Down/Across case and unchanged
Contract 2 and undeclared Contract 3 fixtures. Then update the downloaded and
searchable guides, candidate inspection, installed unsaved preview, assigned
output, independent OOXML parsing, and package proof.

Likely implementation surfaces remain inside the established
`documentation_template_workspace` slice:

| Proposed source prefix | Proposed parent pack | Exact consumers |
|---|---|---|
| `src/documentation-templates/excel-template.ts` | `flow_export` | Contract 3 Output parsing, geometry validation, repeat and separator projections, generated-cell budget |
| `src/documentation-templates/excel-workbook.ts` and `excel-renderer.ts` | `flow_export` | workbook named ranges, style copying, background materialization, preview and assigned XLSX |
| `src/documentation-templates/excel-template-catalogue.ts` | `flow_export` | downloaded Template Guide examples and validation language |
| `src/project-documentation/workspace-excel-template-guidance-ui.ts` and `workspace-template-library-ui.ts` | `flow_export` | searchable guidance, candidate inspection, and operator-facing repair |

The exact changed-path plan is authoritative. Forecast `flow_export` with
properties and package proof; this does not authorize an all-runnable-pack
checkpoint. Before product coding, run the governed read-only intent
classification from the approved specification commit. A `coarse-boundary`
result requires independently reviewed ownership preparation; bounded
`granularity-assessment-required` or `coarse-within-pack` results follow their
documented judgment route.

The implementation-and-review elapsed effort ceiling is six active hours. At
three hours report the exact generated rectangle and cell counts; Across and
Down separator projection; literal cardinality; fill precedence and OOXML style
counts; Contract 2 and undeclared Contract 3 compatibility; installed workbook
results; intent classification; selected tasks; failures; remaining work;
confidence; and forecast. Continue while the behavior remains a bounded,
state-preserving presentation correction. A different template language,
background outside the declared finite envelope, relaxed cell budget, changed
binding/image semantics, unavailable ownership, or genuinely global plan stops
for current direction.

## Combined-candidate settled QA result

The final candidate combined this correction with the separately approved
layered-schema inheritance-card consistency and Flow typed-example corrections.
Their specification handoffs were queued at 22:23:33Z, 22:46:36Z, and 23:00:50Z
on 2026-08-23 respectively. The first coherent generated-presentation
implementation arrived at 02:18:52Z on 2026-08-24, 3 hours 18 minutes 2 seconds
after this correction's handoff. The architect issued the final `qa-ready`
handoff at 06:12:57Z, and QA fast-forwarded to exact candidate `119c25ef7a` at
06:16:50Z: 7 hours 16 minutes from this correction's handoff and 3 minutes
53 seconds after the final architecture handoff. The corresponding end-to-end
intervals from the layered-schema and typed-example handoffs were 7 hours
53 minutes 17 seconds and 7 hours 30 minutes 14 seconds.

The first evidence-producing checkpoint ran from 05:56:26Z through 06:11:16Z,
about 14 minutes 51 seconds. Its authoritative exact plan selected
`flow_export`, `flow_graph`, `layered_schema`, `live_flow_testing`,
`property_set_flow_sections`, and `shell`, and passed all 200 focused tasks with
properties and package proof. It bound the exact candidate tree and the complete
combined change set. A second same-tree checkpoint, required to bind the
layered-schema task and its exact `ea912eae22` base independently, ran from
06:35:47Z through 06:50:33Z, about 14 minutes 46 seconds, and passed the same
six-pack/200-task plan. It changed no product bytes and did not advance QA. No
all-runnable-pack checkpoint ran, and no final regression claim was made.

One bounded verification-tooling blocker required acceptance-identity and task-
cardinality repairs before evidence. The first architect handoff for the layered
schema portion, `b26f25a70c`, had passing focused evidence but could not be
fast-forwarded because QA had since received the two later approved
specifications; it was rejected for lineage only and reissued on exact current QA
as the combined candidate. No task failed in either final evidence run; the
second run was an evidence-identity refresh rather than a product-failure rerun.
Recommendation: **continue with an adjustment**—retain focused exact-plan
verification, require stacked candidates to be reconstructed from current QA
before the architect issues a `qa-ready` handoff, and bind every independently
forwarded stable task before its handoff. Cumulative final regression and
promotion remain a separate explicit `master` decision.
