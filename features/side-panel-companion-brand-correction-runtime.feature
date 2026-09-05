Feature: Side panel companion brand correction runtime

  Background:
    Given the production side panel is installed and running in Chrome
    And an isolated repository contains one active project and two saved projects

  # Side panel companion brand correction runtime 001
  Scenario Outline: Side panel companion brand correction runtime 001
    Given Projects is rendered at width <panel_width>
    When each name, metadata item, and Active project label is measured
    Then its actual composited text contrast is at least 4.5 to 1
    And enabled records have full opacity and native enabled actions
    And long names wrap without document overflow or clipped text

    Examples:
      | panel_width |
      | 360 CSS px  |
      | 420 CSS px  |
      | 512 CSS px  |

  # Side panel companion brand correction runtime 002
  Scenario Outline: Side panel companion brand correction runtime 002
    Given view <view_name> is exercised with empty and populated production states
    When current screenshots and computed styles are recorded at 360, 420, and 512 CSS px
    Then ordinary surface and control roles match the approved companion contract
    And the view has no unreadable text, clipped action, or document overflow
    And its meaningful error and disabled states retain non-colour indications

    Examples:
      | view_name |
      | Projects  |
      | Live      |
      | Library   |
      | Sessions  |
      | Defects   |
      | Schemas   |
      | Hotkeys   |

  # Side panel companion brand correction runtime 003
  Scenario Outline: Side panel companion brand correction runtime 003
    Given the existing action <action_name> is available
    When it is invoked through the revised presentation
    Then its production callback receives the same stable identity and input
    And its result and cancellation preserve the existing domain contract
    And focus returns to a reachable control in the revised layout

    Examples:
      | action_name                  |
      | Open in Specification Studio |
      | Switch project               |
      | Edit project details         |
      | Export project               |
      | Close project                |
      | Create project               |
      | Import project               |
      | Search and sort projects     |
      | Recover failed storage       |

  # Side panel companion brand correction runtime 004
  Scenario Outline: Side panel companion brand correction runtime 004
    Given accessibility mode <mode_name> is active
    When workspace tabs, section tabs, Commands, and project details are operated
    Then names, roles, selected states, and focus remain correct
    And every visible control is reachable with a visible focus indication
    And section navigation uses at most two rows without clipped labels
    And no new animation, clipped text, or inaccessible overflow is introduced

    Examples:
      | mode_name             |
      | keyboard only         |
      | 200 percent zoom      |
      | forced colours        |
      | reduced motion        |

  # Side panel companion brand correction runtime 005
  Scenario: Side panel companion brand correction runtime 005
    Given Projects is unfiltered and the active project has a long stable identifier
    When installed project records and visible context are inspected
    Then the active project has exactly one full record
    And the complete identifier is absent from the default presentation
    When its details disclosure is opened with the keyboard
    Then the complete identifier and exact saved time are visible and selectable
    And filtering or sorting leaves the active project and saved data unchanged

  # Side panel companion brand correction runtime 006
  Scenario: Side panel companion brand correction runtime 006
    Given the same project is opened in Specification Studio and the side panel
    When baseline and candidate images are compared on the exact built candidate
    Then the panel shares the Studio paper, ink, navy, and restrained gold roles
    And the panel has its own usable narrow layout with no new decoration
    And the Studio presentation and stored project snapshot remain unchanged
    And CSS checks alone cannot substitute for these installed observations
