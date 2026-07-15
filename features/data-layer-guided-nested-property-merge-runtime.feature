Feature: Data layer guided nested property merge runtime

  Background:
    Given the built extension side panel is running with production guided validation, Schema Library persistence, and schema validation
    And captured product_view contains products with product_name and product_id
    And Product detail is the selected production working-draft continuation context

  # Data layer guided nested property merge runtime 001
  Scenario Outline: Data layer guided nested property merge runtime 001
    Given the production Product detail working draft does not contain /products
    When rendered Add validation saves <first_path> with detected type <first_type>
    And the operator repeats the rendered flow for <second_path> with detected type <second_type>
    Then production persistence contains both canonical property paths as sibling item properties
    And the stored type for <first_path> is <first_type>
    And the same stored item object has type <second_type> at <second_path>
    And production persistence contains one attached rule for each property path
    And the rendered schema tree displays both properties beneath shared array ancestor <array_ancestor>

    Examples:
      | array_ancestor       | first_path                               | first_type | second_path                              | second_type |
      | /products/*          | /products/*/product_name                 | String     | /products/*/product_id                   | Number      |
      | /products/*          | /products/*/product_id                   | Number     | /products/*/product_name                 | String      |
      | /orders/*/products/* | /orders/*/products/*/product_name        | String     | /orders/*/products/*/product_id          | Number      |

  # Data layer guided nested property merge runtime 002
  Scenario: Data layer guided nested property merge runtime 002
    Given production persistence contains /products/*/product_name with required membership, documentation, a pattern rule, and parent constraints
    When rendered Add validation saves /products/*/product_id as a required Number
    Then production persistence adds product_id without changing the stored product_name definition or metadata
    And production persistence retains the existing products array and item-object constraints
    And no unrelated stored sibling or rule is removed or duplicated

  # Data layer guided nested property merge runtime 003
  Scenario: Data layer guided nested property merge runtime 003
    Given production persistence contains guided rules for /products/*/product_name and /products/*/product_id
    When the side panel reloads and production validation evaluates invalid values for both properties
    Then the restored working draft contains both sibling definitions and attached rules
    And production validation reports independent failures for product_name and product_id
    And each failure contains the matching wildcard template path and concrete products item path
