Feature: Data layer history array observer

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer history array observer 001
  Scenario Outline: Data layer history array observer 001
    When page <page_url> appends history entry <event_name> with payload <payload_label>
    Then the extension records a new observed event entry
    And the observed event entry URL is <page_url>
    And the observed event entry timestamp is recorded
    And the observed event entry observer path is <history_path>
    And the observed event entry name is <event_name>
    And the observed event entry payload is <payload_label>
    And the observed event entry raw value is retained

    Examples:
      | project_name         | history_path  | page_url                | event_name | payload_label |
      | my-chrome-utilities | queue.history | https://example.test/p/ | signup     | signup-values |

  # Data layer history array observer 002
  Scenario Outline: Data layer history array observer 002
    When the page calls push on the configured history array with entry <event_name>
    Then the page push return value is preserved
    And the original page push behavior is preserved
    And the page-owned history array remains readable by page scripts
    And the extension records entry <event_name> without causing a page script error

    Examples:
      | project_name         | history_path  | event_name |
      | my-chrome-utilities | queue.history | signup     |

  # Data layer history array observer 003
  Scenario Outline: Data layer history array observer 003
    Given the observer is attached on page <start_url>
    When the active tab navigates to page <next_url>
    Then the observer is reinstalled for history array path <history_path>
    And exactly one observer is active for the page
    And entries added after navigation are captured once with URL <next_url>

    Examples:
      | project_name         | history_path  | start_url             | next_url                 |
      | my-chrome-utilities | queue.history | https://example.test/ | https://example.test/p/  |

  # Data layer history array observer 004
  Scenario Outline: Data layer history array observer 004
    When the configured history array path cannot be observed
    Then the observer reports status <status>
    And the observer does not break the page

    Examples:
      | project_name         | history_path | status       |
      | my-chrome-utilities | missing.path | path missing |
      | my-chrome-utilities | queue.value  | not an array |

  # Data layer history array observer 005
  Scenario Outline: Data layer history array observer 005
    When data layer observer capabilities are inspected
    Then object push events with event fields are not observed
    And analytics beacons are not observed
    And object snapshots are not captured

    Examples:
      | project_name         | history_path  |
      | my-chrome-utilities | queue.history |
