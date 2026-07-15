# mutation-stamp: sha256=aade25584abd57b5c955dfbd1bccfe9bb6257346e516bbe8a75be11ce844ffa6
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T00:35:53.952991258Z","feature_name":"Data layer Live guided conditional rule authoring","feature_path":"features/data-layer-live-guided-conditional-rule-authoring.feature","background_hash":"fbab252ba8321e3815cb76e105268494fc0c0d00fefd6bfcb37db14d9045a848","implementation_hash":"sha256:0135b9dc42e87856572a54aa7489ac6ae7e859d1b6544bde594f94b549afe625","scenarios":[{"index":4,"name":"Data layer Live guided conditional rule authoring 005","scenario_hash":"b085b820ba710b50931952bd61131cbcb33f4b1dc6280c6ce7ea50ad2e270bc7","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-15T00:35:53.952991258Z"},{"index":5,"name":"Data layer Live guided conditional rule authoring 006","scenario_hash":"56044c4e7e8ff6046677022d76443ed4ea2daba0bb24be1b72bf5d202cae5773","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T00:35:53.952991258Z"},{"index":2,"name":"Data layer Live guided conditional rule authoring 003","scenario_hash":"83a5a63cb36eb7cbac83f15c958a506e67a9831a2c163c26daebc7c4864e0ffb","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-15T00:34:51.766675663Z"},{"index":7,"name":"Data layer Live guided conditional rule authoring 008","scenario_hash":"d7090b1f18f97436b294725c809f0f54ad105c8fa2ff46d3e7178c3ff9e8abf5","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-15T00:34:51.766675663Z"},{"index":8,"name":"Data layer Live guided conditional rule authoring 009","scenario_hash":"cdbf13c596cd90cf5194616ff662b50c4ea3f0dba775603e446acecb8fd56164","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-15T00:34:51.766675663Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Live guided conditional rule authoring

  Background:
    Given captured product_detail event is open in the Live event inspector
    And its payload contains page_type product_detail and oOrder.aProducts
    And the operator starts Add validation from that event

  # Data layer Live guided conditional rule authoring 001
  Scenario: Data layer Live guided conditional rule authoring 001
    Given a consequence property and requirement have been selected
    When the guided requirement stage is displayed
    Then Apply only when is available without opening the advanced schema editor
    And it is disabled by default for an unconditional rule
    And enabling it reveals conditional controls within the current Add validation flow

  # Data layer Live guided conditional rule authoring 002
  Scenario: Data layer Live guided conditional rule authoring 002
    Given consequence Required targets /oOrder/aProducts/0
    When the operator enables Apply only when
    And selects /page_type as the condition property
    Then the detected condition type is string
    And compatible trigger operators are available
    And Equals is initialized with observed value product_detail
    And the consequence target is not offered as its own default trigger

  # Data layer Live guided conditional rule authoring 003
  Scenario Outline: Data layer Live guided conditional rule authoring 003
    Given condition property <condition_path> has detected type <condition_type>
    When condition operators are displayed
    Then <compatible_operator> is available
    And <incompatible_operator> is unavailable

    Examples:
      | condition_path | condition_type | compatible_operator | incompatible_operator |
      | /page_type     | string         | Matches pattern      | Is greater than       |
      | /basket_total  | number         | Is at least          | Matches pattern       |
      | /consented     | boolean        | Equals               | Is less than          |
      | /products      | array          | Exists               | Is greater than       |

  # Data layer Live guided conditional rule authoring 004
  Scenario: Data layer Live guided conditional rule authoring 004
    Given the current event does not contain schema property /customer/type
    And the selected destination schema declares /customer/type as string
    When condition properties are displayed
    Then /customer/type remains selectable with source destination schema
    And Exists and Does not exist require no comparison value
    And comparison operators require a type-aware operator-entered value

  # Data layer Live guided conditional rule authoring 005
  Scenario Outline: Data layer Live guided conditional rule authoring 005
    Given conditions are /page_type Equals product_detail and /currency Equals EUR
    And the condition group uses <group_operator>
    When trigger results are <first_result> and <second_result>
    Then the consequence is <consequence_behavior>

    Examples:
      | group_operator | first_result | second_result | consequence_behavior |
      | All            | true         | true          | evaluated            |
      | All            | true         | false         | Not applicable       |
      | Any            | true         | false         | evaluated            |
      | Any            | false        | false         | Not applicable       |

  # Data layer Live guided conditional rule authoring 006
  Scenario Outline: Data layer Live guided conditional rule authoring 006
    Given guided rule When /page_type Equals product_detail, /oOrder/aProducts/0 must be present
    When the current-event preview uses page_type <page_type_value> and first product <product_state>
    Then the guided preview result is <preview_result>
    And the preview reports <issue_count> consequence issues

    Examples:
      | page_type_value | product_state | preview_result | issue_count |
      | product_detail  | present       | Passed         | 0           |
      | product_detail  | missing       | Failed         | 1           |
      | category        | missing       | Not applicable | 0           |

  # Data layer Live guided conditional rule authoring 007
  Scenario: Data layer Live guided conditional rule authoring 007
    Given the conditional consequence and predicates are valid
    When the guided review stage is displayed
    Then one readable summary states When page_type equals product_detail, oOrder.aProducts.0 must be present
    And trigger conditions, group operator, consequence, destination schema, assignment action, and local-or-reusable choice are reviewed together
    And no JavaScript or free-form executable expression is requested or stored

  # Data layer Live guided conditional rule authoring 008
  Scenario Outline: Data layer Live guided conditional rule authoring 008
    Given a complete guided conditional rule is ready to save as <rule_scope>
    When Add validation completes
    Then one atomic rule stores the condition group and consequence at the destination schema working draft
    And persistence outcome is <persistence_outcome>
    And the advanced schema editor was not required

    Examples:
      | rule_scope        | persistence_outcome                                                    |
      | local rule        | one local conditional attachment is created                            |
      | reusable rule     | one reusable conditional rule and one pinned attachment are created    |

  # Data layer Live guided conditional rule authoring 009
  Scenario Outline: Data layer Live guided conditional rule authoring 009
    Given Apply only when has <invalid_configuration>
    When the operator attempts to continue or save
    Then the guided flow remains at the conditional controls
    And local assistance states <recovery_message>
    And no partial rule, schema change, or reusable rule is persisted

    Examples:
      | invalid_configuration                    | recovery_message                          |
      | no condition                             | Add at least one condition                |
      | condition without a property             | Choose a condition property               |
      | Equals without a comparison value        | Enter a comparison value                  |
      | malformed Matches pattern value          | Correct the regular expression            |
      | Is greater than on a string property     | Choose an operator compatible with string |

  # Data layer Live guided conditional rule authoring 010
  Scenario: Data layer Live guided conditional rule authoring 010
    Given compatible conditional values have been entered
    When the operator moves Back, changes the consequence target, changes destination schema, or returns to the condition controls
    Then compatible predicates and typed comparison values are retained
    And incompatible or missing condition paths require explicit review before saving
    And the current event is never silently substituted for an operator-entered comparison value

  # Data layer Live guided conditional rule authoring 011
  Scenario: Data layer Live guided conditional rule authoring 011
    Given a guided conditional rule has been saved
    When its working draft is reopened, published, exported, imported, or reloaded
    Then its stable identity, trigger paths, typed comparisons, group operator, consequence, severity, message, and enabled state are retained
    And validation continues to distinguish Passed, Failed, and Not applicable

  # Data layer Live guided conditional rule authoring 012
  Scenario: Data layer Live guided conditional rule authoring 012
    Given Apply only when contains entered predicates
    When the operator disables Apply only when or cancels Add validation
    Then disabling requires confirmation before discarding the predicates
    And canceling leaves the schema and Rule Library unchanged
    And returning to the Live event restores the selected event, property, scroll position, and keyboard focus

  # Data layer Live guided conditional rule authoring 013
  Scenario: Data layer Live guided conditional rule authoring 013
    Given consequence Required targets /products/*/duration
    And the captured event and destination schema contain /products/*/price_monthly as Number
    When the operator enables Apply only when
    And condition properties are displayed
    Then /products/*/price_monthly is available as a same-item condition property
    And separate concrete price_monthly paths are not offered for each captured product
    When the operator selects /products/*/price_monthly with Exists
    Then the review states For each products item, when price_monthly exists, duration must be present
    And the atomic rule stores trigger /products/*/price_monthly and consequence /products/*/duration
    And current-event preview evaluates each products item with the same wildcard binding
