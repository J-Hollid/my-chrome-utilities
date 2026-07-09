# mutation-stamp: sha256=77ad844e47aaa6b0f08f3dae1e185822a5abc17ac0a9394b8e71eb5a7e0f61d2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T20:35:42.500345597Z","feature_name":"Data layer history path incremental entry","feature_path":"features/data-layer-history-path-incremental-entry.feature","background_hash":"71750cfab5800f33ad41c4fb360850821efe9aa6e09cbd891fa49db6dc5828a3","implementation_hash":"sha256:659b603e57b40dc01247b42f84011c34d611a22c26f35991851ff385fb553e01","scenarios":[{"index":0,"name":"Data layer history path incremental entry 001","scenario_hash":"a7d38bc0880d1033ee65594c74520dc6988139d2ffc80505e82fde040ceadb94","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-09T14:45:15.578915903Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer history path incremental entry

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>
    And the data layer testing settings are opened

  # Data layer history path incremental entry 001
  Scenario Outline: Data layer history path incremental entry 001
    When the user types history array path sequence <first_text>, <intermediate_text>, then <history_path>
    Then the path field preserves intermediate text <intermediate_text>
    And the completed path field and configured history array path are <history_path>
    And the path field records the canonical first text
    And the path field preserves the canonical intermediate text
    And the completed path field and configured history array path use the canonical history path

    Examples:
      | project_name         | first_text | intermediate_text | history_path  |
      | my-chrome-utilities | event      | event.            | event.history |
