Feature: Data layer history path text entry

  Background:
    Given a repository for project <project_name>
    And the data layer testing settings are opened

  # Data layer history path text entry 001
  Scenario Outline: Data layer history path text entry 001
    When the user enters history array path <history_path> in the path field
    Then the path field value is <history_path>
    And the configured history array path is <history_path>

    Examples:
      | project_name         | history_path             |
      | my-chrome-utilities | test_obj.history         |
      | my-chrome-utilities | some.deep.object.history |
