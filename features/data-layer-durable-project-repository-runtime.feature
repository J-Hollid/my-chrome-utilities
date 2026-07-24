Feature: Data layer durable project repository runtime

  Background:
    Given the built extension is running with the production durable-project repository
    And production Undo and Redo are scoped to each open project page

  # Data layer durable project repository runtime 001
  Scenario: Data layer durable project repository runtime 001
    Given extension Web Storage is at its quota and contains a readable project library
    When the installed side panel mounts the Projects tab
    Then no uncaught QuotaExceededError is emitted
    And the mount path performs no unconditional Web Storage setItem for the project library or active projection
    And the installed UI renders the persisted projects or a recovery-only view without a false empty library

  # Data layer durable project repository runtime 002
  Scenario: Data layer durable project repository runtime 002
    Given the packaged manifest is inspected
    Then required permissions contain storage and unlimitedStorage
    And the installed extension can open its IndexedDB repository from side panel, Specification Studio, and extension service worker contexts
    And permission presence does not bypass simulated quota, abort, corruption, or unavailable-repository handling

  # Data layer durable project repository runtime 003
  Scenario: Data layer durable project repository runtime 003
    Given production Retail website Draft token draft-retail-14 contains Page Confirmation and unrelated Trade portal records
    When actual controls change Confirmation funnel_step from 3a to 3b
    Then one IndexedDB transaction compares base token draft-retail-14 and commits a new opaque Draft token
    And observed writes contain the Confirmation record, Draft metadata, and change-feed record
    And no observed write contains a command-history record, serialized complete project library, or complete before-project snapshot
    And byte hashes for Trade portal and unrelated Retail website records remain unchanged
    And the published project revision remains unchanged

  # Data layer durable project repository runtime 004
  Scenario: Data layer durable project repository runtime 004
    Given installed Builder and side panel loaded production Retail website Draft token draft-retail-14
    When Builder commits a Page name with token draft-retail-15 before the side panel submits a base-token-draft-retail-14 property patch
    Then the repository transaction observes token draft-retail-15 before applying the second command
    And disjoint changed paths produce one rebased Draft save with a new token
    And overlapping changed paths produce a visible conflict with zero partial writes
    And runtime notifications contain project-retail, Draft token, command identity, and changed record identities without a project payload

  # Data layer durable project repository runtime 005
  Scenario: Data layer durable project repository runtime 005
    Given one installed Builder page saves a bulk action that changes 500 schema rows
    When actual Undo and Redo controls execute before that page closes
    Then the page-scoped stack contains one forward patch and one inverse patch for the bulk action
    And Undo and Redo each save atomically without persisting either patch or a complete project snapshot
    When the Builder page reloads
    Then production Undo and Redo stacks are empty while the latest Saved Draft remains available

  # Data layer durable project repository runtime 006
  Scenario Outline: Data layer durable project repository runtime 006
    Given production Retail website Draft token draft-retail-14 is durable and one Page edit is pending in memory
    When the repository adapter injects <failure> before transaction commit
    Then repository hashes and revision remain equal to their pre-command values
    And the installed status names Retail website, the Page edit, Save failed, and its last Saved Draft
    And actual switch and publish controls are disabled
    And Retry save and Export unsaved Draft preserve the in-memory edit

    Examples:
      | failure                |
      | quota exceeded         |
      | transaction aborted    |
      | repository unavailable |

  # Data layer durable project repository runtime 007
  Scenario: Data layer durable project repository runtime 007
    Given production Web Storage contains project library generation 14, active projection generation 15, saved schemas, and full-snapshot Undo history
    When the installed versioned migration runs concurrently from side panel and Specification Studio
    Then one migration lock and one IndexedDB transaction produce one verified Saved Draft from generation 15
    And stable IDs, reference hashes, active identity, saved schema definitions, fixtures, Flow graphs, and releases match the selected source
    And the source payloads are retained in one recoverable backup with checksums
    And project document keys leave Web Storage only after the durable read-back equals the migration manifest
    And the second context observes the completed marker without duplicating records

  # Data layer durable project repository runtime 008
  Scenario: Data layer durable project repository runtime 008
    Given legacy library and active projection have equal project identity and revision but different project hashes
    When the installed migrator evaluates both sources
    Then its IndexedDB transaction aborts with no durable project records and no deleted legacy key
    And the rendered recovery review names both hashes and changed fields
    When actual controls select one source
    Then a new reviewed migration transaction uses only that source and retains the rejected source in the backup

  # Data layer durable project repository runtime 009
  Scenario: Data layer durable project repository runtime 009
    Given production migration is complete at project-retail Draft token draft-retail-15
    When installed Builder and side panel reload and one surface commits a new Draft token
    Then both surfaces restore project-retail from IndexedDB and converge on that token through the production change feed
    And neither surface uses a storage event or a Web Storage project projection as canonical state
    And repeated reloads produce no migration, project write, command, or revision

  # Data layer durable project repository runtime 010
  Scenario: Data layer durable project repository runtime 010
    Given production IndexedDB contains 100 projects whose complete records total 200 MiB
    When actual Projects controls search, sort, and render Trade portal
    Then observed reads use the metadata index and do not deserialize another project's graph, fixture payload, or release
    When actual controls open Trade portal
    Then the route reads only project-trade records required for its visible workspace

  # Data layer durable project repository runtime 011
  Scenario: Data layer durable project repository runtime 011
    Given an injected failed save opens installed Storage and recovery at 360 pixels
    When keyboard controls inspect usage, export the unsaved Draft, and retry the save
    Then one vertical scroll owner contains labelled usage categories and every recovery action
    And focus moves to the exact result after each action and returns to the originating control on close
    And no recovery action silently deletes a project, release, fixture, command, or migration backup

  # Data layer durable project repository runtime 012
  Scenario: Data layer durable project repository runtime 012
    Given production Retail website contains Release 3, a large fixture, and a migration backup
    When actual controls export Retail website and import it as a new inactive project
    Then parsed export contains the latest durable Draft and release but no Undo, Redo, migration backup, storage estimate, or permission state
    And one import transaction creates only remapped records for the new project
    And Release 3, the source fixture, active identity, and every pre-existing project hash remain unchanged

  # Data layer durable project repository runtime 013
  Scenario: Data layer durable project repository runtime 013
    Given production IndexedDB has project-retail:flow-orphan in flowGraphs without a matching Flow entity
    And the orphan graph references Payment Page
    When the installed versioned ownership repair runs
    Then one IndexedDB transaction writes a recoverable checksummed backup, deletes project-retail:flow-orphan, and writes a verified receipt
    And durable read-back contains no Flow graph whose key lacks a same-project Flow
    And the installed Payment removal review contains no flow-orphan text or Open flow-orphan control
    And the new Saved Draft token is observed without changing Published revision 3 or unrelated record hashes
    But an injected backup, delete, receipt, or verification failure aborts all repair writes and preserves the original flowGraphs bytes
