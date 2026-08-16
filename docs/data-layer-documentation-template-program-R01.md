# Data layer documentation template program R01

Status: approved by the user on 2026-08-17; implementation handoff is queued
behind QA integration of the project asset-body and v3 archive prerequisite

Prepared: 2026-08-17

## Purpose

Allow a project to present its existing Documentation Set through reusable Excel
and rich-page templates without creating another documentation definition,
schema, Page document, or export data model. Built-in Excel and rich rendering
remain the default. A custom template changes presentation only and consumes the
same immutable documentation snapshot, selected sections, configured rows,
columns, concepts, context order, theme, stale state, and incomplete-Draft state.

The existing documentation kinds remain exactly:

- Overview;
- Flow value map, including the Pages and contained Event occurrences already
  selected inside that Flow section;
- project-wide Data capture matrix; and
- Site Profile property table.

There is no new Page documentation section. A Flow template may repeat a visual
pattern for the existing Page contexts within that Flow document.

## Product model

A project owns a Documentation Template Library. A template has a stable
identity, human name, output format, applicable documentation kind, template
contract version, current content digest, and validation result. An Excel
template refers to one project-owned binary body. A rich-page template stores one
safe semantic block tree. Template bodies are Draft content, survive reload and
project portability, and create no production revision.

Each Documentation Set has one template assignment for each output-format and
documentation-kind pair. Every unassigned pair resolves to `Built-in`. One
assignment applies to every section of that kind: for example, the selected Flow
Excel template renders every selected Flow section, and the selected Profile rich
template renders every selected Site Profile section. Per-section overrides and
whole-workbook templates are not part of R01.

The Template Library opens from the persistent Documentation context rather than
becoming a fourth primary workspace tab. It lists Built-in and project templates
by format and kind, supports starter download, Excel upload, rich-template
creation, rename, replacement, duplication, assignment, and guarded removal, and
shows exact validation findings. At 1280 pixels list and detail may be visible
together. At 360 pixels they open one at a time without horizontal page scrolling.

An assigned template cannot be removed. The operator first assigns Built-in or
another compatible template. Replacing a template body retains its stable
identity, creates one reversible project command, and marks every preview that
used its former digest stale.

## Stable template context

Contract version 1 exposes presentation-safe values only. It never exposes raw
project identities, source identities, revision hashes, provenance, diagnostics,
repair targets, repository keys, Blob URLs, or unpublished template bodies.

Every kind receives these roots:

| Root | Values |
|---|---|
| `document` | `title`, `incomplete`, `generatedAt` |
| `project` | `name`, `purpose`, `website` |
| `set` | `name` |
| `section` | `name`, `kind` |
| `theme` | `name`, `clientName`, `headerText`, `footerText`, `logo` |
| `table` | ordered `columns`, ordered `rows`, ordered non-empty `concepts`, and optional `legend` |

`table.columns` entries expose `key` and `heading`. `table.rows` entries expose
`concept` and ordered `cells`. Each cell exposes `columnKey`, `heading`, and
literal `value`. Only configured columns and rows enter these collections.

Kind-specific roots add:

| Kind | Roots and collections |
|---|---|
| Overview | `overview.fields`, each with `label` and `value` in Name, Purpose, Website order |
| Flow | `flow.name`, ordered `flow.pages`, ordered `flow.columns`, and ordered `flow.rows` |
| Matrix | ordered `matrix.columns`, `matrix.rows`, `matrix.concepts`, and `matrix.legend` |
| Profile | `profile.name`, ordered `profile.rows`, and ordered `profile.concepts` |

Each `flow.pages` entry exposes `stepLabel`, `pageName`, `sourcePageName`,
`eventName`, `heading`, its Page-context `rows`, and ordered contained `events`.
Each contained Event exposes `eventName`, `heading`, and its context `rows`.
Flow and context rows expose `property`, configured metadata values, and literal
`value` for that context. `flow.columns` and `flow.rows` expose the existing
transposed value-map form; each Flow row has ordered `cells` aligned with the
configured Flow columns.

