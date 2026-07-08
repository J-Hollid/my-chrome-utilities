Feature: Portable build package flow

  Background:
    Given a repository for project <project_name>

  # Portable build package flow 001
  Scenario Outline: Portable build package flow 001
    When command <build_command> is run
    Then output directory <dist_dir> is created
    And <dist_dir> contains a loadable Chrome extension build

    Examples:
      | project_name         | build_command | dist_dir |
      | my-chrome-utilities | npm run build | dist     |

  # Portable build package flow 002
  Scenario Outline: Portable build package flow 002
    When command <package_command> is run after a production build
    Then a <artifact_type> package artifact is created from <dist_dir>
    And the package artifact contains the Chrome extension build from <dist_dir>

    Examples:
      | project_name         | package_command | artifact_type | dist_dir |
      | my-chrome-utilities | npm run package | zip           | dist     |

  # Portable build package flow 003
  Scenario Outline: Portable build package flow 003
    When the README is inspected
    Then the README documents copying the <artifact_type> package artifact to another machine
    And the README documents copying <dist_dir> to another machine
    And the README documents loading the unpacked extension in Chrome
    And the README includes smoke test steps for the installed extension

    Examples:
      | project_name         | artifact_type | dist_dir |
      | my-chrome-utilities | zip           | dist     |

  # Portable build package flow 004
  Scenario Outline: Portable build package flow 004
    When package flow documentation and scripts are inspected
    Then Chrome Web Store packaging is not present
    And signing is not present
    And auto-update behavior is not present

    Examples:
      | project_name         |
      | my-chrome-utilities |
