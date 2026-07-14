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
      | product_detail  | missing        | Failed         | 1           |
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
    Given a saved conditional rule fails because /oOrder/aProducts is missing while /page_type equals product_detail
    When the production Live inspector renders the validation result
    Then exactly 1 issue is rendered for /oOrder/aProducts
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
