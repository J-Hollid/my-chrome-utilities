Feature: Side panel workspace tabs

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>

  # Side panel workspace tabs 001
  Scenario Outline: Side panel workspace tabs 001
    When the side panel is displayed
    Then global command controls remain visible outside the workspace tabs
    And workspace tabs are ordered <primary_tab> then <settings_tab>
    And only the primary workspace panel is visible by default
    And assistive technology recognizes each workspace tab and its associated panel
    And each workspace panel begins with a heading matching its tab label
    And data layer controls appear only in tab <primary_tab>
    And hotkey configuration controls appear only in tab <settings_tab>

    Examples:
      | project_name         | primary_tab | settings_tab |
      | my-chrome-utilities | Data Layer  | Hotkeys      |

  # Side panel workspace tabs 002
  Scenario Outline: Side panel workspace tabs 002
    Given workspace tab <initial_tab> is active
    When the user activates workspace tab <tab_name>
    Then only the panel for tab <tab_name> is visible
    And workspace tab <tab_name> is exposed as selected
    And workspace tab <tab_name> remains active after the side panel reloads

    Examples:
      | project_name         | initial_tab | tab_name |
      | my-chrome-utilities | Data Layer  | Hotkeys  |

  # Side panel workspace tabs 003
  Scenario Outline: Side panel workspace tabs 003
    Given workspace tab <initial_tab> has keyboard focus
    When tab navigation key <navigation_key> is pressed
    Then keyboard focus and selection move to workspace tab <tab_name>
    And only the panel for tab <tab_name> is visible

    Examples:
      | project_name         | initial_tab | navigation_key | tab_name   |
      | my-chrome-utilities | Data Layer  | ArrowRight    | Hotkeys    |
      | my-chrome-utilities | Hotkeys     | ArrowLeft     | Data Layer |
      | my-chrome-utilities | Data Layer  | End           | Hotkeys    |
      | my-chrome-utilities | Hotkeys     | Home          | Data Layer |

  # Side panel workspace tabs 004
  Scenario Outline: Side panel workspace tabs 004
    Given workspace tab <initial_tab> is active
    When keyboard focus enters the workspace tabs
    Then keyboard focus moves to workspace tab <initial_tab>
    When key <forward_key> is pressed
    Then keyboard focus moves into the panel for tab <initial_tab>

    Examples:
      | project_name         | initial_tab | forward_key |
      | my-chrome-utilities | Data Layer  | Tab         |

  # Side panel workspace tabs 005
  Scenario Outline: Side panel workspace tabs 005
    When workspace navigation command <command_id> runs
    Then only the panel for tab <tab_name> is visible
    And workspace tab <tab_name> is exposed as selected
    And command <command_id> is available in the command palette and for hotkey assignment

    Examples:
      | project_name         | command_id                 | tab_name   |
      | my-chrome-utilities | navigation.show-data-layer | Data Layer |
      | my-chrome-utilities | navigation.show-hotkeys    | Hotkeys    |
