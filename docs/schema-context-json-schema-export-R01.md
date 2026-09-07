# Schema context JSON Schema export R01

Status: user-approved for coder handoff and focused QA integration on 2026-09-07.
Approval recorded: 2026-09-07T17:10:48Z.
Prepared: 2026-09-07. Task: `schema-context-json-schema-export`.
Starting QA head: `60920f41fee7857808f4ff5e4f8b543210dc8c44`.
Mode: feature integration into `qa`.

## Outcome and scope

Every installed schema editor and viewer gives the operator an
`Export JSON Schema 2020-12` action for the complete schema currently shown.
The action opens a readable JSON preview with `Copy JSON` and `Download JSON`.
The output is one schema for use in other tools.

The current Saved Schema Library has a standard exporter and compatibility
review. The Studio project export uses production schemas. These actions do
not supply the requested action in each contributor and context workspace.
Extend the existing capability through the current schema controls.

Cover Saved Schema editors and revision viewers, Shared Profiles, Property
Sets, Pages, Events, Flow Page instances, and Event occurrences. Cover both the
side panel and the standalone or Flow workspace where that host exists. Cover
read-only schema views, including an opened revision. A relationship-tree link
uses its existing schema host. A property detail uses the containing schema's
action; it does not export only that property. A sample payload, Flow-derived
example, or documentation table is not a schema viewer.

The coder records the installed host inventory and maps every host to runtime
proof. Include a legacy Page Group schema host if it remains reachable. Do not
add a new schema role to a structural Page Group or a presentation-only Section.

## Source and interaction

1. In Studio, add the same export button to the schema header in both existing
   editor layouts. Keep each layout's present controls; no toolbar redesign or
   unification is required. In the side panel, use the schema header or an
   existing labelled schema actions menu. Keep it available in Tree and Table
   views where present, with search or filters set,
   and in read-only views. The complete selected schema is exported regardless
   of filtered rows, selected property, collapsed branches, or current tab.
2. Show the schema name, contributor role, context, and Draft or revision in the
   export preview. For a Flow instance or occurrence, identify its Flow and Page
   context. Use that exact context's effective schema, including inherited
   properties, enabled rules, sparse overrides, and selected exclusions.
3. An editor exports its current accepted Draft, including a new unpublished
   schema. A revision viewer exports the revision it shows. An editor must not
   silently substitute the last publication. An occurrence must not substitute
   its reusable Event or a sibling occurrence.
4. Unconfirmed property edits must be confirmed or cancelled through the existing
   editor before export. Explain this at the action. A pending durable save
   temporarily blocks export; it becomes available when that save settles.
   Export itself never saves, publishes, discards, or creates an Undo command.
5. Freeze one source snapshot when opening the preview. Preview, clipboard text,
   and downloaded UTF-8 JSON use the same two-space-indented text with one final
   newline. Download uses MIME type `application/schema+json` and a safe
   `.schema.json` filename that identifies the schema and Draft or revision.
6. A source revision, context, or effective parent change invalidates the preview
   and its compatibility confirmation. Disable Copy and Download, explain the
   change, and provide `Refresh export`. Never silently copy a stale schema.
   Search, expansion, and other view-only changes do not invalidate it.
7. Copy success follows a successful clipboard write. Download success follows
   acceptance by the browser download boundary. A rejected operation shows an
   error, retains the preview, and allows retry. Clipboard failure leaves
   Download available. Cancel or close has no export effect and returns focus
   to the invoking control when that control is still present.
8. Keep the action, preview controls, and compatibility review operable with
   keyboard and pointer at 360px and 1280px. Long JSON scrolls inside the preview
   and does not push action controls outside the viewport.

## JSON Schema contract

