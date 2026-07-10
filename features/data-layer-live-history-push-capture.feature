# mutation-stamp: sha256=4b487e21141b0484d6ce609601649c83107b1a6dcff4c2900f4c315d9837c5c9
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T17:24:38.362063956Z","feature_name":"Data layer live history push capture","feature_path":"features/data-layer-live-history-push-capture.feature","background_hash":"51ac8f37768a49d2796d370904426a99bd2d03102707e7775973232f92024bf4","implementation_hash":"sha256:architect-semantic-review-v7","scenarios":[{"index":0,"name":"Data layer live history push capture 001","scenario_hash":"0245124faef208479cceb61787985af88b281117fd0b0a14e82aa3ba94a547c9","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:24:38.362063956Z"},{"index":1,"name":"Data layer live history push capture 002","scenario_hash":"e22034dd853f8516959b1d392e883c3d96d8c1c51aa16a1448429dc15bb0ccff","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:24:38.362063956Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer live history push capture

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>
    And history array path <history_path> is configured

  # Data layer live history push capture 001
  Scenario Outline: Data layer live history push capture 001
    Given page <page_url> has no queued data layer entries at <history_path>
    And data layer testing is started from the side panel for the selected target page
    When the selected target page pushes history entry <event_name> with payload <payload_label>
    Then the side panel session timeline shows initial page entry <page_url> and observed event <event_name>
    And the observed event entry matches page URL <page_url>, observer path <history_path>, and payload <payload_label>
    And the live capture entry uses the canonical page URL
    And the live capture entry uses the canonical history path
    And the live capture entry records signup event
    And the live capture entry records signup values payload

    Examples:
      | project_name         | history_path     | page_url                 | event_name | payload_label |
      | my-chrome-utilities | dataLayerHistory | https://www.example.com/ | signup     | signup-values |

  # Data layer live history push capture 002
  Scenario Outline: Data layer live history push capture 002
    Given before testing starts, page <page_url> has queued data layer entry <event_name> with payload <payload_label> at <history_path>
    When data layer testing is started from the side panel for the selected target page
    Then the side panel session timeline shows initial page entry <page_url> and observed event <event_name>
    And the observed event entry matches page URL <page_url>, observer path <history_path>, and payload <payload_label>
    And the live capture entry uses the canonical page URL
    And the live capture entry uses the canonical history path
    And the live capture entry records signup event
    And the live capture entry records queued signup payload

    Examples:
      | project_name         | history_path     | page_url                 | event_name | payload_label |
      | my-chrome-utilities | dataLayerHistory | https://www.example.com/ | signup     | signup-payload |
