# mutation-stamp: sha256=e1448c84c1858ed09497b039999698e001caa4b7b12a80f36013f838fa20ed38
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-24T07:57:21.968304552Z","feature_name":"Data layer durable project repository","feature_path":"features/data-layer-durable-project-repository.feature","background_hash":"81a3262becad324dfcecfa4f53db2a34463df2951ccf3298eab13ee4623dcda9","implementation_hash":"sha256:85b2f970ecb3b9fa9a29f030a2c6c9eefd988ce1a59bb93be52d73e9e584a4e7","scenarios":[{"index":5,"name":"Data layer durable project repository 006","scenario_hash":"3c084811a55454950e55fb908b022226efce73c45b110f820ab9abd8150f5f89","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-24T07:50:17.751549156Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer durable project repository

  Background:
    Given the durable project repository contains active Retail website with Saved Draft and Published revision 3
    And it contains inactive Trade portal with Saved Draft and Published revision 1

  # Data layer durable project repository 001
  Scenario: Data layer durable project repository 001
    Given Retail website contains schemas, Pages, Events, fixtures, and releases
    When the operator opens the Projects tab without changing project data
    Then project names, metadata, Published revisions, and active state appear without rewriting any project
    And inactive Trade portal content is not loaded until the operator opens, exports, or switches to it
    And opening or reloading the side panel cannot change the Saved Draft or Published revision

  # Data layer durable project repository 002
  Scenario: Data layer durable project repository 002
    Given Retail website Page Confirmation has funnel_step value 3a
    When the operator changes funnel_step to 3b
    Then one command using base Draft token draft-retail-14 commits a new opaque Draft token
    And only Confirmation and Retail website Draft metadata change durably
    And Trade portal, unrelated Retail website entities, releases, and fixtures remain byte-identical
    And Builder and the side panel observe the Saved Draft change without receiving a complete project payload
    And Published revision 3 remains unchanged

  # Data layer durable project repository 003
  Scenario: Data layer durable project repository 003
    Given Builder and the side panel both loaded Retail website Draft token draft-retail-14
    When Builder commits Page Confirmation name Confirmed with Draft token draft-retail-15
    And the side panel submits funnel_step value 3b from base token draft-retail-14
    Then the repository compares the side-panel command with persisted token draft-retail-15 before writing
    And a non-overlapping patch may rebase as one named Draft save
    But an overlapping patch is rejected with current, pending, and conflicting fields
    And no stale surface can replace the complete project or entity collection
    And no Draft save changes Published revision 3

  # Data layer durable project repository 004
  Scenario: Data layer durable project repository 004
    Given one open Builder window saved a 500-row bulk schema commit
    When the operator invokes Undo and then Redo before closing or reloading that window
    Then one window-scoped inverse save restores the prior Draft values and one forward save reapplies the bulk values
    And the 500-row commit remains one in-memory history action rather than 500 actions
    And stable project, entity, and property identities remain unchanged
    And no Undo entry, Redo entry, forward patch, inverse patch, or complete project snapshot is persisted
    And Published revision 3 remains unchanged

  # Data layer durable project repository 005
  Scenario: Data layer durable project repository 005
    Given one open Builder window has two Undo actions for saved Retail website Draft edits
    When the operator closes or reloads that project window and opens Retail website again
    Then the latest Saved Draft values remain durable
    And Undo and Redo start empty in the new page scope
    And the interface does not promise recovery of actions from the closed page scope
    When the operator intentionally publishes the current Draft
    Then Published revision 4 is created as one immutable project revision

  # Data layer durable project repository 006
  Scenario Outline: Data layer durable project repository 006
    Given Retail website Draft token draft-retail-14 identifies the last durable Draft
    And the operator has an in-memory Page edit that is not yet durable
    When the repository reports <failure> while saving the edit
    Then the last Saved Draft and every previously durable record remain unchanged
    And the interface states Save failed for Retail website and names the attempted Page edit
    And project switching and publication remain blocked
    And Retry save and Export unsaved Draft are available without claiming the edit is saved

    Examples:
      | failure                |
      | quota exceeded         |
      | transaction aborted    |
      | repository unavailable |

  # Data layer durable project repository 007
  Scenario: Data layer durable project repository 007
    Given a failed save is blocking Retail website
    When the operator opens Storage and recovery
    Then it identifies the last-saved time, base Published revision, unsaved command, project data size, release size, fixture size, and available browser estimate
    And it explains that unlimited storage reduces quota risk but does not make a failed write successful
    And it offers Retry save, Export unsaved Draft, Export repository backup, and Open storage diagnostics
    And keyboard use at 360 pixels reaches every recovery action within one vertical scroll owner

  # Data layer durable project repository 008
  Scenario: Data layer durable project repository 008
    Given legacy Web Storage contains a project library generation 14, an active-project projection generation 15, global saved schema definitions, and complete project snapshot Undo history
    When the operator starts the upgraded extension
    Then migration selects generation 15 for the matching stable project identity and preserves all project and entity identities
    And project records, schema definitions, fixture payloads, Flow graphs, releases, and active context are committed atomically to the durable repository
    And a recoverable legacy backup and migration receipt identify the source keys, byte counts, and checksums
    And migrated project document keys are removed from Web Storage only after repository verification succeeds
    And the operator is told that project content was preserved and pre-upgrade Undo and Redo were not migrated

  # Data layer durable project repository 009
  Scenario: Data layer durable project repository 009
    Given legacy project library and active-project projection both identify project-retail at generation 14 but contain different Confirmation definitions
    When migration compares the sources
    Then migration stops before deleting, replacing, or partially importing either source
    And a recovery review names both sources, the conflicting project and fields, and their checksums
    And the operator can export both sources and choose which one to migrate
    And no source is chosen by key order, byte size, or last access time

  # Data layer durable project repository 010
  Scenario: Data layer durable project repository 010
    Given the repository contains 100 projects with large schemas and fixture payloads
    When the operator searches the Projects tab for Trade portal
    Then the library query loads compact project metadata rather than 100 complete project graphs
    When the operator opens Trade portal
    Then only Trade portal and the records needed by its visible route are loaded
    And Retail website remains durable and inactive without a second active subscription

  # Data layer durable project repository 011
  Scenario: Data layer durable project repository 011
    Given Retail website has immutable Release 3, a large captured fixture, and an unpublished Page edit
    When the Page edit commits and the operator exports the project
    Then Release 3 and the fixture payload are not copied into window-scoped Undo or Redo
    And project export contains the latest durable Draft and immutable release content but excludes Undo, Redo, migration backups, and storage diagnostics
    And import commits one new project transaction without changing the active project or existing repository records

  # Data layer durable project repository 012
  Scenario: Data layer durable project repository 012
    Given legacy migration has completed and its verified backup remains available
    When Builder, side panel, and Specification Studio create, edit, switch, undo, redo, export, and reload projects
    Then every project-bound surface reads and writes only the migrated durable records
    And Web Storage receives no canonical project document, full schema definition, fixture payload, release snapshot, or Undo snapshot
    And deleting the legacy backup requires a named consequence review and leaves current projects unchanged

  # Data layer durable project repository 013
  Scenario: Data layer durable project repository 013
    Given Retail website durably contains Flow graph flow-orphan whose owning Flow entity is absent
    And that orphan topology references Payment Page
    When the installed repository upgrade evaluates Flow graph ownership
    Then one atomic repair retains the orphan graph in a recoverable backup before deleting its Draft flowGraphs record
    And a verified repair receipt identifies Retail website, flow-orphan, source checksum, and deleted record identity
    And read-back proves that every remaining Flow graph is keyed by one live Flow in the same project
    And dependency discovery no longer treats flow-orphan as a Payment dependency or navigable entity
    And the Saved Draft token advances while Published revision 3 and unrelated durable records remain unchanged
    But if backup, deletion, receipt, or read-back verification fails, the repair transaction aborts with the original orphan record intact
