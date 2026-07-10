# mutation-stamp: sha256=12515e304ba3de8914306ef7ea09f46636b541a19018da28bba62cb1d186bd32
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T17:19:45.762308974Z","feature_name":"Data layer active tab page context","feature_path":"features/data-layer-active-tab-page-context.feature","background_hash":"6731a1e245b2a7a499466026a7d4c3e1b15a3c2b432db7b127184119a650a154","implementation_hash":"sha256:architect-semantic-review-v5","scenarios":[{"index":0,"name":"Data layer active tab page context 001","scenario_hash":"77597642a39131a6c8939f4fc0efaef51a62f7e56eff72c02ac8055ca4d97c09","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:19:45.762308974Z"},{"index":1,"name":"Data layer active tab page context 002","scenario_hash":"a7ce8d0aa40a7282c686513a8c7c82865a680f0856fc158c4ecf6eaa6d9a1cba","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:19:45.762308974Z"},{"index":2,"name":"Data layer active tab page context 003","scenario_hash":"7c74b4f6cbbd202a2529bb0e6c198c6b569479ba80165a65be98885629367118","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:19:45.762308974Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer active tab page context

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And the side panel is open at <side_panel_url>

  # Data layer active tab page context 001
  Scenario Outline: Data layer active tab page context 001
    Given the selected observation target URL is <page_url>
    When command <command_id> is run from the side panel
    Then the data layer testing session current URL is <page_url>
    And no timeline entry uses URL <side_panel_url>

    Examples:
      | project_name         | history_path  | side_panel_url                           | command_id               | page_url                |
      | my-chrome-utilities | queue.history | chrome-extension://extension/side-panel.html | data-layer.start-testing | https://example.test/p/ |

  # Data layer active tab page context 002
  Scenario Outline: Data layer active tab page context 002
    Given a data layer testing session is active
    And the selected observation target URL is <page_url>
    When page <page_url> appends history entry <event_name> with payload <payload_label>
    Then the extension records a new observed event entry
    And the observed event entry URL is <page_url>
    And no timeline entry uses URL <side_panel_url>
    And the timeline entry for <event_name> shows page URL <page_url>

    Examples:
      | project_name         | history_path  | side_panel_url                           | page_url                | event_name | payload_label |
      | my-chrome-utilities | queue.history | chrome-extension://extension/side-panel.html | https://example.test/p/ | signup     | signup-values |

  # Data layer active tab page context 003
  Scenario Outline: Data layer active tab page context 003
    Given a data layer testing session is active
    When the selected target tab navigates from <start_url> to page <page_url>
    And page <page_url> appends history entry <event_name> with payload <payload_label>
    Then the extension records entry <event_name> with URL <page_url>
    And no timeline entry uses URL <side_panel_url>

    Examples:
      | project_name         | history_path  | side_panel_url                           | start_url             | page_url                   | event_name | payload_label   |
      | my-chrome-utilities | queue.history | chrome-extension://extension/side-panel.html | https://example.test/ | https://example.test/cart/ | purchase   | purchase-values |
