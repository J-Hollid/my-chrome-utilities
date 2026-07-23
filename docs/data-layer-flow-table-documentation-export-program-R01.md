# Data-layer Flow table documentation export program R01

## Authority and scope

This program activates documentation-table export for one selected Specification
Flow. It is later authority than the earlier scope statement that deferred Flow
documentation export, but only for the two table projections and output formats
defined here.

The program does not activate project-wide batch documentation, temporal Flow
validation, fixtures, coverage, release, or Live. The graph remains documentary and
per-Event schema validation remains independent.

## Outcome

An operator can turn the canonical Flow graph and its effective schemas into the two
documentation forms already used by analytics teams:

1. A Flow value map, with ordered context-setting Page events and optional nested interaction Event
   subcontexts as columns, properties as rows, and effective expected values in
   cells.
2. A data capture matrix, with context-setting Page events and optional nested interaction Event subcontexts
   as columns, the union of effective properties as rows, and a mark describing
   presence expectations in each cell.

Both views are configurable previews over one immutable export snapshot. They reuse
the existing side-panel specification-table interaction model and export as
spreadsheet clipboard text, rich HTML for Confluence or Jira, or a real `.xlsx`
workbook.

## Canonical input

An export snapshot contains:

- selected project and Flow identity;
- graph revision and selected Page-frame references plus any selected contained
  Event-occurrence references;
- documentation column labels and ordering;
- each selected context's canonical effective schema revision, property tree,
  expected values, conditions, validation rules, documentation, and provenance;
- compilation diagnostics; and
- generation time and Draft or published source state where available.

The snapshot is derived. It never stores a second schema, graph, assignment, or
validation model. If an included graph or schema revision changes, the preview is
stale and export actions remain disabled until the operator compiles a new snapshot.

## Context columns

Operators select context-setting Page events and their optional interaction Event
subcontexts through human names while stable references are stored beneath the
controls.

- Every selected Page frame is a primary context-setting event, including a Page
  with no interaction occurrence. It retains the Page's observed event identity,
  such as `pageview`, and its column compiles Shared Profile, applicable ordered Page Groups,
  Page, and Flow Page-instance contributions.
- Every selected interaction Event occurrence is nested beneath exactly one containing Page and
  extends that Page-instance branch with Event and occurrence contributions.
- Reusing one Event under different Pages produces distinct selectable occurrence
  subcontexts, so each Page may document a different expected schema instance for
  that Event.
- Page type supplies context-setting semantics and Events-catalog type supplies
  interaction semantics. Neither uses a role selector, stored role, distinct
  binding, or duplicate compiler path.

Flow selection provides context-setting Page events and their nested interaction
Event contexts for export. Production
validation continues to resolve Page applicability through assignment rules and the
observed Event; export configuration neither creates nor consults a Page-context
binding.

Column headings identify the Page primary context and may add a nested Event
subheading. They can include documentation Step label, Page instance, and Event.
Raw IDs are never visible.

## Documentation order and branching

Page-to-Page relationships propose a deterministic documentation order. A simple
Page path receives 1, 2, 3. Alternative Page branches receive labels such as 2a and
2b and remain adjacent beneath their branch group before the merge context.
Contained Event subcontexts remain immediately beneath their owning Page and never
introduce, advance, split, or merge topology.

Operators may rename Step labels and reorder documentation columns. These settings
belong to the export configuration only. They cannot change graph coordinates,
relationship direction, branch meaning, occurrence identity, or any claim about
runtime sequence.

## Flow value map

The Flow value map is a transposed effective-schema view:

| Checkout journey | Step 1 Cart · pageview | ↳ button_click | Step 2a Shipping · pageview | ↳ error | Step 2b Payment · pageview | ↳ error |
|---|---|---|---|---|---|---|
| page_name | cart | cart | shipping | shipping | payment | payment |
| form_name | checkout | checkout | checkout | checkout | checkout | checkout |
| form_step_name | cart | cart | shipping | shipping | payment | payment |
| error_message | — | — | — | address unavailable | — | payment declined |
| page_type | checkout | checkout | checkout | checkout | checkout | checkout |

Cell rendering is truthful:

