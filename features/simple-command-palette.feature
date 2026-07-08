# mutation-stamp: sha256=fbd68f1744eaf3caa83f24f26e9e4edc32a26dd0a0cb72c02438f68c87eab84f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-08T19:14:25.091433067Z","feature_name":"Simple command palette","feature_path":"features/simple-command-palette.feature","background_hash":"7010dbc38239bc7043db7168e3ce76337d3bc72582407db6296288f1ba4d4743","implementation_hash":"sha256:57736879a16bce5351ce2d26e0a1d4952472742e1eb9f67020cc8fc91efac3c1","scenarios":[{"index":0,"name":"Simple command palette 001","scenario_hash":"e70fac64e07b91a4896653c14ebe2be30e5ef4a4c9a571184e5a6628a409a24f","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:03:22.553481589Z"},{"index":1,"name":"Simple command palette 002","scenario_hash":"24ab5ac9bdf0bd0e036a29f4b6c8b2da606c416f78e999302a57f2e0c03b9509","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:03:22.553481589Z"},{"index":2,"name":"Simple command palette 003","scenario_hash":"267b23f788780401b7d44e8171ab27514301eebe8120a36f96726986f4d3ca8e","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:03:22.553481589Z"},{"index":3,"name":"Simple command palette 004","scenario_hash":"d10b658a65682bd6a15262515ddf40e661fe6919c834120676d6ad3f4f4dc5cb","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:03:22.553481589Z"},{"index":4,"name":"Simple command palette 005","scenario_hash":"a639afe6d9871d73a9f50fd8d52db051e253364bf874c1f78506dfb430fc39c6","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:03:22.553481589Z"}]}
# acceptance-mutation-manifest-end

Feature: Simple command palette

  Background:
    Given a repository for project <project_name>

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
    And no global shortcuts are declared
    And no user keybinding editor is present

    Examples:
      | project_name         |
      | my-chrome-utilities |
