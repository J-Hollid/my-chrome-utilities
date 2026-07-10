# mutation-stamp: sha256=4ca014ade2911955b2a62fc282acdf526d1a4a7136095cf3c05b35e9bb121ad4
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T17:17:36.753933264Z","feature_name":"Data layer active page read result","feature_path":"features/data-layer-active-page-read-result.feature","background_hash":"97a8a64aaa748292b8377b9c3963c2e12fe45af9505e0d2b7819e08554310b72","implementation_hash":"sha256:architect-semantic-review-v4","scenarios":[{"index":0,"name":"Data layer active page read result 001","scenario_hash":"63ed4f373483643125bcc8d82371246081a7b4db30bac0f181fd922daa80faf9","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:17:36.753933264Z"},{"index":1,"name":"Data layer active page read result 002","scenario_hash":"14a42cb2d574707db6350115107eb683efc2296ed8ed4afc2d68c64fc34c05f4","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:17:36.753933264Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer active page read result

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer active page read result 001
  Scenario Outline: Data layer active page read result 001
    Given selected target page <page_url> defines history array path <history_path> with existing entry <event_name>
    When the extension reads history array path <history_path> from the selected target page
    Then the target page read succeeds
    And the target page read result includes history array path <history_path>
    And the target page read result is not empty
    And observer status <status> is shown for history array path <history_path>

    Examples:
      | project_name         | history_path     | page_url                | event_name | status |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | signup     | ready  |

  # Data layer active page read result 002
  Scenario Outline: Data layer active page read result 002
    Given selected target page <page_url> cannot be read by the extension
    When observation starts for the selected target page
    Then page access status <page_access_status> is shown
    And observer status is not <path_status>
    And no empty page object is used as a successful page read

    Examples:
      | project_name         | history_path     | page_url                | page_access_status     | path_status  |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | page access unavailable | path missing |
