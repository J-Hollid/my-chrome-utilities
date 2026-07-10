# mutation-stamp: sha256=127552527cf48a91a11750168ef4aa718dceac08eec8cc50b42fd5613ddf292c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T08:56:42.377535164Z","feature_name":"Side panel hotkey keymap","feature_path":"features/side-panel-hotkey-keymap.feature","background_hash":"226bb5e22a9a96c00cb0a883dbd213ae0d7a3a032163f94e519d113dc2da25a5","implementation_hash":"sha256:ebaa1201c72337f0a865c1d87e1021f06e3dd25b32ff6456b329ed72b541f9b6","scenarios":[{"index":2,"name":"Side panel hotkey keymap 003","scenario_hash":"eda0601bdd6676a4e6ca55bd63725818369f2dfaaa96cea8de2fcc458fcf6164","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:52:40.285698597Z"},{"index":3,"name":"Side panel hotkey keymap 004","scenario_hash":"2142248b736ea4153817a5ff8331475ff16499da7d8cad24d295fe03926757ac","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:52:40.285698597Z"},{"index":4,"name":"Side panel hotkey keymap 005","scenario_hash":"64d7095d332e691af77c3024999f167c42b0474db0dbaafba602d5e6d91cbfcc","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:52:40.285698597Z"},{"index":5,"name":"Side panel hotkey keymap 006","scenario_hash":"6748300d728b4bef42ef9699fa34a2db2258f6b279bfccdd4d7f7fdc45cfabad","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:52:40.285698597Z"},{"index":6,"name":"Side panel hotkey keymap 007","scenario_hash":"5911cc5ab033d3d317f25253be76cafcc8434192dd3149644fb583c82c8ced44","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:52:40.285698597Z"},{"index":0,"name":"Side panel hotkey keymap 001","scenario_hash":"03d2429102cda5b6324c1e4430dc5c19313474fc887e0f2b29026cf15d7c9b66","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:46:52.591423526Z"},{"index":1,"name":"Side panel hotkey keymap 002","scenario_hash":"fa1ae32c0e6105b7e3635cb45b827b3d0a0edfe58989806da1cf2c3d0ffd404a","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:46:52.591423526Z"}]}
# acceptance-mutation-manifest-end

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
    And the keymap update preserves the canonical start binding
    And the keymap update used the canonical obsolete command id

    Examples:
      | project_name         | existing_command_id      | existing_sequence | missing_command_id    | obsolete_command_id |
      | my-chrome-utilities | data-layer.start-testing | C-c s             | data-layer.end-testing | demo.removed        |

  # Side panel hotkey keymap 004
  Scenario Outline: Side panel hotkey keymap 004
    Given a valid keymap binds command <command_id> to sequence <sequence>
    And the active keymap uses the canonical start sequence
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
    And the active keymap uses the canonical start sequence
    And focus is inside text input <input_name>
    And the text input guard targets the canonical history path input
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
    And the duplicate rejection uses the canonical duplicate sequence
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
