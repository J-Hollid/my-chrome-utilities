# mutation-stamp: sha256=7a934612c408f2b1983493e0216fd86dc9d4ab09baa59bfe465bd6c16ed4f38a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T07:26:56.915603244Z","feature_name":"Data layer schema nested path authoring","feature_path":"features/data-layer-schema-nested-path-authoring.feature","background_hash":"9d557f20ffa14dd62c853bb0e2748cc3047b18d44b3a78c7029c0373b8f74a62","implementation_hash":"sha256:b1a476a3fac4ae62b1f19e3469902dc9a3fd2f9fbf84aab41e737122c702f3ef","scenarios":[{"index":2,"name":"Data layer schema nested path authoring 003","scenario_hash":"4a9eced4d4ddff662e0aac541ac3e3af184e49c78ab6547f68f57d2cd76fc4e8","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T07:26:56.915603244Z"},{"index":5,"name":"Data layer schema nested path authoring 006","scenario_hash":"13f80139edd6ee92aa93ee27479ae0cee4b0c0d77f03fb137eb0d853318ab3c8","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-14T07:26:56.915603244Z"},{"index":6,"name":"Data layer schema nested path authoring 007","scenario_hash":"1121e23cc98601c3528e9934f1dabdb4ba74fda5a675a716efb20e4b52e7b475","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T07:26:56.915603244Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema nested path authoring

  Background:
    Given captured event product_view contains fruits apple, banana, pear
    And it contains 2 products with id and name properties
    And Product detail working draft is selected for Add validation

  # Data layer schema nested path authoring 001
  Scenario: Data layer schema nested path authoring 001
    When the operator activates Add validation on nested event property order.id
    Then rule target /order/id is displayed
    And no array-target choice is requested
    And observed value and type prefill the rule builder

  # Data layer schema nested path authoring 002
  Scenario: Data layer schema nested path authoring 002
    When products is expanded in the event property tree
    Then Every item exposes id with target /products/*/id and 2 matched values
    And Specific items Item 2 exposes id with target /products/1/id and zero-based index 1
    And each target has its own Add validation action

  # Data layer schema nested path authoring 003
  Scenario Outline: Data layer schema nested path authoring 003
    Given products is expanded to tree location <target_choice>
    When the operator activates Add validation for id
    Then rule target is <rule_target>
    And matched value count is <matched_value_count>

    Examples:
      | target_choice                 | rule_target     | matched_value_count |
      | This item only                | /products/1/id  | 1                   |
      | This property in every item   | /products/*/id  | 2                   |

  # Data layer schema nested path authoring 004
  Scenario: Data layer schema nested path authoring 004
    Given Add validation defines a rule for /products/*/id
    And products item schema or id property is absent from Product detail
    When validation review is displayed
    Then it identifies Product detail, template path /products/*/id, concrete path /products/1/id, and 2 matched values
    And it identifies each missing array, item, object, or property model node that will be created
    When the operator adds the validation to the working draft
    Then the missing model nodes and rule are persisted as 1 pending working-draft change
    And the current Product detail revision remains unchanged

  # Data layer schema nested path authoring 005
  Scenario: Data layer schema nested path authoring 005
    Given Product detail advanced schema editor is displayed
    When products is expanded in the property tree
    Then Array itself and Every item are available
    And Every item exposes the product item-property template
    And Add specific index rule requests a non-negative zero-based index
    And an exact-index rule and every-item rules remain distinguishable

  # Data layer schema nested path authoring 006
  Scenario Outline: Data layer schema nested path authoring 006
    Given the advanced target editor receives slash-path shorthand <entered_path>
    When path validation runs
    Then path result is <path_result>
    And assistance is <assistance>

    Examples:
      | entered_path             | path_result | assistance                                  |
      | /order/id                | accepted    | Targets nested property order id            |
      | /products/*/id           | accepted    | Targets id in every products item           |
      | /fruits/1                | accepted    | Targets item 2 at zero-based index 1        |
      | /order/*                 | blocked     | order is not an array                       |
      | /fruits/name             | blocked     | fruits items cannot contain property name   |
      | /fruits/-1               | blocked     | Enter a non-negative array index             |

  # Data layer schema nested path authoring 007
  Scenario Outline: Data layer schema nested path authoring 007
    Given manual rule target <rule_target> resolves to type <target_type>
    When the property rule picker opens
    Then <compatible_rule> is available
    And rules incompatible with <target_type> are absent

    Examples:
      | rule_target       | target_type | compatible_rule       |
      | /order/id         | string      | Text length            |
      | /products/*/id    | number      | Numeric range          |
      | /fruits/1         | string      | Exact value            |

  # Data layer schema nested path authoring 008
  Scenario: Data layer schema nested path authoring 008
    Given a nested or array rule has been added from the advanced editor
    When validation examples are previewed
    Then every matching concrete value and issue is displayed
    And the template rule path remains visible
    And accepting the rule changes only the Product detail working draft
