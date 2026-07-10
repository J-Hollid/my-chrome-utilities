# mutation-stamp: sha256=4258b668283c7f82bc177a6a1887a4afdcd585c7fd5046552071c113e4e08f44
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T14:48:26.309486684Z","feature_name":"Side panel hotkey operator layout","feature_path":"features/side-panel-hotkey-operator-layout.feature","background_hash":"f997b1dd3d360ca2ee8543a69a8817c4d4329558338084de9a4ed3ef0245f31c","implementation_hash":"sha256:operator-interface-semantic-v2","scenarios":[{"index":0,"name":"Side panel hotkey operator layout 001","scenario_hash":"038f8a3574fae6df244878515742d213765b2cb675ddea2b6624135db6c8bd70","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:26.309486684Z"},{"index":1,"name":"Side panel hotkey operator layout 002","scenario_hash":"870d7528f3b5e7c5a6d3e45b59bd7067cd76e78486d3fe7971470399e8899f97","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:26.309486684Z"},{"index":2,"name":"Side panel hotkey operator layout 003","scenario_hash":"4bc34e53c37a0e3750513ca74bd37cf434d8c0f8aad194bb40847aed06453b25","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:26.309486684Z"},{"index":3,"name":"Side panel hotkey operator layout 004","scenario_hash":"baf1504ba6b70526770756f653092f68156232a83daa6a3cac8e04359b0b88c5","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:26.309486684Z"},{"index":4,"name":"Side panel hotkey operator layout 005","scenario_hash":"8e8c43076e6e9464d1a329f56721f9cbd2cdaa00d4d32ea6b7fd30d655c059fe","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:26.309486684Z"}]}
# acceptance-mutation-manifest-end

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
