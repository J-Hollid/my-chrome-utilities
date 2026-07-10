# mutation-stamp: sha256=9119f1d8839a67beb493da7ddf329f116e2e3a305eb3671e8c8177049d86de48
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T17:24:39.674765342Z","feature_name":"Data layer page window observation","feature_path":"features/data-layer-page-window-observation.feature","background_hash":"97a8a64aaa748292b8377b9c3963c2e12fe45af9505e0d2b7819e08554310b72","implementation_hash":"sha256:architect-semantic-review-v7","scenarios":[{"index":0,"name":"Data layer page window observation 001","scenario_hash":"ed34c3f476678ba068e8334ab2fd825cd2a7081353593df0815800ccf6c43d32","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:24:39.674765342Z"},{"index":1,"name":"Data layer page window observation 002","scenario_hash":"c29090982ed1b3399a23e583c135377fc220bdae6334b5f8a9300e1573c57442","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:24:39.674765342Z"},{"index":2,"name":"Data layer page window observation 003","scenario_hash":"d8063c64f70f9d42c371b4dbf8a6cfda6cf5b3333203ea311b6b743d11d4b7c4","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:24:39.674765342Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer page window observation

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer page window observation 001
  Scenario Outline: Data layer page window observation 001
    Given selected target page <page_url> defines history array path <history_path>
    When observation starts for the selected target page
    Then observer status <status> is shown for history array path <history_path>
    And the observer resolves <history_path> from the selected target page window

    Examples:
      | project_name         | history_path     | page_url                | status |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | ready  |

  # Data layer page window observation 002
  Scenario Outline: Data layer page window observation 002
    Given selected target page <page_url> does not define history array path <history_path>
    When observation starts for the selected target page
    Then observer status <status> is shown for history array path <history_path>
    And no observer is active for history array path <history_path>

    Examples:
      | project_name         | history_path  | page_url                | status       |
      | my-chrome-utilities | queue.history | https://example.test/p/ | path missing |

  # Data layer page window observation 003
  Scenario Outline: Data layer page window observation 003
    Given selected target page <page_url> defines history array path <history_path>
    When page <page_url> appends history entry <event_name> with payload <payload_label>
    Then the extension records a new observed event entry
    And the observed event entry URL is <page_url>
    And the observed event entry observer path is <history_path>
    And the page-owned history array contains entry <event_name>

    Examples:
      | project_name         | history_path     | page_url                | event_name | payload_label |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | signup     | signup-values |
