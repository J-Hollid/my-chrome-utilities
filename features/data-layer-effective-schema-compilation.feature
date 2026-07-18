Feature: Data layer effective schema compilation

  Background:
    Given requirement profiles are ordered explicitly for a validation context

  # Data layer effective schema compilation 001
  Scenario: Data layer effective schema compilation 001
    Given Sitewide, Commerce, Purchase, and Retail confirmation profiles are ordered
    When the effective Retail contract is compiled
    Then transaction_id, value, and currency are Required
    And every structural parent and configured rule, description, example, and allowed value is present

  # Data layer effective schema compilation 002
  Scenario: Data layer effective schema compilation 002
    Given Sitewide, Commerce, Purchase, Trade account, and Purchase order profiles are ordered
    When the effective Trade contract is compiled
    Then transaction_id, value, currency, account_id, and purchase_order_number are Required
    And the compiled schema has a stable revision identity

  # Data layer effective schema compilation 003
  Scenario: Data layer effective schema compilation 003
    Given several profiles contribute to /ecommerce/value
    When the operator inspects the effective requirement
    Then every contributing profile, precedence position, release introduction, and override or disable decision is visible
    And Effective, Local only, and Provenance views agree on the winning value

  # Data layer effective schema compilation 004
  Scenario Outline: Data layer effective schema compilation 004
    Given two ordered profiles introduce a <conflict>
    When compilation runs
    Then the effective schema is blocked at the conflicting requirement
    And both origins and the incompatible values are visible
    Examples:
      | conflict |
      | string and number types |
      | Required and Forbidden states |
      | disjoint allowed-value sets |
      | incompatible validation rules |

  # Data layer effective schema compilation 005
  Scenario: Data layer effective schema compilation 005
    Given a compatible later profile narrows allowed values and adds documentation
    When compilation runs
    Then allowed values are intersected and documentation is retained deterministically
    And no silent last-write-wins result is reported

  # Data layer effective schema compilation 006
  Scenario: Data layer effective schema compilation 006
    Given changing profile order would alter 3 effective requirements
    When the operator stages the reorder
    Then a before-and-after impact preview names the 3 requirements and every consumer
    And cancelling leaves the order and compiled revision unchanged

  # Data layer effective schema compilation 007
  Scenario: Data layer effective schema compilation 007
    Given a supported legacy parent-schema chain has published revisions
    When migration converts it to ordered profiles
    Then effective validation remains behavior-equivalent
    And historical revisions remain immutable with parent-to-profile provenance
    And cycles or missing parents block migration without replacing source data
