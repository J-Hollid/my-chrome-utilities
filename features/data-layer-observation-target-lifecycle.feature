Feature: Data layer observation target lifecycle

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is attached to target <page_title> in tab <tab_id>
    And history array path <history_path> is configured

  # Data layer observation target lifecycle 001
  Scenario Outline: Data layer observation target lifecycle 001
    When the user activates another browser tab <other_tab>
    Then observation remains attached to <page_title> in tab <tab_id>
    And the Live header indicates when the target is not the visibly active tab
    And events pushed in <page_title> continue to enter the active session
    And events pushed in <other_tab> are not captured by that session

    Examples:
      | project_name         | history_path  | page_title | tab_id | other_tab |
      | my-chrome-utilities | event.history | Checkout   | 42     | Docs      |

  # Data layer observation target lifecycle 002
  Scenario Outline: Data layer observation target lifecycle 002
    Given target <page_title> is at page <start_url>
    When tab <tab_id> navigates to <next_url>
    Then the same testing session remains pinned to tab <tab_id>
    And its current target URL becomes <next_url>
    And observation is reattached once for <history_path> on the new page
    And existing captured events retain page <start_url>

    Examples:
      | project_name         | history_path  | page_title | tab_id | start_url                           | next_url                               |
      | my-chrome-utilities | event.history | Checkout   | 42     | https://shop.example.test/checkout | https://shop.example.test/confirmation |

  # Data layer observation target lifecycle 003
  Scenario Outline: Data layer observation target lifecycle 003
    When target tab <tab_id> is closed
    Then capture stops for target <page_title>
    And the active session enters target state <target_state> without losing captured events
    And actions offer Save session, End session, and Choose target
    And observation is not transferred to another tab automatically

    Examples:
      | project_name         | history_path  | page_title | tab_id | target_state       |
      | my-chrome-utilities | event.history | Checkout   | 42     | Target unavailable |

  # Data layer observation target lifecycle 004
  Scenario Outline: Data layer observation target lifecycle 004
    When session action <session_action> intentionally ends the session
    Then all runtime listeners and page hooks for tab <tab_id> are removed
    And target <page_title> is retained as the recent target in detached state
    And the ended session remains ended
    And target <page_title> is not reattached automatically

    Examples:
      | project_name         | history_path  | page_title | tab_id | session_action |
      | my-chrome-utilities | event.history | Checkout   | 42     | End testing   |

  # Data layer observation target lifecycle 005
  Scenario Outline: Data layer observation target lifecycle 005
    Given the prior session ended with recent target <page_title>
    When a new testing session is prepared and tab <tab_id> is still available
    Then <page_title> is preselected as the recent target
    And its current URL and access state are revalidated
    And observation starts only after an explicit Start testing action

    Examples:
      | project_name         | history_path  | page_title | tab_id |
      | my-chrome-utilities | event.history | Checkout   | 42     |

  # Data layer observation target lifecycle 006
  Scenario Outline: Data layer observation target lifecycle 006
    When the side panel is reopened while the session is active
    Then persisted target identity is checked against open tab <tab_id>
    And observation resumes only when the tab, page access, and active session still match
    And successful recovery restores target <page_title> without choosing the currently visible tab
    And failed recovery shows a target-specific recovery state without creating a new session

    Examples:
      | project_name         | history_path  | page_title | tab_id |
      | my-chrome-utilities | event.history | Checkout   | 42     |

  # Data layer observation target lifecycle 007
  Scenario Outline: Data layer observation target lifecycle 007
    Given access to target origin <origin> is revoked while the session is active
    When the next page read or history push would be processed
    Then observation detaches from tab <tab_id>
    And the session enters target state <target_state>
    And no further page content or events are read without permission
    And captured session content remains available

    Examples:
      | project_name         | history_path  | page_title | tab_id | origin                    | target_state       |
      | my-chrome-utilities | event.history | Checkout   | 42     | https://shop.example.test | Permission required |

  # Data layer observation target lifecycle 008
  Scenario Outline: Data layer observation target lifecycle 008
    Given an active session is attached to <page_title>
    When the user confirms End and attach to <new_target>
    Then the current session ends without changing its captured events or target provenance
    And a new session is created for <new_target>
    And no captured event is moved between the two sessions
    And only the new session owns an active observer

    Examples:
      | project_name         | history_path  | page_title | tab_id | new_target            |
      | my-chrome-utilities | event.history | Checkout   | 42     | Purchase confirmation |
