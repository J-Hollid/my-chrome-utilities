# mutation-stamp: sha256=0431932db8b6ccd3b52d8eea7fd24c1c1ee37c38e3aa2146c756e6d799dae141
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T09:26:45.107888064Z","feature_name":"Data layer event property validation entry","feature_path":"features/data-layer-event-property-validation-entry.feature","background_hash":"7311907506ce4116fc1ad34d82e40f219aa072dc5bb82f9307aa51135fadf156","implementation_hash":"sha256:70d08e935535ca59c7bce36da811d8fb5b6ef5345c3dd17d0d124456d3960403","scenarios":[{"index":0,"name":"Data layer event property validation entry 001","scenario_hash":"53e5a73f221cb0dce8aa40677caecdf9d62f4f06d69a726a025ee50ddf8d87d7","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-14T09:24:50.508020854Z"},{"index":3,"name":"Data layer event property validation entry 004","scenario_hash":"c538424a3ccc2fa74c06d057a227099153de4142a3f5b15302dc9ced2eaf6e38","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T09:24:50.508020854Z"},{"index":4,"name":"Data layer event property validation entry 005","scenario_hash":"1906351fcc1b0f3ae54e339034fa23a6810954596be26d98ee85033a25fce78f","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T09:24:50.508020854Z"},{"index":5,"name":"Data layer event property validation entry 006","scenario_hash":"59061ad2ecc3490d54d4cfd3642e802dab0fff8e909498db839991a934454ebc","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-14T09:24:50.508020854Z"}]}
# acceptance-mutation-manifest-end

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
