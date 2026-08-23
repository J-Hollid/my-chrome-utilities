# Data-layer layered schema editing repairs R01

## Authority and outcome

This focused correction refines the active canonical authoring and layered-schema
contracts only for two operator defects. It is governed by
`docs/data-layer-canonical-schema-authoring-correction-program-R01.md` and adds
Layering scenarios 032 and 033 with their installed runtime partners.

An operator editing a Flow Page instance or another inherited contributor can
exclude an ordinary inherited effective property at that contributor without
changing any source. An operator can also narrow Allowed values before separately
touching Example without the old allowed-value selection making that edit fail.

Stable task name: `layered-schema-exclusion-example-repair`.

QA integration: exact candidate `ad9b9276c2` passed the authoritative
`flow_export`, `flow_graph`, `layered_schema`, `live_flow_testing`, and
`property_set_flow_sections` plan (113 tasks) with package proof. The integrated
tree also makes exclusion atomic with any same-contributor sparse facets and
does not expose exclusion controls in unsupported Event-occurrence workspaces.

The proposed follow-up in
`docs/data-layer-page-flow-inherited-property-selection-R01.md` supersedes only
the property-action placement below and the presentation of excluded effective
rows. Its first-class Page and Flow Page-instance selector retains this program's
sparse identity, composition, safety, persistence, downstream-scope, and Undo
semantics; Layering 033 remains unchanged.

## Contextual inherited-property exclusion

An ordinary inherited effective property exposes `Exclude inherited property`
directly from its property actions. `Override here` is not a prerequisite because
the operator is excluding the effective inherited property, not claiming ownership
of its name, position, or source structure.

The action applies after the complete applicable parent stack has composed. One
exclusion therefore handles a property inherited through several Shared Profile,
Page Group, Page, or other parent contributions; the operator does not repeat the
action for each source. A Page-instance exclusion applies to that Page instance and
downstream contexts that would otherwise inherit the property from its Page branch.
An independently contributed Event-branch property is not silently erased.

Before confirmation, review names the selected property, any descendants, affected
compiled contexts, stale outputs, runtime effect, and Undo. Confirmation stores one
sparse local exclusion anchored by stable property identity. It stores no copied
parent definition and changes no parent, reusable Page, sibling instance, unrelated
facet, or Published state. A container exclusion covers its descendant subtree.
Reload preserves the exclusion. Undo removes it and recompiles the current parent
definition rather than restoring a stale snapshot.

An invariant or protected property cannot be weakened through this action. If a
surviving required rule depends on the property, exclusion does not silently create
a broken ready schema: the exact dependency and source are shown with the existing
repair route. These safety cases do not justify withholding the action from an
ordinary property with no such blocker.

## Allowed values and Example reconciliation

Allowed values and an Example selected from them form one consistent property
change. When an edit removes the selected Example value, the Example automatically
selects the first remaining allowed value in operator-defined order. If no allowed
value remains, the Example becomes Blank. The prior Example never blocks the
Allowed values edit merely because the operator touched that control first.

Review or direct-save feedback identifies both the explicit Allowed values edit and
the resulting Example change. One property-scoped Draft command and one Undo entry
cover both. On an inherited contributor, only the necessary sparse local facets are
stored; parent contributors, siblings, unrelated facets, and Published state remain
unchanged. Undo restores the former Allowed values and Example method/value
together.

A custom Example is different: narrowing Allowed values neither coerces nor clears
it. The custom typed value remains, and the existing non-blocking warning explains
that it does not satisfy the new Allowed values. Type-invalid input and other
unrelated validation rules remain blocking under their existing contracts.

## Boundaries

This correction does not add deletion of source properties, name- or path-only
tombstones, silent weakening of invariants, copied parent snapshots, a second Flow
schema editor, a new schema representation, multiple commands for one reconciled
edit, or a new publication workflow. It preserves canonical stable identities,
sparse ownership, contributor ordering, conflict handling, derived Page-instance
and Event-occurrence output, selected-context export, validation, project
portability, reload, and page-scoped Undo.

## Development focus and QA impact

