Feature: Data layer Live session summary

  Background:
    Given a repository for project my-chrome-utilities
    And the Data Layer Live view is displayed

  # Data layer Live session summary 001
  Scenario Outline: Data layer Live session summary 001
    Given the session summary represents testing state <testing_state> for target page <page_title> at <page_url>
    And observer path <observer_path> has captured <event_count> events from <connected_source_count> connected sources
    When the Live session summary is displayed
    Then the session status indicator shows <status_label>
    And the status indicator is visually distinct from the summary metadata and identifiable without color alone
    And separately labelled fields show Target page <page_title>, Page URL <page_url>, Observer path <observer_path>, Captured events <event_count>, and Connected sources <connected_source_count>
    And the summary values are not serialized into one sentence

    Examples:
      | testing_state | status_label | page_title           | page_url                                 | observer_path | event_count | connected_source_count |
      | Active        | Capturing    | Checkout             | https://shop.example.test/checkout       | event.history | 42          | 3                      |
      | Paused        | Paused       | Order confirmation   | https://shop.example.test/confirmation   | dataLayer     | 7           | 2                      |
      | Detached      | Detached     | Cart                  | https://shop.example.test/cart           | queue.history | 0           | 0                      |

  # Data layer Live session summary 002
  Scenario Outline: Data layer Live session summary 002
    Given target page <page_title> has canonical URL <page_url>
    And the extension side panel has URL <side_panel_url>
    And the side panel is <panel_width> CSS px wide
    When the Live session summary is displayed
    Then the Page URL field contains <page_url>
    And the Page URL field does not contain <side_panel_url>
    And the displayed URL wraps or truncates within its field without widening the side panel or causing horizontal document scrolling
    And the complete URL <page_url> is available from an accessible Copy page URL control

    Examples:
      | page_title | page_url                                                                                         | side_panel_url                               | panel_width |
      | Checkout   | https://shop.example.test/checkout?campaign=summer-sale&audience=returning-customers&variant=blue | chrome-extension://abcdefghijkl/side-panel.html | 320         |
