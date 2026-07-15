# mutation-stamp: sha256=becf26484efeef3e7e21c5257874d9c70bbe9c39272a149e3ecb45b3b71283a6
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T15:09:14.517142102Z","feature_name":"Data layer conditional validation rules","feature_path":"features/data-layer-conditional-validation-rules.feature","background_hash":"4b7c7e25293a42e1befc1ca98c9c07fe75ca9fabdd36b4597baa4a30bcea2aaf","implementation_hash":"sha256:84fa5f222890901c5ca8db4d1f1fe4caa62af662364b5fa6048f635be74a6e9a","scenarios":[{"index":8,"name":"Data layer conditional validation rules 009","scenario_hash":"7ded2649992b55eb94ce31254d1706f8e5729721ce088cc0285b26b0276d6dac","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-15T14:34:55.605363867Z"},{"index":1,"name":"Data layer conditional validation rules 002","scenario_hash":"c17d1c9cd3e5dc5d2cc9981173965d7d82395d5114a470d72e8f9448a0440990","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-14T15:36:34.855620285Z"},{"index":2,"name":"Data layer conditional validation rules 003","scenario_hash":"e8de0687fc46b5c3fa871878e8638d01827b58bbb5fc58de51ad4e877e43e805","mutation_count":48,"result":{"Total":48,"Killed":48,"Survived":0,"Errors":0},"tested_at":"2026-07-14T15:36:34.855620285Z"},{"index":3,"name":"Data layer conditional validation rules 004","scenario_hash":"de58ba75eb06a61b6bf80a3aec38ba45cca22d029ffa5e66088f565b6302848d","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-14T15:36:34.855620285Z"},{"index":4,"name":"Data layer conditional validation rules 005","scenario_hash":"f3f5c39e9d1bd3ceb8a026f41d935c5ad19a882a8b77c3390b95e572f782a0cf","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T15:36:34.855620285Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer conditional validation rules

  Background:
    Given schema Product event is being edited
    And its validation target is one complete captured data layer event

  # Data layer conditional validation rules 001
  Scenario: Data layer conditional validation rules 001
    Given property /oOrder/aProducts has an Item count rule with minimum 1
    When the operator makes the rule conditional
    And adds condition /page_type Equals product_detail
    Then the Item count rule is retained as the consequence
    And the rule summary states When page_type equals product_detail, oOrder.aProducts must contain at least 1 item
    And the trigger path and consequence path are stored in the same conditional rule
    And no JavaScript or free-form executable expression is requested or stored

  # Data layer conditional validation rules 002
  Scenario Outline: Data layer conditional validation rules 002
    Given conditional rule When /page_type Equals product_detail, /oOrder/aProducts must contain at least 1 item
    And an event has page_type <page_type_value> and aProducts <products_value>
    When the event is validated
    Then the conditional rule result is <rule_result>
    And the event receives <issue_count> issues from the conditional rule

    Examples:
      | page_type_value | products_value | rule_result    | issue_count |
      | product_detail  | missing        | Not applicable | 0           |
      | product_detail  | empty array    | Failed         | 1           |
      | product_detail  | 1 item         | Passed         | 0           |
      | category        | empty array    | Not applicable | 0           |

  # Data layer conditional validation rules 003
  Scenario Outline: Data layer conditional validation rules 003
    Given a trigger property has <observed_state>
    When trigger predicate <predicate> is evaluated against <configured_value>
    Then the predicate result is <predicate_result>

    Examples:
      | observed_state        | predicate       | configured_value      | predicate_result |
      | present with null     | Exists          | none                  | true             |
      | absent                | Does not exist  | none                  | true             |
      | string product_detail | Equals          | string product_detail | true             |
      | number 1              | Equals          | string 1              | false            |
      | absent                | Does not equal  | string internal       | false            |
      | string checkout       | Is one of       | page, checkout        | true             |
      | string product_detail | Matches pattern | ^product_             | true             |
      | number 6              | Is greater than | number 5              | true             |
      | number 5              | Is at least     | number 5              | true             |
      | number 4              | Is less than    | number 5              | true             |
      | number 5              | Is at most      | number 5              | true             |
      | string 5              | Is greater than | number 4              | false            |

  # Data layer conditional validation rules 004
  Scenario Outline: Data layer conditional validation rules 004
    Given the conditional rule has predicates /page_type Equals product_detail and /currency Equals EUR
    And its condition group uses <group_operator>
    When predicate results are <first_result> and <second_result>
    Then the consequence is <consequence_behavior>

    Examples:
      | group_operator | first_result | second_result | consequence_behavior |
      | All            | true         | true          | evaluated             |
      | All            | true         | false         | Not applicable        |
      | Any            | true         | false         | evaluated             |
      | Any            | false        | false         | Not applicable        |

  # Data layer conditional validation rules 005
  Scenario Outline: Data layer conditional validation rules 005
    Given a conditional rule draft has <invalid_configuration>
    When conditional rule validation runs
    Then the rule cannot be attached or saved
    And local assistance states <recovery_message>

    Examples:
      | invalid_configuration                   | recovery_message                          |
      | no trigger predicate                    | Add at least one condition                |
      | trigger without a property path         | Choose a condition property               |
      | Equals without a comparison value       | Enter a comparison value                  |
      | malformed Matches pattern value         | Correct the regular expression            |
      | Is greater than on a string trigger      | Choose an operator compatible with string |
      | consequence rule with invalid parameters | Correct the consequence rule              |

  # Data layer conditional validation rules 006
  Scenario: Data layer conditional validation rules 006
    Given the page_type condition is satisfied
    And a conditional Required rule targets /oOrder/aProducts/0
    And /oOrder/aProducts/0 is missing
    When validation results are presented
    Then the failure is attributed to expected path /oOrder/aProducts/0
    And a synthetic missing-property row is available at that path
    And rule details identify the condition summary, Failed result, Required constraint, and actual Missing value
    And the condition property page_type is not marked as failing

  # Data layer conditional validation rules 007
  Scenario: Data layer conditional validation rules 007
    Given the page_type condition is not satisfied
    When validation results are presented
    Then the conditional rule is retained with result Not applicable
    And it creates no error or warning
    And rule details identify which condition was not satisfied
    And Not applicable is not counted as Passed or Failed

  # Data layer conditional validation rules 008
  Scenario: Data layer conditional validation rules 008
    Given a conditional rule has a stable identity, trigger conditions, group operator, and consequence rule
    When it is saved locally, saved as reusable, revised, inherited, exported, imported, and reloaded
    Then each lifecycle operation preserves the conditional rule as one atomic definition
    And trigger paths, typed comparison values, group operator, consequence parameters, severity, and issue message are retained
    And changing a reusable conditional rule creates a new version without mutating schemas pinned to an earlier version

  # Data layer conditional validation rules 009
  Scenario Outline: Data layer conditional validation rules 009
    Given conditional rule When /products/*/price_monthly Exists, /products/*/duration is Required
    And one products item has price_monthly <price_monthly_state> and duration <duration_state>
    When the event is validated
    Then that products item has conditional result <item_result>
    And validation creates <issue_count> issues for /products/0/duration

    Examples:
      | price_monthly_state | duration_state | item_result    | issue_count |
      | number 29           | number 12      | Passed         | 0           |
      | null                | missing        | Failed         | 1           |
      | missing             | missing        | Not applicable | 0           |
      | missing             | number 12      | Not applicable | 0           |

  # Data layer conditional validation rules 010
  Scenario: Data layer conditional validation rules 010
    Given conditional rule When /products/*/price_monthly Exists, /products/*/duration is Required
    And four products respectively contain price_monthly 29 only, neither property, duration 12 only, and both price_monthly 49 and duration 12
    When the event is validated
    Then item 1 is Failed with one issue at /products/0/duration
    And items 2 and 3 are Not applicable without issues
    And item 4 is Passed without issues
    And a condition match in one products item never activates the consequence for another item
    And each issue retains trigger template /products/*/price_monthly and consequence template /products/*/duration
