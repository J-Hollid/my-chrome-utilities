# mutation-stamp: sha256=5ec21b1b6fbedc90485f93ab9c5b8c4421f5324e6535917d37d5f5772eb66dcb
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T07:26:49.995673680Z","feature_name":"Data layer schema nested path validation","feature_path":"features/data-layer-schema-nested-path-validation.feature","background_hash":"d1e6afba9c030c3e3df12db187bc7fa37ab5a2893ac879bdf2354d3097afde69","implementation_hash":"sha256:ca3d5aa0ad02182e4ac5a477e658e9319009b2789895df19caea71a90fd2fe4b","scenarios":[{"index":0,"name":"Data layer schema nested path validation 001","scenario_hash":"86929796afda93d31b88710c6f5fc276a3c715ad57965d1ed03d409ca67e8186","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T07:26:49.995673680Z"},{"index":1,"name":"Data layer schema nested path validation 002","scenario_hash":"003fc862286cecd23a13b5166060689f77fb9a313a644b576ed00e8ccaf009a5","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T07:26:49.995673680Z"},{"index":4,"name":"Data layer schema nested path validation 005","scenario_hash":"c1b11cb07ec9a6c29debe5f54fdd4ee41b8741a3ef6be3159d597fe9e76db484","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T07:26:49.995673680Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema nested path validation

  Background:
    Given validation payload contains fruits apple, banana, pear
    And it contains products with id 1 and name product 1, and id 2 and name product 2
    And it contains order id 12345678

  # Data layer schema nested path validation 001
  Scenario Outline: Data layer schema nested path validation 001
    Given rule target intent is <target_intent>
    When the target path is normalized
    Then canonical path is <canonical_path>

    Examples:
      | target_intent                       | canonical_path    |
      | nested order id                     | /order/id         |
      | fruits item at zero-based index 1   | /fruits/1         |
      | id in every products item           | /products/*/id    |

  # Data layer schema nested path validation 002
  Scenario Outline: Data layer schema nested path validation 002
    Given rule /fruits/1 requires exact value banana
    When fruits value is <fruits_value>
    Then validation result is <validation_result>
    And issue path is <issue_path>

    Examples:
      | fruits_value             | validation_result | issue_path |
      | apple, banana, pear      | valid             | none       |
      | apple, orange, pear      | issue             | /fruits/1  |
      | apple                    | issue             | /fruits/1  |

  # Data layer schema nested path validation 003
  Scenario: Data layer schema nested path validation 003
    Given rule /products/*/id requires a number
    And rule /products/*/name requires a non-empty string
    And the second product has no id and an empty name
    When schema validation runs
    Then every existing products item is evaluated against the same item-property rules
    And issues identify /products/1/id and /products/1/name
    And no separate rule is generated for each observed index

  # Data layer schema nested path validation 004
  Scenario: Data layer schema nested path validation 004
    Given products is an empty array
    And rules target /products/*/id and /products/*/name
    When schema validation runs
    Then no item-property issue is produced
    And a minimum item-count rule remains available to require a non-empty array

  # Data layer schema nested path validation 005
  Scenario Outline: Data layer schema nested path validation 005
    Given /order/id requires text length exactly 8 and digits only
    When order id is <order_id>
    Then validation result is <validation_result>
    And failed constraint is <failed_constraint>

    Examples:
      | order_id | validation_result | failed_constraint |
      | 12345678 | valid             | none              |
      | 1234567  | issue             | text length 8     |
      | 1234567a | issue             | digits only       |

  # Data layer schema nested path validation 006
  Scenario: Data layer schema nested path validation 006
    Given every fruits item must be a string
    And rule /fruits/1 requires exact value banana
    When schema validation runs
    Then the every-item rule applies to fruits indexes 0, 1, and 2
    And the exact-index rule additionally applies to fruits index 1
    And both constraints must pass at index 1

  # Data layer schema nested path validation 007
  Scenario: Data layer schema nested path validation 007
    Given rule template path /products/*/id fails for the second product
    When validation issues are displayed
    Then the rule identifies template path /products/*/id
    And the issue identifies concrete path /products/1/id
    And the expected constraint and actual value remain available

  # Data layer schema nested path validation 008
  Scenario: Data layer schema nested path validation 008
    Given orders contains repeating items arrays
    And rule /orders/*/items/*/sku requires a non-empty string
    When a sku is empty in the second item of the first order
    Then the issue identifies concrete path /orders/0/items/1/sku
    And validation continues for every other matching sku
