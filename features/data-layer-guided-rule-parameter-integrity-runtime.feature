Feature: Data layer guided rule parameter integrity runtime

  Background:
    Given the built extension side panel is running with production guided validation, Schema Library persistence, and schema validation
    And captured event pageview has payload login_status not logged in
    And schema Otelo - Generic Pageview revision 1 contains /login_status

  # Data layer guided rule parameter integrity runtime 001
  Scenario: Data layer guided rule parameter integrity runtime 001
    When the operator uses rendered Add validation for /login_status
    And selects Must be one of these values with not logged in and logged in
    And saves the rule to the Otelo - Generic Pageview working draft
    Then browser persistence contains exactly 1 attached allowed-values rule
    And its propertyPath is /login_status
    And its operator parameters are not logged in,logged in without /login_status
    When the production validator immediately validates the originating event from that stored working draft
    Then the event is Valid
    And exactly 1 passing evaluation reports actual not logged in and expected not logged in,logged in
    And no validation issue is rendered

  # Data layer guided rule parameter integrity runtime 002
  Scenario Outline: Data layer guided rule parameter integrity runtime 002
    When rendered guided authoring saves requirement <requirement> with configuration <configuration>
    Then the production attachment has operator <operator>
    And its stored target is /login_status
    And its stored operator parameters are <operator_parameters>
    When the production validator receives matching value <matching_value>
    Then the rule passes without reconstructing its target from operator parameters

    Examples:
      | requirement                | configuration                         | operator           | operator_parameters                   | matching_value  |
      | Must be present            | no configuration                       | required           | no parameters                         | not logged in   |
      | Must be one of these values | not logged in and logged in            | allowed-values     | not logged in,logged in               | logged in       |
      | Must match a pattern       | ^not logged in$                         | regular-expression | ^not logged in$                        | not logged in   |

  # Data layer guided rule parameter integrity runtime 003
  Scenario: Data layer guided rule parameter integrity runtime 003
    Given browser storage contains an enabled rule with propertyPath /login_status and parameters /login_status:not logged in,logged in
    When the production Schema Library restore path loads the rule
    And the production validator validates login_status not logged in
    Then validation is Valid with exactly 1 passing evaluation
    And the evaluation reports actual not logged in and expected not logged in,logged in
    When the complete Schema Library is exported and reloaded
    Then the rule retains its identity and attachment with canonical operator parameters not logged in,logged in

  # Data layer guided rule parameter integrity runtime 004
  Scenario Outline: Data layer guided rule parameter integrity runtime 004
    Given a production allowed-values rule targets /login_status with parameters <stored_parameters>
    When the production validator receives login_status <actual_value>
    Then validation result is <validation_result>
    And effective allowed values are <effective_allowed_values>

    Examples:
      | stored_parameters                           | actual_value                 | validation_result | effective_allowed_values                   |
      | /login_status:not logged in,logged in       | not logged in                | Valid             | not logged in and logged in                |
      | urn:status:not-logged-in,logged in           | urn:status:not-logged-in     | Valid             | urn:status:not-logged-in and logged in     |
      | /other_status:not-logged-in,logged in        | /other_status:not-logged-in  | Valid             | /other_status:not-logged-in and logged in  |
      | not logged in,logged in                     | logged out                   | 1 issue           | not logged in and logged in                |

  # Data layer guided rule parameter integrity runtime 005
  Scenario: Data layer guided rule parameter integrity runtime 005
    Given rendered Add validation targets /products/*/login_status
    And product items have login_status values not logged in, logged in, and logged out in that order
    When the operator saves allowed values not logged in and logged in
    And the production validator validates the event
    Then the stored rule contains propertyPath /products/*/login_status exactly once
    And its operator parameters contain no property path
    And 3 ordered evaluations contain 2 passes followed by 1 failure
    And the failure identifies concrete path /products/2/login_status and template path /products/*/login_status

  # Data layer guided rule parameter integrity runtime 006
  Scenario Outline: Data layer guided rule parameter integrity runtime 006
    Given the rendered flow uses <rule_ownership> ownership and <schema_destination>
    When Add validation persists the /login_status allowed-values rule and closes
    Then production browser storage contains exactly 1 canonical schema attachment
    And the next rendered validation uses that stored attachment rather than a reconstructed acceptance fixture
    And assignment count, current schema revision, and unrelated rules retain their previous values

    Examples:
      | rule_ownership | schema_destination             |
      | local          | new schema draft               |
      | local          | existing schema working draft  |
      | reusable       | new schema draft               |
      | reusable       | existing schema working draft  |
