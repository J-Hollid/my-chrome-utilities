# mutation-stamp: sha256=90e3627001a20f767c04a4fa15a6df5002e11c428202e53d0e38bcdfb8004502
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T14:52:27.950317168Z","feature_name":"Data layer active tab page context","feature_path":"features/data-layer-active-tab-page-context.feature","background_hash":"6731a1e245b2a7a499466026a7d4c3e1b15a3c2b432db7b127184119a650a154","implementation_hash":"sha256:48ee6e9d5a271e29b7e3e2381e4b312af09ce9b0fb16049b6e05367433896b7d","scenarios":[{"index":0,"name":"Data layer active tab page context 001","scenario_hash":"994cbfad12ac54fdc8388fd6a840eed4aa827c941d6f9b9f9b071e543431af81","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-08T22:18:20.507440432Z"},{"index":1,"name":"Data layer active tab page context 002","scenario_hash":"c2f3f098ec55eef892e62d74000cdc7ae6a9f6790e2f9603227a72352266ef53","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-08T22:18:20.507440432Z"},{"index":2,"name":"Data layer active tab page context 003","scenario_hash":"e30d3428ab57939ab1ae8454fb5f527c87f30ed6a5bb5468ff21a0a88734ee3f","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-07-08T22:18:20.507440432Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer active tab page context

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And the side panel is open at <side_panel_url>

  # Data layer active tab page context 001
  Scenario Outline: Data layer active tab page context 001
    Given the active browser tab URL is <page_url>
    When command <command_id> is run from the side panel
    Then the data layer testing session current URL is <page_url>
    And no timeline entry uses URL <side_panel_url>

    Examples:
      | project_name         | history_path  | side_panel_url                           | command_id               | page_url                |
      | my-chrome-utilities | queue.history | chrome-extension://extension/side-panel.html | data-layer.start-testing | https://example.test/p/ |

  # Data layer active tab page context 002
  Scenario Outline: Data layer active tab page context 002
    Given a data layer testing session is active
    And the active browser tab URL is <page_url>
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
    When the active tab navigates from <start_url> to page <page_url>
    And page <page_url> appends history entry <event_name> with payload <payload_label>
    Then the extension records entry <event_name> with URL <page_url>
    And no timeline entry uses URL <side_panel_url>

    Examples:
      | project_name         | history_path  | side_panel_url                           | start_url             | page_url                   | event_name | payload_label   |
      | my-chrome-utilities | queue.history | chrome-extension://extension/side-panel.html | https://example.test/ | https://example.test/cart/ | purchase   | purchase-values |
