Feature: Side panel hotkey operator layout

  Background:
    Given a repository for project <project_name>
    And the Hotkeys workspace is displayed

  # Side panel hotkey operator layout 001
  Scenario Outline: Side panel hotkey operator layout 001
    Given commands from groups <group_names> are registered
    When the hotkey editor is displayed
    Then search and assignment summary appear before the command groups
    And each group heading shows its visible command count
    And command rows show title, command id, current key sequence, and assignment state in that order
    And unassigned commands remain visible when no filter excludes them

    Examples:
      | project_name         | group_names                    |
      | my-chrome-utilities | Navigation and Data Layer      |

  # Side panel hotkey operator layout 002
  Scenario Outline: Side panel hotkey operator layout 002
    Given command <command_id> is being edited at available width <panel_width>
    When the key sequence editor opens
    Then the edited command remains identifiable
    And pending key sequence, Save, Clear, and Cancel controls are grouped with that command
    And editing controls do not obscure adjacent command titles or key sequences

    Examples:
      | project_name         | command_id               | panel_width |
      | my-chrome-utilities | data-layer.start-testing | 320 px      |
      | my-chrome-utilities | data-layer.start-testing | 720 px      |

  # Side panel hotkey operator layout 003
  Scenario Outline: Side panel hotkey operator layout 003
    Given key sequence <sequence> conflicts between command <command_id> and edited command <edited_command_id>
    When the conflict is displayed
    Then the warning appears beside the edited command
    And it names <sequence>, <command_id>, and <edited_command_id>
    And keyboard focus moves to the warning or invalid field
    And unrelated command groups do not move ahead of the edited command

    Examples:
      | project_name         | sequence | command_id               | edited_command_id       |
      | my-chrome-utilities | C-c s    | data-layer.start-testing | data-layer.end-testing  |

  # Side panel hotkey operator layout 004
  Scenario Outline: Side panel hotkey operator layout 004
    Given the hotkey editor contains command groups and keymap file controls
    When the workspace first opens
    Then command search and assignments are visible
    And advanced section <advanced_section> is collapsed after the command groups
    When the user expands <advanced_section>
    Then file paths, reload controls, and keymap status are shown without replacing the command assignments

    Examples:
      | project_name         | advanced_section |
      | my-chrome-utilities | Keymap files     |

  # Side panel hotkey operator layout 005
  Scenario Outline: Side panel hotkey operator layout 005
    Given hotkey operation <operation> completes with result <result>
    When status is displayed
    Then result <result> is announced in the Hotkeys workspace context
    And the status reports the actual changed and unchanged assignment counts
    And the status is not inserted as a command row

    Examples:
      | project_name         | operation      | result                         |
      | my-chrome-utilities | keymap reload  | added 2, removed 0, unchanged 8 |
      | my-chrome-utilities | keymap reload  | added 0, removed 1, unchanged 9 |
