# mutation-stamp: sha256=4df484078d1fd476bf8c66e7502c9923ebef63d36990ec09343ebeef257ccd79
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:33:47.109670676Z","feature_name":"Data layer canonical project schema drafts","feature_path":"features/data-layer-canonical-project-schema-drafts.feature","background_hash":"6a98b15e74255d5c7eeb277598388b622a1893dc9728ad987dbc99e06715e6ab","implementation_hash":"sha256:429099d9358d0b7e1b6731597018ed01d4cd1278d9dd135c85f1aa16ea449a08","scenarios":[{"index":0,"name":"Data layer canonical project schema drafts 001","scenario_hash":"35159f124d02e945c0d64f11624e693585e7361226984b5844b60471916d255f","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:33:47.109670676Z"},{"index":4,"name":"Data layer canonical project schema drafts 005","scenario_hash":"95df86859f0511f8a430adec0bf2f7f7eefa5b195f6ef43601acb61c22bc68c9","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:33:47.109670676Z"},{"index":14,"name":"Data layer canonical project schema drafts 015","scenario_hash":"18a583a9e9fb97ea5655c35642831e19b8a6964ece7a8a10fb4fb265e4198378","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:33:47.109670676Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer canonical project schema drafts

  Background:
    Given a Specification Project owns one revisioned canonical draft
    And project-owned schemas have no independently mutable library copy

  # Data layer canonical project schema drafts 001
  Scenario Outline: Data layer canonical project schema drafts 001
    Given revision 12 contains no /ecommerce/transaction_id property
    When the operator adds /ecommerce/transaction_id from the <surface>
    Then revision 13 contains the property exactly once
    And the side panel and full-page workspace immediately display revision 13
    Examples:
      | surface |
      | side-panel schema editor |
      | full-page schema editor |

  # Data layer canonical project schema drafts 002
  Scenario: Data layer canonical project schema drafts 002
    Given revision 13 contains /ecommerce/transaction_id
    When an unrelated Page description is saved
    Then the schema document remains byte-for-byte semantically unchanged
    And the Page change and schema property coexist in revision 14

  # Data layer canonical project schema drafts 003
  Scenario: Data layer canonical project schema drafts 003
    Given two open surfaces both read revision 14
    And the side panel commits a schema description as revision 15
    When the stale full-page surface submits a property edit based on revision 14
    Then revision 15 is not overwritten
    And the property edit is retained as a pending conflict
    And Reload latest, Reapply edit, and Merge fields name the conflicting revision and fields

  # Data layer canonical project schema drafts 004
  Scenario: Data layer canonical project schema drafts 004
    Given persisted revision 15 and a pending property edit
    When the atomic project write fails
    Then the exact prior persisted bytes remain authoritative
    And the pending edit remains visible with Save failed and Retry
    When Retry succeeds
    Then one new revision contains the edit without duplication

  # Data layer canonical project schema drafts 005
  Scenario Outline: Data layer canonical project schema drafts 005
    Given a project name, description, schema property, rule, and assignment are edited
    When the <interruption> occurs before publication
    Then every edit is recovered from the canonical draft
    And the selected entity and pending conflict state are recovered
    Examples:
      | interruption |
      | workspace rerender |
      | collection navigation |
      | extension reload |
      | browser restart after recovery journal write |

  # Data layer canonical project schema drafts 006
  Scenario: Data layer canonical project schema drafts 006
    Given revision 15 is published in project release 3
    When the operator edits its schema from either surface
    Then release 3 remains immutable
    And a new project draft is created from release 3
    And an unrelated draft save cannot change the published schema or pinned assignment revision

  # Data layer canonical project schema drafts 007
  Scenario: Data layer canonical project schema drafts 007
    Given a version 1 project and a library schema share an ID but have different requirements
    When migration stages them for canonical adoption
    Then both source versions and their exact serialized bytes are preserved
    And the operator sees field-level Adopt project, Adopt library, and Merge choices
    And cancelling or failing migration changes neither source

  # Data layer canonical project schema drafts 008
  Scenario: Data layer canonical project schema drafts 008
    Given a version 1 full project contains profiles, pages, events, flows, fixtures, schemas, assignments, and releases
    When migration is staged
    Then graph-wide changes, reference mappings, compatibility paths, and blockers are visible before commit
    And no canonical or legacy byte changes before explicit confirmation

  # Data layer canonical project schema drafts 009
  Scenario: Data layer canonical project schema drafts 009
    Given legacy schemas contain embedded assignment conditions
    When migration converts supported assignments
    Then each condition becomes one named Applicability Set referenced by a stable assignment ID
    And blank, colliding, unpinned, or unresolved assignments are quarantined with individual repair controls

  # Data layer canonical project schema drafts 010
  Scenario: Data layer canonical project schema drafts 010
    Given two legacy Flows normalize to the same name selector
    When migration cannot infer one stable Flow ID
    Then both source Flows are preserved and publication is blocked
    And the operator can select or create the intended stable reference without editing raw IDs

  # Data layer canonical project schema drafts 011
  Scenario: Data layer canonical project schema drafts 011
    Given canonical and legacy bytes were captured before migration
    When conversion, validation, or persistence fails
    Then every captured byte sequence remains unchanged
    And the staged migration plus exact failure remains available for correction and Retry

  # Data layer canonical project schema drafts 012
  Scenario: Data layer canonical project schema drafts 012
    Given supported legacy schemas, reusable rules, captured-event workflows, and imports have not been adopted
    When the operator opens the explicit compatibility path
    Then each remains accessible and behavior-equivalent
    And adoption is optional, staged, and reversible until commit

  # Data layer canonical project schema drafts 013
  Scenario: Data layer canonical project schema drafts 013
    Given a schema draft contains no assignment
    When its project release is published
    Then publication creates no blank, fallback, or placeholder assignment
    And assignment count, rows, empty state, search, and conflicts all report zero

  # Data layer canonical project schema drafts 014
  Scenario: Data layer canonical project schema drafts 014
    Given two assignments share a schema and event but reference different Applicability Sets
    When both are saved, one is pinned, and the other is edited
    Then their IDs are stable and unique and the pin stores an actual schema revision
    And editing preserves the Applicability Set, source, target, unknown compatible fields, and unedited values
    And no published release changes until the project draft is published

  # Data layer canonical project schema drafts 015
  Scenario Outline: Data layer canonical project schema drafts 015
    Given a saved <edit> transaction has changed the canonical draft
    When the operator selects Undo and then Redo
    Then Undo restores the exact prior revision and Redo restores the complete transaction
    And no related entity or compiled result is partially changed
    Examples:
      | edit |
      | property and rule |
      | nested matcher group |
      | flow step and transition |
