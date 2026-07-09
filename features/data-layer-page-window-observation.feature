# mutation-stamp: sha256=191212676fadf1a08a0304bfddb7bac10271f6c0b4ba25976c4e801ce079fece
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T14:56:28.779480904Z","feature_name":"Data layer page window observation","feature_path":"features/data-layer-page-window-observation.feature","background_hash":"97a8a64aaa748292b8377b9c3963c2e12fe45af9505e0d2b7819e08554310b72","implementation_hash":"sha256:d2934c8f0814289834f762c9036d9757d87b7b849610bd5dea1ac6e68ddc5e13","scenarios":[{"index":0,"name":"Data layer page window observation 001","scenario_hash":"33d2829dd121b93e788072c956e6276f0f139401f03f0bea941db7c125609a4c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-09T09:28:11.807053230Z"},{"index":1,"name":"Data layer page window observation 002","scenario_hash":"a8ab058282205dcfdbe1c6fd1bd28ccedadabe3f438b320a94651fd63261b8a6","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-09T09:28:11.807053230Z"},{"index":2,"name":"Data layer page window observation 003","scenario_hash":"5c4b4cc2098eb8599e7737261f64f77afa85181bb0b8eec5678dd3d8dbdcc860","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-09T09:28:11.807053230Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer page window observation

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer page window observation 001
  Scenario Outline: Data layer page window observation 001
    Given active website page <page_url> defines history array path <history_path>
    When observation starts for the active website page
    Then observer status <status> is shown for history array path <history_path>
    And the observer resolves <history_path> from the active website page window

    Examples:
      | project_name         | history_path     | page_url                | status |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | ready  |

  # Data layer page window observation 002
  Scenario Outline: Data layer page window observation 002
    Given active website page <page_url> does not define history array path <history_path>
    When observation starts for the active website page
    Then observer status <status> is shown for history array path <history_path>
    And no observer is active for history array path <history_path>

    Examples:
      | project_name         | history_path  | page_url                | status       |
      | my-chrome-utilities | queue.history | https://example.test/p/ | path missing |

  # Data layer page window observation 003
  Scenario Outline: Data layer page window observation 003
    Given active website page <page_url> defines history array path <history_path>
    When page <page_url> appends history entry <event_name> with payload <payload_label>
    Then the extension records a new observed event entry
    And the observed event entry URL is <page_url>
    And the observed event entry observer path is <history_path>
    And the page-owned history array contains entry <event_name>

    Examples:
      | project_name         | history_path     | page_url                | event_name | payload_label |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | signup     | signup-values |
