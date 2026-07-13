Feature: Data layer schema property rule picker

  Background:
    Given schema Page view working draft is open at 320 CSS px wide
    And property page_type has type string

  # Data layer schema property rule picker 001
  Scenario: Data layer schema property rule picker 001
    Given the property rule picker is closed
    When the page_type property row is displayed
    Then a compact Add rule button is available
    And the rule picker and Rule Library results are absent from the property row
    And the property row does not expand to display available rules

  # Data layer schema property rule picker 002
  Scenario: Data layer schema property rule picker 002
    When the operator activates Add rule for page_type
    Then a focused rule-picker dialog opens above the schema editor
    And its heading identifies page_type and type string
    And rule search receives keyboard focus
    And matching results scroll within the bounded dialog
    And background schema controls do not receive keyboard focus

  # Data layer schema property rule picker 003
  Scenario Outline: Data layer schema property rule picker 003
    Given property <property_name> has type <property_type>
    When compatible rule types are calculated
    Then rule type <rule_type> has availability <availability>

    Examples:
      | property_name | property_type | rule_type             | availability |
      | page_type     | string        | Required              | available    |
      | page_type     | string        | Regular expression    | available    |
      | revenue       | number        | Numeric range         | available    |
      | items         | array         | Item count            | available    |
      | revenue       | number        | Regular expression    | unavailable  |
      | product       | object        | Allowed values        | unavailable  |

  # Data layer schema property rule picker 004
  Scenario Outline: Data layer schema property rule picker 004
    Given compatible reusable string rules have unequal names, operators, parameters, descriptions, types, and versions
    And incompatible number and array rules also exist
    When the operator searches rules for <query>
    Then only compatible reusable rules matching <matched_metadata> are displayed
    And incompatible rules are absent from attachable results

    Examples:
      | query          | matched_metadata |
      | Approved pages | rule name        |
      | allowed values | operator         |
      | checkout       | parameters       |
      | public pages   | description      |
      | string         | applicable type  |
      | version 2      | version          |

  # Data layer schema property rule picker 005
  Scenario: Data layer schema property rule picker 005
    Given compatible built-in and reusable rules are available for page_type
    When rule-picker results are displayed
    Then compatible built-in rules appear under Create a rule
    And compatible reusable rules appear under Attach from Rule Library
    And each result identifies name, operator, parameters, applicable type, and reusable-rule version when present
    And selecting a built-in rule opens local rule configuration
    And selecting a reusable rule attaches that rule to page_type

  # Data layer schema property rule picker 006
  Scenario: Data layer schema property rule picker 006
    Given the Rule Library contains compatible and incompatible reusable rules
    When the page_type rule picker opens
    Then compatible built-in rule creation remains available
    And only compatible reusable rules are attachable
    And Rule Library contents do not replace built-in rule creation

  # Data layer schema property rule picker 007
  Scenario: Data layer schema property rule picker 007
    Given reusable rule Approved page types version 2 is compatible with page_type
    When the operator attaches Approved page types version 2
    Then it is attached once to page_type in the Page view working draft
    And the page_type active-rule count increases by 1
    And the current published Page view revision remains unchanged
    And the rule picker closes
    And keyboard focus returns to Add rule for page_type

  # Data layer schema property rule picker 008
  Scenario: Data layer schema property rule picker 008
    Given Approved page types version 2 is already attached to page_type
    When the page_type rule picker opens
    Then Approved page types version 2 is identified as already attached
    And it cannot be attached to page_type again

  # Data layer schema property rule picker 009
  Scenario: Data layer schema property rule picker 009
    Given no compatible reusable rule matches query missing-rule
    When empty search results are displayed
    Then No compatible rules match this search is displayed
    And Clear search restores compatible built-in and reusable results
    And the Page view working draft remains unchanged

  # Data layer schema property rule picker 010
  Scenario Outline: Data layer schema property rule picker 010
    Given the rule picker is open with matching results and one result selected
    When the operator performs <picker_input>
    Then <selection_outcome>
    And the schema editor layout remains unchanged

    Examples:
      | picker_input                                        | selection_outcome                   |
      | Arrow key navigation followed by Enter             | the selected rule action runs       |
      | Escape                                              | no rule is created or attached      |
