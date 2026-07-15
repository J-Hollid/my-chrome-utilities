Feature: Data layer recursive declared property validation

  Background:
    Given Generic pageview revision 4 declares page_type
    And it declares commerce with currency and order with id
    And it declares products as object items with product_id, product_name, and attributes with color
    And Only declared properties are allowed is enabled

  # Data layer recursive declared property validation 001
  Scenario: Data layer recursive declared property validation 001
    When an otherwise valid payload contains every declared nested property across two products
    Then no root, nested object, or array item property produces an Undeclared property issue
    And validation resolves every property to its canonical schema path
    And the stored schema revision remains unchanged

  # Data layer recursive declared property validation 002
  Scenario Outline: Data layer recursive declared property validation 002
    When an otherwise valid payload adds <value> at nested path <concrete_path>
    Then exactly one Undeclared property issue identifies <concrete_path>
    And that issue has expected declared property and actual <actual_type>
    And its schema location identifies <object_boundary>

    Examples:
      | concrete_path                 | value        | actual_type | object_boundary                                  |
      | /commerce/debug               | true         | boolean     | #/properties/commerce/additionalProperties       |
      | /commerce/order/internal_id   | "internal"   | string      | #/properties/commerce/properties/order/additionalProperties |
      | /products/0/debug             | true         | boolean     | #/properties/products/items/additionalProperties |
      | /products/1/attributes/source | "feed"       | string      | #/properties/products/items/properties/attributes/additionalProperties |

  # Data layer recursive declared property validation 003
  Scenario: Data layer recursive declared property validation 003
    Given two product items contain undeclared debug
    When the payload is validated
    Then one Undeclared property issue identifies /products/0/debug
    And one Undeclared property issue identifies /products/1/debug
    And neither item issue uses the wildcard path /products/*/debug
    And declared siblings in both items produce no Undeclared property issue

  # Data layer recursive declared property validation 004
  Scenario: Data layer recursive declared property validation 004
    Given an otherwise valid payload adds object {"internal_id":"1","source":"feed"} at /commerce/debug
    When the payload is validated
    Then exactly one Undeclared property issue identifies /commerce/debug with actual object
    And no Undeclared property issue is produced for a descendant of /commerce/debug

  # Data layer recursive declared property validation 005
  Scenario: Data layer recursive declared property validation 005
    Given the declared object /commerce/order has string value "invalid"
    And tags is declared as an array of strings
    When the payload is validated
    Then exactly one Type mismatch issue identifies /commerce/order with expected object
    And no Undeclared property issue is produced beneath /commerce/order
    And arrays whose declared items are scalar values do not acquire object-property validation

  # Data layer recursive declared property validation 006
  Scenario Outline: Data layer recursive declared property validation 006
    Given the same nested declaration is stored as <schema_representation>
    When payload property <concrete_path> is checked for undeclared properties
    Then it is recognized as declared at canonical path <canonical_path>
    And validation does not change the stored representation

    Examples:
      | schema_representation                      | concrete_path                 | canonical_path                  |
      | nested commerce order id                   | /commerce/order/id            | /commerce/order/id              |
      | path-keyed /commerce/order/id              | /commerce/order/id            | /commerce/order/id              |
      | nested products item product_name          | /products/0/product_name      | /products/*/product_name        |
      | path-keyed /products/*/attributes/color    | /products/2/attributes/color  | /products/*/attributes/color    |

  # Data layer recursive declared property validation 007
  Scenario: Data layer recursive declared property validation 007
    When the operator disables Only declared properties are allowed
    And an otherwise valid payload contains undeclared properties at root, nested object, and array item boundaries
    Then none of those properties produces an Undeclared property issue
    And type, required, allowed-value, and attached-rule validation remain active at every depth
    And re-enabling the policy restores declared-property validation at every object boundary

  # Data layer recursive declared property validation 008
  Scenario: Data layer recursive declared property validation 008
    Given current Live events were validated before the recursive policy was published
    When Generic pageview revision 5 publishes Only declared properties are allowed
    Then every current Live event is revalidated at every declared object boundary
    And each nested undeclared property is reported once at its concrete payload path
    And saved-session validation evidence remains associated with its original schema revision
