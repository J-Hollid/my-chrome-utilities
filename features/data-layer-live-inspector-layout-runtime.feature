Feature: Data Layer Live inspector layout runtime

  Background:
    Given the built extension side panel is running in a browser at 320 CSS px wide
    And captured event purchase is open in the Live inspector

  # Data Layer Live inspector layout runtime 001
  Scenario Outline: Data Layer Live inspector layout runtime 001
    Given the selected event has a payload taller than viewport height <panel_height>
    When bounding rectangles are measured in the running side panel
    Then the live session header, source statuses, inspector, and inspector actions do not intersect
    And every inspector action is reachable by scrolling the active content region
    And the document has no horizontal overflow

    Examples:
      | panel_height |
      | 640 CSS px   |
