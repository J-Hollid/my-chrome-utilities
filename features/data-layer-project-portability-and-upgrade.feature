Feature: Data layer project portability and upgrade

  # Data layer project portability and upgrade 001
  Scenario: Data layer project portability and upgrade 001
    Given active Retail website has a Saved Draft based on Published revision 3 with metadata, canonical contributors, Pages, Page Groups, Events, Flows, occurrences, applicability, assignments, documentation settings, and adopted-schema lineage
    When the operator exports Retail website from the Projects tab
    Then one versioned project bundle identifies project-retail, its Saved Draft, and base Published revision 3
    And it contains the complete project-owned canonical graph and stable internal references
    And it contains assignment contributor targets without a schemaDrafts collection or copied compiled schemas
    And it excludes unadopted Saved Schema Library records, browser permissions, Live observations, cached compilation, transient interface state, and Undo history
    And export changes neither the active project, Saved Draft, nor Published revision 3

  # Data layer project portability and upgrade 002
  Scenario: Data layer project portability and upgrade 002
    Given Retail website is active and a valid bundle contains another project-retail with linked Sitewide, Cart, Purchase, and Retail checkout records
    When the operator stages that file from the Projects tab
    Then import review shows format version, source name, source Published revision, Saved Draft state, entity counts, reference integrity, migrations, unique target name Retail website copy, and Import as new project
    And no project is created before confirmation
    When the reviewed new-project transaction is accepted
    Then one inactive imported project named Retail website copy receives a new project identity and new identities for every project-owned record
    And every internal parent, membership, occurrence, assignment contributor target, and Flow reference is remapped to those new identities
    And external Saved Schema Library lineage continues to identify its original source revision
    And active Retail website plus every pre-existing project remains byte-identical
    When the operator opens the imported project
    Then it becomes the only active project and its effective schemas and Flow references resolve without the source installation

  # Data layer project portability and upgrade 003
  Scenario Outline: Data layer project portability and upgrade 003
    Given Retail website is active before project import
    When file validation receives <problem>
    Then import review identifies <repair> at the exact bundle section
    And the import commit action cannot be invoked
    And no project record, active-context change, or partial entity write occurs

    Examples:
      | problem                              | repair                                      |
      | malformed JSON                       | choose a readable project bundle             |
      | unsupported future format version    | use a supported version or migrate externally |
      | missing Page referenced by a Flow    | restore the missing Page and export again    |

  # Data layer project portability and upgrade 004
  Scenario: Data layer project portability and upgrade 004
    Given the pre-library installation contains one singleton Legacy shop project with stable identity project-legacy, metadata, storage generation 9, project graph, navigation, Undo history, and Purchase payload in schemaDrafts
    And Retail Purchase assignment references that legacy schema draft
    When the project-library upgrade runs
    Then one atomic migration creates a Legacy shop library entry without changing project-legacy or its project-owned identities
    And project-legacy becomes the active project
    And metadata, current Draft, project graph, and navigation remain available
    And Purchase payload becomes a Shared Profile with its complete canonical content, lineage, and identity
    And Retail Purchase targets that Shared Profile while no schemaDrafts collection remains
    And prior Undo and Redo are absent from the migrated project while a recoverable legacy backup retains their bytes
    And the migration notice states that project content was preserved but prior Undo and Redo were not migrated
    And reloading does not migrate, duplicate, or reset the project again

  # Data layer project portability and upgrade 005
  Scenario: Data layer project portability and upgrade 005
    Given the operator starts with Retail website active in the project library
    When visible project controls create Agency platform, edit its metadata, switch back to Retail website, and open Retail website in Specification Studio
    And the operator exports Retail website, imports the bundle as a new inactive project, and opens the imported project
    Then exactly one project is active after every context-changing action
    And existing projects retain their metadata, canonical graphs, Saved Drafts, and Published revisions
    And the imported project has remapped stable references and the same effective schema meaning as its source
    When the side panel and Specification Studio reload
    Then both restore the imported project as active and show no entity from Retail website or Agency platform

  # Data layer project portability and upgrade 006
  Scenario: Data layer project portability and upgrade 006
    Given Retail website has a newer Saved Draft above production baseline 13 and its schema manifest
    When the operator exports the project normally
    Then the bundle contains the current Saved Draft, its base Project revision 13, current production project snapshot, schema manifest, and referenced current schema snapshots
    And every schema entry has one stable schema identity and its selective production Schema revision
    And it contains no per-edit revision, canonical change list, opaque Draft token, field stamp, Undo, Redo, or older production snapshot
    And a separately requested repository recovery archive remains the only export that includes complete production history

  # Data layer project portability and upgrade 007
  Scenario: Data layer project portability and upgrade 007
    Given an older project bundle contains Project revision 3 and a schema at edit revision 2847 with 2847 change entries
    When the operator stages it through Import project
    Then import review reports that legacy edit revisions will be compacted without changing current schema content or genuine publication lineage
    When Import as new project is confirmed
    Then the imported project retains Project revision 3 and reconstructs Schema revisions only from distinct production snapshots
    And the latest Draft content and remapped stable references remain exact
    And imported active records and later ordinary exports contain no discarded edit revision or change entry
    And the source project and every pre-existing project remain unchanged
