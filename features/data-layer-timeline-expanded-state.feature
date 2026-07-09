# mutation-stamp: sha256=d049dbb9b81dd15d3335c3f616def4ee17b3159055e80b06cb541b31e421a3ee
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T21:41:48.388153225Z","feature_name":"Data layer timeline expanded state","feature_path":"features/data-layer-timeline-expanded-state.feature","background_hash":"1ed406330c33164448b1b64f5e6411da604de2b6e19e02c7feda7ced47da0b2d","implementation_hash":"sha256:d0c7ec892a10eb624d6234334298614a4c2a0403e61021ab638dbf67738b69ac","scenarios":[{"index":0,"name":"Data layer timeline expanded state 001","scenario_hash":"a06085f02f04158c7b42b0aa2e8291894e5feb6a614755ee1b86daee6f0bad5a","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-09T21:41:37.335607665Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer timeline expanded state

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>
    And a data layer testing session is active

  # Data layer timeline expanded state 001
  Scenario Outline: Data layer timeline expanded state 001
    Given pageload <page_url> is expanded in the side panel timeline
    And the expanded pageload uses the canonical page URL
    When observed event <event_name> is recorded for pageload <page_url>
    And the expanded-state event uses the canonical event name
    Then pageload <page_url> remains expanded
    And observed event <event_name> is visible without re-expanding pageload <page_url>

    Examples:
      | project_name         | page_url                 | event_name |
      | my-chrome-utilities | https://www.example.com/ | scroll     |
