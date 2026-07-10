Feature: Side panel hotkey keymap

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>

  # Side panel hotkey keymap 001
  Scenario Outline: Side panel hotkey keymap 001
    Given the side panel is closed
    When global side panel shortcut <global_shortcut> is pressed
    Then the side panel opens for the active tab
    And app-level hotkey focus is active
    When global side panel shortcut <global_shortcut> is pressed while the side panel is open but unfocused
    Then the existing side panel receives app-level hotkey focus
    And no duplicate side panel is opened
    When global side panel shortcut <global_shortcut> is pressed while app-level hotkey focus is already active
    Then app-level hotkey focus remains active

    Examples:
      | project_name         | global_shortcut |
      | my-chrome-utilities | Ctrl+Shift+1    |

  # Side panel hotkey keymap 002
  Scenario Outline: Side panel hotkey keymap 002
    When the side panel is displayed
    Then visible keymap controls create, update, and load hotkey keymap files
    When the user creates a hotkey keymap file
    Then the generated keymap uses schema version <schema_version>
    And the generated keymap contains every registered command id
    And each generated command binding is blank

    Examples:
      | project_name         | schema_version |
      | my-chrome-utilities | 1              |

  # Side panel hotkey keymap 003
  Scenario Outline: Side panel hotkey keymap 003
    Given an existing keymap binds command <existing_command_id> to sequence <existing_sequence>
    And the existing keymap contains obsolete command id <obsolete_command_id>
    When the user updates the hotkey keymap file
    Then command <existing_command_id> keeps sequence <existing_sequence>
    And missing registered command <missing_command_id> is added with a blank binding
    And obsolete command id <obsolete_command_id> is removed
    And the keymap update summary reports added and removed commands

    Examples:
      | project_name         | existing_command_id      | existing_sequence | missing_command_id    | obsolete_command_id |
      | my-chrome-utilities | data-layer.start-testing | C-c s             | data-layer.end-testing | demo.removed        |

  # Side panel hotkey keymap 004
  Scenario Outline: Side panel hotkey keymap 004
    Given a valid keymap binds command <command_id> to sequence <sequence>
    When the user loads the hotkey keymap file
    Then the keymap is stored locally
    And app-level hotkey focus is active
    When key sequence <sequence> is pressed
    Then command <command_id> runs
    When the side panel is reloaded and key sequence <sequence> is pressed
    Then the stored keymap runs command <command_id>

    Examples:
      | project_name         | command_id               | sequence |
      | my-chrome-utilities | data-layer.start-testing | C-c s    |

  # Side panel hotkey keymap 005
  Scenario Outline: Side panel hotkey keymap 005
    Given a valid keymap binds command <command_id> to sequence <sequence>
    And focus is inside text input <input_name>
    When key sequence <sequence> is pressed inside text input <input_name>
    Then command <command_id> does not run
    And text input <input_name> remains focused
    When focus leaves text input <input_name>
    And key sequence <sequence> is pressed with app-level hotkey focus active
    Then command <command_id> runs

    Examples:
      | project_name         | command_id               | sequence | input_name         |
      | my-chrome-utilities | data-layer.start-testing | C-c s    | history-path       |

  # Side panel hotkey keymap 006
  Scenario Outline: Side panel hotkey keymap 006
    Given a keymap binds command <first_command_id> and command <second_command_id> to sequence <sequence>
    When the user loads the hotkey keymap file
    Then the duplicate sequence is rejected
    And neither command <first_command_id> nor command <second_command_id> is rebound to sequence <sequence>
    And a visible keymap warning names sequence <sequence>

    Examples:
      | project_name         | first_command_id         | second_command_id      | sequence |
      | my-chrome-utilities | data-layer.start-testing | data-layer.end-testing | C-c d    |

  # Side panel hotkey keymap 007
  Scenario Outline: Side panel hotkey keymap 007
    Given a valid keymap binds command <command_id> to sequence <sequence>
    And app-level hotkey focus is active
    When key sequence prefix <prefix> is pressed
    And key <cancel_key> is pressed before the sequence is completed
    Then command <command_id> does not run
    And the pending key sequence is cleared
    When key sequence <sequence> is pressed
    Then command <command_id> runs

    Examples:
      | project_name         | command_id               | sequence | prefix | cancel_key |
      | my-chrome-utilities | data-layer.start-testing | C-c s    | C-c    | Escape     |
