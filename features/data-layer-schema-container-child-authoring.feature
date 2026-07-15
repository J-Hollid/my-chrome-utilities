Feature: Data layer schema container child authoring

  Background:
    Given schema Page view has current revision 3
    And its working draft is open in the schema editor
    And the working draft contains object /commerce
    And array /products has object items containing /products/*/product_name
    And array /tags has string items

  # Data layer schema container child authoring 001
  Scenario: Data layer schema container child authoring 001
    When the property tree is displayed
    Then object rows /commerce and /products/* each offer Add child property
    And array row /products offers Add item property
    And string property /products/*/product_name offers no child-property action
    And scalar-item array /tags offers no Add item property action
    And the persistent Add property action remains available for root properties

  # Data layer schema container child authoring 002
  Scenario Outline: Data layer schema container child authoring 002
    Given the operator activates <action> on container <container_path>
    When the contextual child-property form opens
    Then it identifies derived parent path <parent_path>
    And Child property name receives keyboard focus
    And no editable full property path is requested
    When the operator enters child name <child_name> with value type <value_type>
    Then the preview identifies canonical path <canonical_path>
    And adding the child creates <canonical_path> beneath the selected container
    And <canonical_path> is selected in the property tree

    Examples:
      | action             | container_path | parent_path | child_name | value_type | canonical_path                 |
      | Add child property | /commerce      | /commerce   | order      | object     | /commerce/order                |
      | Add item property  | /products      | /products/* | product_id | number     | /products/*/product_id         |
      | Add child property | /products/*    | /products/* | product_sku | string    | /products/*/product_sku        |

  # Data layer schema container child authoring 003
  Scenario: Data layer schema container child authoring 003
    Given /commerce/order was added as an object through Add child property
    When the operator uses Add child property on /commerce/order to add line_items as an array of object
    Then /commerce/order/line_items is created as an object-item array
    And /commerce/order remains an object
    And /commerce/order/line_items offers Add item property
    When Add item property adds sku as string
    Then /commerce/order/line_items/*/sku is created without entering its full path
    And the newly added array remains available for further item-property authoring

  # Data layer schema container child authoring 004
  Scenario: Data layer schema container child authoring 004
    Given /products/*/product_name has its existing definition, documentation, required membership, and attached rules
    And /products and its item object have existing constraints
    When Add item property adds /products/*/product_id as number
    Then product_id is stored alongside product_name in the same item object
    And the product_name definition, documentation, required membership, and attached rules are unchanged
    And the array, item-object constraints, unrelated siblings, and unrelated rules are unchanged

  # Data layer schema container child authoring 005
  Scenario Outline: Data layer schema container child authoring 005
    Given the full-path Add property form contains <entered_path> as number
    When manual property validation runs
    Then normalized path is /products/*/product_id
    And the valid object-item path is ready to add
    And assistance does not claim that products cannot contain child properties
    When the operator activates Add property
    Then /products/*/product_id is added alongside /products/*/product_name

    Examples:
      | entered_path                  |
      | products/*/product_id         |
      | products.*.product_id         |

  # Data layer schema container child authoring 006
  Scenario: Data layer schema container child authoring 006
    Given Add item property was opened from /products
    When child name product_name identifies an existing item property
    Then addition is blocked without changing the working draft
    And Go to existing property /products/*/product_name is available
    When the operator cancels contextual child authoring
    Then keyboard focus returns to Add item property on /products

  # Data layer schema container child authoring 007
  Scenario: Data layer schema container child authoring 007
    Given /commerce/order/line_items/*/sku and /products/*/product_id were added through container actions
    When the working draft is persisted and reopened after side-panel reload
    Then both nested properties remain in the working-draft property tree
    And both remain identified as Manual with their selected value types
    And /products/*/product_name remains present
    And current revision 3 remains unchanged
