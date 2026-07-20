# Data-layer durable project repository program R01

## Decision and authority

This program corrects the project-library storage failure in which mounting the
side panel can throw `QuotaExceededError` while rewriting
`my-chrome-utilities.specification-project-library.v1`. It is later authority for
project persistence, migration, page-scoped Undo/Redo, storage failure recovery, and
extension storage permissions. The existing project-management contracts remain
authoritative for project behavior, active context, entity lifecycle, import, and
export except where their singleton migration previously required complete legacy
Undo snapshots to remain in the active project document.

The durable repository is not another project model. It persists the same canonical
project, stable identities, published revisions, current Draft, and references used by
Builder, the side panel, Specification Studio, compilation, export, and runtime
assignment. It replaces the physical Web Storage representation and whole-document
write pattern.

Recommended delivery order is:

1. complete and merge `single-schema-editor-parity`;
2. deliver `durable-project-repository`; and
3. reconstruct `flow-canvas-topology-examples` from that merged baseline.

This prevents new Flow persistence from being built against the storage model being
removed. The current schema recovery remains first and no existing task is
deactivated.

## Corrective outcome

The extension stores canonical project data in one versioned IndexedDB repository,
requests the required `storage` and `unlimitedStorage` permissions, and writes only
records affected by a Draft save. Undo and Redo are forward and inverse patches held
only in the open project page's memory; they are accepted as lost when that page
closes or reloads. Project library browsing reads compact metadata. Opening a project
loads only records needed by the visible route. Cross-surface updates carry stable
identities and opaque Draft tokens, not serialized projects.

Legacy project-library, active-project, and saved-schema documents migrate
atomically. The migrator resolves a newer matching storage generation, blocks
equal-generation divergence, verifies the durable read-back, retains a recoverable
source backup, and only then removes migrated document keys from Web Storage. Prior
persisted Undo and Redo are not migrated into the active repository; the operator is
explicitly told that project content is preserved while pre-upgrade Undo and Redo
are unavailable.

The implementation cannot pass by adding only `unlimitedStorage`, compressing the
same unbounded project snapshots, moving one giant JSON value to
`chrome.storage.local`, rewriting every project after a small edit, catching and
ignoring a failed write, using a mocked repository disconnected from installed
surfaces, or retaining Web Storage as a competing canonical project projection.

## Root causes being corrected

The current physical model has five compounding problems:

1. one Web Storage value contains every complete project;
2. each project transaction appends another complete before-project snapshot;
3. the active project and its history are duplicated in a second Web Storage key;
4. side-panel mount rewrites both values even when no project changed; and
5. quota failure is uncaught at mount and incompletely explained during later saves.

Large schema documents, captured fixture payloads, Flow graphs, release snapshots,
adopted source content, and legacy compatibility data multiply the snapshot cost.
The result is write amplification and storage growth proportional to project size
times retained edit count, with additional duplication for the active project.

## Durable repository model

IndexedDB is the canonical durable boundary. The first version provides stores or
equivalent independently addressable records for:

- project metadata, Saved Draft token, and intentional published revision;
- active project identity;
- canonical project entities keyed by project, kind, and stable entity identity;
- canonical schema definitions and saved-schema lineage;
- documentary Flow graphs and their stable component records;
- fixture payloads and assertion evidence;
- immutable release records;
- a change feed containing identities and opaque Draft tokens;
- migration receipts and recoverable legacy backups; and
- compact repository settings and storage-health metadata.

The exact IndexedDB store count may vary if atomicity and selective reads are
preserved. A record may not hide an entire multi-project library or complete
full-snapshot history behind one serialized value.

The global Saved Schema Library remains usable without an active project. Complete
saved-schema definitions use the durable repository; compact search metadata may be
indexed separately. Adoption still creates project-owned canonical data with stable
external lineage. Unrelated Live session storage is not redesigned by this program,
but no canonical project document, full schema definition, fixture payload, Flow
graph, release snapshot, or Undo snapshot may be newly written to Web Storage.

## Permissions and capacity

The packaged Manifest V3 extension declares `storage` and `unlimitedStorage` as
required permissions. Unlimited storage is a resilience measure for
`chrome.storage.local`, IndexedDB, Cache Storage, and origin-private files. It does
not suppress transaction, corruption, unavailable-repository, simulated quota, or
disk failure handling and does not authorize unbounded snapshots.

