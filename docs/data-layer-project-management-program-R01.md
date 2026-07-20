# Data-layer project management program R01

## Decision and authority

This program is the active authority for managing data-layer Specification
Projects, choosing the single active project, opening that project in Specification
Studio, and moving a project between installations. It adds a focused project-
management slice to the current Flow, canonical-schema, and selected-Flow export
checkpoints. It does not reactivate the archived full-site R02/R04 release program.

The project library may hold multiple projects, but zero or one stable project
identity is active for an extension profile. A project selection, preview, import,
or library search is not activation. Only an explicit create, open, switch, or
confirmed project deep link changes active context.

## Corrective outcome

The side panel has a top-level `Projects` tab. An operator can create projects,
browse the library, edit metadata, safely switch the active context, open the active
project in Specification Studio, export a complete project Draft, and import a
validated bundle as a new inactive project. Every project-bound surface visibly
names and subscribes to the same active project.

The implementation cannot pass by retaining one implicit singleton state, choosing
the first stored project, placing project controls inside Schema, changing only a
header while retaining old project records, sharing navigation or entity selection
between projects, replacing an existing project during import, or using a mocked
project list disconnected from production storage and Specification Studio.

## Project repository and active context

The production repository stores a collection of complete project states keyed by
stable project identity and one nullable `activeProjectId`. The active identity is
profile-level context, not mutable project metadata. Every project-owned command,
subscription, route, and deep link carries the owning project identity; project
revision alone is not sufficient to resolve an entity.

The repository invariants are:

- any number of saved projects may exist;
- `activeProjectId` is absent or identifies exactly one saved project;
- a project and every contained entity retain stable identity across rename,
  switching, reload, and metadata edits;
- project-owned references never resolve against another project;
- list selection and import staging do not change active context; and
- active-context change completes atomically before target subscriptions and entity
  resolution begin.

Creating a project while another project is active previews the context change.
Confirmation stores a new empty canonical project graph, preserves every existing
project, and makes the new project active. Opening or switching performs the same
safe context transition. There is no simultaneous active-project set.

## Project metadata

The guided project form exposes:

- required human project name;
- purpose or description;
- website or domain context;
- owner or team; and
- notes.

System-managed stable identity, Draft revision, created time, and last-modified time
are displayed where useful but are not free-text identity fields. A trimmed project
name is required and case-insensitively unique within the local library. Metadata
changes are revisioned project commands with impact feedback and one Undo. A rename
updates library rows, active headers, Studio titles, and human-readable deep links
without changing stable project or entity references.

## Projects side-panel tab

`Projects` is a peer of Schema and other top-level side-panel tabs. It contains:

1. an Active project card with name, website, Draft revision, last-modified state,
   `Open in Specification Studio`, `Edit details`, and `Export`;
2. a searchable Project library with explicit Active and Switch actions; and
3. contextual `Create project` and `Import project` actions.

Project lifecycle controls do not appear as schema functionality. Every repeated
row action includes the project name in its accessible name. At 360px the tab uses
one vertical scroll owner, no horizontal page scrolling, deterministic dialog focus,
and complete keyboard access.

When no project is active, project-bound Schema, Page, Page Group, Event, Flow, and
documentation surfaces state `No active project` and offer `Open project` and
`Create project`. Storage order, recency, and a one-result list cannot implicitly
choose a project. Global capabilities such as the Saved Schema Library remain
available without fabricating project context.

## Switching and pending writes

Before activation changes, consequence review names the current project, target
project, project-bound surfaces that will update, and whether the current Draft is
saved. An unresolved stale command, save conflict, or failed write blocks the
switch before the target subscribes. The exact pending command offers merge,
reject, or retry. After resolution, the saved current revision remains in the
library and the target becomes the sole active identity.

Side panel and Specification Studio subscribe to the same active-context record.
They replace project projections only after activation commits. Schema, Pages, Page
Groups, Events, Flows, documentation, assignments, and selected entities must not
show a mixture from two projects during or after the switch.

Each project owns its last valid Studio and side-panel location. Returning to a
project restores only locations whose stable references still exist in that
project; otherwise its Project overview is the fallback. A deep link to an inactive
project names the target and requests safe activation before resolving the entity.

## Specification Studio information architecture

Specification Studio is the project workspace:

```text
Projects -> Open project -> Specification Studio -> Project overview
```

`Open in Specification Studio` belongs to the project card and active-project
header. It opens a route containing stable project identity, shows the project name,
and lands on Project overview unless a valid project-scoped entity deep link was
requested. No schema implicitly owns the workspace.

