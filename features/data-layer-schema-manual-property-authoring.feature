Feature: Data layer schema manual property authoring

  Background:
    Given schema Page view has current revision 3
    And its working draft is open in the schema editor

  # Data layer schema manual property authoring 001
  Scenario: Data layer schema manual property authoring 001
    When Property rules are displayed
    Then a persistent Add property action appears above the property tree
    And no global Add validation rule action is displayed
    And property rows retain their own Add rule actions

  # Data layer schema manual property authoring 002
  Scenario: Data layer schema manual property authoring 002
    When the operator activates Add property
    Then a focused manual-property form opens
    And Property path receives keyboard focus
    And Value type offers string, number, boolean, object, and array
    And Array item type is hidden until array is selected
    And Add property and Cancel are available

  # Data layer schema manual property authoring 003
  Scenario Outline: Data layer schema manual property authoring 003
    Given the manual-property form contains path <entered_path>
    When the path preview is displayed
    Then normalized path is <normalized_path>
    And missing object path is <missing_object_path>

    Examples:
      | entered_path        | normalized_path       | missing_object_path |
      | page_category       | /page_category        | none                |
      | commerce.order.id   | /commerce/order/id    | commerce, order     |

  # Data layer schema manual property authoring 004
  Scenario: Data layer schema manual property authoring 004
    Given the manual-property form defines commerce.order.id as string
    When the operator activates Add property
    Then missing commerce and order object properties are created
    And manual property /commerce/order/id has been added to the Page view working draft
    And /commerce/order/id is selected in the property tree with 0 active rules
    And Add rule is available for /commerce/order/id
    And current revision 3 remains unchanged

  # Data layer schema manual property authoring 005
  Scenario Outline: Data layer schema manual property authoring 005
    Given the manual-property form has property definition <property_definition>
    When manual property validation runs
    Then addition result is <addition_result>
    And assistance is <assistance>

    Examples:
      | property_definition                 | addition_result | assistance                                      |
      | empty path                          | blocked         | Enter a property path                           |
      | commerce..id as string              | blocked         | Remove the empty path segment                   |
      | existing page_type as string        | blocked         | Go to existing property page_type               |
      | commerce.order under string commerce | blocked        | commerce cannot contain child properties        |
      | inherited page_name as string       | blocked         | page_name is defined by the parent schema        |
      | items as array without item type    | blocked         | Select an array item type                        |

  # Data layer schema manual property authoring 006
  Scenario Outline: Data layer schema manual property authoring 006
    Given the manual-property form defines property items as array
    When array item type <item_type> is selected
    Then the preview identifies items as an array of <item_type>
    And the property can be added

    Examples:
      | item_type |
      | string    |
      | number    |
      | boolean   |
      | object    |

  # Data layer schema manual property authoring 007
  Scenario: Data layer schema manual property authoring 007
    Given page_type already exists in the property tree
    And duplicate path page_type is blocked in the manual-property form
    When the operator activates Go to existing property page_type
    Then the form closes without changing the working draft
    And page_type is selected and visible in the property tree
    And keyboard focus moves to Add rule for page_type

  # Data layer schema manual property authoring 008
  Scenario: Data layer schema manual property authoring 008
    Given the manual-property form contains an unsaved property definition
    When the operator activates Cancel
    Then the form closes
    And no property or rule is added
    And the Page view working draft remains unchanged
    And keyboard focus returns to Add property

  # Data layer schema manual property authoring 009
  Scenario: Data layer schema manual property authoring 009
    Given manual property /commerce/order/id has been added to the Page view working draft
    When the side panel reloads and Page view is reopened
    Then /commerce/order/id remains in the working-draft property tree
    And it remains identified as Manual with type string and 0 active rules
    And current revision 3 remains unchanged

  # Data layer schema manual property authoring 010
  Scenario: Data layer schema manual property authoring 010
    Given manual property /commerce/order/id has been added without a rule
    When validation preview refreshes
    Then /commerce/order/id is part of the schema data model
    And no validation constraint beyond type string is inferred
    And no reusable or local rule is attached implicitly
