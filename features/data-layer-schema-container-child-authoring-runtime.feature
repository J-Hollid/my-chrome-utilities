Feature: Data layer schema container child authoring runtime

  Background:
    Given the built extension side panel is running with the production Schema Library, schema editor, working drafts, and persistence
    And production Page view revision 3 has an open working draft containing object /commerce, object-item array /products, and string-item array /tags
    And /products/* contains existing property /products/*/product_name

  # Data layer schema container child authoring runtime 001
  Scenario: Data layer schema container child authoring runtime 001
    When the production property tree is rendered
    Then /commerce and /products/* render Add child property
    And /products renders Add item property
    And /products/*/product_name and /tags render no invalid child action
    When the rendered Add item property action is activated on /products
    Then the production form focuses Child property name
    And it renders /products/* as fixed parent context
    And no editable full-path control is rendered

  # Data layer schema container child authoring runtime 002
  Scenario Outline: Data layer schema container child authoring runtime 002
    Given the rendered contextual action is opened on <container_path>
    When production controls add <child_name> as <value_type>
    Then production working-draft persistence contains <canonical_path> with type <value_type>
    And the current published revision remains byte-equivalent
    And the rendered tree selects <canonical_path>

    Examples:
      | container_path | child_name | value_type | canonical_path                 |
      | /commerce      | order      | object     | /commerce/order                |
      | /products      | product_id | number     | /products/*/product_id         |
      | /products/*    | product_sku | string    | /products/*/product_sku        |

  # Data layer schema container child authoring runtime 003
  Scenario: Data layer schema container child authoring runtime 003
    Given production /products/*/product_name has definition metadata and production /products has container constraints
    When rendered Add item property adds /products/*/product_id
    Then stored product_name and product_id are siblings in one production item-object properties map
    And product_name metadata and products container constraints remain byte-equivalent
    And no unrelated production property, rule, or documentation entry is removed or duplicated

  # Data layer schema container child authoring runtime 004
  Scenario Outline: Data layer schema container child authoring runtime 004
    Given the rendered full-path Add property form contains <entered_path> as number
    When production validation and addition run
    Then the form accepts canonical object-item path /products/*/product_id
    And no cannot-contain-children assistance is rendered
    And stored /products/*/product_name remains beside stored /products/*/product_id
    When the side panel reloads and production Page view is reopened
    Then both object-item properties are rendered from the restored working draft

    Examples:
      | entered_path                  |
      | products/*/product_id         |
      | products.*.product_id         |

  # Data layer schema container child authoring runtime 005
  Scenario: Data layer schema container child authoring runtime 005
    Given the rendered Add item property form was opened from /products
    When the operator enters existing child product_name
    Then production persistence remains byte-equivalent and Go to existing property /products/*/product_name is rendered
    When the rendered form is cancelled
    Then the dialog closes and focus returns to Add item property on /products
