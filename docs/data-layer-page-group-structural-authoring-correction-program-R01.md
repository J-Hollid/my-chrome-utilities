# Data-layer Page Group structural authoring correction program R01

## Purpose

Correct Page schema authoring so an operator can define and inspect a Page with
multiple ordered Page Group memberships without supplying runtime observation
values. Move concrete applicability evaluation to the Fixtures workspace and
remove hard-coded observation examples from the Pages editor.

## Problem

The Pages editor currently exposes Retail, Trade, and Overlapping observations
whose payloads are fixed by the product rather than supplied by the project. A
missing observation is also represented as an empty object in some compilation
paths. Conditional Applicability Set predicates then evaluate false, which can
silently remove Page Group contributions from an effective schema or its
documentation.

This conflates specification authoring with example validation. During initial
authoring there is normally no observation. Absence of runtime values does not
mean that every conditional Page Group is inapplicable.

## Required behavior

### Pages author structure

A Page owns one ordered general-to-specific Page Group membership stack. Opening
the Page without a Fixture shows every membership, every structural schema
contribution, and its provenance. Conditional contributions retain their named
Applicability Set and readable condition.

The structural view distinguishes unconditional properties from conditional
branches. Mutually exclusive branches are not collapsed into one unconditional
winner, and neither branch is removed merely because no observation is present.

The Pages editor contains no observation selector, sample payload editor, or
scenario-evaluation action. It may display applicability as read-only structure,
but does not invent values with which to evaluate it.

### Fixtures evaluate examples

A saved Fixture supplies the concrete payload for evaluating Page and Page Group
applicability in the project editor. Fixture evaluation identifies the active and
inactive memberships, preserves the Page-owned relative order of active groups,
compiles the scenario-specific schema, and validates the Fixture against it.

Fixture names and payloads come from project records. Retail, Trade, Overlapping,
or other example categories are never generated as product-owned observations.
Captured Live events continue to use their real payloads in their owning testing
surface.

### Documentation preserves the specification

Documentation generated without a Fixture context includes unconditional
contributions and all conditional branches with conditions and provenance. It
does not evaluate applicability against an empty payload. A document generated
for a selected Fixture clearly labels its schema as an evaluated example rather
than the complete Page specification.

## Acceptance mapping

| Risk | Acceptance scenario | Required result |
|---|---|---|
| Missing values deactivate valid memberships during authoring | Structural authoring 001 | Every ordered membership and contribution remains visible without an observation |
| Conditional groups appear to overwrite or disappear | Structural authoring 002 | Effective properties distinguish unconditional results and conditional branches |
| Demo payloads masquerade as project records | Structural authoring 003 | Only saved Fixtures supply project-editor evaluation payloads |
| Documentation silently omits conditional schema | Structural authoring 004 | Generic documentation preserves all conditional branches |

## Scope

This correction covers Page configuration, Page Group structural composition,
Fixture-owned scenario evaluation, and Page schema documentation. It does not
change live event capture, Applicability Set authoring syntax, Page Group
membership order, or the legality rules for schema refinements.
