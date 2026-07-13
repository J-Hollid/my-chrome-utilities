Feature: Data layer schema rule authoring

  Background:
    Given schema Page view is being edited from a nested payload example

  # Data layer schema rule authoring 001
  Scenario: Data layer schema rule authoring 001
    When the property tree is displayed
    Then object and array properties can be expanded and collapsed
    And each property row shows human name, complete path, observed type, example value, and active-rule count
    And nested path /commerce/order/id remains associated with its containing objects
    And property values are not editable as schema rules

  # Data layer schema rule authoring 002
  Scenario: Data layer schema rule authoring 002
    Given property page_type has observed type string
    When the operator activates Add rule for page_type
    Then a keyboard-accessible searchable rule picker opens for page_type
    And string-compatible built-in rules and reusable string rules are available
    And rules that require incompatible value types are absent from results
    And closing the picker returns focus to Add rule for page_type

  # Data layer schema rule authoring 003
  Scenario Outline: Data layer schema rule authoring 003
    Given property <property_path> has type <property_type>
    When the operator configures rule <rule_kind> with parameters <parameters>
    Then 1 rule with a stable identity is attached to <property_path>
    And value <accepted_value> satisfies the rule
    And value <rejected_value> produces the configured validation issue

    Examples:
      | property_path       | property_type | rule_kind            | parameters                                  | accepted_value | rejected_value |
      | /page_type          | string        | allowed values       | page, product, checkout                     | product        | internal       |
      | /page_name          | string        | forbidden substrings | test, debug; case insensitive               | Checkout       | Debug checkout |
      | /transaction_id     | string        | regular expression   | ^[A-Z]+-[0-9]+$                              | ORDER-42       | order42        |
      | /revenue            | number        | numeric range        | minimum 0, maximum 100000                    | 49.95          | -1             |
      | /items              | array         | item count           | minimum 1                                   | 2 items        | empty array    |

  # Data layer schema rule authoring 004
  Scenario: Data layer schema rule authoring 004
    Given page_name has Required and Forbidden substrings rules
    When the operator activates View attached rules for page_name
    Then a keyboard-accessible menu identifies each rule, origin, parameters, severity, and enabled state
    And local rules can be edited, disabled, re-enabled, or removed
    And choosing a rule moves focus to its editor without losing the property-tree position

  # Data layer schema rule authoring 005
  Scenario: Data layer schema rule authoring 005
    Given the payload root contains declared properties page_type, page_name, and commerce
    When the operator enables general rule Only declared properties are allowed
    Then undeclared root property debug produces an issue
    And declared nested properties remain governed by their own object rules
    And the general rule can be disabled without deleting property rules

  # Data layer schema rule authoring 006
  Scenario: Data layer schema rule authoring 006
    Given items is an array of objects containing product_id and price
    When rules are attached to /items/*/product_id and /items/*/price
    Then every array item is validated at the corresponding nested path
    And an issue identifies the concrete item index and complete property path
    And sibling properties and surrounding array structure are not flattened

  # Data layer schema rule authoring 007
  Scenario Outline: Data layer schema rule authoring 007
    Given a rule draft has invalid configuration <invalid_configuration>
    When rule validation runs
    Then the rule cannot be attached or saved
    And a local error states <recovery_message>

    Examples:
      | invalid_configuration       | recovery_message                    |
      | empty allowed-values list   | Add at least one allowed value       |
      | malformed regular expression | Correct the regular expression      |
      | minimum greater than maximum | Make minimum less than maximum      |
      | string rule on number value | Choose a rule compatible with number |

  # Data layer schema rule authoring 008
  Scenario: Data layer schema rule authoring 008
    Given validation examples include a passing payload and a failing payload
    When the schema draft or example changes
    Then validation preview refreshes without saving the schema
    And each issue identifies property path, rule, expected constraint, actual value, severity, and schema origin
    And preview failures do not mutate the example or schema draft

  # Data layer schema rule authoring 009
  Scenario: Data layer schema rule authoring 009
    When available rule types are inspected
    Then validation rules are declarative built-in or reusable parameterized rules
    And no rule accepts or executes operator-authored JavaScript
