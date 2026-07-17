Feature: Data layer Required rule type independence runtime

  Background:
    Given the built extension is running with production Rule Library, schema editor, validation, and persistence systems
    And reusable stable id reusable-required-7 says Required when /page_type Equals product_detail

  # Data layer Required rule type independence runtime 001
  Scenario Outline: Data layer Required rule type independence runtime 001
    Given the production schema editor contains property <property_path> with type <property_type>
    When the actual property rule picker opens
    Then the production DOM offers reusable-required-7 as an enabled attachment action

    Examples:
      | property_path | property_type |
      | /title        | string        |
      | /quantity     | number        |
      | /consented    | boolean       |
      | /customer     | object        |
      | /products     | array         |

  # Data layer Required rule type independence runtime 002
  Scenario: Data layer Required rule type independence runtime 002
    When the operator attaches reusable-required-7 to string, number, boolean, object, and array properties through the actual DOM
    Then production persistence stores 5 attachments pinned to reusable-required-7 revision 1
    And the Rule Library stores 1 reusable-required-7 definition
    And every attachment retains its canonical consequence property path
    And serialization and reload preserve the reusable identity, condition, and attachments

  # Data layer Required rule type independence runtime 003
  Scenario Outline: Data layer Required rule type independence runtime 003
    Given reusable-required-7 is attached to a <property_type> property
    When production validation receives page_type product_detail with the consequence property <property_state>
    Then the production conditional result is <rule_result>
    And production validation creates <issue_count> Required issues

    Examples:
      | property_type | property_state | rule_result | issue_count |
      | string        | missing        | Failed      | 1           |
      | number        | missing        | Failed      | 1           |
      | boolean       | missing        | Failed      | 1           |
      | object        | missing        | Failed      | 1           |
      | array         | missing        | Failed      | 1           |
      | array         | present        | Passed      | 0           |

  # Data layer Required rule type independence runtime 004
  Scenario: Data layer Required rule type independence runtime 004
    Given production storage contains reusable-required-7 revision 3 with former applicable type string
    When the Rule Library is loaded, rendered, serialized, and reloaded
    Then production compatibility offers reusable-required-7 for all 5 property types
    And stored stable id reusable-required-7 and revision 3 remain unchanged
    And the condition, revision history, severity, message, and existing attachments are byte-for-byte unchanged
    And no migration-created reusable rule or revision exists

  # Data layer Required rule type independence runtime 005
  Scenario Outline: Data layer Required rule type independence runtime 005
    Given the production Rule Library contains <rule_definition>
    And the destination property has type <property_type>
    When the actual property rule picker opens
    Then the production DOM reports <picker_outcome>

    Examples:
      | rule_definition             | property_type | picker_outcome                               |
      | Allowed values type string  | number        | no attachment action for that reusable rule  |
      | Numeric range type number   | string        | no attachment action for that reusable rule  |