Use the Draft 2020-12 dialect declaration:
`"$schema": "https://json-schema.org/draft/2020-12/schema"`.
The [core specification](https://json-schema.org/draft/2020-12/json-schema-core)
defines the dialect, references, and media type. The
[validation specification](https://json-schema.org/draft/2020-12/json-schema-validation)
defines assertions and annotations. Use the existing locked independent
Draft 2020-12 validator for downstream proof.

The document describes valid payloads. It is not a sample payload, project
backup, raw canonical node store, or production manifest. Preserve supported
types, required and forbidden properties, typed const and enum values, nested
objects, recursive array items, string and numeric limits, cardinality,
conditional rules, and object closure. Conditions remain conditions rather
than being evaluated against one sample Event. Preserve description and typed
examples as annotations. References needed for validation resolve within the
download; consumers need no extension storage or external schema fetch.

Preserve existing Concept metadata as `x-concept`, an annotation only, under
canonical authoring scenario 063. This is the existing exception to the older
standard-export rule against custom keywords. Do not emit other internal
identities, rule records, severities, assignments, provenance records, history,
credentials, or UI state. Property names that happen to match those words
remain ordinary declared payload properties.

Published Saved Schema resource identities and filenames keep their existing
revision contract. Draft output omits `$id`; it cannot reuse a published
revision's identity. No export creates a publication or production manifest.
An empty valid schema can be exported. Canonical errors, unresolved effective
conflicts, broken references, or missing array item types block export and name
the cause. Fixture, Assignment, Coverage, or unused publication warnings do not
block a valid schema export.

Keep the existing compatibility review for unsupported validation and for
warning or message conversions. Name every affected rule, property path, and
change of meaning. Copy and Download require explicit confirmation for that
snapshot. Cancellation produces no clipboard or download effect. An approved
lossy export retains every compatible assertion and reports the omitted-rule
count; it must not claim full validation equivalence. A broken or invalid schema
cannot use lossy confirmation to bypass its errors.

Existing published library row exports, library bundles, project production
exports, full project backups, import behavior, and documentation exports retain
their scope. This task adds the current-schema interface. It does not introduce
a new import flow, editor model, publication workflow, or validation language.

## Contracts and precedence

New product contract:
`features/data-layer-schema-context-json-schema-export.feature`.
New browser contract:
`features/data-layer-schema-context-json-schema-export-runtime.feature`.

Preserve `features/data-layer-json-schema-2020-12-export.feature` and its runtime
partner for published library exports. Preserve the canonical authoring and
layered-schema feature pairs and
`docs/data-layer-canonical-schema-authoring-correction-program-R01.md` for
composition, staged edits, Concept, and existing validation semantics. Current
Property Set and Flow context authority supersedes old Page Group composition
names. The active-scope manifest routes this approved task to this program,
both new contracts, and the verification instructions below.

## Development focus and QA impact

Start with three direct groups: snapshot/serialization unit tests; the two new
acceptance contracts; installed export controls with real clipboard and download
observations. The runtime matrix must exercise each host, not just a shared
helper. Validate captured output with the locked independent validator using
positive and negative payloads. Use existing JSON Schema export tests to protect
library compatibility. Do not replace runtime evidence with source searches.

Read-only ownership queries at the starting head found the following likely
integration surfaces. These are forecasts; the coder must classify complete
intent before product coding and run exact plan-only preflight after the first
coherent candidate. No stopped implementation candidate exists for this task.

| Existing path or proposed prefix | Parent / slice or fallback | Exact consumers to assess |
|---|---|---|
| `src/canonical-schema/ui-mount.ts`, `src/data-layer-composed-schema-workspace-ui.ts`, `src/data-layer-layered-schema-ui.ts` | `layered_schema` / conservative parent fallback | `flow_graph`, `flow_export`, `live_flow_testing`, `property_set_flow_sections`; canonical and composed hosts |
| `src/data-layer-json-schema-export.ts` | `schemas` / conservative parent fallback | `defects`, `live_flow_testing`, `project_assurance_severity`, `guided_test_cases`, `shell`; existing standard export consumers |
| `src/data-layer-installed/schemas/library-export-workflow.ts` and adjacent policy | `schemas` / `schema_library_lifecycle` | `defects`, `project_assurance_severity`, `guided_test_cases`, `shell` installed controller consumer slices |
| `src/specification-builder.ts` | `schemas` / current `schema_builder_reorder_adapters`; verify semantic fit during intent | `defects`, `live_flow_testing`, `project_assurance_severity`, `guided_test_cases`, `shell`; Studio integration |
| Proposed `src/schema-context-export/` | `layered_schema` / proposed `schema_context_export` | `schemas`, `flow_graph`; selected-schema adapters and their installed hosts |
| Proposed `src/data-layer-installed/schemas/context-export/` | `schemas` / proposed `schema_context_export_controls` | `layered_schema`; saved-schema and project-context control adapters |

The conservative forecast is `schemas`, `layered_schema`, `flow_graph`,
`flow_export`, `live_flow_testing`, `property_set_flow_sections`, `defects`,
`project_assurance_severity`, `guided_test_cases`, and `shell`. Use the complete
canonical plan, including further proved consumers. Proposed prefixes and slices
are not permission to reduce current/base evidence. Split broad files at the
needed export boundary; do not add another purpose to a large controller.

Apply ownership readiness and the granularity ratchet. An all-pack
`coarse-boundary` requires independent preparation. Bounded coarse findings
require reasoned judgment and a durable seam, observation, or parent fallback.
Do not start preparation from pack count alone or change ownership to narrow
the product's own evidence range.

Implementation and review use the selected tasks through
`node scripts/run-focused-acceptance.mjs`, with `--property`,
`--changed-since <base>`, and `--prepare-evidence schema-context-json-schema-export`
on the settled candidate, followed by the printed evidence-record command.
Fresh package proof is required. No all-runnable-pack run or master promotion
is part of this task. The specifier runs only contract parsing and the required
APS IR-DRY normalization, not acceptance mutation or implementation quality gates.

## Effort and review

Forecast: four hours from coder activation to first review handoff. At two hours,
expect one working end-to-end export, the complete host map, intent classification,
and a direct serialization test. Report variance at two and four hours, with the
remaining work and revised forecast. Continue while the approved outcome and a
safe bounded completion path remain unchanged. Escalate a material requirement
change or repeated failure with no bounded cause.

Record approval, first handoff, review, repair, evidence, and QA integration
timestamps. Report actual host coverage, validator parity, failed checks, reruns,
focused verification time, and zero feature-mode full gates. Serena symbol
overviews and references helped locate the existing exporter and host mounts;
one empty-symbol query failed and supplied no evidence. Path queries showed the
conservative consumer spread. No setup or tool provisioning was needed.

## Specification check record

Both new contracts passed the locked APS parser and IR-DRY checker. The product
contract has seven scenarios; the runtime contract has six, including fourteen
explicit host/surface examples. These are planned checks, not runtime passes.

Normalized preview-opening, confirmed-preview, and export-content steps. Removed
redundant setup and kept common setup in each Background. No example column has
an identical value in every row. The four remaining possible-synonym findings
describe distinct behavior: enabled controls versus completed writes, schema
facets versus readiness state, inspecting a disabled action versus opening it,
and schema validity versus payload validity. Keep those distinctions.

Implementation, acceptance execution, independent-validator parity, and browser
proof remain pending. No implementation quality tools, acceptance mutation,
commit, handoff, or integration ran during specification preparation.
