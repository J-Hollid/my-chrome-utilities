# mutation-stamp: sha256=b911dd1431af01d6a3949bc0c885cf5490b45e45e64a0b7febb49fdb3055be72
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T10:34:10.747448532Z","feature_name":"Side panel hotkey editor","feature_path":"features/side-panel-hotkey-editor.feature","background_hash":"226bb5e22a9a96c00cb0a883dbd213ae0d7a3a032163f94e519d113dc2da25a5","implementation_hash":"sha256:841b33b49780240248de45bdd8ff03b9c1e9f114d9512f1c811aa2e3c6ce2666","scenarios":[{"index":0,"name":"Side panel hotkey editor 001","scenario_hash":"f47206df71427dce221f0912baf14fde696aa0e6d69c729be019dc9d401c7991","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T10:31:48.947333442Z"},{"index":1,"name":"Side panel hotkey editor 002","scenario_hash":"56cdcc148fc5130e75c3db13aeb2833eb9148a747aea20f5090b113d54850b31","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T10:31:48.947333442Z"},{"index":2,"name":"Side panel hotkey editor 003","scenario_hash":"7623e420d5c71692c979347fa84a08e6c2189055be85cad235ee0c92e388dd6d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T10:31:48.947333442Z"},{"index":3,"name":"Side panel hotkey editor 004","scenario_hash":"26b6f4250914f6411c5b045795ab4d27fa79a8fdf8b47749baa91fab97475ca6","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T10:31:48.947333442Z"},{"index":4,"name":"Side panel hotkey editor 005","scenario_hash":"de46facb348b75f787bab9a242800d739db20145bfbcda159230e9d00c013bbb","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T10:31:48.947333442Z"},{"index":5,"name":"Side panel hotkey editor 006","scenario_hash":"fa8fa2a47023e779f76a67492463625d3b5df8ab8a4fc0077ca110b8af7f5a12","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T10:31:48.947333442Z"}]}
# acceptance-mutation-manifest-end

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