| Effective definition | Cell summary |
|---|---|
| One exact expected value | The typed value |
| Several allowed values | Distinct values joined in rule order |
| Required without an expected value | `Required — value not specified` |
| Conditional value or presence | Value or presence plus the plain-language condition |
| Forbidden | `Not expected` |
| Compiler conflict | `Blocked — conflicting definitions` |
| Unresolved context | `Incomplete` |

Activating a cell shows the complete rule, expected type/value, condition, effective
revision, and provenance with direct repair links. A documented example is not
silently substituted for a missing expected value.

## Data capture matrix

The matrix rows are the union of stable effective property paths across selected
contexts. Operators may render display names or canonical paths.

| Mark | Meaning |
|---|---|
| M | Mandatory unconditionally |
| O | Optional but expected and valid |
| C | Conditional presence; details retain the structured condition |
| N | Explicitly forbidden or not expected |
| — | Not declared for this context |
| ! | Blocked or conflicting effective definition |

`N` and `—` are never collapsed: forbidden is enforceable while undeclared carries
no expectation. Activating `C` or `!` shows the exact condition or conflict and its
provenance.

## Shared table configuration

The feature reuses the existing specification-table conventions:

- searchable property selection;
- property and context ordering with pointer and keyboard controls;
- Include headings;
- Spreadsheet or Rich table for Confluence or Jira;
- Plain, Bordered, or Bordered with highlighted headings;
- semantic HTML with matching plain-text fallback;
- escaped cell content and deliberate line-break preservation; and
- visible preview retained if clipboard writing fails.

Flow-specific controls add:

- Flow value map or Data capture matrix;
- Page-frame selection with nested contained Event-occurrence selection;
- Step/Page/Event heading format;
- branch label and documentation-order overrides;
- matrix symbols and legend;
- display name or canonical path rows; and
- optional Description, Type, Allowed values, Documented example, Comments, and
  provenance metadata.

Export-only configuration never mutates canonical schema documentation.

## Output formats

### Spreadsheet clipboard

Spreadsheet copy produces tab-separated plain text in preview row and column order,
with optional headings. Tabs or newlines in content cannot create additional cells,
rows, or columns.

### Rich Confluence or Jira table

Rich copy produces semantic HTML plus a matching plain-text fallback. It supports
the same three existing styles. Content is escaped and cannot inject elements,
scripts, headings, or styles.

### Excel workbook

Download Excel workbook produces one offline `.xlsx` file with four sheets:

1. `Flow values`
2. `Capture matrix`
3. `Legend and provenance`
4. `Export diagnostics`

The first two match their previews. The third expands symbols, contributor names,
conditions, and effective revisions. The fourth records source state, graph and
schema revisions, incomplete contexts, conflicts, and generation time.

Text beginning with `=`, `+`, `-`, or `@` remains literal text and never becomes an
executable spreadsheet formula. Workbook generation makes no network request.

## Incomplete Draft exports

Documentation is useful during design, so incomplete Drafts may be exported after an
explicit `Export labelled incomplete` confirmation. The preview and all formats must
show `Draft — incomplete`, mark affected cells, and include complete diagnostics.
No missing value is invented and the result cannot appear published or complete.

## Production evidence

Behavior scenarios specify table semantics. Runtime scenarios must exercise the
built extension through visible controls and prove:

- actual compiler output supplies cells;
- selectors persist stable Page-frame and contained occurrence references;
- clipboard adapters receive exact TSV, HTML, and fallback text;
- the download adapter receives a valid parseable `.xlsx` file with the four sheets;
- formula and HTML injection are neutralized;
- stale snapshots disable export;
- incomplete labels and diagnostics survive every format; and
- project, graph, schemas, documentation, assignments, and validation remain
  unchanged.

Direct state injection, DOM-local expected-value tables, fake workbook metadata,
source-string checks, or a component-only clipboard mock do not satisfy terminal
acceptance.

## Delivery phases

### Phase A — canonical projection

Create immutable export snapshots, Page and nested occurrence selectors,
Page-relationship-derived branch order, Flow value-map cells, matrix-state
classification, provenance, and stale detection.

### Phase B — shared preview configuration

Reuse the side-panel table configuration core for property selection, metadata,
ordering, headings, styles, preview, focus, and clipboard fallbacks.

### Phase C — output adapters

