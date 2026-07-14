# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T11:44:12.982705261Z","feature_name":"Side panel workspace tabs","feature_path":"features/side-panel-workspace-tabs.feature","background_hash":"226bb5e22a9a96c00cb0a883dbd213ae0d7a3a032163f94e519d113dc2da25a5","implementation_hash":"sha256:ca1020b324ca5985d04174e1ba94f1e0273b0586694672c3c79b7214751ed450","scenarios":[{"index":4,"name":"Side panel workspace tabs 005","scenario_hash":"d8fc2c39d12ca6164fa6162f4c665fc86256c5059be3cbe8a6123477616a1ff0","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T11:44:12.982705261Z"}]}
# acceptance-mutation-manifest-end

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

  # Side panel workspace tabs 006
  Scenario Outline: Side panel workspace tabs 006
    When the side panel is displayed
    Then panels for workspace tabs <primary_tab> and <settings_tab> are separate peer regions
    And neither workspace panel contains the other workspace panel
    When the user activates workspace tab <settings_tab>
    Then the panel for tab <primary_tab> is hidden
    And the panel for tab <settings_tab> remains visible
    And heading <settings_tab>, hotkey search, and registered command groups are visible in that panel

    Examples:
      | project_name         | primary_tab | settings_tab |
      | my-chrome-utilities | Data Layer  | Hotkeys      |
