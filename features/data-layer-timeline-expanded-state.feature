# mutation-stamp: sha256=2e32502807dc497029eac2f0c200e719ef2c37b20013726795bcf1a9d08e39d7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T13:46:15.973200190Z","feature_name":"Data layer timeline expanded state","feature_path":"features/data-layer-timeline-expanded-state.feature","background_hash":"1ed406330c33164448b1b64f5e6411da604de2b6e19e02c7feda7ced47da0b2d","implementation_hash":"sha256:timeline-expanded-semantic-v2","scenarios":[{"index":0,"name":"Data layer timeline expanded state 001","scenario_hash":"197c004fefdee65455ee966fad5a5be8722578d615fee66e0aef7dd28fd988f2","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:46:15.973200190Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer timeline expanded state

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>
    And a data layer testing session is active

  # Data layer timeline expanded state 001
  Scenario Outline: Data layer timeline expanded state 001
    Given the event feed is grouped by page
    And pageload <page_url> is expanded in the side panel timeline
    And the expanded pageload uses the canonical page URL
    When observed event <event_name> is recorded for pageload <page_url>
    And the expanded-state event uses the canonical event name
    Then pageload <page_url> remains expanded
    And observed event <event_name> is visible without re-expanding pageload <page_url>

    Examples:
      | project_name         | page_url                 | event_name |
      | my-chrome-utilities | https://www.example.com/ | scroll     |
