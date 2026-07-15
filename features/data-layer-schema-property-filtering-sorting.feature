Feature: Data layer schema property filtering and sorting

  Background:
    Given schema Page view working draft is open in the schema editor
    And its property tree contains page_type, commerce.order.id, and products
    And products is an object-item array containing product_name, product_id, and price_monthly
    And the unfiltered property tree contains 9 canonical property rows

  # Data layer schema property filtering and sorting 001
  Scenario: Data layer schema property filtering and sorting 001
    When Property rules are displayed
    Then Filter properties and Sort properties controls appear above the property tree
    And Filter properties is initially empty
    And Sort properties initially selects Schema order
    And the result status identifies 9 of 9 properties
    And Add property remains available independently of both controls

  # Data layer schema property filtering and sorting 002
  Scenario Outline: Data layer schema property filtering and sorting 002
    When Filter properties contains <query>
    Then directly matching property rows are <matching_rows>
    And visible ancestor context rows are <context_rows>
    And ancestor-only rows are identified as Filter context
    And nonmatching siblings and descendants are hidden
    And result status is <result_status>

    Examples:
      | query             | matching_rows                                                        | context_rows                 | result_status                   |
      | product_id        | /products/*/product_id                                                | /products, /products/*       | 1 of 9 properties, 2 context    |
      | products          | /products, /products/*, /products/*/product_name, /products/*/product_id, /products/*/price_monthly | none | 5 of 9 properties, 0 context |
      | /commerce/order   | /commerce/order, /commerce/order/id                                   | /commerce                    | 2 of 9 properties, 1 context    |
      | PRODUCT_NAME      | /products/*/product_name                                              | /products, /products/*       | 1 of 9 properties, 2 context    |

  # Data layer schema property filtering and sorting 003
  Scenario: Data layer schema property filtering and sorting 003
    Given Filter properties contains missing_property
    When no canonical or displayed path contains the query case-insensitively
    Then no property row is displayed
    And result status is 0 of 9 properties
    And No properties match missing_property is displayed with Clear filter
    When the operator activates Clear filter
    Then all 9 property rows are restored in the selected sort order
    And keyboard focus returns to Filter properties

  # Data layer schema property filtering and sorting 004
  Scenario Outline: Data layer schema property filtering and sorting 004
    When Sort properties selects <sort_order>
    Then root property order is <root_order>
    And products item-property order is <item_property_order>
    And /products/* remains immediately beneath /products before its named item properties
    And every ancestor remains before its descendants

    Examples:
      | sort_order   | root_order                    | item_property_order                         |
      | Schema order | page_type, commerce, products | product_name, product_id, price_monthly     |
      | Name A-Z     | commerce, page_type, products | price_monthly, product_id, product_name     |
      | Name Z-A     | products, page_type, commerce | product_name, product_id, price_monthly     |

  # Data layer schema property filtering and sorting 005
  Scenario: Data layer schema property filtering and sorting 005
    Given Filter properties contains product_ and Sort properties selects Name A-Z
    When the filtered property tree is displayed
    Then /products and /products/* provide ancestor context
    And both ancestor rows are identified as Filter context
    And matching children are ordered /products/*/product_id then /products/*/product_name
    And each visible row retains its canonical identity, type, origin, documentation, rule count, and property actions
    When Add rule for /products/*/product_id refreshes the property tree
    Then query product_, sort Name A-Z, ancestor context, selection, and keyboard return target are preserved

  # Data layer schema property filtering and sorting 006
  Scenario: Data layer schema property filtering and sorting 006
    Given the working draft, pending changes, selected property, and expanded rule sections are recorded
    When the operator changes Filter properties and Sort properties
    Then the schema document, rules, documentation, and pending changes remain byte-equivalent
    And no working-draft change is created by filtering or sorting
    When Filter properties is cleared and Schema order is restored
    Then the recorded selected property and expanded rule sections are restored
