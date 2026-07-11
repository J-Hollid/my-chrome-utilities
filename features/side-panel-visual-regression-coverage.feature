# mutation-stamp: sha256=16f5a3fe2034af4cd8926baa16cb189c29344d2ed8f0ef26085121fcb5eefa77
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T14:48:29.567626528Z","feature_name":"Side panel visual regression coverage","feature_path":"features/side-panel-visual-regression-coverage.feature","background_hash":"021c56ced56b1e280e2e853f6b9fe02c136b6d656cfb79cd83297f5f1b78fcc6","implementation_hash":"sha256:operator-interface-semantic-v2","scenarios":[{"index":0,"name":"Side panel visual regression coverage 001","scenario_hash":"e6235a5c7323fb14ab1931533a587fab6dbc71598e9a9b09eeada3eeb6723e9f","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:29.567626528Z"},{"index":1,"name":"Side panel visual regression coverage 002","scenario_hash":"c8dc28f700cc3220460da4d88a301d34a9839c4249c42bed3fe2076a0f05de69","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:29.567626528Z"},{"index":2,"name":"Side panel visual regression coverage 003","scenario_hash":"7171542d1f27c5845fe6104638196fd5f4b77ca03042e5acc2b04c536db81d0d","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:29.567626528Z"},{"index":3,"name":"Side panel visual regression coverage 004","scenario_hash":"1b29508d256a49254e42f44dcbd55e497d1023256492656612f314b1c6c99141","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:29.567626528Z"}]}
# acceptance-mutation-manifest-end

Feature: Side panel visual regression coverage

  Background:
    Given a repository for project <project_name>
    And deterministic side panel fixture data is available

  # Side panel visual regression coverage 001
  Scenario Outline: Side panel visual regression coverage 001
    When baseline image coverage is generated for view <view_name> in state <view_state>
    Then the view is captured at available widths 360, 520, and 720 CSS pixels
    And each width is captured in light and dark themes
    And timestamps, generated ids, and active-page URLs use deterministic fixture values

    Examples:
      | project_name         | view_name | view_state          |
      | my-chrome-utilities | Live      | event list          |
      | my-chrome-utilities | Live      | event inspector     |
      | my-chrome-utilities | Library   | template editor     |
      | my-chrome-utilities | Library   | sequence editor     |
      | my-chrome-utilities | Sessions  | session detail      |
      | my-chrome-utilities | Schemas   | schema detail       |
      | my-chrome-utilities | Hotkeys   | command assignments |

  # Side panel visual regression coverage 002
  Scenario Outline: Side panel visual regression coverage 002
    When exceptional-state fixture <view_state> is captured in view <view_name>
    Then the state title, explanation, recovery action, and surrounding navigation are visible
    And the capture contains no unexpected horizontal overflow or clipped control label

    Examples:
      | project_name         | view_name | view_state               |
      | my-chrome-utilities | Live      | source connection failed |
      | my-chrome-utilities | Library   | no matching templates    |
      | my-chrome-utilities | Sessions  | no saved sessions        |
      | my-chrome-utilities | Schemas   | invalid schema draft     |
      | my-chrome-utilities | Hotkeys   | key sequence conflict    |

  # Side panel visual regression coverage 003
  Scenario Outline: Side panel visual regression coverage 003
    Given an approved baseline exists for view <view_name> at width <panel_width> in theme <theme_name>
    When the current capture differs from the approved baseline beyond the configured tolerance
    Then visual regression verification fails
    And a current image, expected image, and visual difference are retained for review
    And accepting the difference requires an explicit baseline update

    Examples:
      | project_name         | view_name | panel_width | theme_name |
      | my-chrome-utilities | Live      | 360 px      | light      |
      | my-chrome-utilities | Library   | 720 px      | dark       |

  # Side panel visual regression coverage 004
  Scenario Outline: Side panel visual regression coverage 004
    When focused and selected states are captured for component <component_name>
    Then the baseline shows the visible focus indicator
    And selected, disabled, error, and destructive variants are covered when supported by <component_name>
    And text and icons remain distinguishable in light and dark themes

    Examples:
      | project_name         | component_name    |
      | my-chrome-utilities | workspace tab     |
      | my-chrome-utilities | source control    |
      | my-chrome-utilities | event row         |
      | my-chrome-utilities | primary action    |
