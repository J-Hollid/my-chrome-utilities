Feature: Data layer schemas operator layout

  Background:
    Given a repository for project <project_name>
    And the Data Layer Schemas view is displayed

  # Data layer schemas operator layout 001
  Scenario Outline: Data layer schemas operator layout 001
    Given schema <schema_name> version <version> has assignment <assignment> and usage count <usage_count>
    When schemas are listed
    Then <schema_name> is the row's primary label
    And the row shows version <version>, <assignment>, validation target, and <usage_count> usages
    And the selected schema is visually distinct without relying on color alone

    Examples:
      | project_name         | schema_name    | version | assignment                     | usage_count |
      | my-chrome-utilities | Purchase event | 2       | event.history purchase payload | 14          |

  # Data layer schemas operator layout 002
  Scenario Outline: Data layer schemas operator layout 002
    Given schema <schema_name> version <version> is selected
    When its detail is displayed
    Then schema identity, version, assignments, validation target, and usage appear before the schema document
    And schema document, assignments, and validation examples are available as distinct detail groups
    And actions <schema_actions> remain reachable while the schema document scrolls

    Examples:
      | project_name         | schema_name    | version | schema_actions                                  |
      | my-chrome-utilities | Purchase event | 2       | Edit as new version, Duplicate, Export, Delete |

  # Data layer schemas operator layout 003
  Scenario Outline: Data layer schemas operator layout 003
    Given validation found <issue_count> issues against schema <schema_name> version <version>
    When validation details are displayed
    Then the summary shows <issue_count> issues and identifies schema <schema_name> version <version>
    And each issue shows instance path, message, expected value, actual value, and schema location in aligned fields
    And selecting an issue reveals the complete values without losing the issue list position

    Examples:
      | project_name         | issue_count | schema_name    | version |
      | my-chrome-utilities | 2           | Purchase event | 2       |

  # Data layer schemas operator layout 004
  Scenario Outline: Data layer schemas operator layout 004
    Given schema <schema_name> version <version> is being edited
    When the editor is displayed
    Then the new-version identity and assignment controls appear before the schema document editor
    And parse status and validation examples are shown near the editor rather than in the schema list
    And persistent actions <editor_actions> remain reachable while the schema document scrolls

    Examples:
      | project_name         | schema_name    | version | editor_actions |
      | my-chrome-utilities | Purchase event | 3       | Save and Cancel |

  # Data layer schemas operator layout 005
  Scenario Outline: Data layer schemas operator layout 005
    Given schema <schema_name> has unsaved version <version>
    When the user selects another schema
    Then the unsaved schema document is not discarded without confirmation
    And choosing to remain restores schema <schema_name> version <version> and its editor position

    Examples:
      | project_name         | schema_name    | version |
      | my-chrome-utilities | Purchase event | 3       |
