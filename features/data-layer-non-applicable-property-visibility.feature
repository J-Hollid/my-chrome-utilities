# mutation-stamp: sha256=b078d69f0deb74dc6e17ca815d168dc8b6cba9a4f9e1d882a030601a1dd77712
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T17:48:23.493109239Z","feature_name":"Data layer non-applicable property visibility","feature_path":"features/data-layer-non-applicable-property-visibility.feature","background_hash":"b667d5841c49b0c067608e799370f930cc7bc991af19bab9a109a8e571f15624","implementation_hash":"sha256:30cbdd44c741d36868b8b4784e0ebf222629f9acf0f7f0ca2ae560400ae4c775","scenarios":[{"index":2,"name":"Data layer non-applicable property visibility 003","scenario_hash":"5ce2f532a2de97a0c8c28bf8e30a77edaad0a35437eb3aab144b863ea4559026","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-14T17:48:23.493109239Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer non-applicable property visibility

  Background:
    Given a captured event with an assigned schema is open in the Live inspector
    And its Properties view contains observed and schema-expected property paths

  # Data layer non-applicable property visibility 001
  Scenario: Data layer non-applicable property visibility 001
    Given optional property /test is missing and its value rules are Not applicable
    When event details are initially displayed
    Then the synthetic /test property row is hidden
    And its Not applicable evaluations are excluded from the default property-rule presentation
    And observed payload properties, applicable validation results, and event-level issues remain visible
    And hiding /test does not change the event validation result

  # Data layer non-applicable property visibility 002
  Scenario: Data layer non-applicable property visibility 002
    Given event details contain hidden non-applicable property rows
    When the operator activates top-level Show non-applicable properties
    Then each hidden row is revealed at its expected location in the property hierarchy
    And each revealed row has neutral treatment and identifies Missing and its Not applicable rules
    And the control changes to Hide non-applicable properties
    When the operator activates Hide non-applicable properties
    Then those rows are hidden again without changing captured or validation data

  # Data layer non-applicable property visibility 003
  Scenario Outline: Data layer non-applicable property visibility 003
    Given property /test is <property_state>
    And it has <rule_state>
    When the default Properties view is displayed
    Then the property row is <row_visibility>
    And the property outcome is <property_outcome>

    Examples:
      | property_state       | rule_state                                | row_visibility | property_outcome                   |
      | missing              | optional Allowed values Not applicable    | hidden         | neutral Not applicable             |
      | missing              | Required failed                           | visible        | error Required                     |
      | present with value   | conditional rule Not applicable           | visible        | neutral No applicable rules        |
      | present with null    | Allowed values failed                      | visible        | error with actual null             |

  # Data layer non-applicable property visibility 004
  Scenario: Data layer non-applicable property visibility 004
    Given an observed property has passing or failing applicable rules and a Not applicable rule
    When the Properties view is displayed with non-applicable properties hidden
    Then the observed property and its applicable results remain visible
    And the Not applicable rule is excluded from Passed, Failed, error, and warning counts
    When Show non-applicable properties is activated
    Then the same property additionally exposes the skipped rule as Not applicable
    And its applicable result and highest visual severity do not change

  # Data layer non-applicable property visibility 005
  Scenario: Data layer non-applicable property visibility 005
    Given Missing appears for an optional property and for a Required property
    When their rows are rendered
    Then Missing text does not receive danger styling merely because the value is absent
    And the optional property is neutral when revealed
    And the Required property communicates its failure through error status, symbol, border, and rule details
    And users do not have to infer validity from the color of Missing text

  # Data layer non-applicable property visibility 006
  Scenario: Data layer non-applicable property visibility 006
    Given a missing nested branch contains only Not applicable descendants
    And another missing branch contains a Required failure
    When non-applicable properties are hidden
    Then the first branch is absent from the property tree
    And the Required descendant and the minimum ancestor hierarchy needed to reach it remain visible
    And observed parent and sibling properties are never hidden because another rule is Not applicable
    And wildcard rules apply the same visibility independently to each concrete item path

  # Data layer non-applicable property visibility 007
  Scenario: Data layer non-applicable property visibility 007
    Given Show non-applicable properties is active
    And the operator has expanded property disclosures and focused a revealed property
    When schema publication revalidates the event or the operator returns to its inspector
    Then the visibility choice and applicable disclosure state are restored
    And focus returns to the same property when it still exists
    And hidden non-applicable properties are excluded from property search until the visibility control is active

  # Data layer non-applicable property visibility 008
  Scenario: Data layer non-applicable property visibility 008
    Given the Properties view is displayed at 320 CSS px wide
    When non-applicable property visibility is available
    Then the top-level control precedes property search and the property hierarchy
    And its accessible state identifies whether non-applicable properties are shown
    And keyboard activation reveals and hides the same rows as pointer activation
    And no color-only cue distinguishes Missing, Not applicable, or Required failure
