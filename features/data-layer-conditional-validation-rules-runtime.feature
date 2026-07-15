# mutation-stamp: sha256=f81995c4ec6703cea37f66f52ae22992cb746be5dd1c7767796df3642a430103
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T15:37:16.772831330Z","feature_name":"Data layer conditional validation rules runtime","feature_path":"features/data-layer-conditional-validation-rules-runtime.feature","background_hash":"55e2399967af9296148d02a5074e22b201e1183ed127171aab9e2a3690a4c518","implementation_hash":"sha256:331cdb2078285141f76573c55f20e098b973fde7bf11584440cbfdcf94999f97","scenarios":[{"index":0,"name":"Data layer conditional validation rules runtime 001","scenario_hash":"4c08e9d99f0abf6c0fc76d554774cea5c801dfaaf7a706a22b362a3390002df2","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-14T15:37:16.772831330Z"},{"index":1,"name":"Data layer conditional validation rules runtime 002","scenario_hash":"c15bcaee976cb685180eb464a056a3be62035e2e12141e2c485aefb4dd4a78a9","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-14T15:37:16.772831330Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer conditional validation rules runtime

  Background:
    Given the built extension side panel is running with production Schema Library persistence and validation
    And captured event product_detail from source event-history is open in the Live event inspector

  # Data layer conditional validation rules runtime 001
  Scenario Outline: Data layer conditional validation rules runtime 001
    Given schema Product event contains properties /page_type and /oOrder/aProducts
    When Add validation for /oOrder/aProducts creates an Item count rule with minimum 1
    And the operator enables Apply only when with condition /page_type Equals product_detail
    And the rule is saved to the Product event working draft
    And production validation receives an event with page_type <page_type_value> and aProducts <products_value>
    Then the stored conditional rule is evaluated once with result <rule_result>
    And production validation reports <issue_count> issues for /oOrder/aProducts

    Examples:
      | page_type_value | products_value | rule_result    | issue_count |
      | product_detail  | missing        | Not applicable | 0           |
      | product_detail  | empty array    | Failed         | 1           |
      | product_detail  | 1 item         | Passed         | 0           |
      | category        | missing        | Not applicable | 0           |

  # Data layer conditional validation rules runtime 002
  Scenario Outline: Data layer conditional validation rules runtime 002
    Given a production conditional rule has /page_type Equals product_detail and /currency Equals EUR
    And its condition group uses <group_operator>
    And its consequence passes for every event in the examples
    When production validation receives an event with page_type <page_type_value> and currency <currency_value>
    Then the consequence evaluator is invoked <invocation_count> times
    And the conditional rule result is <rule_result>

    Examples:
      | group_operator | page_type_value | currency_value | invocation_count | rule_result    |
      | All            | product_detail  | EUR            | 1                | Passed         |
      | All            | product_detail  | USD            | 0                | Not applicable |
      | Any            | product_detail  | USD            | 1                | Passed         |
      | Any            | category        | USD            | 0                | Not applicable |

  # Data layer conditional validation rules runtime 003
  Scenario: Data layer conditional validation rules runtime 003
    Given Apply only when is open for an Item count rule on /oOrder/aProducts
    When the operator selects /page_type from the current event as the trigger
    Then trigger operators are limited to operators compatible with the detected string type
    And Equals uses a type-aware comparison value initialized from the event
    And condition properties from the schema remain selectable when absent from the current event
    And the current event preview distinguishes Passed, Failed, and Not applicable
    And saving returns to the existing Add validation flow without creating a second consequence rule

  # Data layer conditional validation rules runtime 004
  Scenario: Data layer conditional validation rules runtime 004
    Given a saved conditional Required rule fails because /oOrder/aProducts/0 is missing while /page_type equals product_detail
    When the production Live inspector renders the validation result
    Then exactly 1 issue is rendered for /oOrder/aProducts/0
    And the rendered details identify the trigger condition and consequence constraint
    And /page_type is not rendered as failing
    When page_type changes to category and the event is validated again
    Then the rendered rule result is Not applicable with no error or warning

  # Data layer conditional validation rules runtime 005
  Scenario: Data layer conditional validation rules runtime 005
    Given a local conditional rule and a reusable conditional rule are attached to Product event
    When the working draft is published, exported, replaced by its import, and reloaded
    Then production persistence retains each conditional rule identity exactly once
    And validation after reload uses the retained trigger conditions and consequence parameters
    And the reusable rule version remains distinct from its schema attachment

  # Data layer conditional validation rules runtime 006
  Scenario Outline: Data layer conditional validation rules runtime 006
    Given production conditional rule When /products/*/price_monthly Exists, /products/*/duration is Required
    When production validation receives one product with price_monthly <price_monthly_state> and duration <duration_state>
    Then the production item evaluation is <item_result>
    And production validation creates <issue_count> issues for /products/0/duration

    Examples:
      | price_monthly_state | duration_state | item_result    | issue_count |
      | number 29           | number 12      | Passed         | 0           |
      | null                | missing        | Failed         | 1           |
      | missing             | missing        | Not applicable | 0           |
      | missing             | number 12      | Not applicable | 0           |

  # Data layer conditional validation rules runtime 007
  Scenario: Data layer conditional validation rules runtime 007
    Given production conditional rule When /products/*/price_monthly Exists, /products/*/duration is Required
    And production payload contains products whose same-item results are Failed, Not applicable, Not applicable, and Passed
    When production validation evaluates the wildcard condition and consequence
    Then exactly one issue identifies concrete path /products/0/duration
    And no issue is created for products items whose own price_monthly is absent
    And the rendered evaluation details distinguish each item's result
    And production persistence and reload retain both wildcard template paths in one conditional rule
