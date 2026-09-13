# Live Add all to schema R01

Status: QA-integrated at `6df76049cd` on 2026-09-13.
See `docs/data-layer-live-add-all-schema-qa-R01.md` for proof and delivery limits.
Task: `live-add-all-schema`.
Mode: feature integration into QA. Master promotion is separate.

The user's explicit approval covers the complete behavior decisions and both
contracts below, including uncertain types, first observed examples, and
preservation of conflicting existing paths. No further behavior approval is
needed for this scope. After the modal repair reaches QA, the specifier completes
the exact ownership forecast and sends this same stable task from that accepted
head. Do not start this feature on an unreviewed modal-repair candidate.

Activation: the prerequisite is QA-integrated at `a79b169d01`. Start this task
from its specification-recording descendant carried by the coder handoff. The
modal lifecycle and both approved specifications are inherited. This is the next
product task; the process correction must not delay its implementation.

## User request and scope

The user requested one action to add all properties to a new or existing schema,
preserve keys that already exist, and derive data such as type and example value.
The source is the complete payload of the selected Live event, including nested
objects and all captured array items. Inspector filtering does not limit the
operation. This is not an aggregate over the whole captured session.

Keep the existing per-property Add to schema and separate Add validation actions.
The modal recovery task remains a separate active repair. Start implementation
from current accepted QA after that repair, and reuse its reviewed dialog
lifecycle. Do not replace or delay that repair with this feature.

## Behavior decisions for approval

- Add all to schema opens a review. Choose New schema and enter a name, or choose
  an existing editable saved schema. An existing selected draft may be suggested,
  but the destination remains visible before confirmation.
- A new schema becomes an unpublished saved draft. An existing schema uses its
  current working draft, or creates a draft from its current revision. This
  operation does not publish, add validation rules, or create assignments.
- Compare canonical full paths, not leaf names. Preserve exact key case and
  escaped JSON Pointer identity. Array item indices map to the existing wildcard
  representation. Object keys that look like numbers remain object keys.
- Existing local and inherited definitions win. Preserve their types, examples,
  descriptions, constraints, rules, and ownership. Do not fill empty metadata on
  an existing property. Missing children may be added under compatible object or
  array parents without replacing those parents or changing an inherited source.
- Infer object and array structure from the complete selected payload. Infer
  scalar type and store a typed example from the first occurrence in payload
  traversal order. Keep false, zero, empty strings, and null as actual values.
  Examples use the existing custom-example representation; they are not allowed
  values or exact-value rules. Container examples are represented through their
  structure and child examples, within the current scalar example model.
- For mixed observed types or null-only data, leave type unspecified and show
  that uncertainty. An empty array does not establish an item type. Do not
  silently select the first array item's shape as the complete array schema.
- Report paths blocked by an incompatible existing parent. Preserve those paths
  and allow the operator to confirm the remaining additions. The review and
  result must distinguish added, preserved, and blocked properties.
- Use a fixed event snapshot. Revalidate destination state before commit; a
  concurrent edit cannot be overwritten by a stale review. Use the established
  conflict and save-failure recovery. Commit the additions together, report
  success only after durable acknowledgement, and preserve the Live event.
- Cancel and Escape make no change. Repeated import is a no-op when every path
  exists. Do not save empty duplicate batches.

## Contracts and verification forecast

Contracts:
`features/data-layer-live-add-all-schema.feature` and
`features/data-layer-live-add-all-schema-runtime.feature`.
Preserve the existing declaration, property-example, and durable-repository
contracts. The new operation adds examples; it does not silently change the
current per-property operation.

Development focus: deterministic path merge and inference tests; the installed
bulk review with actual pointer/keyboard input; and durable commit/reload/failure
tests. Browser checks must measure the review's visibility and operability,
including initially hidden dialog hosts. Calling DOM `.click()` alone is not
proof that a user can operate the controls.

Likely integration surfaces: Live action wiring, installed Schema guided
validation, schema library draft operations, and property documentation.
The current installed guided-controller owner is parent `schemas`, slice
`schema_guided_validation`; declared consumers are `capture`,
`project_management`, `live_flow_testing`, `project_assurance_severity`, and
`guided_test_cases` through their installed-controller consumer slices.
The bulk model belongs in separate modules, with proposed prefix
`src/live-schema-bulk/` under parent `schemas` and existing slice
`schema_guided_validation`, subject to canonical intent classification.
Its direct consumer is the installed guided Schema owner. Retain transitive
consumer coverage. The existing single-property model instead has parent-pack
fallback: its path query selects `schemas`, `defects`, `live_flow_testing`,
`project_assurance_severity`, `guided_test_cases`, and `shell`, with 627 planned
checks. If that path must change, preserve its conservative coverage and assess
the exact boundary under the standing granularity rules. Do not silently narrow
that parent fallback in this product change.
The accepted-head query for `src/data-layer-live-observer-ui.ts` identifies the
`capture` parent fallback, not a separate Live inspection pack. It selects
`capture`, `event-library`, `project_event_transport`, `schemas`, `defects`,
`replay`, `live_flow_testing`, `project_assurance_severity`, `guided_test_cases`,
and `shell`. Together with the installed guided-controller consumers, the
current forecast also includes `project_management`. Record this broader
forecast in read-only intent. It is not an all-pack launch or permission to
omit required consumers. Prefer a local bulk-action owner without refactoring
unrelated renderer behavior. This forecast does not exclude any planned owner.

Before coder handoff, complete the exact path/owner forecast against the accepted
modal-repair QA head. The coder then records intent before edits and exact
changed-path plan-only preflight before settled evidence. Use focused evidence
with properties and package proof through ordinary review. Do not run an
all-pack feature gate or change registry ownership inside the product range to
reduce selected coverage.

Initial effort expectation: two hours to a review-ready candidate, with a
one-hour progress assessment. Continue bounded work and report variance under
the existing autonomy rules. Specification parser and DRY checks are separate
from implementation, installed runtime, and final release proof.

## Specification check record

Both feature files passed the vendored Gherkin parser on 2026-09-12.
The IR DRY checker reported zero runtime findings and six advisory product
wording pairs. Manual review retained the distinct operations: destination
selection, review, confirmation, and a prior completed operation. They are not
interchangeable steps. Shared event setup is in Background; every example
parameter varies and is used. No redundant constant table column remains.
Reports are local under `tmp/live-add-all-schema-spec/`.

Scorecard: two parsed contracts, ten scenarios, zero runtime proofs for the new
feature. No acceptance mutation or product quality gate was run by the specifier.
The request and uncertainty/conflict behavior are approved. The existing scalar
example model limits what can be inferred without a broader editor change.
Keep that limit visible during implementation and review.
