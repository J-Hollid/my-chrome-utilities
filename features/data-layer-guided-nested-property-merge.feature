# mutation-stamp: sha256=3890dacbc8aa9f89482fbcf5f2be929532834715c6ee4154ce75f22d47724a05
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T13:45:41.774537804Z","feature_name":"Data layer guided nested property merge","feature_path":"features/data-layer-guided-nested-property-merge.feature","background_hash":"deb553aa974e99bfb89513c414d9b2d73f818a5389f54b2960791cb8b0c7a14c","implementation_hash":"sha256:b36daecfb0425d35077d69fa979a3df03be7941d93cd0ebc67d2562852117e07","scenarios":[{"index":0,"name":"Data layer guided nested property merge 001","scenario_hash":"cb45b15a9b157e387e4f6492bed2103d7f9f1c5be5e66182cc8d7a51b3f15be8","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:45:41.774537804Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer guided nested property merge

  Background:
    Given a captured product_view event contains products with product_name and product_id
    And Product detail is the selected working-draft continuation context

  # Data layer guided nested property merge 001
  Scenario Outline: Data layer guided nested property merge 001
    Given the Product detail working draft does not contain /products
    When Add validation saves a Must be present rule for <first_path> with detected type <first_type>
    And the operator repeats the flow for <second_path> whose detected type is <second_type>
    Then the working draft contains <first_path> with type <first_type>
    And sibling <second_path> retains type <second_type>
    And both properties are siblings beneath shared array ancestor <array_ancestor>
    And each property retains one attached rule at its own canonical path

    Examples:
      | array_ancestor       | first_path                               | first_type | second_path                              | second_type |
      | /products/*          | /products/*/product_name                 | String     | /products/*/product_id                   | Number      |
      | /products/*          | /products/*/product_id                   | Number     | /products/*/product_name                 | String      |
      | /orders/*/products/* | /orders/*/products/*/product_name        | String     | /orders/*/products/*/product_id          | Number      |

  # Data layer guided nested property merge 002
  Scenario: Data layer guided nested property merge 002
    Given /products/*/product_name has a string definition, required relationship, documentation, and pattern rule
    And /products has array constraints and its item object has declared-property constraints
    When Add validation saves /products/*/product_id as a required Number
    Then product_id is added alongside product_name in the existing item object
    And all previously stored definition, relationship, documentation, and rule details are unchanged
    And the existing array and item-object constraints are unchanged
    And no unrelated sibling or attached rule is removed or duplicated

  # Data layer guided nested property merge 003
  Scenario: Data layer guided nested property merge 003
    Given the working draft contains rules for /products/*/product_name and /products/*/product_id
    When the working draft is persisted, reopened, and used to validate the captured event
    Then both sibling property definitions and both attached rules are restored
    And product_name and product_id are validated independently for every products item
    And each failure identifies its own canonical template path and concrete item path
