# mutation-stamp: sha256=54a547a9133d21e93519817b19efb7a52ae6df32da9ffd712bb2cf95166773b2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T14:45:43.805940460Z","feature_name":"Data layer active page read result","feature_path":"features/data-layer-active-page-read-result.feature","background_hash":"97a8a64aaa748292b8377b9c3963c2e12fe45af9505e0d2b7819e08554310b72","implementation_hash":"sha256:6d87248c6a9b0d2ae3936cd327e36b850d33859f14a0dbf0afa9d53bae7f205e","scenarios":[{"index":0,"name":"Data layer active page read result 001","scenario_hash":"aa492df49d78ae576b5dce569deaa240d3cdf5d042740222e477cf18045fda02","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-09T10:23:58.711943353Z"},{"index":1,"name":"Data layer active page read result 002","scenario_hash":"f8828aa6c9616d14558d55225bbca99e6fd2f4599e88fc54ca89655f6b22ab0b","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-09T10:23:58.711943353Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer active page read result

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer active page read result 001
  Scenario Outline: Data layer active page read result 001
    Given active website page <page_url> defines history array path <history_path> with existing entry <event_name>
    When the extension reads history array path <history_path> from the active website page
    Then the active page read succeeds
    And the active page read result includes history array path <history_path>
    And the active page read result is not empty
    And observer status <status> is shown for history array path <history_path>

    Examples:
      | project_name         | history_path     | page_url                | event_name | status |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | signup     | ready  |

  # Data layer active page read result 002
  Scenario Outline: Data layer active page read result 002
    Given active website page <page_url> cannot be read by the extension
    When observation starts for the active website page
    Then page access status <page_access_status> is shown
    And observer status is not <path_status>
    And no empty page object is used as a successful page read

    Examples:
      | project_name         | history_path     | page_url                | page_access_status     | path_status  |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | page access unavailable | path missing |
