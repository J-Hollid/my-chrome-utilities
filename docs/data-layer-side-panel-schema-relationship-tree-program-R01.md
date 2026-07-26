# Data layer side-panel schema relationship tree program R01

## Objective

Replace the long mixed list inside the existing side-panel Schema Library with a
compact tree derived from the active project's contributor roles and
relationships. Every project schema remains in that Library. Operators can filter
by contributor category and search the whole relationship hierarchy while
continuing to edit one canonical schema through the established in-panel editor.

## Relationship projection

Categories are not tags and are never manually assigned. Shared Profile, Page
Group, Page, Event, Flow Page-instance, and Event-occurrence categories derive
from canonical contributor roles. Flow nodes are structural ancestors for their
Page instances and occurrences.

The one in-panel Schema Library contains a global Saved schemas branch and, when
a project is active, a Project branch. The finite project projection contains:

- Shared Profiles and their canonical contributors;
- Page Groups with references to every member Page;
- Pages with references to every Flow Page instance;
- Events with references to every Event occurrence; and
- Flows with Page instances containing their Event occurrences.

An entity with several relationships appears beneath every relevant parent. Each
appearance is a reference carrying a relationship path and the same stable
canonical target. It never creates another schema record. The global Saved Schema
records remain in the Saved schemas branch of the same in-panel Library.

## Filter and search

The category filter supports Saved schemas, Shared Profiles, Page Groups, Pages,
Events, Flow Page instances, Event occurrences, and All. Filtering retains structural
ancestors needed to locate matching contributors and removes unrelated
schema-bearing descendants.

Search traverses every node in the filtered hierarchy. It matches human names,
derived roles, and human relationship paths case-insensitively. Results retain
their breadcrumbs, automatically expand matching ancestor paths, and omit
unrelated siblings. Raw identities are not search labels or visible breadcrumbs.

Tree query, filter, valid expansion state, and scroll position are project-scoped
view state. They return when the operator switches back to a project but are not
canonical project content, portable data, or publication state.

## Editor and update behavior

Opening any reference routes its stable contributor and relationship context into
the sole established side-panel Schema editor. Closing the editor restores the
invoking reference and tree state. Repeated references reuse the same canonical
editor projection.

Membership changes, occurrence moves, renames, additions, and removals update the
tree from current project relationships. No category field or synchronization
command exists. Missing or stale relationship references disappear or resolve
through existing project repair behavior without changing canonical schema data.

## Delivery boundary

This cycle changes only how schemas are presented and found inside the existing
in-panel Schema Library: its list projection, relationship-tree navigation,
category filtering, hierarchy search, project-scoped view state, and compact
accessibility. It does not move project schemas out of the Library and does not
change schema inheritance, contributor applicability, Flow ownership, project
collections, persistence, the Saved Schema Library model, or the established
compact editor.

The focused verification sequence is:

```sh
node scripts/run-focused-acceptance.mjs --pack schema_relationship_tree
node scripts/package.mjs
```

The pack contains both relationship-tree contracts and focused production
evidence for repeated Page and Event references, stable canonical routing,
category filters, hierarchy search and breadcrumbs, live relationship updates,
project switching, no-project behavior, one-editor reuse, keyboard operation, and
360px geometry.
