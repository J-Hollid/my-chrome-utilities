# Data-layer Property Set and Flow Section separation program R01

## Purpose

Replace Page Group's combined schema-composition and Flow-placement meanings with
two independent concepts. A project-level Property Set is a reusable, composable
schema contributor applied to Pages. A Flow-owned Section is a named canvas
container used only to organize Page instances.

## Problem

Page Group currently owns a canonical schema, Shared Profile inheritance,
applicability, Page membership order, Assignment targeting, Flow lane selection,
and Page-frame placement. This makes a visual Flow operation depend on a Page's
schema composition and makes the Page Group name misleading now that its primary
purpose is reusable property componentization.

A presentation rename would retain the coupling. The stored domain must separate
the reusable schema component from the Flow-owned visual container while preserving
existing effective schemas, stable contributor identities, Flow topology, and
project portability.

## Required behavior

### Property Sets are reusable schema components

Property Sets are a top-level project collection. Each Property Set retains one
stable contributor identity, its canonical schema, selective Shared Profile
inheritance recipes, local facets, documentation, rules, and where-used
relationships. A Property Set may remain an Assignment schema target.

Shared Profiles and Property Sets remain distinct. A Shared Profile is a reusable
source from which a fixed selection of properties is inherited. A Property Set is
an applied composition unit whose complete current effective schema participates
in each Page application. New Property Set-local properties therefore reach every
applying Page, while new properties in an inherited Shared Profile remain Parent
additions until explicitly selected by that Property Set.

### Pages apply ordered Property Sets

A Page owns one ordered general-to-specific list of Property Set applications.
Each application contains the Property Set reference and an optional Applicability
Set reference. Applicability belongs to the application rather than the reusable
Property Set, so the same Property Set may be unconditional on one Page and
conditional on another.

The Page workspace calls this list Property composition. Operators can search,
add, reorder, remove, and open Property Sets. The interface uses applied or used
language rather than saying that a Page belongs to a Property Set. Reordering keeps
the existing ordinary-facet precedence, impact review, provenance, blocking
invariant behavior, and one page-scoped Undo action.

### Flow Sections are schema-neutral containers

A Section belongs to exactly one Flow and is created from that Flow's canvas. It
has its own stable identity, human name, bounds, and presentation order. It is not
a top-level project collection, schema contributor, Assignment target, or schema
tree category.

Any Page instance may be placed inside a Section regardless of the Page's Property
Sets. A Page instance may also remain outside every Section. Moving a Page instance
between Sections or outside them changes only Flow presentation. Moving a Section
moves its contained Page instances while preserving their relative positions.
Resizing a Section changes its bounds without silently changing containment.

Section changes never change Page Property composition, effective schemas,
applicability, contributor provenance, validation, or Assignment targeting.
Relationships may cross Section boundaries. Repeated instances of the same Page
may occupy different Sections.

Removing a Section defaults to retaining its Page instances at their current
canvas positions without a Section. Removing the Section together with its
contents is a separate destructive action with named impact review. Both actions
remain Flow-local and undoable.

Flow documentation continues to derive journey order from Page relationships.
Section names may appear as presentation labels but never as schema contributors,
provenance, validation context, or ordering authority.

### Verified migration and portability

The one-time project upgrade converts every Page Group into one Property Set while
preserving its contributor identity and complete schema content. Page membership
order becomes Property Set application order. A Page Group's Applicability Set is
copied to each corresponding Page application.

Each Flow receives its own Section for every legacy Page Group lane that it used.
Those Sections receive new Flow-owned identities while retaining the human names,
order, and bounds needed to reproduce the canvas. Page-frame, occurrence,
relationship, Page, Event, Property Set, and Assignment identities remain stable;
each legacy Page-frame placement reference is replaced by its new Section
reference. Page Group Assignment targets become Property Set targets.

The upgrade is atomic, verified before legacy fields are removed, and idempotent.
Import accepts the legacy representation. Newly saved and exported projects use
Property Sets, Property Set applications, Flow Sections, and Section references
without maintaining a second Page Group model.

## Acceptance mapping

| Risk | Acceptance scenario | Required result |
|---|---|---|
| A rename leaves two meanings coupled | Separation 001 | Project navigation and workspaces expose Property Sets and Flow-owned Sections with no Page Group authoring concept |
| Reusable components become ambiguous with Shared Profiles | Separation 002 and 005 | Property Sets are whole applied layers while Shared Profile selection remains fixed and explicit |
| Composition loses ordering or provenance | Separation 003 | Reordering changes only legal ordinary winners and retains superseded provenance and impact review |
| Applicability remains incorrectly global | Separation 004 | Applicability is stored per Page application and the same Property Set behaves independently on different Pages |
| Renaming breaks routing and discovery | Separation 006 | Assignments and schema relationships use Property Set identity; Sections never appear as schema targets |
| Canvas grouping still changes schema | Separation 007 and 008 | Section placement accepts any Page and every visual operation is schema-neutral |
| Container removal silently deletes work | Separation 009 | The default preserves Page frames and destructive removal is a separate reviewed action |
| Existing projects lose identity or meaning | Separation 010 | Verified migration preserves schemas, topology, references, and effective results |
| The new controls are not operable in constrained layouts | Separation 011 | Keyboard and pointer operation remain contained at desktop and narrow widths |

## Scope

This correction covers project taxonomy, Property Set lifecycle and authoring,
Page composition applications, application-specific applicability, Assignment and
schema-tree terminology, Flow Section creation and containment, schema-neutral
canvas operations, migration, import, export, Undo, and responsive operation.

It does not merge Shared Profiles into Property Sets, change selective Shared
Profile membership, make Sections executable stages or responsibility lanes,
derive schema from Section placement, change Page relationships, or add Section
semantics to validation and documentation order.
