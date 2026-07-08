Feature: Typed command registry

  Background:
    Given a repository for project <project_name>

  # Typed command registry 001
  Scenario Outline: Typed command registry 001
    When the command registry contract is inspected
    Then each command defines <id_field>, <title_field>, <description_field>, <category_field>, and <run_field>
    And the registry can list commands
    And command registry logic is separated from side panel rendering

    Examples:
      | project_name         | id_field | title_field | description_field | category_field | run_field |
      | my-chrome-utilities | id       | title       | description       | category       | run       |

  # Typed command registry 002
  Scenario Outline: Typed command registry 002
    When command <command_id> is inspected
    Then command <command_id> is registered
    And command <command_id> has a title, description, category, and run behavior

    Examples:
      | project_name         | command_id     |
      | my-chrome-utilities | demo.say-hello |

  # Typed command registry 003
  Scenario Outline: Typed command registry 003
    When command <command_id> is run by id
    Then visible app state or log records that command <command_id> ran

    Examples:
      | project_name         | command_id     |
      | my-chrome-utilities | demo.say-hello |

  # Typed command registry 004
  Scenario Outline: Typed command registry 004
    When command features are inspected
    Then no command palette is present
    And no user-configurable keybindings are present

    Examples:
      | project_name         |
      | my-chrome-utilities |
