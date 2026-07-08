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
