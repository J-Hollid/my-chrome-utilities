Feature: Data layer recursive declared property validation runtime

  Background:
    Given the built extension side panel is running with production schema editing, validation, persistence, and Live event presentation
    And a persisted Generic pageview working draft declares /commerce/order/id and /products/*/product_name
    And Only declared properties are allowed is checked in the production schema editor

  # Data layer recursive declared property validation runtime 001
  Scenario: Data layer recursive declared property validation runtime 001
    When production validation receives {"commerce":{"order":{"id":"1"}},"products":[{"product_name":"phone"},{"product_name":"case"}]}
    Then the production result contains no Undeclared property issue
    And the nested object and both product items resolve to their canonical declarations
    And reopening the editor keeps Only declared properties are allowed checked

  # Data layer recursive declared property validation runtime 002
  Scenario Outline: Data layer recursive declared property validation runtime 002
    When production validation adds <value> at <concrete_path>
    Then its issues contain exactly one Undeclared property issue at <concrete_path>
    And that issue displays expected declared property and actual <actual_type>
    And its schema location identifies the containing declared object

    Examples:
      | concrete_path               | value      | actual_type |
      | /commerce/debug             | true       | boolean     |
      | /commerce/order/internal_id | "internal" | string      |
      | /products/0/debug           | true       | boolean     |

  # Data layer recursive declared property validation runtime 003
  Scenario: Data layer recursive declared property validation runtime 003
    Given production payload products 0 and 1 each contain undeclared debug
    And product 1 also contains undeclared object metadata with two children
    When production validation completes
    Then the issues identify /products/0/debug and /products/1/debug once each
    And exactly one Undeclared property issue identifies /products/1/metadata with actual object
    And no issue uses a wildcard or a descendant of /products/1/metadata as its instance path

  # Data layer recursive declared property validation runtime 004
  Scenario Outline: Data layer recursive declared property validation runtime 004
    Given the production schema stores product_name as <schema_representation>
    When production validation receives product_name at <concrete_path>
    Then the production validator recognizes canonical declaration /products/*/product_name
    And no Undeclared property issue is produced for product_name
    And the persisted schema document remains byte-for-byte unchanged

    Examples:
      | schema_representation                    | concrete_path            |
      | nested products object-item properties  | /products/0/product_name |
      | path-keyed /products/*/product_name      | /products/2/product_name |

  # Data layer recursive declared property validation runtime 005
  Scenario: Data layer recursive declared property validation runtime 005
    When the operator unchecks Only declared properties are allowed and production validation reruns
    Then extra properties at root, nested object, and product item boundaries produce no Undeclared property issue
    And other configured validation remains active
    When the operator checks the policy again and production validation reruns
    Then the same extra properties produce one Undeclared property issue each
    And persisted property definitions have not been added, removed, renamed, or migrated

  # Data layer recursive declared property validation runtime 006
  Scenario: Data layer recursive declared property validation runtime 006
    Given the current production Live feed contains declared-only and nested-extra-property events
    When the operator publishes the checked policy through production controls
    Then publication-triggered validation refreshes every current Live event recursively
    And event rows and details show each nested issue at its concrete path
    And queries and defect matching use the refreshed nested issues
    And saved-session results retain their original schema revision and validation evidence
