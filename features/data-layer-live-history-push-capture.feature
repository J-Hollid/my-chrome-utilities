# mutation-stamp: sha256=f447d8ddc3f57b0e1ee0190af1cf6bc8aa1bbe9c275f22ac00583efa4505aebd
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T14:56:28.712894192Z","feature_name":"Data layer live history push capture","feature_path":"features/data-layer-live-history-push-capture.feature","background_hash":"51ac8f37768a49d2796d370904426a99bd2d03102707e7775973232f92024bf4","implementation_hash":"sha256:753c3035014201427f51acdbf69489f755543e83f89494ee88b93e22c4f7d46b","scenarios":[{"index":0,"name":"Data layer live history push capture 001","scenario_hash":"9346023e558e02fe075c5e501c1b6be81a70910f2495f7dd3e2700d10e4a6759","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-09T14:33:07.599025657Z"},{"index":1,"name":"Data layer live history push capture 002","scenario_hash":"521a451b8a008a361570e59aaf915a842b6265305f76f658851a9a762d7c7b4c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-09T14:33:07.599025657Z"}]}
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
    And data layer testing is started from the side panel for the active website page
    When the active website page pushes history entry <event_name> with payload <payload_label>
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
    When data layer testing is started from the side panel for the active website page
    Then the side panel session timeline shows initial page entry <page_url> and observed event <event_name>
    And the observed event entry matches page URL <page_url>, observer path <history_path>, and payload <payload_label>
    And the live capture entry uses the canonical page URL
    And the live capture entry uses the canonical history path
    And the live capture entry records signup event
    And the live capture entry records queued signup payload

    Examples:
      | project_name         | history_path     | page_url                 | event_name | payload_label |
      | my-chrome-utilities | dataLayerHistory | https://www.example.com/ | signup     | signup-payload |
