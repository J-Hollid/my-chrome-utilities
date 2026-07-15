# mutation-stamp: sha256=4fd6a5deda417e41de0a3b50566b36ae4b586c51bd5e2539368247cc94020df0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T18:51:59.561820884Z","feature_name":"Data layer Live schema property declaration","feature_path":"features/data-layer-live-schema-property-declaration.feature","background_hash":"74fbfd7476695059f9314c94450e22a1d227cb6b1e40046095e5334cd8a2c804","implementation_hash":"unknown","scenarios":[{"index":1,"name":"Data layer Live schema property declaration 002","scenario_hash":"97bc714391278788ce966fc6673be5e1769f0fee2f3306c2436fb1f2a35fd07e","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T18:51:59.561820884Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Live schema property declaration

  Background:
    Given captured product_view is selected in the Live event inspector
    And its payload contains page_type product_detail, commerce currency EUR, and products with product_name and product_id
    And Product detail revision 3 has a working draft selected as the continuation context

  # Data layer Live schema property declaration 001
  Scenario: Data layer Live schema property declaration 001
    When Live property rows are displayed
    Then each observed undeclared property offers Add to schema separately from Add validation
    And each Add to schema action identifies its property path and Product detail destination
    And a locally or inherited declared property is identified as already declared instead of offering a duplicate addition

  # Data layer Live schema property declaration 002
  Scenario Outline: Data layer Live schema property declaration 002
    When the operator activates Add to schema for <concrete_path>
    Then a declaration review identifies canonical path <canonical_path>, detected type <detected_type>, and Product detail revision 3
    And the review states that no validation rule will be added
    And requirement, scope, assignment, severity, message, and Rule Library stages are absent
    And no schema change is persisted before confirmation

    Examples:
      | concrete_path                 | canonical_path                  | detected_type |
      | /page_type                    | /page_type                      | String        |
      | /commerce/currency            | /commerce/currency              | String        |
      | /products/0/product_name      | /products/*/product_name        | String        |
      | /products/0/product_id        | /products/*/product_id          | Number        |

  # Data layer Live schema property declaration 003
  Scenario: Data layer Live schema property declaration 003
    Given declaration review confirms /products/*/product_name as String
    When the operator adds the property to the Product detail draft
    Then the working draft declares /products/*/product_name with its necessary array and object ancestors
    And the property has 0 attached local or reusable rules
    And no required, allowed-value, exact-value, range, pattern, or conditional constraint is added
    And existing assignments and rules remain unchanged
    And Product detail revision 3 remains current until the working draft is published

  # Data layer Live schema property declaration 004
  Scenario: Data layer Live schema property declaration 004
    Given the Product detail draft already declares /products/*/product_name
    When the operator adds observed /products/0/product_id as a Number declaration
    Then /products/*/product_id is added alongside /products/*/product_name
    And their shared products array and item object are retained once
    And every existing sibling, constraint, rule, documentation entry, and example remains unchanged
    And no rule is attached to /products/*/product_id

  # Data layer Live schema property declaration 005
  Scenario: Data layer Live schema property declaration 005
    Given no working-draft continuation context is selected
    When the operator activates Add to schema for /page_type
    Then schema destination selection lists compatible existing schemas
    And no destination is selected without operator input
    And choosing Product detail opens declaration review without opening validation-rule stages
    And cancelling destination selection leaves every schema unchanged

  # Data layer Live schema property declaration 006
  Scenario: Data layer Live schema property declaration 006
    Given Only declared properties are allowed is enabled for Product detail
    And /products/*/product_name was added from Live without a validation rule
    When the working draft validates events with product_name present and absent
    Then present product_name values do not produce Undeclared property issues
    And absent product_name values do not produce Required value issues
    And no attached-rule evaluation is produced for product_name
    And publishing and reloading preserve the declaration-only property
