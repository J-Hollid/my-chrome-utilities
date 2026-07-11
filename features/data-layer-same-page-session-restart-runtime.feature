Feature: Data layer same-page session restart runtime

  Background:
    Given the built extension side panel is running in a browser
    And testing is attached to tab <tab_id> at <page_url>
    And history array <history_path> contains <existing_events>

  # Data layer same-page session restart runtime 001
  Scenario Outline: Data layer same-page session restart runtime 001
    Given the active testing session has captured <existing_events>
    When the user ends testing
    And starts testing again on the same tab and unchanged page
    Then a new testing session with a distinct session identity is active
    And the prior session timeline is cleared before current page history is imported
    And the new Live feed contains <existing_events> exactly once in history order
    And no event entry from the ended session persists in the new session
    And history array <history_path> on the target page remains unchanged

    Examples:
      | tab_id | page_url                  | history_path  | existing_events      |
      | 42     | https://example.test/home | event.history | pageview, banner view |

  # Data layer same-page session restart runtime 002
  Scenario Outline: Data layer same-page session restart runtime 002
    Given testing was ended and restarted on the same tab and unchanged page
    When event <new_event> is appended to <history_path>
    Then <new_event> is captured exactly once in the new testing session
    And each event from <existing_events> remains present exactly once in the new Live feed

    Examples:
      | tab_id | page_url                  | history_path  | existing_events      | new_event |
      | 42     | https://example.test/home | event.history | pageview, banner view | purchase  |

  # Data layer same-page session restart runtime 003
  Scenario Outline: Data layer same-page session restart runtime 003
    Given the active testing session captured <first_page_events> on <page_url>
    When the selected target tab navigates to <next_page_url>
    And events <next_page_events> are observed there
    Then the same testing session identity remains active
    And the session timeline retains <first_page_events> under <page_url>
    And the session timeline contains <next_page_events> under <next_page_url>
    And navigation does not apply the same-page new-session reset

    Examples:
      | tab_id | page_url                  | history_path  | existing_events | first_page_events | next_page_url                  | next_page_events |
      | 42     | https://example.test/home | event.history | pageview        | pageview          | https://example.test/checkout | checkout, purchase |
