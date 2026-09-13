# Configuration export and import review

Reviewed on 2026-09-13 against QA source after `aa42580131`.
This is an investigation and refinement proposal, not an implementation handoff.
The user's exact export button, filename, error, and installed builds are not yet
known. Reproductions below use generated test data and an in-memory repository.

## Current flows

| Entry point | Export | Import and scope |
| --- | --- | --- |
| Projects: export one project | Version 3 ZIP through the durable transport | Projects imports ZIP or its supported legacy project JSON; reviews then creates a new inactive project with remapped identities. |
| Specification Studio: Export project | Version 2 specification-project-state JSON, except when an Excel template body triggers ZIP | Studio has its own JSON parser and an archive import path. Its JSON format differs from Projects JSON. |
| Storage and recovery: Export repository backup | Version 2 durable-repository-recovery-bundle JSON | Contains multiple projects and repository records. No matching user-facing restore path was found. Normal project import rejects it. |
| Schema Library: Extension backup | schema-library-v1.json | Schema Library import accepts version 1 schemas/rules. This is not an entire extension backup. |
| Schema Library: standard export | JSON Schema Draft 2020-12 | Intended for external schema use; not the native Schema Library restore format. Export reports omitted rules. |
| Event Library and saved sessions | Separate library/session files | Separate import controls; not an all-project or whole-extension transfer. |
| Hotkeys | my-chrome-utilities-hotkey-keymap.json | Separate keymap validation and local settings; not included by a whole-extension export contract. |

Projects uses createVersion3ProjectLibraryTransport from the durable runtime.
Its archive contains manifest.json, draft.json, optional published.json, and
deduplicated asset entries. Image bodies and Excel template bodies can therefore
travel in one ZIP. One downloaded file is appropriate; binary data need not be
sent as separate loose files. A JSON file alone can be complete only if all
required data is embedded. Current metadata references are not embedded bodies.

## Confirmed format incompatibilities

Using the production built serializers and parsers with a generated project:

- Studio export to Projects import returns bundle.format: Choose a readable
  project bundle.
- Repository backup to Projects import returns the same format blocker.
- Repository backup to Studio import throws Unsupported Specification Project
  format; supported versions are 1 and 2.
- Durable project JSON to Studio import throws that same error.

Thus a file produced by one extension export control can be rejected by another
extension import control. Valid JSON is not sufficient: each parser checks a
different envelope. These results establish a plausible cause, not the exact
cause of the user's colleague's failure.

## Gaps to refine

1. **No complete workspace transfer contract.** Project sharing, repository
   recovery, schema backup, hotkeys, and session/library exports are separate.
   There is no identified export/import pair for the user's entire configuration.
   Define whether this includes all or selected projects, global schemas/rules,
   event libraries, saved sessions, utility settings, templates, images, and
   publication history. Device permissions and current tab connections should
   be reviewed separately from portable configuration.
2. **Repository backup lacks a matching restore flow and binary bodies.**
   exportRepositoryRecoveryBundle enumerates projects, saved schemas, revisions,
   manifests, settings, and migration records. It does not enumerate the visual
   body stores or load documentation-template bodies. Its current tests inspect
   JSON records, not a complete restore into a fresh installation with assets.
3. **Studio image-only export can choose JSON.** Its ZIP condition checks Excel
   template bodies, not Flow image bodies. The JSON serializer serializes project
   state without loading the durable binary stores. A project with image
   references can therefore be exported without its independently stored images.
4. **Projects ZIP import drops template bodies in its adapter.**
   importFlowVisualArchive returns assets and templateBodies. stageArchiveImport
   retains assets but not templateBodies; its commit passes only visual assets
   to repository.importProject. The repository's direct importProjectArchive
   path does forward both. This is a source-confirmed path difference; a complete
   installed template round trip remains to be demonstrated.
5. **The Projects file picker advertises JSON only.** side-panel.html declares
   application/json,.json. Its handler can inspect ZIP signatures, but the
   mounted Projects UI does not update that accept attribute. Studio explicitly
   accepts JSON and ZIP. File-picker filtering may hide the intended archive.
6. **Naming and collision behavior are unclear.** Extension backup under Schema
   Library means schemas and rules only. Schema Append removes current records
   with matching imported IDs and inserts imported records, so it can replace
   existing content. Projects import instead remaps identities. A whole-workspace
   importer needs an explicit preview of preserve, copy, replace, and conflict
   decisions, with no silent overwrite.
7. **Scale and compatibility need an explicit contract.** The ZIP implementation
   has chunked writing, format checks, digests, feature declarations, and limits.
   Repository JSON export loads project data and serializes one large object.
   A whole-workspace transfer should use a consistent snapshot, bounded memory,
   progress, cancellation, version diagnostics, and atomic import or rollback.

## Proposed direction

First unify the project export/import paths and fix the missing assets and file
filter. Recognize existing envelopes and either route to the correct importer
or name the correct control in the error. Preserve old formats through explicit
migration rules rather than silently interpreting arbitrary JSON.

Then specify one portable workspace ZIP: a versioned manifest, selected project
records, global shared dependencies, settings sections, and content-addressed
binary entries. Export preview should show included projects, assets, approximate
size, and exclusions. Import should identify the archive before mutation, check
version/features/digests/references, show collisions and exclusions, and commit
the reviewed result without overwriting unrelated local work.

Keep Restore backup separate from Share projects if their history, diagnostics,
and identity behavior differs. Both must have an actual inverse operation.

Permanent tests should export through each installed control and import into a
fresh repository/profile: multiple projects, shared schemas, images, Excel
templates, nested references, history policy, and settings. Also cover cross-entry
format errors, same-ID conflicts, missing/tampered bodies, unsupported versions,
cancel, and storage failure. Test exact file contents and restored behavior,
not just JSON parse success or ZIP creation.

## Evidence and limits

Primary source locations: src/specification-builder.ts:546;
src/data-layer-specification-project.ts:356;
src/data-layer-project-library.ts:87;
src/durable-project/project-library-transport-v2.ts;
src/data-layer-durable-project-repository.ts:344;
src/data-layer-durable-project-repository-ui.ts:27;
src/flow-visual-archive-export.ts;
src/data-layer-installed/schemas/library-export-policy.ts;
src/data-layer-installed/schemas/library-import-policy.ts; side-panel.html:154.

The investigation changed no extension code or stored user data. No installed
browser transfer was run. The generated parser reproductions passed as described;
binary-loss findings are based on traced source paths. The user's exported file
and installed versions are still needed to identify their exact failing path.