Development focus begins with direct model and command coverage for one contextual
exclusion across a multi-parent Page-instance stack and one allowed-value Example
reconciliation. It then covers the existing Table and focused Definition controls,
sparse persistence and reload, compiler output, one contained Event occurrence,
and Undo. Likely direct checks are
`test/data-layer-composed-schema-workspace-test.mjs`,
`test/data-layer-focused-schema-property-ui-test.mjs`,
`test/data-layer-flow-page-instance-test.mjs`, and the installed layered-schema
browser target.

The likely QA impact is parent pack `layered_schema` plus its declared dependent
consumers `flow_graph`, `flow_export`, `live_flow_testing`, and
`selective_profile_inheritance` when exact changed paths reach their shared
composition boundary. The exact changed-path plan remains authoritative; feature
mode does not authorize an all-runnable-pack checkpoint.

Likely existing shared integration surfaces and proposed ownership are:

| Source prefix or exact path | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `src/composed-schema/` and `src/data-layer-composed-schema*` | `layered_schema` | `layered_schema_contextual_property_exclusion` | composed contributor rows and actions, Page-instance persistence, layered compilation, `flow_graph` Page-frame context, `flow_export` selected-context rows, and `live_flow_testing` validation |
| `src/canonical-schema-focused/definition.ts`, `src/canonical-schema/ui-mount.ts`, and `src/composed-schema/facet-draft.ts` | `layered_schema` | `layered_schema_allowed_example_reconciliation` | Table quick edit, focused Definition review, sparse contributor commands, reload, and `selective_profile_inheritance` parity |

Stopped candidate `51aa431eb1` is a patch reference only. A reconstruction must
replay read-only intent classification for its actual integration paths, including
`src/layered-schema/compile*.ts`, `src/data-layer-layered-schema*.ts`,
`src/composed-schema/`, and the canonical focused Definition and mount surfaces.
The candidate improperly reached the independent acceptance paths
`acceptance/src/acceptance/steps/layered_schema.clj` and
`test/support/layered-schema-{targets,workflows}.mjs`. The product reconstruction
must consume their repaired behavior from its QA base rather than change those
paths again; they do not enlarge the product behavior or excuse a narrower
runtime proof.

Before fresh review evidence, the reconstruction must prove all of these named
gates:

- a persisted stable-identity exclusion remains fail-closed when a surviving
  required rule depends on the excluded property, including after reload or a
  later parent change;
- runtime 032 compiles a real contained Event occurrence and uses an actual
  repository save/load boundary rather than an in-memory clone;
- runtime 033 crosses the durable project-command boundary and proves one atomic
  Undo for Allowed values and Example;
- affected property coverage exercises exclusion/dependency conservation and
  selected/custom Example reconciliation.

Before this product reconstruction resumes, independent task
`verification-repair-layered-page-group-display-paths` must reach QA with the
exact public no-leading-slash matrix assertions from patch reference
`912437c5ec`, fresh bound evidence, and every canonical identity still
slash-qualified. The product task does not own or replay that repair.

The coder must run the governed read-only intent classification from the exact
current QA head before product coding. A `coarse-boundary` result routes the
mandatory independently reviewed ownership-preparation stage. A bounded
`granularity-assessment-required` or `coarse-within-pack` result requires the
documented judgment path and does not automatically start preparation.

The implementation-and-review elapsed effort ceiling is four active hours. At two
active hours, report direct exclusion and reconciliation results, current source
paths, intent classification, exact planned packs and tasks, any forecast variance,
failures, remaining work, confidence, and completion forecast. Continue while the
approved behavior and safety boundaries remain unchanged and the completion path
is bounded.

## Acceptance mapping

- Layering 032 and runtime 032 prove direct ordinary inherited exclusion through a
  multi-parent Flow Page instance, downstream Page-branch effect, sparse durable
  identity, reload, Undo, source isolation, and protected/dependency safety.
- Layering 033 and runtime 033 prove edit-order independence and atomic
  reconciliation for a selected allowed-value Example while preserving a custom
  Example and its warning, isolation, and Undo.
