Feature: Data layer validation presence semantics

  Background:
    Given schema Otelo - Generic Pageview v2 is assigned to a captured event
    And the schema contains optional property /test

  # Data layer validation presence semantics 001
  Scenario Outline: Data layer validation presence semantics 001
    Given /test has a <rule> rule configured as <configuration>
    And /test is missing from the event
    When the event is validated
    Then the rule result is Not applicable
    And the rule creates no error or warning
    And the missing property is not reported as an invalid value

    Examples:
      | rule               | configuration       |
      | Exact value        | test                |
      | Value type         | string              |
      | Non-empty string   | none                |
      | Text length        | 4                   |
      | Digits only        | none                |
      | Allowed values     | test                |
      | Regular expression | ^test$              |
      | Numeric range      | 1 through 10        |
      | Item count         | minimum 1           |

  # Data layer validation presence semantics 002
  Scenario Outline: Data layer validation presence semantics 002
    Given /test has Required and Allowed values test rules
    And /test is <property_state>
    When the event is validated
    Then the Required rule result is <required_result>
    And the Allowed values rule result is <allowed_values_result>
    And the event receives <issue_count> issues for /test
    And any issue is attributed to <issue_source>

    Examples:
      | property_state | required_result | allowed_values_result | issue_count | issue_source   |
      | missing        | Failed          | Not applicable        | 1           | Required       |
      | test           | Passed          | Passed                | 0           | none           |
      | another value  | Passed          | Failed                | 1           | Allowed values |

  # Data layer validation presence semantics 003
  Scenario: Data layer validation presence semantics 003
    Given /test has Allowed values test
    And the event contains /test with an explicit null value
    When the event is validated
    Then /test is treated as present
    And the Allowed values rule fails with actual value null
    And the result does not describe /test as missing

  # Data layer validation presence semantics 004
  Scenario: Data layer validation presence semantics 004
    Given optional value rules target nested path /profile/status, wildcard path /products/*/sku, and specific index /products/2
    And the event omits profile, omits sku from one existing product, and has only two products
    When the event is validated
    Then the absent nested property, wildcard property, and specific item each produce no issue from their value rule
    And value rules are still evaluated for concrete wildcard matches that exist
    When Required rules are added for the same missing targets
    Then each absent concrete target receives exactly one Required issue
    And no value-rule issue duplicates a Required issue

  # Data layer validation presence semantics 005
  Scenario Outline: Data layer validation presence semantics 005
    Given a conditional <consequence_rule> rule targets /test
    And the trigger condition is <condition_result>
    And /test is <property_state>
    When the event is validated
    Then the conditional rule result is <rule_result>
    And the conditional rule creates <issue_count> issues

    Examples:
      | consequence_rule | condition_result | property_state         | rule_result    | issue_count |
      | Allowed values   | not satisfied    | missing                | Not applicable | 0           |
      | Allowed values   | satisfied        | missing                | Not applicable | 0           |
      | Required         | satisfied        | missing                | Failed         | 1           |
      | Allowed values   | satisfied        | present with bad value | Failed         | 1           |

  # Data layer validation presence semantics 006
  Scenario: Data layer validation presence semantics 006
    Given a conditional Item count rule requires at least 1 item in /oOrder/aProducts
    And its trigger condition is satisfied
    When /oOrder/aProducts is missing
    Then the Item count rule is Not applicable and creates no issue
    When /oOrder/aProducts is an empty array
    Then the Item count rule fails
    When conditional presence is required for /oOrder/aProducts/0
    Then a Required rule targets /oOrder/aProducts/0 independently of the Item count rule

  # Data layer validation presence semantics 007
  Scenario: Data layer validation presence semantics 007
    Given equivalent optional-property rules are local, inherited, and reusable
    When an event omits their target property
    Then every rule has the same Not applicable result
    And the Live inspector counts none of them as Passed, Failed, errors, or warnings
    And no issue displays actual Missing for a value constraint
