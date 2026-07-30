# Data-layer Page Group structural authoring correction program R01

## Purpose

Correct Page schema authoring so the real Effective schema at Page table composes
canonical properties from multiple ordered Page Group memberships without a
runtime observation. Provide independent Applicability Set preview checkboxes,
ordered override, and Fixture evaluation without a global Applicability Set winner.

## Problem

The Page Group Applicability Set selector cannot represent None once sets exist.
The effective-schema workspace filters assigned groups, while separate structural
evidence exercises legacy constraints instead of proving that canonical Page Group
properties populate the production table. Applicability Sets are also treated as
global competing winners, making two legitimate independent matches ambiguous.

This conflates membership, authoring preview, and routing. Membership determines
schema composition. Applicability Sets are reusable independent predicates.
Assignment priority, not Applicability Set priority, resolves competing routes.

## Required behavior

### Pages author structure

A Page owns one ordered general-to-specific Page Group membership stack. The actual
Effective schema at Page table composes canonical properties from every
participating membership and then the Page-local schema. Save, navigation, and
reload preserve the same result.

Each distinct Applicability Set referenced by an assigned Page Group appears once
as a checkbox. Every checkbox is checked when the Page opens. Groups without an
Applicability Set always participate; checking multiple sets composes all their
groups together in membership order. Checkbox state is transient preview state and
changes no project record. The Page Group editor offers None as a durable
Applicability Set selection.

The Pages editor contains no observation selector or sample payload editor.

### Transitive Shared Profile inheritance

Each participating Page Group contributes its complete effective schema rather
than only its local canonical properties. A Page Group first composes every Shared
Profile it references as parallel peers, then applies its local contribution. The
Page composes those effective Page Group results in membership order before its
Page-local contribution.

Provenance preserves the complete inheritance route, for example `Commerce →
Checkout → Cart`. A Shared Profile reachable directly from the Page or through
multiple selected Page Groups produces one effective property contribution rather
than duplicate rows or a conflict with itself, while provenance retains every
reachability route.

Clearing an Applicability Set preview checkbox excludes the associated Page Group's
complete effective schema, including profiles reachable only through that group. A
profile remains when another participating group or the Page itself still
references it. Flow Page instances, Fixtures, validation, documentation, and export
use this same transitive contributor graph.

### Ordered resolution

Composition first combines compatible facets. A later Page Group replaces an
earlier ordinary conflicting facet and the table retains the earlier contributor as
superseded provenance. Reordering therefore changes the effective result and
receives impact review. Invariant rules and structurally incompatible definitions
cannot be resolved by order and remain blocked with direct repair actions. The Page
local contribution follows the Page Group stack under the same rules.

### Fixtures evaluate examples

A saved Fixture supplies the concrete payload for evaluating referenced
Applicability Sets. Every set evaluates independently. All matching groups compose
in Page-owned order, and simultaneous matches are valid unless their schema
definitions conflict. Ambiguity is reserved for tied competing Assignments.

Fixture names and payloads come from project records. Retail, Trade, Overlapping,
or other example categories are never generated as product-owned observations.
Captured Live events continue to use their real payloads in their owning testing
surface.

### Documentation preserves the specification

Documentation generated without a Fixture uses the all-checked ordered composition,
including effective and superseded provenance plus each group's referenced
Applicability Set. It does not evaluate conditions against an empty payload. A
document generated for a selected Fixture labels its independently matched sets and
schema as an evaluated example.

## Acceptance mapping

| Risk | Acceptance scenario | Required result |
|---|---|---|
| Applicability cannot be absent and preview controls invent observations | Structural authoring 001 | None is durable and referenced sets appear as checked checkboxes |
| Separate helper evidence hides an empty production table | Structural authoring 002 | Canonical properties populate the real table across reload |
| Independent contexts cannot be previewed together | Structural authoring 003 | Any checkbox combination recomposes without project writes |
| Reorder does not resolve ordinary conflicts | Structural authoring 004 | Later ordinary facets win with superseded provenance |
| Applicability Sets incorrectly compete globally | Structural authoring 005 | Every set evaluates independently and only Assignments can tie |
| Generic documentation drops composition context | Structural authoring 006 | All-checked ordered output preserves applicability and provenance |
| Shared Profile inheritance stops at Page Groups | Structural authoring 007 | Multiple Page Group profiles populate the Page table with complete provenance |
| Repeated profile reachability duplicates or loses properties | Structural authoring 008 | Stable profile identity deduplicates values while retaining every route |
| Downstream surfaces flatten Page Groups to local schema | Structural authoring 009 | Page instances, Fixtures, validation, and documentation use the same transitive graph |

## Scope

This correction covers Page and Page Group configuration, canonical effective
schema composition, independent Applicability Set evaluation, Fixture-owned
scenario evaluation, Assignment ambiguity boundaries, ordered ordinary override,
transitive Shared Profile inheritance, and Page schema documentation. It does not
change live event capture or conditional rule authoring inside a canonical
property.
