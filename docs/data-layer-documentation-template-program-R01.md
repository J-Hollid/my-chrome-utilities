# Data layer documentation template program R01

Status: QA-integrated at `a785a83b50`; the user approved the guided Excel
authoring correction for QA feature implementation on 2026-08-18

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

The public template context exposes presentation-safe values only. It never exposes raw
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

## Excel guided workbook contract

The current Excel contract is specified by
`docs/data-layer-guided-excel-template-authoring-R01.md`. It supersedes the
unadopted contract-version-1 Note and literal-endpoint design. Guided starters,
visible Template Guide setup, named repeat and image areas, in-tool binding and
repeat guidance, unsaved candidate preview, and operator-facing findings replace
that design without compatibility rendering or migration.

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

This is one bounded user-visible Documentation feature on the current QA
baseline, which already contains reviewed candidate `1b192105a8` and its
project-scoped content-addressed visual bodies and version-3 project archive.
The implementation extends that settled durability and archive boundary so an
Excel template body is another validated project-owned asset class. The
extension is part of task `documentation-templates`; it is not a prerequisite
handoff or a separate delivery.

The implementation must preserve existing visual-asset behavior while sharing
the content-addressed body, lazy-read, atomic import, deletion-safety, and
archive-entry mechanics that are independent of media type. It must not create a
second Base64, root-record, or non-portable binary store, and it must not force
Excel workbooks through image dimensions, image signatures, or image media-type
validation.

The first candidate proved the direct three-pack behavior and package locally,
but its governed preflight exposed coarse ownership in shared repository,
archive, workspace-entry, and build paths. It is not review-ready. Preserve
`7f9c8a1121` only as a patch reference. Ownership readiness is now QA-integrated
at `b8194b517e`; reconstruct this feature from that exact QA descendant and use
the settled asset-body, Documentation-contribution, and build-dependency seams.
The standing ordered-batch approval requires no second product approval.

Under `docs/qa-verification-granularity-ratchet-R01.md`, task
`verification-granularity-ratchet` established the initial subordinate-slice
contract without product behavior. Its 12-task first-use intent did not include
five existing integration files already present in candidate `7f9c8a1121`.
Exact candidate `e8e5fd48` therefore selects 13 packs and 601 tasks through the
durable repository, Flow archive/portability, and global application-controller
boundaries. This is safe conservative fallback but not an accepted focused
first-use result.

Task `verification-slice-documentation-templates` repaired the known-path replay,
automatic variance routing, durable disposition, and reusable seams on QA at
`8d3cf5012c`. It merged neither stopped product candidate and implemented no
template product behavior. Reconstruct and resume this product automatically
from the exact scorecard descendant of that commit. A reviewed parent-fallback
disposition may authorize a wider exact result when no truthful split exists; it
cannot be mistaken for the disproved 12-task forecast or require another product
approval.

Reissued candidate `00f3e45d` confirms that repair: exact readiness is
`bounded-ready` at 10 packs and 247 canonical tasks. Its first review checkpoint
failed only the inherited mapping-repair assertion that still expected the six
template contracts to remain planned; the candidate repairs that assertion and
passes the direct process and product checks. Governed repair of resulting
incident `0f9c4990-a10a-47ef-878b-fcceff3a690f` is paused because eligible
deferred task-scoped incident `d723a7c4-1116-4887-b60a-21aded1ab5d8` refers to
the same `flow_export` acceptance session before those six contracts were added.

User-approved task `deferred-acceptance-session-preflight` supplies the narrow,
fail-closed monotonic acceptance-session rule in
`docs/qa-feature-mode-deferred-incident-boundary-R01.md`, now QA-integrated at
`03e4157b83`. It changes no template behavior or incident state. Reconstruct and
resume `documentation-templates` automatically from the exact scorecard
descendant of that commit, using `00f3e45d` only as a patch reference.

Candidate `f2f598d4` then confirmed the same 10-pack/247-task boundary but found
that the accepted preflight compared declaration-ordered pack features with the
runtime-first canonical planner identity. User-approved correction task
`deferred-acceptance-session-order` makes only registry completeness
order-insensitive; source receipt identity, planner order, artifact pairing, and
historical subsequence remain strict. The correction is QA-integrated at
`cad10c898c`. Resume this product automatically from the exact correction
scorecard descendant and use `f2f598d4` only as a patch reference.

Independent review of the reconstructed product then completed the missing
production paths at stopped candidate `d139725a1a`. Its direct unit, property,
browser, typecheck, build, and package checks pass, but exact readiness from QA
`1f68d463d7` correctly stops before a 13-pack/617-task catalogue. The only new
undisposed paths are `src/data-layer-durable-project-runtime.ts` and
`src/durable-project/runtime-core.ts`, where the candidate stages project asset
bodies so workbook bytes and matching template metadata reach one atomic Draft
transaction.

