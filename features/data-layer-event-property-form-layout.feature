Feature: Data layer event property form layout

  Background:
    Given a repository for project my-chrome-utilities
    And event template Purchase confirmation is open for editing

  # Data layer event property form layout 001
  Scenario Outline: Data layer event property form layout 001
    Given the side panel is <panel_width> CSS px wide
    When the payload form is displayed
    Then each control uses 100 percent of the editor content width
      | control             |
      | JSON draft textarea |
      | destination input   |
    And each control's label appears directly above that control
    And the property list, JSON draft textarea, destination input, and feedback region occupy separate visual rows
    And the payload form causes no horizontal document scrolling

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |

  # Data layer event property form layout 002
  Scenario: Data layer event property form layout 002
    Given help text, validation feedback, and an action result are available in the payload form
    When the payload form is displayed
    Then help text, validation feedback, and the action result each occupy their own row
    And none of those feedback rows shares a visual line with a form control
    And Save revision, Save as copy, Push draft, and Discard draft form a separate wrapping action group
    And no action is placed inline with form feedback
