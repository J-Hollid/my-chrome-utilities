# Data layer Live add all schema 001 through 007
Feature: Data layer Live add all schema

  Background:
    Given one captured event is selected in the Live inspector
    And Add all to schema uses a fixed snapshot of that event payload

  # Data layer Live add all schema 001
  Scenario Outline: Data layer Live add all schema 001
    When the operator chooses <destination> in Add all to schema
    Then the review shows all observed property paths and their proposed additions
    And the review identifies the destination and properties that will be preserved or blocked
    And no schema is persisted before confirmation

    Examples:
      | destination           |
      | a named new schema    |
      | an existing schema    |

  # Data layer Live add all schema 002
  Scenario Outline: Data layer Live add all schema 002
    Given the selected event contains missing property <path> with JSON value <value>
    When the operator confirms Add all to schema
    Then the destination draft declares <path> with type <type>
    And its property documentation stores typed example <value>
    And no validation constraint is inferred from the observed value

    Examples:
      | path           | value   | type    |
      | /product/name  | "Phone" | string  |
      | /product/price | 12.5    | number  |
      | /consent       | false   | boolean |
      | /count         | 0       | number  |
      | /empty         | ""      | string  |

  # Data layer Live add all schema 003
  Scenario Outline: Data layer Live add all schema 003
    Given <ownership> property /customer/id already has a type, example, documentation, and rules
    And the selected event contains a different value for /customer/id and new property /product/id
    When the operator confirms Add all to schema
    Then /customer/id retains all existing data without a duplicate or override
    And /product/id is added as a separate property with its observed type and example

    Examples:
      | ownership |
      | local     |
      | inherited |

  # Data layer Live add all schema 004
  Scenario: Data layer Live add all schema 004
    Given the selected event contains products item 0 with name Phone
    And products item 1 contains name Tablet and price 25
    And the destination already declares products as an array of objects
    When the operator confirms Add all to schema
    Then /products/*/name is declared once with string example Phone
    And /products/*/price is declared once with number example 25
    And the existing array and item object retain their metadata and constraints
    And no concrete array index becomes a separate property declaration

  # Data layer Live add all schema 005
  Scenario Outline: Data layer Live add all schema 005
    Given the selected event contains new property <path> with observation <observation>
    When the operator reviews Add all to schema
    Then the review proposes <inference>
    And the review does not fabricate missing values or validation rules

    Examples:
      | path          | observation                         | inference                                           |
      | /optional     | null                                | an unspecified type with a typed null example        |
      | /products     | an empty array                      | an array without an inferred item type               |
      | /details      | an empty object                     | an object without invented children                  |
      | /products/*/id| number 7 followed by string seven   | an unspecified type with first observed example 7    |

  # Data layer Live add all schema 006
  Scenario: Data layer Live add all schema 006
    Given the destination declares /customer as a string
    And the selected event contains object child /customer/id and new scalar /event_name
    When the operator reviews Add all to schema
    Then /customer/id is identified as blocked by the existing parent type
    And confirmation adds /event_name while preserving /customer unchanged
    And the result identifies the blocked path without claiming that it was added

  # Data layer Live add all schema 007
  Scenario: Data layer Live add all schema 007
    Given the operator confirmed one Add all to schema operation
    When the operator repeats it with the same payload and destination
    Then no property is duplicated and no existing example or constraint changes
    And an operation with no additions makes no durable write
    And a successful addition changes only the draft and does not publish a revision