Matrix rows expose `property`, `concept`, and ordered `cells` aligned with the
configured matrix columns. Matrix cells expose the existing Mandatory, Optional,
Conditional, Not expected, Not defined, or Blocked presentation. Profile rows
expose `property`, `concept`, and only the configured Property, Description,
Required, Allowed values, Example, and Comments values. Concept collections
contain only included, non-empty groups in Documentation Set order.

Templates cannot sort, filter, query, or mutate the context. Collection order is
the already-configured Documentation Set order. Missing optional values render as
empty literal text.

## Excel prototype contract

An Excel template is one valid, unencrypted, macro-free `.xlsx` workbook with
exactly one worksheet. The upload identifies its applicable documentation kind
from exactly one worksheet Note:

```text
tw:template(kind="flow" contract="1")
```

The first release preserves ordinary static cells, literal numbers and booleans,
fonts, fills, borders, alignment, number formats, row heights, column widths,
merged cells, page setup, headers and footers, and embedded PNG, JPEG, or GIF
images. The generated worksheet takes the Documentation section's deterministic
safe name rather than the prototype worksheet name.

Cell text may contain one or more scalar placeholders such as
`{{project.name}}` or `{{page.pageName}}`. A known optional value that is absent
becomes empty text. An unknown or out-of-scope path invalidates the template.
Inserted project values are literal cell content even when they begin with `=`,
`+`, `-`, or `@`.

An ordinary Excel Note on the top-left cell of a rectangular prototype region
defines collection repetition:

```text
tw:each(items="flow.pages" var="page" direction="right" lastCell="D8")
tw:each(items="table.rows" var="row" direction="down" lastCell="H10")
```

`lastCell` is the lower-right cell on the same worksheet. `down` inserts enough
copies of the complete region below the prototype and shifts later content down.
`right` inserts copies to the right and shifts later content right. Each copy
retains supported presentation and binds its declared item variable. A collection
with no items removes the prototype region. Template directives and directive
Notes are absent from generated output.

Repeat regions may nest only when the inner rectangle is wholly contained by the
outer rectangle. Crossing, partially overlapping, circular, out-of-bounds, or
same-direction expansion that would overwrite another directive is invalid.
Merged cells must be wholly inside or wholly outside each repeated rectangle.
Generation blocks rather than truncates when expansion would exceed Excel's row
or column limits.

One image directive may bind the existing theme logo into a rectangular fit area:

```text
tw:image(source="theme.logo" lastCell="C3")
```

It preserves the existing supported image bytes and aspect-ratio fit without
enlargement. An absent logo leaves the area empty.

The template language has no arbitrary expressions, functions, conditions,
formulas, scripts, macros, queries, external fetches, or access outside the
versioned binding catalogue. Template workbooks containing formulas, macro or
add-in parts, external links, linked media, data connections, embedded packages,
charts, pivot tables, slicers, or unsupported drawings are rejected rather than
silently altered. The source is limited to 10 MiB, 2,000 ZIP entries, and 50 MiB
of declared unpacked content. Validation rejects unsafe entry paths, duplicate or
missing parts, encrypted content, signature or media-type mismatch, decompression
limit violations, broken relationships, and invalid OOXML.

For each kind, `Download starter template` returns exactly one valid prototype
worksheet that recreates the Built-in structure using contract-version-1
markers. Template help in the Library lists every binding valid for the selected
kind and shows exact worksheet, cell, directive, and binding findings after
upload. `Download sample-filled workbook` renders the candidate against the
current selected section without assigning or saving it.

## Rich-page template contract

A Rich Page Template is authored inside the Documentation Template Library. It
starts as the Built-in page for its selected kind and uses safe semantic blocks:

- heading;
- paragraph with ordinary emphasis and binding chips;
- divider;
- Theme logo;
- repeat collection;
- data table; and
- concept group.

