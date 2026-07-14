Feature: Data layer validation presence semantics runtime

  Background:
    Given the built extension validation modules and Live inspector presentation are loaded
    And a production schema is assigned to a captured event

  # Data layer validation presence semantics runtime 001
  Scenario Outline: Data layer validation presence semantics runtime 001
    Given the production schema has canonical path /test with a <operator> rule configured as <parameters>
    And the production event payload omits /test
    When production validation evaluates the event
    Then the actual rule evaluation status is not-applicable
    And the production validation issue collection is empty
    And the event remains valid

    Examples:
      | operator           | parameters |
      | exact-value        | test       |
      | value-type         | string     |
      | non-empty-string   | none       |
      | text-length        | 4          |
      | digits-only        | none       |
      | allowed-values     | test       |
      | regular-expression | ^test$     |
      | numeric-range      | 1,10       |
      | item-count         | 1          |

  # Data layer validation presence semantics runtime 002
  Scenario Outline: Data layer validation presence semantics runtime 002
    Given production Required and Allowed values test rules target canonical path /test
    When production validation receives /test as <observed_value>
    Then the actual Required evaluation status is <required_status>
    And the actual Allowed values evaluation status is <allowed_status>
    And the production issue outcome is <issue_outcome>

    Examples:
      | observed_value | required_status | allowed_status  | issue_outcome            |
      | missing        | error           | not-applicable | one Required issue       |
      | test           | pass            | pass           | no issue                 |
      | another value  | pass            | error          | one Allowed values issue |

  # Data layer validation presence semantics runtime 003
  Scenario: Data layer validation presence semantics runtime 003
    Given production value and Required rules target /profile/status, /products/*/sku, and /products/2
    And a production payload omits profile, omits one product sku, and omits product index 2
    When the production schema validator evaluates the payload
    Then each absent target has a not-applicable value-rule evaluation
    And each absent target has exactly one Required issue at its concrete path
    And existing wildcard values are each evaluated exactly once

  # Data layer validation presence semantics runtime 004
  Scenario Outline: Data layer validation presence semantics runtime 004
    Given production condition /page_type Equals product_detail has a <consequence> consequence on <target_path>
    And a production payload has page_type product_detail and <target_state>
    When production validation evaluates the conditional rule
    Then the actual conditional evaluation status is <status>
    And production validation reports <issue_count> consequence issues

    Examples:
      | consequence         | target_path              | target_state               | status         | issue_count |
      | allowed-values test | /test                    | missing target              | not-applicable | 0           |
      | item-count 1        | /oOrder/aProducts        | missing target              | not-applicable | 0           |
      | item-count 1        | /oOrder/aProducts        | existing empty array        | error          | 1           |
      | required            | /oOrder/aProducts/0      | missing target              | error          | 1           |

  # Data layer validation presence semantics runtime 005
  Scenario: Data layer validation presence semantics runtime 005
    Given local, inherited, reusable, canonical-path, and legacy root-property Allowed values rules target omitted properties
    When production validation and Live inspector presentation process the event
    Then no value rule creates a validation issue
    And canonical-path evaluations are rendered as Not applicable rather than Passed or Failed
    And the displayed validation details contain no invalid-value message with actual Missing
