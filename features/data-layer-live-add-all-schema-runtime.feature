# Data layer Live add all schema runtime 001 through 003
Feature: Data layer Live add all schema runtime

  Background:
    Given the built extension side panel is running with the production Live inspector and durable schema repository
    And the selected captured event contains nested properties and two array items with different child keys

  # Data layer Live add all schema runtime 001
  Scenario Outline: Data layer Live add all schema runtime 001
    When the operator uses pointer input to activate Add all to schema
    And selects <destination>
    Then the production review and its controls have visible bounds and accept pointer and keyboard input
    And the review includes properties from both array items
    When the operator closes the review with <close_action>
    Then modal input blocking ends and focus returns to the originating Live control
    And the durable repository is unchanged
    And reopening produces one usable review

    Examples:
      | destination        | close_action |
      | a named new schema | Cancel       |
      | an existing schema | Escape       |

  # Data layer Live add all schema runtime 002
  Scenario Outline: Data layer Live add all schema runtime 002
    Given <destination> is selected in the production review
    When the operator confirms using keyboard input
    Then the production durable repository commits the reviewed additions as one operation
    And existing local and inherited properties retain their types, examples, rules, and documentation
    And the Live inspector remains usable on the originating event
    When the side panel reloads
    Then the Schema editor shows the added nested paths with their inferred types and typed examples
    And no new publication or automatic validation assignment exists

    Examples:
      | destination        |
      | a named new schema |
      | an existing schema |

  # Data layer Live add all schema runtime 003
  Scenario: Data layer Live add all schema runtime 003
    Given the durable repository rejects the reviewed addition
    When the operator confirms Add all to schema
    Then no partial schema or property batch is committed
    And the review does not report success
    And the existing durable failure recovery retains the exact unsaved additions
    And disposing the review leaves no invisible modal that blocks the side panel
