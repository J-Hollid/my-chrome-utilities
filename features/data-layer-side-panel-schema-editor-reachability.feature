Feature: Data layer side-panel schema editor reachability

  Background:
    Given Shop is the active project
    And its side-panel Schema Library contains a tree taller than the available workspace
    And the selected schema contains enough properties to require editor scrolling

  # Data layer side-panel schema editor reachability 001
  Scenario Outline: Data layer side-panel schema editor reachability 001
    Given the Side Panel viewport is <panel_width> by <panel_height> CSS pixels
    And the operator can see <open_action> in the Schema Library
    When the operator activates <open_action>
    Then the complete Schema editor scroll viewport is inside the visible Side Panel workspace
    And the editor heading and first control are visible
    And no hidden outer panel scrollbar is required to reach the editor
    When the operator scrolls through the Schema editor
    Then the editor's existing vertical scrollbar reaches every property and final editor action
    And no horizontal document scrollbar appears

    Examples:
      | panel_width | panel_height | open_action               |
      | 360         | 760          | Create schema              |
      | 420         | 900          | Open Saved schema          |
      | 520         | 900          | Open project contributor   |

  # Data layer side-panel schema editor reachability 002
  Scenario: Data layer side-panel schema editor reachability 002
    Given the operator records the Schema tree scroll position and invoking reference
    When the operator opens and closes the compact Schema editor
    Then the Schema tree is reachable through its outer panel scrollbar
    And its recorded scroll position is restored
    And focus returns to the exact invoking reference
    And schema and project content remain unchanged
