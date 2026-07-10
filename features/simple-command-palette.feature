# mutation-stamp: sha256=d1205dd9844dbc7ee97b8b1200f8e459faafbfbc05b8ab108e85de23657eb2f1
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T21:10:48.802718895Z","feature_name":"Simple command palette","feature_path":"features/simple-command-palette.feature","background_hash":"226bb5e22a9a96c00cb0a883dbd213ae0d7a3a032163f94e519d113dc2da25a5","implementation_hash":"sha256:palette-adapter-refinement-v1","scenarios":[{"index":1,"name":"Simple command palette 002","scenario_hash":"e943423833b70500533182c3c54e7649bc7690a104cd08bea62040cfd170b3e2","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:55:22.792416429Z"},{"index":0,"name":"Simple command palette 001","scenario_hash":"e70fac64e07b91a4896653c14ebe2be30e5ef4a4c9a571184e5a6628a409a24f","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:53:47.270919051Z"},{"index":2,"name":"Simple command palette 003","scenario_hash":"267b23f788780401b7d44e8171ab27514301eebe8120a36f96726986f4d3ca8e","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:53:47.270919051Z"},{"index":3,"name":"Simple command palette 004","scenario_hash":"d10b658a65682bd6a15262515ddf40e661fe6919c834120676d6ad3f4f4dc5cb","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:53:47.270919051Z"},{"index":4,"name":"Simple command palette 005","scenario_hash":"ee0f155379f217219a7a69e0ae8ae2c23b11044b159c315693d7ad5c7b722a4a","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-10T08:53:47.270919051Z"}]}
# acceptance-mutation-manifest-end

Feature: Simple command palette

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>

  # Simple command palette 001
  Scenario Outline: Simple command palette 001
    When the side panel is displayed
    Then a visible button opens the command palette
    When shortcut <shortcut> is pressed inside the side panel
    Then the command palette opens

    Examples:
      | project_name         | shortcut |
      | my-chrome-utilities | Ctrl+K   |

  # Simple command palette 002
  Scenario Outline: Simple command palette 002
    When the command palette is open
    Then registered commands are listed
    When the user types <filter_text>
    Then only matching commands are shown
    And the command filter uses the canonical hello query

    Examples:
      | project_name         | filter_text |
      | my-chrome-utilities | hello       |

  # Simple command palette 003
  Scenario Outline: Simple command palette 003
    When command <command_id> is selected in the command palette
    And key <key> is pressed
    Then command <command_id> runs
    And visible command log records that command <command_id> ran

    Examples:
      | project_name         | command_id     | key   |
      | my-chrome-utilities | demo.say-hello | Enter |

  # Simple command palette 004
  Scenario Outline: Simple command palette 004
    When the command palette is open
    And key <key> is pressed
    Then the command palette closes

    Examples:
      | project_name         | key    |
      | my-chrome-utilities | Escape |

  # Simple command palette 005
  Scenario Outline: Simple command palette 005
    When command palette implementation is inspected
    Then no fuzzy-search package dependency is declared
    And command palette commands are backed by the command registry

    Examples:
      | project_name         |
      | my-chrome-utilities |
