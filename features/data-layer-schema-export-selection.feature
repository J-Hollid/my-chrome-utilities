# mutation-stamp: sha256=40c7d0334f7aa225fb2708482bda20a198675ba42f6821ecd83d9f42336837f9
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T19:24:10.268688287Z","feature_name":"Data layer schema export selection","feature_path":"features/data-layer-schema-export-selection.feature","background_hash":"7c800ab877ff6ca501dc16519f768932a2b66d501c677a3168e7144094421caf","implementation_hash":"f4bbc4d649ac0819f4c8d3e6c33c34514002fadbc4a90cc5b71280cc2966f0d5","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer schema export selection

  Background:
    Given the Data Layer Schemas workspace contains published Product detail revision 4

  # Data layer schema export selection 001
  Scenario: Data layer schema export selection 001
    When the operator opens Export Schema Library
    Then Extension backup and JSON Schema Draft 2020-12 bundle are available
    And each choice explains whether the file is intended for extension restore or third-party validation
    And opening the export choices does not download a file

  # Data layer schema export selection 002
  Scenario: Data layer schema export selection 002
    When the operator chooses Extension backup for the Schema Library
    Then 1 versioned extension JSON file contains schemas, reusable rules, assignments, revisions, inheritance exceptions, examples, and working drafts
    And the file remains accepted by Import Schema Library
    And existing extension backup and restore behavior is unchanged

  # Data layer schema export selection 003
  Scenario: Data layer schema export selection 003
    When the operator chooses JSON Schema Draft 2020-12 bundle for the Schema Library
    Then a compatibility review identifies the 3rd-party format and number of schema resources
    And confirming downloads 1 JSON Schema Draft 2020-12 Compound Schema Document
    And that file is not presented as an extension backup or accepted by Import Schema Library

  # Data layer schema export selection 004
  Scenario: Data layer schema export selection 004
    When the operator opens Export for Product detail
    Then Extension schema package and JSON Schema Draft 2020-12 are available
    And the export choices identify current published revision 4
    And no other unrelated schema is selected for export

  # Data layer schema export selection 005
  Scenario: Data layer schema export selection 005
    Given Product detail inherits Generic page view and uses reusable rules
    When the operator chooses Extension schema package for Product detail
    Then the package contains Product detail with its revision history, assignments, examples, and working draft
    And it contains the parent-schema and reusable-rule dependencies required to restore Product detail
    And unrelated schemas and reusable rules are absent
    And importing the package offers Replace matching schemas and Append to Schema Library

  # Data layer schema export selection 006
  Scenario: Data layer schema export selection 006
    Given Product detail has a working draft based on revision 4
    When the operator chooses JSON Schema Draft 2020-12 for Product detail
    Then the compatibility review identifies current published revision 4 as the export source
    And confirming downloads 1 standalone schema resource for Product detail revision 4
    And pending working-draft changes are absent
    And Generic page view validation inherited by Product detail is resolved into the standalone resource

  # Data layer schema export selection 007
  Scenario: Data layer schema export selection 007
    Given Checkout is an unpublished new-schema draft
    When the operator opens Export for Checkout
    Then Extension schema package is available
    And JSON Schema Draft 2020-12 is disabled with reason Publish the schema before exporting a standard revision

  # Data layer schema export selection 008
  Scenario: Data layer schema export selection 008
    When an export completes or is blocked
    Then status identifies the selected format, export scope, and revision or schema count
    And keyboard focus returns to the export control that opened the choices
    And all export choices and compatibility review actions are reachable at 320 CSS px wide

  # Data layer schema export selection 009
  Scenario: Data layer schema export selection 009
    Given the selected standard export contains standard-compatible and unsupported active rules
    When the compatibility review is displayed
    Then each unsupported rule and affected property path is listed as omitted
    And Cancel and Export without unsupported rules are available
    When the operator activates Export without unsupported rules
    Then the standard document is downloaded with only standard-compatible rules
    And completion status identifies the number of omitted rules
