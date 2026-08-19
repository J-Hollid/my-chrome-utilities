# Data layer documentation template recovery R01

Status: User-approved on 2026-08-19

Prepared: 2026-08-19

## Outcome

An invalid previously saved Excel documentation template cannot trap its project
in a state where every Draft command fails. The affected custom output remains
fail-closed, but unrelated project changes remain saveable and the operator can
explicitly assign Built-in and remove the invalid template.

The reported workbook is confirmed unencrypted and carries only a nonfunctional
Microsoft Purview classification label. It can already be read and populated
with sample data. This makes the saved template record and its save-time
validation the correction's primary boundary, rather than workbook parsing or
rendering. Purview compatibility remains explicit regression evidence.

## Observed failure and diagnosis boundary

The reported exception is emitted by stored template-record validation. It is
raised when an Excel template record has an unsupported contract version, lacks
body metadata, has a malformed or mismatched digest, has an out-of-range byte
length, contains Rich content, or lacks a valid saved validation state. That
validation runs at the start of every Draft save, including the commands needed
to assign Built-in or remove a template.

The message is not emitted by the workbook-package parser. The confirmed sample
output proves that the current parser and renderer can consume this body.
Microsoft documents that Office may store a sensitivity label in Custom File
Properties, and that a sensitivity label can separately apply encryption. The
reported non-encrypting label is therefore not the cause of this record-level
error. The implementation must capture the exact failing record invariant rather
than infer the cause from the generic message.

References:

- [Sensitivity Label Properties](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/85388ac6-fb55-4017-828c-2680e3ab22ba)
- [Manage sensitivity labels in Office apps](https://learn.microsoft.com/en-us/purview/sensitivity-labels-office-apps)
- [Apply encryption using sensitivity labels](https://learn.microsoft.com/en-us/purview/encryption-sensitivity-labels)

## Recovery contract

A stored invalid template is unavailable, not silently valid. The Template
Library identifies the template and the exact failing metadata invariant. It
does not offer that template for a new assignment, duplicate, sample, preview,
or export.

Every primary problem uses the saved operator-facing template name, Excel or
Rich-page format, documentation kind, and affected Documentation Set count. It
does not require the operator to interpret an identity such as
`documentation-template:75358396-0bc2-403c-841f-818a351c1804`. `Go to problem`
opens Templates with that exact template selected, every referencing
Documentation Set name and assignment visible, and focus at the first applicable
repair. The internal identity and
failed record invariant remain available in initially collapsed technical
details for support and diagnosis. Duplicate template names are disambiguated by
format, kind, and assignment context rather than making the UUID the primary
label.

An existing assignment is retained until the operator chooses a repair. The
affected Excel format and kind remain blocked and never silently fall back to
Built-in. Other formats, kinds, and project commands remain available.

Saving an unrelated change may carry an invalid template record only when that
record, its body reference, and its assignment are unchanged from the stored
Draft. This tolerance is transition-scoped: it does not declare the template
valid and does not permit a new or changed invalid record.

Assign Built-in is an authorized recovery transition. It can save while the
unchanged invalid template record remains in the Library. Once no Documentation
Set refers to that template, Remove template can delete the record through the
normal reversible Draft command. Multiple references still block removal and
identify every assignment that must first be repaired.

`Revalidate saved workbook` is the preferred in-place recovery when the stored
body is readable. It loads the exact project-owned bytes and runs current guided
validation for the template's kind. When the body passes, one atomic reversible
Draft command rebuilds only body-derived contract, digest, byte length, and
validation metadata. It preserves the template's operator-facing name, stable
identity, body bytes, and every assignment. The metadata repair makes prior
preview identity stale; custom output resumes only after Refresh preview.

If the stored body fails current validation, revalidation reports the current
workbook findings and changes nothing. Assign Built-in, Replace workbook, and
eventual removal remain available. Revalidation never treats a previously saved
validation result or successful sample as a substitute for current validation.

Upload, Save template, replacement, new assignment, portability import, and any
other operation that introduces or changes invalid template metadata remain
atomic and fail-closed. A failed operation leaves no new body, metadata,
assignment, revision, or partial recovery.

## Purview-labelled workbook boundary

Documented Office sensitivity-label Custom File Properties are nonfunctional
package metadata. When the `.xlsx` remains unencrypted and otherwise satisfies
the guided contract, those properties do not become bindings, areas,
relationships, project fields, or template instructions and do not make the
candidate invalid. Saving retains the exact selected bytes and matching digest
and byte length in the project-owned body store.

This compatibility does not authorize decryption, rights bypass, external
content, formulas, macros, embedded packages, unsupported relationships, or an
increase to any package limit. A label that applies encryption remains rejected
as an encrypted workbook before persistence. The correction makes no promise
that generated output inherits or enforces an organization's label policy;
output-label governance requires a separate explicit product decision.

## Development focus and QA impact

Stable task name: `documentation-template-recovery`.

Begin with transition validation around an already stored invalid template:
unchanged carry-forward, unrelated Draft save, explicit Built-in reassignment,
in-place revalidation, unreferenced removal, and strict rejection of newly
introduced invalid state. Then expose derived unavailable status,
operator-facing identity, exact invariant, assignment inventory, and routed
`Go to problem` action in the Template Library. Add a real OOXML fixture
containing the documented Purview Custom File Properties and retain the existing
encrypted-workbook rejection.

Likely existing integration surfaces and proposed ownership are:

| Proposed source prefix or path | Proposed parent pack | Proposed subordinate slice | Exact consumers |
|---|---|---|---|
| `src/documentation-templates/` | `flow_export` | `documentation_template_workspace` | Template Library, documentation compiler, preview/export, and `shell/documentation_workspace_consumer` |
| `src/project-documentation/workspace-template-` | `flow_export` | `documentation_template_workspace` | Documentation workspace contribution and `shell/documentation_workspace_consumer` |
| `src/data-layer-durable-project-repository.ts` | `durable_project_repository` | existing reviewed parent fallback | durable Draft runtime, documentation-template body staging, `flow_export`, and `shell` |

No new production prefix is expected. The coder must run governed read-only
intent classification from the current QA head before product coding. A
`coarse-boundary` result requires independently reviewed ownership preparation.
`granularity-assessment-required` and `coarse-within-pack` require recorded
judgment and do not automatically start preparation.

Forecast focused evidence covers `flow_export`, `project_management`,
`durable_project_repository`, their declared `shell` consumer, properties, and
package proof. The exact changed-path plan is authoritative; feature mode never
runs the all-20 gate. The browser evidence uses actual installed controls and a
durable pre-existing invalid record, proves an unrelated save and the complete
in-place revalidation and Built-in/remove recovery sequences across reload,
follows `Go to problem` across multiple Documentation Sets with keyboard focus,
and independently inspects both unencrypted labelled and encrypted workbook
fixtures.

The implementation-and-review effort ceiling is ten active hours. At five
active hours, report the reproduced invalid invariant, unrelated-save and
in-place and Built-in recovery status, Purview fixture status, exact planned
packs, any forecast variance, remaining behavior, confidence, and completion
forecast. Continue by default while the approved behavior and safety boundary
remain unchanged.

## Exclusions

This correction does not rewrite an invalid workbook, silently assign Built-in,
drop a template or assignment during load, weaken package validation, remove a
Microsoft label, decrypt protected content, change project portability, or add
output-label enforcement. It does not promote accumulated QA work to `master`.
