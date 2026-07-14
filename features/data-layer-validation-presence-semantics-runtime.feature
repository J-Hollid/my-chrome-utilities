# mutation-stamp: sha256=002e2a75be67aecf1510a1184243ef6adc2c64db8f14adfaf38120fb67b134c8
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T15:40:25.364077022Z","feature_name":"Data layer validation presence semantics runtime","feature_path":"features/data-layer-validation-presence-semantics-runtime.feature","background_hash":"61b3f85d58b0cf1a71df66bd7f5cb30727c7746e169e570d937501f47153a287","implementation_hash":"validation-presence-relational-v2","scenarios":[{"index":0,"name":"Data layer validation presence semantics runtime 001","scenario_hash":"c30ec5422fd4157bb441f9777dd0a0cefdb7e86e91f02abbb3ff95f467eb2a55","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-14T15:40:25.364077022Z"},{"index":1,"name":"Data layer validation presence semantics runtime 002","scenario_hash":"3f4f710a5491bb8af602116c190c398057ac17c8280d5153081f015007b540a8","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T15:40:25.364077022Z"},{"index":3,"name":"Data layer validation presence semantics runtime 004","scenario_hash":"6d3542d271a2b2408ef216a2f4f3615bfbe417f3c3b2a5bffa9e5eb04e8e685e","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-14T15:40:25.364077022Z"}]}
# acceptance-mutation-manifest-end

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