Storage and recovery reports at least:

- current Saved Draft time and published revision;
- pending unsaved command;
- project entity bytes;
- release bytes;
- fixture bytes;
- migration-backup bytes; and
- the browser's available storage estimate when supplied.

Diagnostics describe an estimate as an estimate. They never claim unlimited
storage means infinite disk or a successful save.

## Draft-save transactions and published revisions

Every Draft edit submitted for persistence has a stable command identity, owning
project identity, opaque base Draft token, affected record identities, and pending
patch. The forward and inverse patches used for Undo and Redo remain in the open
page's memory and are not written to IndexedDB. A single IndexedDB transaction:

1. reads the persisted Draft token;
2. compares it with the command base token;
3. resolves or rejects stale paths using the established visible conflict policy;
4. writes only affected canonical records;
5. writes a new opaque Draft token and change-feed record; and
6. leaves the published project revision unchanged.

The transaction commits all effects or none. A disjoint stale patch may be visibly
rebased as one named Draft save. An overlapping patch returns current, pending, and
conflicting fields before any write. No stale surface replaces the whole project or
collection.

Draft tokens are internal concurrency identities, not operator-facing revision
labels and not operator-authored numbers. An intentional Publish action creates the next
immutable published project revision. Ordinary create, edit, delete, Undo, Redo,
switch, reload, and autosave operations update the Saved Draft without advancing the
published revision.

Builder, side panel, Specification Studio, and the extension service worker access
one asynchronous repository interface. Production extension messaging publishes
project identity, Draft token, command identity, and changed record identities. Each
consumer reloads the records it needs and verifies the token. Messages do not
carry complete project payloads, and Web Storage `storage` events are no longer the
canonical subscription mechanism.

## Page-scoped Undo and Redo

Each open Builder, side-panel editor page, or Specification Studio page owns its own
in-memory Undo and Redo stacks for the project it currently has open. New actions
place forward and inverse patches in that page scope. One bulk commit remains one
Undo step regardless of row count. Undo applies its inverse as a normal Draft save;
Redo applies its forward patch as a normal Draft save. Stable identities remain
unchanged and neither action advances the published revision.

Closing, reloading, or replacing the open project page discards both stacks. Opening
the project again restores the latest Saved Draft with empty Undo and Redo. The
interface never promises recovery of discarded page history. If another surface
changes overlapping project data, the local stale Undo/Redo entry is invalidated or
receives the normal visible conflict review; it cannot overwrite the newer Draft.

No Undo entry, Redo entry, forward patch, inverse patch, complete before-project
snapshot, or history checkpoint is persisted in IndexedDB, `chrome.storage`, Web
Storage, project export, or project import.

## Atomic legacy migration

Migration inputs include the existing project-library document, active-project
projection, singleton project state, navigation, and global saved-schema
definitions. The migration is versioned, locked across extension contexts, and
idempotent.

For the same stable project identity:

- a strictly newer valid storage generation wins;
- matching generation and matching content migrate once;
- equal generation with divergent content blocks for operator review; and
- an invalid or missing referenced record blocks the owning project rather than
  silently dropping content.

The successful migration transaction writes canonical records, active identity,
saved-schema definitions, fixtures, Flow graphs, releases, a migration receipt, and
one recoverable backup containing the original source
payloads and checksums. It reads the durable records back and compares the migration
manifest before reporting success. Only after verification are migrated document
keys removed from Web Storage.

The prior full-snapshot Undo/Redo arrays do not remain in the active canonical
record. Their original bytes remain in the migration backup only. The installed
notice explains that pre-upgrade Undo and Redo were not migrated without calling
project content lost.
Deleting the backup is a separate named consequence review; it never changes the
current project.

If migration fails, the IndexedDB transaction aborts, no legacy source is deleted,
and a recovery-only interface offers source export and exact repair. Concurrent
startup contexts observe the migration lock or completed marker rather than
duplicating records.

## Save failure and recovery

Mounting a surface is read-only unless a versioned migration actually needs to
commit. It performs no unconditional project-library or active-project `setItem`.
An existing readable project never appears as an empty library because a write
failed.

