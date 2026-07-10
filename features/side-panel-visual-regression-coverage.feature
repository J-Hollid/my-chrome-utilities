Feature: Side panel visual regression coverage

  Background:
    Given a repository for project <project_name>
    And deterministic side panel fixture data is available

  # Side panel visual regression coverage 001
  Scenario Outline: Side panel visual regression coverage 001
    When baseline image coverage is generated for view <view_name> in state <view_state>
    Then the view is captured at available widths 320, 480, and 720 CSS pixels
    And each width is captured in light and dark themes
    And timestamps, generated ids, and active-page URLs use deterministic fixture values

    Examples:
      | project_name         | view_name | view_state          |
      | my-chrome-utilities | Live      | event list          |
      | my-chrome-utilities | Live      | event inspector     |
      | my-chrome-utilities | Library   | template editor     |
      | my-chrome-utilities | Library   | sequence editor     |
      | my-chrome-utilities | Sessions  | session detail      |
      | my-chrome-utilities | Schemas   | schema detail       |
      | my-chrome-utilities | Hotkeys   | command assignments |

  # Side panel visual regression coverage 002
  Scenario Outline: Side panel visual regression coverage 002
    When baseline image coverage is generated for exceptional state <view_state> in view <view_name>
    Then the state title, explanation, recovery action, and surrounding navigation are visible
    And the capture contains no unexpected horizontal overflow or clipped control label

    Examples:
      | project_name         | view_name | view_state               |
      | my-chrome-utilities | Live      | source connection failed |
      | my-chrome-utilities | Library   | no matching templates    |
      | my-chrome-utilities | Sessions  | no saved sessions        |
      | my-chrome-utilities | Schemas   | invalid schema draft     |
      | my-chrome-utilities | Hotkeys   | key sequence conflict    |

  # Side panel visual regression coverage 003
  Scenario Outline: Side panel visual regression coverage 003
    Given an approved baseline exists for view <view_name> at width <panel_width> in theme <theme_name>
    When the current capture differs from the approved baseline beyond the configured tolerance
    Then visual regression verification fails
    And a current image, expected image, and visual difference are retained for review
    And accepting the difference requires an explicit baseline update

    Examples:
      | project_name         | view_name | panel_width | theme_name |
      | my-chrome-utilities | Live      | 320 px      | light      |
      | my-chrome-utilities | Library   | 720 px      | dark       |

  # Side panel visual regression coverage 004
  Scenario Outline: Side panel visual regression coverage 004
    When focused and selected states are captured for component <component_name>
    Then the baseline shows the visible focus indicator
    And selected, disabled, error, and destructive variants are covered when supported by <component_name>
    And text and icons remain distinguishable in light and dark themes

    Examples:
      | project_name         | component_name    |
      | my-chrome-utilities | workspace tab     |
      | my-chrome-utilities | source control    |
      | my-chrome-utilities | event row         |
      | my-chrome-utilities | primary action    |
