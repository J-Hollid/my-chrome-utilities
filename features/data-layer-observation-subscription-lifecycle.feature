Feature: Data layer observation subscription lifecycle

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active on page <page_url>
    And history array path <history_path> is configured

  # Data layer observation subscription lifecycle 001
  Scenario Outline: Data layer observation subscription lifecycle 001
    Given the history array contains existing events <existing_events> before observation starts
    When observation attaches and event <live_event> is pushed afterward
    Then existing events <existing_events> are imported once in array order
    And event <live_event> is captured once after the imported events
    And the boundary between existing history and subsequent pushes does not omit or duplicate an event

    Examples:
      | project_name         | page_url                 | history_path  | existing_events        | live_event |
      | my-chrome-utilities | https://www.example.com/ | event.history | pageview, offer_view    | purchase   |

  # Data layer observation subscription lifecycle 002
  Scenario Outline: Data layer observation subscription lifecycle 002
    Given existing event <existing_event> was already imported from the current page and history array
    When observation is restarted for the same page, array, and <history_path>
    Then <existing_event> is not appended to the session again
    And exactly one active subscription observes <history_path>
    When event <live_event> is pushed
    Then <live_event> is captured once

    Examples:
      | project_name         | page_url                 | history_path  | existing_event | live_event |
      | my-chrome-utilities | https://www.example.com/ | event.history | pageview       | purchase   |

  # Data layer observation subscription lifecycle 003
  Scenario Outline: Data layer observation subscription lifecycle 003
    Given event <event_name> was captured on page <first_page>
    When the active tab navigates to new page <page_url> with a new history array containing <event_name>
    Then the new page's existing history is imported once
    And both occurrences of <event_name> remain distinct and retain their page URLs
    And exactly one active subscription observes <history_path> on <page_url>

    Examples:
      | project_name         | first_page                | page_url                         | history_path  | event_name |
      | my-chrome-utilities | https://www.example.com/  | https://www.example.com/checkout | event.history | pageview   |

  # Data layer observation subscription lifecycle 004
  Scenario Outline: Data layer observation subscription lifecycle 004
    Given observation start request <first_request> is still pending
    When newer start request <second_request> is made for the same page and source
    Then request <second_request> becomes the current observation
    And request <first_request> cannot leave an active listener or page hook after it completes
    And one page push produces one captured event and one Live feed row

    Examples:
      | project_name         | page_url                 | history_path  | first_request       | second_request      |
      | my-chrome-utilities | https://www.example.com/ | event.history | path input refresh  | manual restart      |

  # Data layer observation subscription lifecycle 005
  Scenario Outline: Data layer observation subscription lifecycle 005
    Given observation is active for history array path <old_path>
    When the configured history array path changes to <history_path>
    Then the subscription for <old_path> is removed before <history_path> becomes active
    And pushes to <old_path> are no longer captured
    And one push to <history_path> produces one captured event

    Examples:
      | project_name         | page_url                 | old_path         | history_path     |
      | my-chrome-utilities | https://www.example.com/ | window.dataLayer | event.history    |

  # Data layer observation subscription lifecycle 006
  Scenario Outline: Data layer observation subscription lifecycle 006
    Given observation is active for <history_path>
    When session action <session_action> completes
    Then its runtime listener and page hook are removed
    And the page array's original push behavior remains restored when no observer uses it
    And later pushes are not appended to the ended session or Live feed

    Examples:
      | project_name         | page_url                 | history_path  | session_action |
      | my-chrome-utilities | https://www.example.com/ | event.history | Stop capture   |
      | my-chrome-utilities | https://www.example.com/ | event.history | End testing    |