Quota exceeded, transaction aborted, repository unavailable, corrupt record, or
verification failure leaves the last durable Draft token unchanged. The surface keeps
the unsaved command in memory, marks the project `Save failed`, names the attempted
action, and blocks project switching and publication. It exposes:

- Retry save;
- Export unsaved Draft;
- Export repository backup; and
- Open storage diagnostics.

No failure path claims the in-memory edit is saved. No recovery action silently
deletes projects, releases, fixtures, or migration backups.
At 360px the recovery view uses one vertical scroll owner, labelled controls,
deterministic result focus, and complete keyboard operation.

## Project library and route loading

The Projects tab queries compact project metadata and active identity. Searching,
sorting, or rendering the library does not deserialize every project graph. Opening,
switching, exporting, or deep-linking loads the selected project's required
records. Inactive projects remain durable without active subscriptions.

One property edit does not rewrite an unrelated entity, fixture, release, inactive
project, or the project list. Immutable releases and large fixture payloads are
referenced independently and are not copied into page-scoped Undo or Redo. Project export
and import retain their existing externally visible semantics while excluding
Undo, Redo, migration backups, storage estimates, and permission state.

## Delivery phases

### Phase A — quota-safe mount and repository boundary

Remove unconditional mount writes, add explicit loading and recovery states,
introduce the asynchronous canonical repository interface, and ensure every save
failure preserves the last durable Draft token.

### Phase B — IndexedDB records and Draft-save transactions

Store projects, entities, schemas, graphs, fixtures, releases, active identity, and
change-feed records behind transactional base Draft tokens. Replace complete project
notifications with identity and token notifications.

### Phase C — page-scoped history and storage health

Replace persisted project Undo snapshots with page-scoped forward and inverse
patches, prove their loss on close or reload, and add diagnostics and the accessible
Storage and recovery interface.

### Phase D — legacy migration and cleanup

Migrate legacy Web Storage atomically, reconcile duplicate active records, preserve
checksummed backups, omit prior history from active records, verify read-back, remove migrated
document keys, and prove idempotent concurrent startup.

### Phase E — installed extension terminal proof

Package the required permissions and prove quota-safe mount, actual IndexedDB
transactions, cross-surface convergence, migration, failure recovery, selective
loading, Undo/Redo, export/import, reload, keyboard operation, and 360px layout in
the installed extension.

## Finding-to-feature traceability

