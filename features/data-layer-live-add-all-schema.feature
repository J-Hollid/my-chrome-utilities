# mutation-stamp: sha256=cba09435331bbb9bdcbd45c8c3b85a5054a2161e7b46972de128153910df7455
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-12T21:31:38.071894391Z","feature_name":"Data layer Live add all schema","feature_path":"features/data-layer-live-add-all-schema.feature","background_hash":"fbac38c67cbe7785bc95f3c8ef74498895d2927f5b43971330a770dac5b7e018","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Data layer Live add all schema 001","scenario_hash":"d88d02b24b95cac905ec3604c498d3b64dce17bd694fb25e9f1518c1a5dcf924","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-09-12T21:31:38.071894391Z"},{"index":1,"name":"Data layer Live add all schema 002","scenario_hash":"632c64b48b0a271a7210d9b9718e1a28421809bbfb9b1dd1c082413a6133496a","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-09-12T21:31:38.071894391Z"},{"index":2,"name":"Data layer Live add all schema 003","scenario_hash":"126ddba4d4a25e800cf640e853789a4adb39c2f1f3cfdfb85abc2b9765583d1b","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-09-12T21:31:38.071894391Z"},{"index":4,"name":"Data layer Live add all schema 005","scenario_hash":"90646ec05a35000b5b99f1404bd0a30c09ea88fbdb1b1723e0b57ae0f4269a2b","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-09-12T21:31:38.071894391Z"}]}
# acceptance-mutation-manifest-end

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