Deliver TSV clipboard, rich HTML/fallback clipboard, offline `.xlsx`, literal-text
safety, legends, diagnostics, and explicit incomplete-Draft export.

### Phase D — installed terminal proof

Exercise both previews and all five outputs for a branched Flow containing exact,
optional, conditional, forbidden, and unresolved definitions.

## Finding-to-feature traceability

`Export NNN` refers to
`features/data-layer-flow-table-documentation-export.feature` and its paired runtime
feature.

| ID | Requirement | Feature and scenario | Visible behavior | Production boundary | Evidence | Phase | Terminal pass condition |
|---|---|---|---|---|---|---|---|
| E01 | Export begins from the selected Flow | Export 001 | Two preview types and three output actions | Flow routing and export workspace | Rendered source identity and unchanged project | A, B | Opening export causes no canonical write |
| E02 | Pages are primary context events and interaction Events are nested schema instances | Export 002 | Human Page-event selectors, optional contained interaction selectors, and nested headings | Context resolver and compiler | Stable frame and occurrence references plus Page and occurrence compiler targets | A | Pages without interaction Events remain selectable and no interaction is detached from its Page |
| E03 | Produce the existing checkout-style values table | Export 003 | Page and nested Event rows, columns, and values | Effective-schema projection | Expected preview and compiler evidence | A | Every cell derives from its Page or occurrence context schema |
| E04 | Non-exact values remain truthful | Export 004 | Exact, allowed, missing, conditional, forbidden, conflict summaries | Cell classifier | Six decisive cases with detail provenance | A | No example or blank conceals missing semantics |
| E05 | Branches need usable Step headings | Export 005 | 1, 2a, 2b, 3 from Page relationships plus nested Event headings | Page topology projection | Preview order and unchanged graph bytes | A, B | Nested Events cannot mutate or imply topology |
| E06 | Produce a data capture matrix | Export 006 | Page contexts plus Page-specific reused Event occurrences and M/O/C/N/—/! cells | Presence classifier | Distinct per-Page occurrence values, exact matrix, and legend | A | Reused Events retain Page-specific schema instances while forbidden and undeclared remain distinct |
| E07 | Conditions and provenance remain inspectable | Export 007 | Cell detail and repair links | Schema provenance resolver | Structured condition and direct targets | A, B | Matrix summary does not discard its condition |
| E08 | Reuse side-panel configuration | Export 008 | Selection, metadata, ordering, resets, headings, styles | Shared table configuration core | Pointer/keyboard preview and export parity | B | Export configuration causes no schema write |
| E09 | Spreadsheet and Confluence clipboard output | Export 009 | TSV and rich HTML with optional headings | Clipboard adapters | Four exact mode cases | B, C | Clipboard output matches configured preview |
| E10 | Real Excel export | Export 010 | Offline workbook with four named sheets | Workbook generator and download adapter | Parsed workbook structure and cells | C | Download is a valid `.xlsx`, not renamed text |
| E11 | Exported content must be inert | Export 011 | Literal formulas, escaped HTML, stable dimensions | Cell encoder and format adapters | Parsed cells and clipboard HTML | C | Content cannot execute or alter table structure |
| E12 | Incomplete Drafts remain useful and unmistakable | Export 012 | Blocked/Incomplete cells, confirmation, watermark, diagnostics | Compiler diagnostics and output headers | All output labels and repair links | A, C | No incomplete output appears complete |
| E13 | Outputs must use one coherent revision snapshot | Export 013 | Page, occurrence, Page-relationship, and schema staleness with disabled actions and refresh | Revision subscriptions and snapshot compiler | Before/after revisions and identical outputs | A | Mixed graph/schema revisions cannot export |
| E14 | Terminal branched-flow proof | Export 014 | Both previews, four copies, one workbook | Built extension and all adapters | Five captured outputs and unchanged canonical bytes | D | Every format agrees and makes no execution claim |

## Terminal acceptance

The program passes when both feature files parse and dry-check without findings, the
focused `flow_export` acceptance pack exercises the built extension, and packaging
consumes that same build. The pack may share registered build dependencies with
`flow_graph`; it does not authorize full archived export or release suites. The
installed evidence must include a Page with no interaction Event, Page-derived primary columns,
nested occurrence columns, one reusable Event with distinct Page-specific
expectations, and Page-relationship-only branch ordering.
