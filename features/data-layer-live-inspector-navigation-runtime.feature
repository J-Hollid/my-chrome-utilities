Feature: Data Layer Live inspector navigation runtime

  Background:
    Given the built extension side panel is running in a browser at 320 CSS px wide
    And captured event purchase is available in the Live event list

  # Data Layer Live inspector navigation runtime 001
  Scenario: Data Layer Live inspector navigation runtime 001
    Given the Live event list has keyboard focus on event purchase
    When the user opens event purchase
    Then the event list has computed display none
    And the inspector and Back to events control have computed display other than none
    And Back to events has no hidden ancestor
    When the user activates Back to events
    Then the inspector has computed display none
    And the event list has computed display other than none
    And keyboard focus returns to event purchase