| ID | Finding or gate | Feature and scenario | Externally visible behavior | Production boundary | Required evidence | Phase | Terminal pass condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | Projects mount rewrites storage and crashes at quota | Durable repository 001; runtime 001 | Projects open or show recovery without a false empty state or uncaught exception | Side-panel mount and legacy adapter | Filled Web Storage, console errors, rendered project names, write trace | A, E | Mount issues zero unconditional project writes and remains operable |
| D02 | Packaged extension lacks durable-storage permissions | Runtime 002 | Installed extension can retain large projects while still reporting real failures | Manifest, packaging, IndexedDB open adapter | Parsed packaged manifest and opened database from trusted contexts | A, E | `storage` and `unlimitedStorage` are present in the installed package |
| D03 | One edit rewrites whole projects and library | Durable repository 002; runtime 003 | A property save updates once and other data remains unchanged | IndexedDB Draft transaction and record stores | Observed keys, Draft tokens, published revision, before/after hashes | B, E | Only affected records, token, and feed change while published revision does not |
| D04 | Stale surfaces can overwrite newer data | Durable repository 003; runtime 004 | Disjoint edits rebase and overlapping edits receive exact conflict review | Draft-token comparator and transactional conflict resolver | Interleaved commands, conflicts, zero partial writes | B, E | No stale command replaces a complete project or collection |
| D05 | Undo stores complete project snapshots | Durable repository 004–005; runtime 005 | Bulk Undo/Redo remain one atomic page-scoped action and disappear on close | Page-scoped forward/inverse stacks and Draft transaction | 500-row action, memory stack, reload, stable IDs, durable write trace | B, C, E | Undo and Redo work while open and no history record persists |
| D06 | Draft saves are mistaken for long-term revisions | Durable repository 002–005; runtime 003–005 | Draft edits save without advancing the published revision; Publish advances once | Draft token and immutable publication boundary | Edit, Undo, Redo, reload, Publish, token and revision trace | B, C, E | Only intentional Publish creates the next project revision |
| D07 | Failed saves can be mistaken for saved work | Durable repository 006; runtime 006 | Exact Save failed state preserves exportable unsaved work and blocks consequences | Repository transaction and draft status | Injected failures, unchanged hashes, enabled recovery, disabled switch/publish | A, E | Every failed transaction preserves durable Draft and names the unsaved command |
| D08 | Operators cannot diagnose or repair storage pressure | Durable repository 007; runtime 011 | Storage and recovery explains usage and offers direct safe actions | Usage estimator, export adapter, recovery UI | Category sizes, browser estimate, keyboard focus, 360px geometry | C, E | Recovery is understandable and complete without destructive clearing |
| D09 | Legacy copies can disagree and migration may guess | Durable repository 008–009; runtime 007–008 | Newer generations migrate; equal divergent generations require choice | Versioned migrator, lock, checksum validator | Source hashes, transaction trace, backup, deleted-key timing, review | D, E | No divergent or invalid source is silently selected or deleted |
| D10 | Legacy history conflicts with page-scoped Undo | Durable repository 008; portability 004; runtime 007 | Project content survives while prior Undo/Redo is omitted with an explicit notice | Migrator and recovery backup | Stable IDs, content hashes, notice, absent active history, recoverable raw bytes | D, E | Current state is exact, old history exists only in backup, and active record contains no snapshots |
| D11 | Library rendering loads every complete project | Durable repository 010; runtime 010 | A 100-project library searches promptly and loads only the opened project | Metadata index and route loader | Read-key trace with 100 projects and 200 MiB of bodies | B, E | Search deserializes metadata only and open reads selected route records |
| D12 | Releases and fixtures are duplicated through history | Durable repository 011; runtime 012 | Editing and export preserve immutable evidence without Undo copies | Release, fixture, page history, serializer, and importer boundaries | Record hashes, memory stack, parsed export, import transaction keys | B, E | Large immutable records remain single durable records and export semantics hold |
| D13 | Web Storage remains a parallel canonical model | Durable repository 012; runtime 009 | All surfaces converge after reload without project `storage` events | Repository adapters, extension messaging, migration cleanup | Web Storage write trap, change-feed messages, reload tokens | B, D, E | No canonical project document or payload is written to Web Storage after migration |
| D14 | A larger quota could mask broken failure behavior | Durable repository 006–007; runtime 002 and 006 | Unlimited storage is explained as resilience, not proof of save | Manifest permission and fault-injectable repository | Permission inspection plus quota, abort, and unavailable failures | A, E | Installed permission coexists with truthful recovery for every injected failure |

## Assumptions and unresolved product decisions

- IndexedDB is the canonical durable store; `chrome.storage.local` may hold compact
  non-project preferences but not active project identity or canonical data.
- Required `unlimitedStorage` is recommended because this is an offline authoring
  tool expected to hold large schemas, fixtures, documentation, and releases.
- Undo and Redo exist only in the open page's memory. Closing, reloading, or
  replacing that project page intentionally discards them.
- Opaque Draft tokens exist only for concurrency. The only operator-visible,
  long-term project revision is created by intentional Publish.
- Legacy backups remain until the operator exports or explicitly deletes them.
  Automatic expiry is not authorized in this revision.
- Compression and content deduplication may optimize records later but cannot
  replace record-level writes, page-scoped history, or failure recovery.
- Unrelated Live session, defect, and event-template storage are not migrated by
  this checkpoint unless a project-owned canonical record references them.
- Cloud sync, collaborative multi-user editing, and server persistence remain out
  of scope.

## Terminal acceptance

The program passes only when both durable-repository feature files and the revised
project-portability files parse and dry-check with no findings, the focused
`durable_project_repository` pack passes against the installed extension, and
packaging consumes that build. The pack must depend on the focused
`project_management` evidence rather than duplicate or replace it.

Terminal evidence must reproduce a full legacy Web Storage quota before side-panel
mount, show no uncaught `QuotaExceededError`, verify the packaged permissions,
perform actual IndexedDB saves and conflicts, prove page-scoped history loss, migrate and
recover divergent sources, converge Builder and side panel after reload, exercise
failure recovery at 360px using keyboard controls, and prove export/import without
project snapshots or Web Storage canonical writes.
