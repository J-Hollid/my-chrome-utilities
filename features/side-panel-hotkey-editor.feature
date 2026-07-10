Feature: Side panel hotkey editor

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>

  # Side panel hotkey editor 001
  Scenario Outline: Side panel hotkey editor 001
    Given workspace tab <hotkey_tab> is active
    When the hotkey editor is displayed
    Then every registered command is listed with its title, command id, and current key sequence
    And commands are grouped under user-facing workspace or navigation labels
    And each command provides visible controls to change or clear its key sequence
    And keymap file controls are grouped under a collapsed <file_section> section

    Examples:
      | project_name         | hotkey_tab | file_section |
      | my-chrome-utilities | Hotkeys    | Keymap files |

  # Side panel hotkey editor 002
  Scenario Outline: Side panel hotkey editor 002
    Given the hotkey editor is displayed
    When the user searches for <query>
    Then only commands matching <query> by title, command id, or key sequence are listed

    Examples:
      | project_name         | query      |
      | my-chrome-utilities | data-layer |

  # Side panel hotkey editor 003
  Scenario Outline: Side panel hotkey editor 003
    Given command <command_id> uses key sequence <sequence>
    When the user changes command <command_id> to key sequence <new_sequence> in the hotkey editor
    Then key sequence <new_sequence> runs command <command_id>
    And key sequence <sequence> no longer runs command <command_id>
    And key sequence <new_sequence> remains active after the side panel reloads
    And visible hotkey status confirms command <command_id> was updated

    Examples:
      | project_name         | command_id               | sequence | new_sequence |
      | my-chrome-utilities | data-layer.start-testing | C-c s    | C-c t        |

  # Side panel hotkey editor 004
  Scenario Outline: Side panel hotkey editor 004
    Given command <command_id> uses key sequence <sequence>
    When the user clears the key sequence for command <command_id> in the hotkey editor
    Then command <command_id> is shown as unassigned
    And key sequence <sequence> no longer runs command <command_id>
    And the cleared key sequence remains unassigned after the side panel reloads

    Examples:
      | project_name         | command_id             | sequence |
      | my-chrome-utilities | data-layer.end-testing | C-c e    |

  # Side panel hotkey editor 005
  Scenario Outline: Side panel hotkey editor 005
    Given command <command_id> uses key sequence <sequence>
    And edited command <edited_command_id> uses prior key sequence <edited_sequence>
    When the user assigns key sequence <sequence> to command <edited_command_id> in the hotkey editor
    Then the hotkey change is rejected
    And a visible conflict warning names key sequence <sequence>, command <command_id>, and command <edited_command_id>
    And command <command_id> retains key sequence <sequence>
    And edited command <edited_command_id> retains prior key sequence <edited_sequence>

    Examples:
      | project_name         | command_id               | edited_command_id       | sequence | edited_sequence |
      | my-chrome-utilities | data-layer.start-testing | data-layer.end-testing | C-c s    | C-c e           |

  # Side panel hotkey editor 006
  Scenario Outline: Side panel hotkey editor 006
    Given command <command_id> uses key sequence <sequence>
    And edited command <edited_command_id> uses prior key sequence <edited_sequence>
    And the user is editing the key sequence for command <edited_command_id>
    When key sequence <sequence> is entered into the hotkey editor
    Then command <command_id> does not run
    And key sequence <sequence> is shown as the pending hotkey change
    When the user cancels the pending hotkey change
    Then edited command <edited_command_id> retains prior key sequence <edited_sequence>

    Examples:
      | project_name         | command_id               | sequence | edited_command_id       | edited_sequence |
      | my-chrome-utilities | data-layer.start-testing | C-c s    | data-layer.end-testing | C-c e           |
