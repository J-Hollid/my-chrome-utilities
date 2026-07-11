Feature: Data layer Live session summary

  Background:
    Given a repository for project my-chrome-utilities
    And the Data Layer Live view is displayed

  # Data layer Live session summary 001
  Scenario Outline: Data layer Live session summary 001
    Given the session summary represents testing state <testing_state> for target page <page_title> at <page_url>
    And observer path <observer_path> has observer state <observer_status> after capturing <event_count> events from <connected_source_count> connected sources
    When the Live session summary is displayed
    Then the summary shows exactly one session status <session_status> and one observer status <observer_status>
    And both status indicators are visually distinct from the summary metadata and identifiable without color alone
    And the status indicators appear before Target page <page_title> and Captured events <event_count>
    And Target page <page_title> and Captured events <event_count> are visible without expanding Details
    And a collapsed Details disclosure contains only Page URL <page_url>, Observer path <observer_path>, and Connected sources <connected_source_count>
    And the summary values are not serialized into one sentence
    When the operator expands Details
    Then its three technical values are revealed as separately labelled fields
    And the primary status, target page, and captured-event count remain visible

    Examples:
      | testing_state | session_status | observer_status  | page_title           | page_url                                 | observer_path | event_count | connected_source_count |
      | Active        | Capturing      | Connected        | Checkout             | https://shop.example.test/checkout       | event.history | 42          | 3                      |
      | Active        | Capturing      | Waiting for path | Product detail       | https://shop.example.test/products/blue  | dataLayer     | 12          | 1                      |
      | Paused        | Paused         | Error            | Order confirmation   | https://shop.example.test/confirmation   | queue.history | 7           | 2                      |
      | Ended         | Ended          | Disconnected     | Cart                  | https://shop.example.test/cart           | analytics     | 0           | 0                      |

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

  # Data layer Live session summary 003
  Scenario Outline: Data layer Live session summary 003
    Given canonical statuses are <session_status> for the session and <observer_status> for the observer
    And equivalent legacy status fragments <duplicate_fragments> could describe the same state
    When persistent Live status content is displayed
    Then persistent content contains session status <session_status> and observer status <observer_status> exactly once each
    And equivalent fragments <duplicate_fragments> are absent from persistent page content
    When action <action_name> produces result <action_result>
    Then temporary notification <notification> is announced without replacing either canonical status
    And notification <notification> does not remain as another persistent status message

    Examples:
      | session_status | observer_status | duplicate_fragments                                                   | action_name   | action_result | notification    |
      | Capturing      | Connected       | observation started, event history connected, session is live         | Start testing | succeeded     | Testing started |
      | Paused         | Error           | attached to target, active data layer attached, observation connected | Pause capture | failed        | Pause failed    |

  # Data layer Live session summary 004
  Scenario Outline: Data layer Live session summary 004
    Given the summary reports session status <session_status>, observer status <observer_status>, target page Checkout, and 42 captured events
    And a long event inspector requires the Live view to scroll
    When the operator scrolls beyond the initial session summary position
    Then session status <session_status> and observer status <observer_status> remain visible at the start of the stable session header
    And the stable header continues to expose Checkout and 42 captured events
    And the scrolling inspector does not cover the stable session header

    Examples:
      | session_status | observer_status |
      | Capturing      | Connected       |
      | Ended          | Disconnected    |

  # Data layer Live session summary 005
  Scenario Outline: Data layer Live session summary 005
    Given <panel_width> CSS px are available for the Live session summary
    And Details is expanded
    When the Live session summary is displayed
    Then primary and secondary metadata each use <metadata_columns> columns
    And each metadata item keeps its label and value together
    And long values wrap or truncate within their own item without overlapping another item
    And the summary causes no horizontal document scrolling

    Examples:
      | panel_width | metadata_columns |
      | 360         | 1                |
      | 520         | 2                |
      | 720         | 3                |