The schema editor must not present `Open specification builder` as though the
project workspace were a schema capability. A contextual `Open schema in
Specification Studio` may deep-link through the owning active project. The existing
schema documentation-table builder remains a schema documentation action; it does
not establish or launch project context.

## Global Saved Schema Library boundary

The Saved Schema Library is global and remains usable with no active project. Its
records are not project entities until adopted. `Add to project` opens a human-name
project picker but changes nothing during selection. Choosing a project other than
the active project uses the normal safe activation review before adoption.

Confirmation creates one project-owned canonical Draft with immutable source
identity and revision lineage. The global source and every non-selected project
remain unchanged. A project export includes the adopted definition needed for
standalone use and its lineage metadata, but not unrelated global library records.

## Project export

Export is available from the active card and a project-library row. It uses the
latest fully persisted Draft revision; a pending failed write must be resolved
before export can claim that revision. One versioned project bundle includes:

- project metadata and Draft revision;
- canonical schemas and inheritance references;
- Pages, Page Groups, Events, Flows, occurrences, applicability, and assignments;
- documentation configuration; and
- complete adopted-schema definitions with external source lineage.

It excludes unadopted global schemas, browser permissions, Live observations,
cached compilation, transient interface state, and Undo/Redo history. Export does
not issue a project mutation or change active context.

## Project import

`Import project` stages a selected bundle before any repository write. Review shows
format version, source name and Draft revision, entity counts, reference integrity,
required migrations, an editable unique target name, and the only first-release
commit mode: `Import as new project`. A colliding source name is deterministically
prefilled with `<source name> copy` and must be unique before commit.

Malformed input, unsupported future versions, missing entities, dangling internal
references, or an unsafe migration block the exact bundle section and disable
commit. Import is atomic; it creates no partial project, entity, or active-context
change.

Successful import always assigns a new project identity and new stable identities
to project-owned records, then remaps every internal parent, membership,
occurrence, assignment, and Flow reference. External Saved Schema Library lineage
continues to identify its original source revision. Existing projects remain byte-
identical. The imported project is inactive until the operator explicitly opens it.
Replace, append, and merge into an existing project are not part of this release.

## Existing singleton migration

On first run after upgrade, an existing singleton Specification Project is wrapped
in the project repository and becomes active. The atomic migration preserves its
stable identity, all contained identities, metadata, Draft revision, canonical
graph, navigation, and Undo/Redo history. A migration marker prevents subsequent
reloads from duplicating or resetting it. Failure leaves the prior singleton bytes
recoverable and does not create a partial library.

## Delivery phases

### Phase A — repository and migration

Introduce the multi-project repository, nullable single active identity, project-
scoped command and subscription boundaries, atomic legacy migration, and per-project
navigation.

### Phase B — Projects tab and metadata

Deliver the active card, searchable library, create and edit forms, switch review,
no-active guidance, responsive keyboard operation, and explicit project context in
every project-bound surface.

### Phase C — Studio and Schema boundaries

Route project actions to Project overview in Specification Studio, preserve entity
deep links under stable project identity, remove the misleading schema-owned project
launcher, and connect Saved Schema adoption through safe project activation.

### Phase D — portable bundles

Implement complete persisted-Draft export, staged validation, atomic import-as-new,
identity remapping, reference conservation, and exclusions.

### Phase E — installed terminal proof

Exercise creation, metadata, switching, Studio routing, export, import, activation,
and reload through visible installed-extension controls with production persistence.

## Finding-to-feature traceability

`Context NNN` refers to
`features/data-layer-project-library-and-active-context.feature` and its runtime
pair. `Portability NNN` refers to
`features/data-layer-project-portability-and-upgrade.feature` and its runtime pair.

