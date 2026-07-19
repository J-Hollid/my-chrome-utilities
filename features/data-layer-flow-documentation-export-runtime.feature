Feature: Data layer Flow documentation export runtime

  Background:
    Given the built extension is running with the production project repository and Flow exporters
    And saved project revision 24 contains a parallel Checkout journey with effective Purchase contracts

  # Data layer Flow documentation export runtime 001
  Scenario: Data layer Flow documentation export runtime 001
    When actual export controls generate Confluence-ready content and Spreadsheet tables
    Then parsed outputs contain the same stable Base, Pages, Events, Profiles, authored requirements, occurrences, relationships, effective contracts, effective requirements, Assignments, examples, provenance, and revision 24
    And effective paths and origins equal production compilation
    And topology and manual-expectation labels equal production graph records
    And every Base, Profile, authored-requirement, contract, and effective-requirement key resolves to exactly one exported record

  # Data layer Flow documentation export runtime 002
  Scenario: Data layer Flow documentation export runtime 002
    Given two production occurrences have the same display name and different stable export keys
    When actual export controls regenerate all documentation formats
    Then every cross-link resolves to the intended occurrence
    And no raw storage identifier or mixed project revision appears
    And omitted semantic categories produce visible lossy warnings

  # Data layer Flow documentation export runtime 003
  Scenario: Data layer Flow documentation export runtime 003
    When actual controls export and reimport full project JSON
    Then production graph, layout, references, schemas, Profiles, Assignments, examples, provenance, and revision identities are structurally equal
    And Confluence-ready content and Spreadsheet tables are not offered as lossless import sources
