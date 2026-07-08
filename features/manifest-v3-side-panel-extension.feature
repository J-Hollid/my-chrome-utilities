Feature: Manifest V3 side panel extension

  Background:
    Given a repository for project <project_name>

  # Manifest V3 side panel extension 001
  Scenario Outline: Manifest V3 side panel extension 001
    When the extension manifest is inspected
    Then manifest_version is <manifest_version>
    And the extension name is <project_name>
    And side_panel.default_path points to the side panel HTML entry
    And permission <permission> is declared
    And no content scripts are declared

    Examples:
      | project_name         | manifest_version | permission |
      | my-chrome-utilities | 3                | sidePanel  |

  # Manifest V3 side panel extension 002
  Scenario Outline: Manifest V3 side panel extension 002
    When the extension action is clicked
    Then the side panel opens for the active tab

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Manifest V3 side panel extension 003
  Scenario Outline: Manifest V3 side panel extension 003
    When the production extension is built
    Then dist can be loaded unpacked in Chrome
    And the built side panel HTML entry exists
    And the side panel displays <project_name>

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Manifest V3 side panel extension 004
  Scenario Outline: Manifest V3 side panel extension 004
    When the extension implementation is inspected
    Then no command registry is present
    And no command palette is present
    And no data layer functionality is present

    Examples:
      | project_name         |
      | my-chrome-utilities |
