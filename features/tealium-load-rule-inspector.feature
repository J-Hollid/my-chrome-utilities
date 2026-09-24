Feature: Tealium load rule inspector

  Scenario: View the published load rule results
    Given a Tealium page has evaluated load rules
    And exact profile metadata supplies load rule names
    When the user opens Load rules in Tealium Live
    Then a separate list shows the rule names and IDs
    And each rule shows its true or false runtime result
    And the result stays in the correct frame and profile

  Scenario: Inspect the conditions of a load rule
    Given a selected load rule has supported published conditions
    When the user opens the rule detail
    Then the conditions use Tealium variable and operator words
    And each condition shows its result and current data value
    And the rule result is clearly identified as the recorded runtime result
    And a condition that cannot be translated is marked unavailable

  Scenario: Open a rule from a tag
    Given a tag has load rule assignments in exact profile metadata
    When the user opens the tag detail
    Then the tag shows its evaluated load rules and their results
    When the user selects a load rule from the tag detail
    Then Tealium Live opens that rule in the Load rules view
