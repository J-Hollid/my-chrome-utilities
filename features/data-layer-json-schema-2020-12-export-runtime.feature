# mutation-stamp: sha256=8149aa481804624f04dc53723e5377d9f2e970c2ea5c8ed86754931bc719ddd2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T19:23:57.763053511Z","feature_name":"Data layer JSON Schema 2020-12 export runtime","feature_path":"features/data-layer-json-schema-2020-12-export-runtime.feature","background_hash":"8ff3f153e5d7b987f9d8ba89fc1233792d1fdfbc2a674e25cd4531cedf443d13","implementation_hash":"f4bbc4d649ac0819f4c8d3e6c33c34514002fadbc4a90cc5b71280cc2966f0d5","scenarios":[{"index":1,"name":"Data layer JSON Schema 2020-12 export runtime 002","scenario_hash":"cbce9e46a1cf19c0fe5094336de6e49206c01a544e336626fdd93b164acc3cad","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-16T19:23:57.763053511Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer JSON Schema 2020-12 export runtime

  Background:
    Given the built extension side panel is running with the production Schema Library and browser download boundary
    And the Schema Library contains published schemas with standard-compatible inherited, conditional, and local rules

  # Data layer JSON Schema 2020-12 export runtime 001
  Scenario: Data layer JSON Schema 2020-12 export runtime 001
    When the operator exports the actual Schema Library as JSON Schema Draft 2020-12
    Then the browser downloads the generated Compound Schema Document
    And an independent Draft 2020-12 validator accepts the document and every embedded schema resource
    And each resource is retrievable by its exported $id
    And no extension persistence field or custom vocabulary keyword is present

  # Data layer JSON Schema 2020-12 export runtime 002
  Scenario Outline: Data layer JSON Schema 2020-12 export runtime 002
    Given the production extension and an independent Draft 2020-12 validator use the exported Product detail revision 4 constraints
    When both validate <payload>
    Then the extension outcome is <validation_outcome>
    And the independent validator outcome is <validation_outcome>

    Examples:
      | payload                                                | validation_outcome |
      | valid product detail with 50-character title           | pass               |
      | product detail with undeclared root debug              | fail               |
      | product detail with 51-character title                 | fail               |
      | product detail with dynamic metadata source            | pass               |
      | product detail missing conditionally required currency | fail               |

  # Data layer JSON Schema 2020-12 export runtime 003
  Scenario: Data layer JSON Schema 2020-12 export runtime 003
    When the operator exports Product detail from its production schema-row action in each available format
    Then the extension package contains only Product detail and its extension dependencies
    And the standalone Draft 2020-12 file contains one effective current schema resource
    And both downloads identify Product detail revision 4
    And neither action mutates the stored Schema Library

  # Data layer JSON Schema 2020-12 export runtime 004
  Scenario: Data layer JSON Schema 2020-12 export runtime 004
    When the operator exports and restores the actual Extension backup
    Then its versioned envelope and import review remain unchanged
    And schemas, reusable rules, assignments, revisions, inheritance exceptions, examples, and working drafts survive reload
    And adding JSON Schema Draft 2020-12 export does not make a standard export importable as extension configuration

  # Data layer JSON Schema 2020-12 export runtime 005
  Scenario: Data layer JSON Schema 2020-12 export runtime 005
    Given a published schema has one standard-compatible rule and one active unsupported rule
    When the operator confirms Export without unsupported rules through production controls
    Then the browser downloads a valid Draft 2020-12 schema containing the standard-compatible rule
    And the unsupported rule and extension-specific substitute keywords are absent
    And rendered completion status reports 1 omitted rule
    And the stored schema and both active rules remain unchanged
