# Data Layer installed Schema controller helper ownership R01

## Status and authority

The user approved this Stage C follow-up on 2026-09-05. The work can start
after this specification is reachable from the active scope and the specifier
sends it to the coder.

The work uses QA feature-integration mode. It starts from exact QA commit
`cfc3120e19b6c6707179256cd147bac8c7684c7f`. It does not request promotion to
`master`. It does not authorize an all-runnable-pack gate.

Stable task name: `schema-controller-helper-ownership`.

This follow-up changes verification ownership only. It does not change product
code, product behavior, product tests, storage, public ports, permissions, or
package capabilities.

## Current condition

Stage C has ten narrow installed Schema controller slices. The earlier
`schemas_installed_side_panel` slice also has exact ownership of
`project-hydration.ts`. Thus, 11 of the 73 TypeScript files in
`src/data-layer-installed/schemas/` have exact slice ownership. The other 62
files use the complete `schemas` parent closure.

The parent fallback is safe. But the current result does not tell a future
developer which helper files are part of one controller family and which files
must stay broad because they serve more than one family. This causes repeat
analysis and makes a small helper change select unrelated Schema tests when a
stable narrow boundary already exists.

## Required outcome

At completion, each current TypeScript file in
`src/data-layer-installed/schemas/` has exactly one durable ownership result:

1. one existing Schema slice owns the file; or
2. an explicit `parent-fallback` disposition names the file and gives the
   technical reason for the full `schemas` closure.

The implementation must classify all 73 current files. It must not classify a
file from its name only. Static imports, installed callbacks and ports, mutable
state ownership, lifecycle ownership, public use, and direct test coverage are
the evidence.

The result is complete only when no current file is absent from both groups and
no file is in more than one group.

## Allowed exact slices

New exact helper ownership can use only these current behavior slices:

- `schemas_installed_composition`;
- `schema_editor_reachability`;
- `schema_relationship_tree_view`;
- `schema_library_lifecycle`;
- `schema_property_authoring`;
- `schema_rule_authoring`;
- `schema_assignment_authoring`;
- `schema_validation_records`;
- `schema_guided_validation`; and
- `schema_canonical_editing`.

Keep the existing exact `project-hydration.ts` ownership in
`schemas_installed_side_panel`. Do not add new helpers to that old broad slice.

Do not create one slice for each helper. Do not create a new Schema behavior
slice in this task. If the ten allowed slices cannot describe a real ownership
boundary, keep the file in the parent closure and record the reason. A later
new behavior slice needs a separate review.

## Classification rules

### Existing-slice result

A helper can join one allowed slice only when all these statements are true:

- one controller family owns its behavior;
- its static imports, callbacks, ports, state, and lifecycle do not add an
  unlisted behavior family;
- an existing direct unit test or the owning controller test observes the
  helper boundary;
- the slice task list includes that direct evidence;
- the slice property tasks include only properties that the helper can affect;
- the current slice consumers are complete for the helper; and
- a changed-path plan for the helper excludes unrelated Schema tasks.

Add the helper path to the source paths of that slice. Add its direct test path
and task only when that test is not already present in the slice. Do not add an
unaffected test to make the slice look complete.

If a helper proves one additional exact consumer, update the existing slice
consumer list only when the consumer has an existing compatible exact slice.
Otherwise, use the parent fallback.

### Parent-fallback result

Keep a file in the complete `schemas` parent closure when one or more of these
conditions apply:

- more than one controller family owns or changes its behavior;
- it is a public contract, facade, model, installed binding, shared lifecycle
  owner, or shared persistence boundary;
- it has a consumer that no current exact consumer slice represents;
- its direct evidence is broad or is not sufficient to prove one family;
- current and base history disagree about the boundary; or
- the evidence is missing, conflicting, or not observable.

Add one entry for each such file to
`verification/granularity-dispositions.json`. Use the task name
`schema-controller-helper-ownership`, the exact source path, decision
`parent-fallback`, review authority `qa-integration`, no replacement paths, and
a specific technical reason. Do not use a general reason for many unrelated
files.

## Durable verification contract

Extend
`test/verification-contracts/schema-controller-slice-activation-test.mjs`.
Do not add a temporary Node test that has this task name.

