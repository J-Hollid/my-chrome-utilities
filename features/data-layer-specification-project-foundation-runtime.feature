Feature: Data layer Specification Project foundation runtime

  Background:
    Given the built extension is running with production project storage, side-panel companion, and full-page workspace

  # Data layer Specification Project foundation runtime 001
  Scenario: Data layer Specification Project foundation runtime 001
    When the operator creates a blank project through the actual workspace DOM
    Then production storage persists one stable project with site, environments, policy, and draft
    And reload opens the same project without any captured event seed
    And the rendered shell identifies project, environment, draft, and Saved state

  # Data layer Specification Project foundation runtime 002
  Scenario: Data layer Specification Project foundation runtime 002
    Given production legacy storage contains schemas, revisions, rules, assignments, and examples
    When the migration adapter loads, serializes, and reloads the library
    Then the compatibility project preserves the production validation outcome and every supported identity
    And no blank assignment or unresolved reference becomes active
    And the original legacy snapshot remains recoverable

  # Data layer Specification Project foundation runtime 003
  Scenario: Data layer Specification Project foundation runtime 003
    Given a project transaction links one page and one event
    When Undo, reload, and Redo run through production history and persistence callbacks
    Then the actual workspace removes and restores both references atomically
    And no dangling reference is stored or rendered

  # Data layer Specification Project foundation runtime 004
  Scenario: Data layer Specification Project foundation runtime 004
    Given the side panel is attached to shop.example with Shop data specification selected
    When the operator opens a selected validation issue in Specification Builder
    Then an actual extension page opens the same project and entity identity
    And the side panel remains available as the contextual companion
    And focus moves to the workspace target rather than the document body

  # Data layer Specification Project foundation runtime 005
  Scenario: Data layer Specification Project foundation runtime 005
    Given migration encounters an unresolved production reference
    When the operator defers migration through rendered review controls
    Then production storage remains byte-for-byte equal to its pre-migration snapshot
    And the compatibility view remains operable after reload
