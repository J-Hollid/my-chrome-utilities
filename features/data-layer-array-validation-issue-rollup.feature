Feature: Data layer array validation issue rollup

  Background:
    Given a captured event contains array /products with 10 product objects
    And schema rule Allowed product type targets /products/*/type

  # Data layer array validation issue rollup 001
  Scenario: Data layer array validation issue rollup 001
    When the property hierarchy is displayed
    Then /products/* is represented by Every item
    And Every item identifies the number of active wildcard-scoped rules beneath it
    And /products/*/type identifies Allowed product type as applying to every matching item
    And wildcard rule details summarize matching-item pass, warning, error, and not-applicable counts
    And the operator does not have to inspect each concrete index to discover wildcard rule results

  # Data layer array validation issue rollup 002
  Scenario: Data layer array validation issue rollup 002
    Given product at zero-based index 7 has disallowed type service
    And the other 9 products have allowed types
    When schema validation results are displayed
    Then /products and /products/* each show 1 error in 1 of 10 items
    And /products/*/type shows 9 passed and 1 error for Allowed product type
    And Affected items contains Item 8 with zero-based index 7
    And Item 8 identifies concrete failing path /products/7/type and actual value service
    And the other 9 product items do not inherit error treatment

  # Data layer array validation issue rollup 003
  Scenario Outline: Data layer array validation issue rollup 003
    Given product validation has <issue_distribution>
    When array issue aggregation runs
    Then /products reports <error_count> errors and <warning_count> warnings across <affected_item_count> of 10 items
    And event validation totals remain <error_count> errors and <warning_count> warnings

    Examples:
      | issue_distribution                                      | error_count | warning_count | affected_item_count |
      | type errors in items 3 and 8                            | 2           | 0             | 2                   |
      | id and type errors in item 8                            | 2           | 0             | 1                   |
      | type error in item 8 and name warning in item 4         | 1           | 1             | 2                   |
      | type error and name warning both in item 8              | 1           | 1             | 1                   |

  # Data layer array validation issue rollup 004
  Scenario Outline: Data layer array validation issue rollup 004
    Given /products is collapsed with an issue at /products/7/type
    When the operator activates <issue_entry_point>
    Then products, Every item, type, and Affected items expand to reveal Item 8
    And keyboard focus moves to the issue at /products/7/type
    And the issue preview identifies Allowed product type, expected values, and actual service

    Examples:
      | issue_entry_point                         |
      | the /products aggregate status            |
      | the /products/* aggregate status          |
      | the Event-level issue link                |

  # Data layer array validation issue rollup 005
  Scenario: Data layer array validation issue rollup 005
    Given /products has one failing Item count rule
    And /products/7/type fails Allowed product type
    When the /products row is displayed
    Then its direct status identifies the failing Item count rule
    And its descendant aggregate identifies 1 error in 1 of 10 items
    And the event has exactly 2 validation errors
    And roll-up badges do not duplicate either underlying error

  # Data layer array validation issue rollup 006
  Scenario: Data layer array validation issue rollup 006
    Given nested rule /orders/*/items/*/sku fails at /orders/1/items/4/sku
    When the property hierarchy is displayed
    Then the issue aggregates through /orders/1/items, /orders/*/items/*, and /orders
    And Affected items identifies Order Item 2 and nested Item 5 with their zero-based indexes
    And the leaf issue retains concrete path /orders/1/items/4/sku
    And sibling orders and items do not inherit error treatment

  # Data layer array validation issue rollup 007
  Scenario: Data layer array validation issue rollup 007
    Given the operator has expanded the affected product at zero-based index 7
    When revalidation changes /products/7/type from service to an allowed value
    Then the products, Every item, wildcard type, and affected-item error roll-ups are removed
    And Allowed product type reports 10 passed
    And the prior expansion state and keyboard focus remain stable

  # Data layer array validation issue rollup 008
  Scenario: Data layer array validation issue rollup 008
    Given wildcard rules target primitive array items at /tags/*
    And tags at zero-based indexes 2 and 5 fail validation
    When schema validation results are displayed
    Then /tags and /tags/* report 2 errors across 2 affected items
    And Affected items identifies Items 3 and 6 with concrete paths /tags/2 and /tags/5
    And object properties are not required for array issue roll-up
