Feature: Project skeleton

  Background:
    Given a repository for project <project_name>

  # Project skeleton 001
  Scenario Outline: Project skeleton 001
    When the project skeleton is inspected
    Then package metadata identifies the project as <project_name>
    And the skeleton includes TypeScript source
    And the skeleton includes a browser app entry point
    And generated dependency and build outputs are ignored

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Project skeleton 002
  Scenario Outline: Project skeleton 002
    When the project build command is run
    Then TypeScript checking succeeds
    And a production build for <project_name> completes

    Examples:
      | project_name         |
      | my-chrome-utilities |
