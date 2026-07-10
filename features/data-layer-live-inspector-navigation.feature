Feature: Data Layer Live inspector navigation

  # Data Layer Live inspector navigation 001
  Scenario Outline: Data Layer Live inspector navigation 001
    Given the Live event list is displayed at available width <panel_width>
    And event <event_name> is visible at feed scroll position <scroll_position>
    When event <event_name> is opened
    Then the inspector replaces the event list
    And a visible Back to events control remains inside the visible inspector context
    And the return control is keyboard reachable while the event list is hidden
    When Back to events is activated
    Then the inspector closes and the event list is displayed
    And keyboard focus returns to event <event_name>
    And the feed filters and scroll position <scroll_position> are restored

    Examples:
      | panel_width | event_name | scroll_position |
      | 320 CSS px  | banner     | 480 CSS px      |

  # Data Layer Live inspector navigation 002
  Scenario Outline: Data Layer Live inspector navigation 002
    Given event <event_name> is open in the Live inspector
    And no inspector disclosure or modal interaction is active
    When Escape is pressed
    Then the inspector closes and the event list is displayed
    And keyboard focus returns to event <event_name>

    Examples:
      | event_name |
      | banner     |