| ID | Finding or decision | Feature and scenario | Externally visible behavior | Production boundary | Required evidence | Phase | Terminal pass condition |
|---|---|---|---|---|---|---|---|
| P01 | Project management is hidden behind one implicit singleton | Context 001 | Projects tab shows active card, searchable library, and contextual lifecycle actions | Side-panel routing and project repository | Rendered tab, rows, active identity, and absent schema-owned controls | A, B | Multiple saved projects are visible while exactly one is Active |
| P02 | A second project cannot be created safely | Context 002 | Guided metadata creation previews and activates a new empty project | Project creation transaction and active-context store | New stable ID, empty graph, unchanged prior bytes, and next action | A, B | Creating a project preserves every existing project and yields one active identity |
| P03 | Project metadata cannot be edited | Context 003 | Name, purpose, website, owner, and notes update everywhere with Undo | Metadata command and project projections | Stable IDs, revisioned command, headers, deep links, and Undo | B | Rename changes no stable identity or project ownership |
| P04 | Operators cannot explicitly change project context | Context 004 | Switch review atomically replaces every project-bound surface | Active-context command, subscriptions, and projections | Before/after active ID and complete visible collection separation | A, B | No surface retains a record from the prior project |
| P05 | Switching may strand or lose a pending write | Context 005 | Unresolved commands block activation with property-scoped repair | Revision repository and switch coordinator | Pending command, absent target subscription, resolved revision, and retained Draft | A, B | Target activates only after current-project persistence is safe |
| P06 | No-active state silently selects a project | Context 006 | Guided empty state offers Open and Create while global schemas remain available | Active-context resolver and surface guards | Absent active ID, rendered guidance, and no inferred lookup | A, B | Storage order and recency cannot establish context |
| P07 | Specification workspace is misleadingly schema-owned | Context 007 | Project action opens Project overview; schema action only deep-links inside it | Studio router and side-panel action ownership | Project route/title, overview, schema DOM, and entity deep link | C | Studio opens without a schema owning the project workspace |
| P08 | Navigation can resolve an entity against the wrong project | Context 008 | Per-project locations restore and deep links activate before resolving | Navigation store, deep-link parser, and project-scoped resolver | Stored locations, consequence review, activation order, and resolved IDs | A, C | An inactive-project link never resolves within the active project |
| P09 | Global saved schemas and project schemas blur context | Context 009 | Add to project safely activates the chosen project and preserves the source | Schema Library adapter, active context, and adoption command | Picker, project Draft lineage, unchanged source and non-target project | C | Exactly one chosen project receives the adopted schema |
| P10 | Projects tab must remain operable in the side panel | Context 010 | One-scroll 360px layout and deterministic keyboard focus | Responsive Projects UI and focus adapter | Overflow measurements, accessible names, focus sequence, and active header | B, E | Complete switching needs no pointer or horizontal page scroll |
| P11 | Project export may omit required graph data or leak transient state | Portability 001 | One versioned persisted-Draft bundle has complete graph and explicit exclusions | Serializer, reference walker, and download adapter | Parsed bundle, resolvable references, excluded categories, unchanged revision | D | Exported project is self-contained without runtime or UI residue |
| P12 | Import can overwrite an existing project or preserve colliding IDs | Portability 002 | Staged Import as new project remaps owned identities and leaves source inactive | Parser, migrator, remapper, atomic repository commit | Review, new IDs, mapped references, lineage, prior bytes, and compiled result | D, E | Imported graph resolves independently and no prior project changes |
| P13 | Invalid import can partially mutate the library | Portability 003 | Exact malformed, version, and dangling-reference blockers disable commit | Format validator and transaction boundary | Focused blocker, disabled action, byte equality, counts, and active ID | D | Every invalid bundle produces zero repository writes |
| P14 | Existing singleton projects need lossless upgrade | Portability 004 | One atomic migration preserves identity, state, navigation, and history | Legacy adapter, repository migration, and marker | Before/after graph, active ID, history, reload count, and recovery bytes | A, E | One reloadable library entry replaces the singleton without duplication |
| P15 | Components could pass without a coherent installed workflow | Portability 005 | Visible create, edit, switch, Studio, export, import, open, and reload sequence | Installed side panel, Studio, repository, serializer, and router | Operator event trace, active-ID history, project bytes, remapped graph, and reloaded DOM | E | Exactly one project remains active and every project stays isolated end to end |

## Assumptions and deferred decisions

- Project names are unique human labels within the local library; stable IDs remain
  authoritative for storage and references.
- The current supported versioned JSON project bundle is the first-release transport.
- Project archive, delete, simultaneous windows pinned to different projects,
  replace import, and cross-project merge require later approved specifications.
- Fixtures, release publication, Live evaluation, and temporal Flow enforcement are
  not activated by this project-management slice.

## Terminal acceptance

The program passes only when all four project-management feature files parse and
dry-check with no findings, the focused `project_management` pack passes against
the built extension, and packaging consumes that same build. Terminal evidence must
show visible project creation and metadata, one active identity throughout every
switch, complete cross-surface context replacement, project-owned Studio routing,
portable export, atomic remapped import, reload persistence, and no cross-project
entity leakage.