The editor offers only bindings valid in the current block scope. A repeat block
selects one allowed collection, binds one visible item name, and may contain
semantic child blocks. Nesting follows the same scope rules as Excel repetition.
The Flow starter can repeat a Page block over `flow.pages` and a contained Event
block over `page.events`. A data-table block binds the already configured ordered
table, Flow value map, matrix, Profile rows, or Overview fields; it cannot select
new contexts, properties, columns, or concepts.

There is no raw HTML, CSS, JavaScript, expression, query, Confluence storage
markup, or ADF source editor. The applied Documentation theme styles supported
data-table blocks. Theme logo, client name, header, and footer appear only where
the template contains their blocks or bindings.

Preview renders the selected section through its assigned Rich template. Current,
selected, and complete rich-copy scopes apply the compatible template once per
section in configured order and combine those semantic sections into one
clipboard payload. Rich HTML and the plain-text fallback contain the same visible
values, headings, groups, and order. Generated content remains inert and cannot
inject elements, attributes, styles, scripts, markers, or additional table shape.

Direct Confluence authentication, page selection, page creation or update,
storage-format or ADF upload, DOCX generation, arbitrary HTML import, and
whole-document rich templates are deferred.

## Snapshot, fallback, and portability

Template assignment and the exact assigned template digest are part of immutable
snapshot identity. A replaced, removed, reassigned, or edited template makes an
existing preview stale. Stale export remains disabled until refresh. One refreshed
snapshot supplies Built-in and custom renderers for the requested output; a
renderer cannot re-read live project state while generating.

An invalid, missing, incompatible, or unavailable custom template never silently
falls back during preview or export. The affected format is blocked with a repair
link. The operator may explicitly assign Built-in. Built-in rendering retains the
current workbook, rich HTML, plain-text, theme, scope, stale, incomplete-Draft,
sanitization, and read-only behavior.

Project portability carries template metadata, assignments, rich block trees,
and each referenced Excel body exactly once. Import validates bodies before an
atomic commit and preserves stable references. Failure leaves no partial project,
template, or asset. Normal project loading reads template metadata but does not
parse every Excel body; validation, sample generation, preview, or export reads
only the selected body.

## Delivery and verification boundary

This is one bounded user-visible Documentation feature built after the approved
project asset-body and version-3 archive boundary is available. It consumes that
boundary and must not create a second Base64, root-record, or non-portable binary
store. If that prerequisite is not integrated, implementation does not start from
an abandoned candidate and instead waits for a current QA base containing the
settled boundary.

**Development focus:** begin with the versioned safe template context and the
Excel marker parser/validator/renderer using small in-memory workbooks. Add the
Template Library assignment and stale-snapshot behavior, then the rich semantic
block renderer and installed Documentation controls. Use one direct unit target
for marker geometry and literal-cell safety, one for rich block scope and
sanitization, and the installed Documentation browser target.

**QA impact:** forecast `flow_export`, `project_management`, and
`durable_project_repository`, followed by package proof. Exact changed-path
planning remains authoritative and may add a bounded owner selected by the
settled asset-port use. If shared infrastructure unexpectedly selects all 20
packs, task launch stops for the feature-mode scope choice. No feature role runs
the all-20 gate.

The implementation-and-review elapsed effort ceiling is twelve hours. At six
hours, report the safe-context and Excel rendering status for all four kinds,
installed upload and assignment status, asset and portability status, rich-editor
status, exact planned packs, variance cause, remaining behavior, confidence, and
forecast. Continue by default while the approved product scope is unchanged and
the completion path remains bounded and causally understood.

Installed evidence uses actual file selection, actual persisted project state,
the production compiler and immutable snapshot, an independent OOXML parser, the
real download and clipboard adapters, reload and portability, and the 1280- and
360-pixel Documentation workspace. It proves all four kinds, horizontal Page
patterns, vertical and nested repetition, mixed Built-in and custom assignments,
sample generation, rich and plain parity, stale and incomplete protection,
rejection findings, literal-cell safety, and unchanged project definitions and
publication bytes.
