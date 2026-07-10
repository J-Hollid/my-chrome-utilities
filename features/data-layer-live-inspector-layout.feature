Feature: Data Layer Live inspector layout

  # Data Layer Live inspector layout 001
  Scenario Outline: Data Layer Live inspector layout 001
    Given an event inspector is displayed at width <panel_width>, height <panel_height>, and text zoom <text_zoom>
    When the Live view's computed layout is inspected
    Then the live session header, source statuses, and event inspector occupy non-overlapping regions in that order
    And no inspector content or action obscures the live session header or source statuses
    And all inspector content reflows without horizontal document scrolling
    And the active content region can scroll to every inspector section and action

    Examples:
      | panel_width | panel_height | text_zoom  |
      | 320 CSS px  | 640 CSS px   | 100 percent |
      | 320 CSS px  | 640 CSS px   | 200 percent |

  # Data Layer Live inspector layout 002
  Scenario Outline: Data Layer Live inspector layout 002
    Given event <event_name> has a payload taller than the available Live content region
    When event <event_name> is inspected
    Then the inspector header, body, and action controls remain in one non-overlapping inspector layout
    And scrolling the inspector body does not move content underneath the session header or source statuses
    And Copy payload, Save to Library, Validate, and Back to events remain reachable

    Examples:
      | event_name |
      | purchase   |
