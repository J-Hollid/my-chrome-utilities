Feature: Data layer canonical project schema drafts runtime

  Background:
    Given the built unpacked extension is running in an isolated Chrome QA profile
    And a blank Specification Project was created through rendered controls
    And the test has not written project or schema state directly

  # Data layer canonical project schema drafts runtime 001
  Scenario: Data layer canonical project schema drafts runtime 001
    When the operator adds /ecommerce/transaction_id in the rendered side-panel schema editor
    And renames an unrelated Page in the rendered full-page editor
    Then both rendered surfaces show the property and Page name without reload
    And persisted browser state contains one canonical schema document with both changes

  # Data layer canonical project schema drafts runtime 002
  Scenario: Data layer canonical project schema drafts runtime 002
    When the operator adds /account_id in the rendered full-page schema editor
    And edits its documentation in the rendered side-panel editor
    Then both surfaces show one newer shared revision and both edits
    And no library refresh or one-way synchronization action is required

  # Data layer canonical project schema drafts runtime 003
  Scenario: Data layer canonical project schema drafts runtime 003
    Given two actual extension pages have opened the same project revision
    When one page saves a description and the stale page saves a property
    Then the stale page displays a field-level revision conflict
    And browser storage retains the newer description
    And choosing Reapply edit creates one revision containing both edits

  # Data layer canonical project schema drafts runtime 004
  Scenario: Data layer canonical project schema drafts runtime 004
    Given the storage adapter will fail the next canonical-envelope write
    When the operator adds a Required rule through rendered controls
    Then Save failed and Retry are visible beside the affected editor
    And persisted bytes equal the captured pre-action bytes
    When the operator activates Retry after storage recovers
    Then the Required rule is stored once and the failure message clears

  # Data layer canonical project schema drafts runtime 005
  Scenario: Data layer canonical project schema drafts runtime 005
    Given rendered controls have changed project metadata, a schema property, and an assignment
    When the workspace rerenders, navigates away, reloads, and restores its recovery journal
    Then the rendered editors recover every value and selected entity
    And persisted revision identities remain stable and unique

  # Data layer canonical project schema drafts runtime 006
  Scenario: Data layer canonical project schema drafts runtime 006
    Given compatible legacy schemas and a conflicting project-owned schema are visible
    When the operator opens migration and cancels after inspecting the conflict
    Then both legacy and project data remain byte-identical
    When the operator reopens migration and explicitly merges the fields
    Then the canonical draft shows provenance for both sources without changing historical revisions

  # Data layer canonical project schema drafts runtime 007
  Scenario: Data layer canonical project schema drafts runtime 007
    Given the operator published project release 1 through the release dialog
    When a schema is edited and an unrelated Page is saved
    Then the release view still shows the original schema revision
    And the draft view shows the newer schema and Page revisions
    And Publish keeps the workspace open while Publish and close restores focus to its invoker

  # Data layer canonical project schema drafts runtime 008
  Scenario: Data layer canonical project schema drafts runtime 008
    Given a version 1 project file is selected through the actual migration file chooser
    When the operator stages it
    Then rendered review lists every entity kind, reference mapping, compatibility path, and blocker before mutation
    And browser persistence still equals the captured canonical and legacy bytes

  # Data layer canonical project schema drafts runtime 009
  Scenario: Data layer canonical project schema drafts runtime 009
    Given legacy assignments include one supported condition, one blank record, one ID collision, and one pin without a revision
    When the operator stages migration
    Then the supported condition becomes a named Applicability Set and assignment reference
    And the 3 invalid records remain individually quarantined with exact repair controls

  # Data layer canonical project schema drafts runtime 010
  Scenario: Data layer canonical project schema drafts runtime 010
    Given two staged legacy Flows have the same normalized selector
    When the operator reviews their assignment reference
    Then migration remains blocked with both source identities visible
    When the operator chooses the intended Flow by name and confirms
    Then one stable Flow ID is stored without hand-entering it

  # Data layer canonical project schema drafts runtime 011
  Scenario: Data layer canonical project schema drafts runtime 011
    Given canonical and legacy browser bytes were recorded before migration
    When migration validation fails and the subsequent repository write is faulted
    Then the recorded bytes remain exact and no partial project appears
    And correcting the stage and activating Retry commits one canonical revision

  # Data layer canonical project schema drafts runtime 012
  Scenario: Data layer canonical project schema drafts runtime 012
    Given legacy schemas, reusable rules, captured events, and supported imports have not been adopted
    When the operator follows each rendered compatibility entry
    Then its existing behavior and data remain accessible
    And cancelling an adoption returns to that same compatibility state

  # Data layer canonical project schema drafts runtime 013
  Scenario: Data layer canonical project schema drafts runtime 013
    Given the rendered schema draft contains no assignment
    When the operator publishes its project release
    Then the actual assignment view shows zero count, zero rows, its empty state, and no conflict
    And persisted canonical state contains no invented assignment

  # Data layer canonical project schema drafts runtime 014
  Scenario: Data layer canonical project schema drafts runtime 014
    Given the operator creates two same-schema Purchase assignments with different named Applicability Sets
    When one is pinned and the other is edited through rendered controls
    Then their displayed and persisted IDs are stable and unique and the pin names a real revision
    And the edit preserves source, target, Applicability Set, compatible unedited fields, and prior release bytes

  # Data layer canonical project schema drafts runtime 015
  Scenario Outline: Data layer canonical project schema drafts runtime 015
    Given the operator commits a rendered <edit> transaction
    When Undo and Redo are activated through actual controls
    Then visible and persisted state returns to the exact before and after revisions
    And no consumer or compiled result is partially changed
    Examples:
      | edit |
      | property and rule |
      | nested matcher group |
      | flow step and transition |

  # Data layer canonical project schema drafts runtime 016
  Scenario: Data layer canonical project schema drafts runtime 016
    Given a pending schema and assignment edit has reached the recovery journal
    When the actual extension page process is terminated before canonical commit and reopened
    Then the rendered recovery view restores every pending field and base revision
    And accepting recovery commits once while discarding recovery restores exact prior bytes
