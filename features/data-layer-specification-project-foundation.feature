# mutation-stamp: sha256=99e76d16a7b9d530ab7528e23f9cb857e11a88e4ae686ba2d89fb6b82573ce6d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:03:11.291574689Z","feature_name":"Data layer Specification Project foundation","feature_path":"features/data-layer-specification-project-foundation.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:b137197dac06654bea006984a29e97780911a252b0f915c269a93c71a7bb3abc","scenarios":[{"index":2,"name":"Data layer Specification Project foundation 003","scenario_hash":"53ec4bb04149d80f404a71c6dbaf40262eae290b4d57b69b1bbb1ea8c91ccb68","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:11.291574689Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Specification Project foundation

  # Data layer Specification Project foundation 001
  Scenario: Data layer Specification Project foundation 001
    Given no captured traffic and no Specification Project exist
    When the operator creates project Shop data specification from a blank start
    Then one stable project identity owns site shop.example, environments Production and Staging, naming conventions, and publication policy
    And one durable project draft opens without requiring a captured event
    And project, environment, draft, and autosave state remain visible

  # Data layer Specification Project foundation 002
  Scenario: Data layer Specification Project foundation 002
    Given Shop data specification is open
    When the project contents are inspected
    Then reusable data requirements, applicability, and journeys are separate linked collections
    And pages, page groups, events, applicability sets, flows, steps, fixtures, and releases have stable identities
    And a schema does not own applicability assignments
    And the project is the authoring and release boundary

  # Data layer Specification Project foundation 003
  Scenario Outline: Data layer Specification Project foundation 003
    Given one accepted project edit transaction changes <project_content>
    When the operator performs <history_action>
    Then <history_outcome>
    And the complete linked project remains referentially valid

    Examples:
      | project_content       | history_action | history_outcome                              |
      | profile description   | Undo           | the former description is restored           |
      | page and event links  | Undo           | both links are removed together               |
      | page and event links  | Redo           | both links are restored together              |

  # Data layer Specification Project foundation 004
  Scenario: Data layer Specification Project foundation 004
    Given a legacy Schema Library contains schemas, revisions, rules, assignments, examples, and supported imports
    When the operator opens it after Specification Projects are introduced
    Then a compatibility project preserves every supported stable identity and revision
    And legacy schemas and rules remain accessible through explicit compatibility views
    And valid assignments become named applicability references without changing validation behavior
    And migration does not publish or discard a project draft

  # Data layer Specification Project foundation 005
  Scenario: Data layer Specification Project foundation 005
    Given compatibility migration cannot resolve one legacy reference
    When migration review is displayed
    Then the unresolved item identifies its source identity and dependants
    And the operator can defer migration while continuing through the compatibility path
    And no partial migrated project replaces the legacy data

  # Data layer Specification Project foundation 006
  Scenario: Data layer Specification Project foundation 006
    Given Shop data specification is open in the full-page workspace
    When the operator opens the side panel on a matching site
    Then the side panel identifies the selected project and environment
    And capture, inspection, matcher testing, validation, and safe quick edits remain available
    And structural authoring opens the same selected entity in the full-page workspace

  # Data layer Specification Project foundation 007
  Scenario: Data layer Specification Project foundation 007
    Given projects Shop data specification and Admin data specification exist
    When a draft edit or release is created in Shop data specification
    Then Admin data specification remains unchanged
    And references cannot silently cross project boundaries
    And exports and releases identify their owning project
