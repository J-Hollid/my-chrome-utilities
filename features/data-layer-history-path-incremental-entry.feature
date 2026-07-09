Feature: Data layer history path incremental entry

  Background:
    Given a repository for project <project_name>
    And the data layer testing settings are opened

  # Data layer history path incremental entry 001
  Scenario Outline: Data layer history path incremental entry 001
    When the user types history array path sequence <first_text>, <intermediate_text>, then <history_path>
    Then the path field preserves intermediate text <intermediate_text>
    And the completed path field and configured history array path are <history_path>

    Examples:
      | project_name         | first_text | intermediate_text | history_path  |
      | my-chrome-utilities | event      | event.            | event.history |
