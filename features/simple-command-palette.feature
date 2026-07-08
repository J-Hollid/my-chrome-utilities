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
