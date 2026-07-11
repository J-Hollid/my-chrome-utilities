Feature: Data layer Live pathname visits

  Background:
    Given a repository for project my-chrome-utilities
    And a data layer testing session is active

  # Data layer Live pathname visits 001
  Scenario: Data layer Live pathname visits 001
    Given these events were captured in chronological order
      | event id | event name | page URL                                                | capture time |
      | event-1  | pageview   | https://shop.example.test/products?campaign=summer#top | 10:00:00     |
      | event-2  | offer      | https://shop.example.test/products?campaign=summer#deal | 10:01:00     |
      | event-3  | pageview   | https://shop.example.test/checkout?step=address         | 10:02:00     |
      | event-4  | purchase   | https://shop.example.test/checkout?step=complete#thanks | 10:03:00     |
      | event-5  | pageview   | https://shop.example.test/products?returning=true       | 10:04:00     |
    When the Live event feed is displayed
    Then contiguous pathname visits are shown in this order
      | visit       | pathname  | latest capture time | event count | event ids newest first |
      | products-2  | /products | 10:04:00            | 1           | event-5                |
      | checkout-1  | /checkout | 10:03:00            | 2           | event-4, event-3       |
      | products-1  | /products | 10:01:00            | 2           | event-2, event-1       |
    And returning to /products creates products-2 without merging products-1
    And each block heading excludes query strings and fragments
    And each event detail retains its complete canonical page URL

  # Data layer Live pathname visits 002
  Scenario Outline: Data layer Live pathname visits 002
    Given the first visit is /checkout with purchase at its head
    When event <new_event> is captured on <captured_pathname>
    Then the top visit pathname is <expected_top_pathname>
    And the first event under <expected_top_pathname> is <new_event>
    And the feed contains <checkout_visit_count> /checkout visits and <confirmation_visit_count> /confirmation visits
    And purchase remains in the existing /checkout visit

    Examples:
      | new_event    | captured_pathname | expected_top_pathname | checkout_visit_count | confirmation_visit_count |
      | confirmation | /checkout         | /checkout             | 1                    | 0                        |
      | pageview     | /confirmation     | /confirmation         | 1                    | 1                        |

  # Data layer Live pathname visits 003
  Scenario Outline: Data layer Live pathname visits 003
    Given operator context is <exploration_action> with viewport marker 960 CSS px
    When events confirmation and receipt are captured in a newer pathname visit
    Then keyboard focus and feed scroll position 960 CSS px remain unchanged
    And a New events control reports 2 new events without moving the viewport
    When the operator activates New events
    Then focus moves to the receipt row under the first pathname heading

    Examples:
      | exploration_action          |
      | reads an older event         |
      | keeps an inspector open      |
