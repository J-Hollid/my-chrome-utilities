# mutation-stamp: sha256=ae30c2fd891d6ce788e3ea1878e9e9755e3879ad2f06dc639ee44d9d6c50496b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T14:08:47.377804245Z","feature_name":"Data layer guided rule parameter integrity","feature_path":"features/data-layer-guided-rule-parameter-integrity.feature","background_hash":"b6b2fcb99b6de0f0879545b0a435feacb92db9bc8bb528dbd08779ccc1b9529d","implementation_hash":"sha256:a4f626c6189dc10c7846b3a75b8ee0e9182f03f05509b7e9dc0a3850e01f6576","scenarios":[{"index":1,"name":"Data layer guided rule parameter integrity 002","scenario_hash":"14c04859f29ece31629059b91c3044052f5de6f38584e9cf6849102c58eb1c45","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T14:08:47.377804245Z"},{"index":2,"name":"Data layer guided rule parameter integrity 003","scenario_hash":"b0682d962231b6054f08765e43b7c11e92f9f5c18b87a2c8859606c7eaca8deb","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T14:08:47.377804245Z"},{"index":4,"name":"Data layer guided rule parameter integrity 005","scenario_hash":"e202264e6438dfecf5ad8d889f3557d55f8b27a2d7852eddc9ee7f3a966f9412","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-14T14:08:47.377804245Z"},{"index":6,"name":"Data layer guided rule parameter integrity 007","scenario_hash":"377af595c54bea094a7adbf2fce075dd085065b8d69052151f5c3c12d3f37b7d","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-14T14:08:47.377804245Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer guided rule parameter integrity

  Background:
    Given schema Otelo - Generic Pageview revision 1 contains property /login_status
    And captured event pageview has login_status not logged in

  # Data layer guided rule parameter integrity 001
  Scenario: Data layer guided rule parameter integrity 001
    When Add validation configures /login_status to allow not logged in and logged in
    And the rule is saved to the schema working draft
    Then the attached rule target is canonical path /login_status
    And its allowed values are not logged in and logged in without a property-path prefix
    When the captured event is validated with the working draft
    Then validation passes for actual value not logged in
    And no Value is not allowed issue is produced

  # Data layer guided rule parameter integrity 002
  Scenario Outline: Data layer guided rule parameter integrity 002
    When guided requirement <requirement> is saved for /login_status with configuration <configuration>
    Then the attached rule operator is <operator>
    And propertyPath alone stores /login_status
    And operator parameters store <operator_parameters>
    And operator parameters do not repeat /login_status

    Examples:
      | requirement                | configuration                         | operator           | operator_parameters                   |
      | Must be present            | no configuration                       | required           | no parameters                         |
      | Must be one of these values | not logged in and logged in            | allowed-values     | not logged in and logged in           |
      | Must match a pattern       | ^not logged in$                         | regular-expression | ^not logged in$                        |

  # Data layer guided rule parameter integrity 003
  Scenario Outline: Data layer guided rule parameter integrity 003
    Given /login_status allows not logged in and logged in
    When login_status has actual value <actual_value>
    Then the allowed-values result is <validation_result>
    And the rule produces <issue_count> issues
    And the evaluation retains target /login_status and actual <actual_value>
    And structured rule details retain both allowed values independently of display text
    And expected allowed values are displayed as not logged in and logged in without /login_status

    Examples:
      | actual_value   | validation_result | issue_count |
      | not logged in  | Passed            | 0           |
      | logged in      | Passed            | 0           |
      | logged out     | Failed            | 1           |

  # Data layer guided rule parameter integrity 004
  Scenario: Data layer guided rule parameter integrity 004
    Given a stored guided rule has propertyPath /login_status
    And its legacy parameters are /login_status:not logged in,logged in
    When the Schema Library is restored and the captured event is validated
    Then the legacy rule is interpreted as allowed values not logged in and logged in
    And validation passes with actual value not logged in
    And the passing evaluation reports actual value not logged in rather than Missing
    When the rule is next saved or exported
    Then its operator parameters no longer contain the duplicate /login_status prefix
    And rule identity, version, severity, message, schema attachment, and assignment remain unchanged

  # Data layer guided rule parameter integrity 005
  Scenario Outline: Data layer guided rule parameter integrity 005
    Given an allowed-values rule has <property_path_state> and stored parameters <stored_parameters>
    When its target property has actual value <actual_value>
    Then the effective rule target is /login_status
    And the effective allowed values are <effective_allowed_values>
    And validation passes

    Examples:
      | property_path_state        | stored_parameters                        | actual_value                | effective_allowed_values                  |
      | propertyPath /login_status | /login_status:not logged in,logged in    | not logged in               | not logged in and logged in               |
      | propertyPath /login_status | not logged in,logged in                  | logged in                   | not logged in and logged in               |
      | propertyPath /login_status | urn:status:not-logged-in,logged in        | urn:status:not-logged-in    | urn:status:not-logged-in and logged in    |
      | propertyPath /login_status | /other_status:not-logged-in,logged in     | /other_status:not-logged-in | /other_status:not-logged-in and logged in |
      | no propertyPath            | login_status:not logged in,logged in      | not logged in               | not logged in and logged in               |

  # Data layer guided rule parameter integrity 006
  Scenario: Data layer guided rule parameter integrity 006
    Given /products/*/login_status allows not logged in and logged in
    And a captured event contains 2 matching product items
    When the guided rule is saved and the event is validated
    Then the wildcard template path is stored once as propertyPath /products/*/login_status
    And allowed values contain no template-path prefix
    And each concrete login_status value is evaluated exactly once in item order
    And each issue identifies its concrete path and the wildcard template path

  # Data layer guided rule parameter integrity 007
  Scenario Outline: Data layer guided rule parameter integrity 007
    Given Add validation will save an <rule_ownership> rule to <schema_destination>
    When the /login_status allowed-values rule is persisted
    Then exactly 1 schema attachment uses canonical target /login_status and values not logged in and logged in
    And reusable definition and schema attachment share the same operator parameters when ownership is reusable
    And no schema assignment, current revision, or unrelated rule is changed

    Examples:
      | rule_ownership | schema_destination             |
      | local          | new schema draft               |
      | local          | existing schema working draft  |
      | reusable       | new schema draft               |
      | reusable       | existing schema working draft  |