The durable contract must derive the current TypeScript inventory from
`src/data-layer-installed/schemas/`. For every file, it must prove exactly one
of these results:

- one non-consumer Schema slice has the source path; or
- one parent-fallback disposition for this task has the source path.

The contract must also prove:

- the existing 11 exact source owners stay valid;
- each new exact helper selects its slice tasks and exact consumers;
- each new exact helper does not select an unrelated Schema controller task;
- each fallback helper selects the complete `schemas` parent unit, property,
  and dependant closure;
- all slice task unions and remainder tasks conserve the parent closure;
- missing, duplicate, conflicting, or unobservable ownership fails closed to
  the parent; and
- registry and ownership changes for this task cannot use the new helper
  mappings to reduce their own evidence.

The Gherkin file
`features/verification-process-schema-controller-helper-ownership.feature`
is the durable acceptance contract. Register it in the existing applicable
verification-process ownership slice. Do not create a new verification-process
slice for this follow-up.

## Implementation boundary

Expected changed files are:

- `verification/manifests/schemas.json`;
- generated `verification/packs.json`;
- `verification/granularity-dispositions.json`;
- the existing Schema slice activation contract;
- the new Gherkin contract and its minimum acceptance support;
- an existing verification-process manifest when registration is necessary;
  and
- generated conservation data only when the canonical registry tools require
  it.

Use the registry compiler for `verification/packs.json`. Do not edit generated
registry bytes by hand.

Product source and product test changes are outside this task. A source or
product-test change is a stop condition, not a reason to expand the patch.

## Work phases

### Phase 1 — complete inventory

Create one table for all 73 current files. For each file, record imports,
callers, owned state or lifecycle, direct tests, consumers, proposed result,
and reason. Confirm the existing 11 exact owners first. Do not change the
registry in this phase.

### Phase 2 — classify the 62 current fallback files

Apply the classification rules. Map clear single-family helpers to one of the
ten allowed slices. Record a specific parent fallback for every shared,
uncertain, or insufficiently tested file.

Finish the complete map before evidence production. During this phase, use
plan-only checks and the changed slice's direct contract only.

### Phase 3 — activate and prove

Update the canonical manifests and dispositions. Compile the registry. Extend
the durable contract and add the minimum acceptance support. For representative
files in each used slice and each fallback class, inspect exact changed-path
plans with and without property mode.

### Phase 4 — one final focused evidence cycle

Create a fresh exact changed-path plan from the full candidate. Run the selected
verification-process ownership and registry evidence, declared properties, and
package proof once. The candidate plan is authoritative. It can include a
bounded affected owner or consumer when the changed files prove it.

Do not run the complete Schemas product pack only because the map describes
Schema source files. Do not run an all-runnable-pack gate. Do not split the
final run into repeated slice runs after one coherent plan is available.

## Stop and fallback rules

Use a parent fallback and continue when a helper is shared, uncertain, or does
not have enough direct evidence. Stop and ask for direction when:

- product behavior, product code, or a product test must change;
- a new Schema behavior slice is necessary;
- a new consumer slice is necessary;
- the exact task plan becomes all-runnable-pack;
- parent closure conservation fails after one focused repair; or
- the candidate cannot account for every current file exactly once.

A larger safe fallback count is not a failure. An unsafe narrow mapping is a
failure.

## Effort and progress

Effort ceiling: three hours from coder receipt to architect `qa-ready`.

Report at 90 minutes with:

- count of files mapped to each existing slice;
- count and classes of parent fallbacks;
- unclassified or duplicate files;
- representative selected task and pack counts;
- current failures and repairs;
- time used and forecast; and
- confidence.

## Completion scorecard

Report:

- total current Schema TypeScript files;
- existing exact owners retained;
- new helpers mapped to each allowed slice;
- explicit parent fallback count and reason classes;
- unclassified and duplicate count, which must both be zero;
- smallest and largest representative exact-slice plan;
- representative parent plan size;
- final selected packs and tasks;
- final run count and elapsed time;
- package result;
- all-runnable-pack runs, which must be zero; and
- product source and product test changes, which must both be zero.
