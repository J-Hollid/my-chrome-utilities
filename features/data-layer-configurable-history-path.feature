# mutation-stamp: sha256=cff235947bdd8cf9ba1f23e1e959b9c6744bef015da406af98874615d29d191e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T20:35:42.284927853Z","feature_name":"Data layer configurable history path","feature_path":"features/data-layer-configurable-history-path.feature","background_hash":"7010dbc38239bc7043db7168e3ce76337d3bc72582407db6296288f1ba4d4743","implementation_hash":"sha256:ef2490e038e92a6c18d5089b7d919a8b8b00acac38158cf88317f49820b0f1c6","scenarios":[{"index":0,"name":"Data layer configurable history path 001","scenario_hash":"7fa01453f121a52b65d5f2ddf8535d47f21f2555c63306c191c3cd3bb072ba73","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-08T20:42:45.789858004Z"},{"index":1,"name":"Data layer configurable history path 002","scenario_hash":"c9dbd33de6adcd4fc34c676e732390ac623a2884b1e905393ac237773cc81e10","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-08T20:42:45.789858004Z"},{"index":2,"name":"Data layer configurable history path 003","scenario_hash":"71365d4bfdaa66a557d8b9489c8206b070f15958691564d699e330486e8997f1","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T20:42:45.789858004Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer configurable history path

  Background:
    Given a repository for project <project_name>

  # Data layer configurable history path 001
  Scenario Outline: Data layer configurable history path 001
    When the data layer testing settings are opened
    Then the user can enter history array path <history_path>
    And Settings displays value <history_path>
    And value <history_path> survives a side panel reload

    Examples:
      | project_name         | history_path             |
      | my-chrome-utilities | queue.history            |
      | my-chrome-utilities | test.test                |
      | my-chrome-utilities | some.deep.object.history |

  # Data layer configurable history path 002
  Scenario Outline: Data layer configurable history path 002
    Given the target probe uses history array path <history_path>
    When the target probe completes
    Then labelled readiness <status> appears
    And no page script error is caused by the path check

    Examples:
      | project_name         | history_path  | status       |
      | my-chrome-utilities | queue.history | Ready            |
      | my-chrome-utilities | missing.path  | Waiting for path |
      | my-chrome-utilities | queue.value   | Error            |

  # Data layer configurable history path 003
  Scenario Outline: Data layer configurable history path 003
    When advanced configuration controls are reviewed
    Then neither config import nor config export is present

    Examples:
      | project_name         |
      | my-chrome-utilities |
