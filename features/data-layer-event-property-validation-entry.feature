Feature: Data layer event property validation entry

  Background:
    Given captured event order_complete is open in the Live event inspector
    And its recursive property tree is displayed

  # Data layer event property validation entry 001
  Scenario Outline: Data layer event property validation entry 001
    Given property <property_path> has validation status <validation_status>
    When its property row is displayed
    Then the <validation_status> badge remains a status control that opens validation details
    And Add validation is a separate property-specific action
    And the status badge is not used as the Add validation action

    Examples:
      | property_path                   | validation_status |
      | /oOrder/orderId                 | Passed            |
      | /oOrder/aProducts/*/sku         | No rules          |
      | /oOrder/aProducts/*/price       | Warning           |
      | /oOrder/aProducts/*/productType | Error             |

  # Data layer event property validation entry 002
  Scenario: Data layer event property validation entry 002
    Given no working-draft continuation context is selected
    When the operator activates Add validation for /oOrder/orderId
    Then a guided validation draft starts at schema destination
    And /oOrder/orderId, its observed value, detected type, event, source, domain, and pathname are prefilled
    And no radio-button property-selection stage is displayed
    And Create validation from this event is absent from event-level actions
    And no schema, rule, or assignment is persisted before review

  # Data layer event property validation entry 003
  Scenario: Data layer event property validation entry 003
    Given Product detail is the selected working-draft continuation context
    When the operator activates Add validation for /oOrder/orderId
    Then the requirement stage opens for /oOrder/orderId
    And Product detail remains the schema destination by stable identity
    And schema destination and property selection are skipped
    And Add property from this event is absent from event-level draft actions

  # Data layer event property validation entry 004
  Scenario Outline: Data layer event property validation entry 004
    Given the operator is viewing <tree_location>
    When Add validation is activated for sku
    Then rule target is <rule_target>
    And matched value count is <matched_value_count>
    And no additional array-scope choice is required

    Examples:
      | tree_location                       | rule_target                    | matched_value_count |
      | aProducts Every item                | /oOrder/aProducts/*/sku        | 6                   |
      | aProducts Specific items Item 2     | /oOrder/aProducts/1/sku        | 1                   |

  # Data layer event property validation entry 005
  Scenario Outline: Data layer event property validation entry 005
    Given property row <property_path> represents <property_type>
    When Add validation starts from that row
    Then the rule builder is prefilled with type <property_type>
    And compatible rule category <compatible_rule_category> is available

    Examples:
      | property_path              | property_type | compatible_rule_category |
      | /oOrder                    | Object        | declared properties      |
      | /oOrder/aProducts          | Array         | item count               |
      | /oOrder/aProducts/*/sku    | String        | text rules               |

  # Data layer event property validation entry 006
  Scenario Outline: Data layer event property validation entry 006
    Given Add validation was started from property /oOrder/aProducts/*/sku
    When the operator completes action <completion_action>
    Then the originating event inspector is restored
    And prior tree expansion, feed position, inspector scroll position, and selected event are restored
    And keyboard focus returns to Add validation for /oOrder/aProducts/*/sku
    And restoration result is <restoration_result>

    Examples:
      | completion_action       | restoration_result                                                   |
      | Cancel                  | no validation state changes                                          |
      | Add validation to draft | the pending draft change is identified beside the recorded status    |

  # Data layer event property validation entry 007
  Scenario: Data layer event property validation entry 007
    Given validation for /oOrder/aProducts/*/sku was added to Product detail working draft
    And the event inspector has returned to the expanded aProducts tree
    When the operator activates Add validation for /oOrder/aProducts/*/name
    Then the requirement stage opens for name in the same Product detail working draft
    And the pending sku change remains present
    And no new schema identity or working draft is created