The standing granularity authority therefore activates a second preparation
under the stable task name `verification-slice-documentation-templates`, as
specified in `docs/qa-verification-granularity-ratchet-R01.md`. It starts from
QA `1f68d463d7`; `d139725a1a` is a patch reference only. Prefer a generic
project asset-body staging seam owned by `durable_project_repository` with the
exact `flow_export` Documentation consumer. If that boundary cannot be proved,
record explicit parent fallback for each broad path instead of waiting for the
user or inventing a narrower claim. After architect `qa-ready` integration,
reissue `documentation-templates` automatically from that exact QA head.

The resumed product must consume the integrated atomic staging capability and
must not copy its staging implementation back into the two broad runtime files.
Upload or replacement succeeds only when validated bytes and their matching
template metadata commit together. Failure retains the exact recoverable
unsaved operation without durable orphan bytes; retry or reviewed conflict
resolution carries the matching bodies, while explicit rejection or discard
removes them. Existing visual bodies, generic project saves, route hydration,
Undo/Redo, conflict behavior, and archive portability remain unchanged. A fresh
exact preflight is mandatory before product evidence; the earlier 10-pack plan
is a conservation target, not a numeric exemption.

Preparation candidate `06222ff00f` is QA-integrated. It binds each staged body
generation to one project Draft operation before queue execution, retains exact
bytes through failure and retry, commits bytes and patches in one repository
transaction, and rejects the whole body-bearing operation when selective merge
would separate any of its metadata patches. Its reusable seam has the exact
`durable_project_repository` to `flow_export` to `shell` consumer chain; both
broad runtime paths have reviewed integrated-seam dispositions and remain
conservatively owned for unrelated changes.

Reissue stable product task `documentation-templates` automatically from the
exact scorecard descendant of `06222ff00f`, using `d139725a1a` only as a patch
reference. Reconstruct all accepted Template Library, Excel, rich-page,
assignment, preview, export, portability, and installed-browser behavior, but
reuse the integrated runtime staging API rather than changing either broad
runtime file. Run a fresh exact readiness preflight before evidence.

**Ownership-readiness launch:** the resumed intent preflight names the integrated
shared surfaces `src/project-asset-body-contribution.ts`,
`src/project-documentation/workspace-contribution.ts`, and
`build-delivered-dependencies.json`, plus every existing shared integration path
retained by the repaired design. The likely new production prefixes remain
`src/documentation-templates/` and
`src/project-documentation/workspace-template-`. Generated `dist/` companions
follow their source owners. The product consumes the independently integrated
seams or reviewed parent fallback; it does not edit verification policy to
narrow its own evidence.

**Development focus:** begin with the versioned safe template context and the
Excel marker parser/validator/renderer using small in-memory workbooks. Add the
Template Library assignment and stale-snapshot behavior, then the rich semantic
block renderer and installed Documentation controls. Use one direct unit target
for marker geometry and literal-cell safety, one for rich block scope and
sanitization, and the installed Documentation browser target.

**QA impact:** forecast `flow_export`, `project_management`, and
`durable_project_repository`, their declared `shell` consumer, and package
proof. The fresh exact changed-path plan after mapping repair is authoritative;
there is no fixed 12-task promise. Unforecast packs reached through an unsliced
credible boundary route automatic assessment rather than a broad evidence run
or user wait. A reviewed conservative fallback may proceed; an all-20 result
still stops for feature-mode scope direction. No feature role runs the all-20
gate.

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

## Settled QA result

Final candidate `a785a83b50` is QA-integrated on 2026-08-18. The implementation
keeps Built-in output as the default and adds one Excel prototype worksheet per
overview, flow, matrix, or profile kind; marker validation and safe repeat
rendering; starter and sample workbooks; per-set assignment; a copy/paste Rich
page template editor; responsive outline/detail editing; preview, clipboard,
stale-state and Undo/Redo behavior; atomic workbook-body persistence; and project
export/import portability with remapped project identities. No new Documentation
definition kind was created.

Independent review found and closed missing nested binding help, responsive Rich
selection and focus behavior, internal template-ID leakage, installed starter
parity, validation-boundary, Rich runtime, and actual archive round-trip evidence.
Architect review then found and repaired stale route hydration and Rich template
loss during import before accepting the final tree.

The exact measured review plan contained 13 packs and executed 619 tasks. It
passed properties, package proof, the installed Documentation browser program,
all four starters, custom Excel and Rich output, rejection boundaries, durable
retry and route lifecycle, project portability, and the complete registered
consumer closure. No all-20 feature checkpoint ran. This program is complete on
QA; promotion to `master` remains a separate cumulative release decision.
