Feature: Data layer Required rule type independence

  Background:
    Given reusable rule Product-detail requirement says Required when /page_type Equals product_detail
    And the reusable rule is enabled in the Rule Library

  # Data layer Required rule type independence 001
  Scenario: Data layer Required rule type independence 001
    When Product-detail requirement is displayed in the Rule Library
    Then its consequence is identified as applicable to every property type
    And its trigger path, trigger type, predicate, severity, message, and revision remain visible
    And the operator is not required to create one Required rule per consequence property type

  # Data layer Required rule type independence 002
  Scenario Outline: Data layer Required rule type independence 002
    Given the attachment target is <property_path>
    And the destination property has type <property_type>
    When compatible reusable rules are displayed for the property
    Then Product-detail requirement is available to attach to <property_path>

    Examples:
      | property_path | property_type |
      | /title        | string        |
      | /quantity     | number        |
      | /consented    | boolean       |
      | /customer     | object        |
      | /products     | array         |

  # Data layer Required rule type independence 003
  Scenario: Data layer Required rule type independence 003
    Given Product-detail requirement revision 2 is attached to differently typed properties in Page view and Purchase
    When the attachments are reviewed
    Then every attachment is pinned to the same reusable rule identity and revision
    And no type-specific duplicate reusable rule is created
    And each schema retains its own consequence property path
    And changing the reusable rule continues through one reusable-rule revision history

  # Data layer Required rule type independence 004
  Scenario Outline: Data layer Required rule type independence 004
    Given Product-detail requirement is attached to a <property_type> property
    And page_type has value <page_type_value>
    And the consequence property is <property_state>
    When the payload is validated
    Then the reusable rule result is <rule_result>
    And validation creates <issue_count> Required issues

    Examples:
      | property_type | page_type_value | property_state | rule_result    | issue_count |
      | string        | product_detail  | missing        | Failed         | 1           |
      | number        | product_detail  | missing        | Failed         | 1           |
      | boolean       | product_detail  | missing        | Failed         | 1           |
      | object        | product_detail  | missing        | Failed         | 1           |
      | array         | product_detail  | missing        | Failed         | 1           |
      | array         | product_detail  | present        | Passed         | 0           |
      | array         | category        | missing        | Not applicable | 0           |

  # Data layer Required rule type independence 005
  Scenario Outline: Data layer Required rule type independence 005
    Given reusable rule <rule_name> has consequence operator <operator>
    And the destination property has type <property_type>
    When compatible reusable rules are displayed for the property
    Then <availability_outcome>

    Examples:
      | rule_name           | operator           | property_type | availability_outcome                                  |
      | Approved page types | Allowed values     | number        | Approved page types is absent from attachable results  |
      | Revenue range       | Numeric range      | string        | Revenue range is absent from attachable results        |
      | Product count       | Item count         | object        | Product count is absent from attachable results        |

  # Data layer Required rule type independence 006
  Scenario: Data layer Required rule type independence 006
    Given Product-detail requirement was saved under the former model with applicable type string
    When the Rule Library is loaded under the current model
    Then the existing Required rule becomes attachable to every property type
    And its stable identity, revision history, condition, parameters, severity, message, and existing attachments remain unchanged
    And no replacement rule or reusable-rule revision is created by the compatibility correction
