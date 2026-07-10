Feature: Data layer observation target selection

  Background:
    Given a repository for project <project_name>
    And the Data Layer Live view is displayed
    And history array path <history_path> is configured

  # Data layer observation target selection 001
  Scenario Outline: Data layer observation target selection 001
    Given no observation target is selected
    When the Live session header is displayed
    Then target state <target_state> is shown before the session actions
    And Start testing identifies that a target page must be selected
    And the extension side-panel URL is not presented as a target page
    And visible action <selection_action> opens observation target selection

    Examples:
      | project_name         | history_path  | target_state | selection_action |
      | my-chrome-utilities | event.history | Detached     | Choose target    |

  # Data layer observation target selection 002
  Scenario Outline: Data layer observation target selection 002
    Given discovery contains eligible pages in browser windows <window_names>
    When the observation target picker is displayed
    Then candidates are grouped by browser window with the current window first
    And each candidate shows page title, hostname and path, window context, active-tab state, access state, and prior-session state
    And the current target is listed before the current active tab, recent targets, and remaining candidates
    And page URLs remain secondary to recognizable page titles

    Examples:
      | project_name         | history_path  | window_names          |
      | my-chrome-utilities | event.history | Main and Test checkout |

  # Data layer observation target selection 003
  Scenario Outline: Data layer observation target selection 003
    Given target candidates include pages <page_titles>
    When the user searches for <query>
    Then only candidates matching <query> by title, hostname, URL, or window context are shown
    And the picker reports the matching target count
    When the search is cleared
    Then candidates <page_titles> are shown again

    Examples:
      | project_name         | history_path  | page_titles                              | query    |
      | my-chrome-utilities | event.history | Home, Checkout, and Purchase confirmation | purchase |

  # Data layer observation target selection 004
  Scenario Outline: Data layer observation target selection 004
    Given candidate page <page_title> has access state <access_state>
    When its target row is displayed
    Then status <access_state> and explanation <status_explanation> are shown without relying on color alone
    And target action <target_action> is available only when it can advance attachment

    Examples:
      | project_name         | history_path  | page_title            | access_state        | status_explanation                    | target_action      |
      | my-chrome-utilities | event.history | Purchase confirmation | Ready               | Page can be observed                   | Select             |
      | my-chrome-utilities | event.history | Checkout              | Permission required | Site access is required                | Request access     |
      | my-chrome-utilities | event.history | Extensions            | Restricted          | Chrome pages cannot be observed        | unavailable        |
      | my-chrome-utilities | event.history | Closed checkout       | Closed              | The browser tab is no longer available | unavailable        |

  # Data layer observation target selection 005
  Scenario Outline: Data layer observation target selection 005
    Given eligible page <page_title> at <page_url> is selected
    When the extension checks <history_path> on that target
    Then the selected target retains its exact tab id, window id, <page_url>, title, and origin
    And page access state <page_access_state> is shown separately from history-path state <path_state>
    And a missing history path does not cause another tab to be selected implicitly

    Examples:
      | project_name         | history_path  | page_title            | page_url                              | page_access_state | path_state   |
      | my-chrome-utilities | event.history | Purchase confirmation | https://shop.example.test/confirmation | Available         | Ready        |
      | my-chrome-utilities | event.history | Checkout              | https://shop.example.test/checkout     | Available         | Path missing |

  # Data layer observation target selection 006
  Scenario Outline: Data layer observation target selection 006
    Given selected target <page_title> has tab id <tab_id> and page URL <page_url>
    When data layer testing starts
    Then the active testing session is pinned to tab id <tab_id>
    And the Live header shows state <target_state>, <page_title>, <page_url>, and <history_path>
    And observation reads and hooks only the selected target
    And changing the browser's visibly active tab does not change the session target

    Examples:
      | project_name         | history_path  | page_title            | tab_id | page_url                              | target_state |
      | my-chrome-utilities | event.history | Purchase confirmation | 42     | https://shop.example.test/confirmation | Attached     |

  # Data layer observation target selection 007
  Scenario Outline: Data layer observation target selection 007
    Given an active session is attached to target <current_target>
    When the user selects different target <new_target>
    Then the existing session remains attached to <current_target>
    And a confirmation offers Keep current session or End and attach to <new_target>
    When the user chooses Keep current session
    Then no observer is attached to <new_target>
    And captured events in the current session remain unchanged

    Examples:
      | project_name         | history_path  | current_target | new_target            |
      | my-chrome-utilities | event.history | Checkout       | Purchase confirmation |

  # Data layer observation target selection 008
  Scenario Outline: Data layer observation target selection 008
    Given two open tabs <first_tab> and <second_tab> have the same page URL <page_url>
    When same-URL target candidates are resolved
    Then <first_tab> and <second_tab> are distinct candidates
    And selecting <second_tab> stores its tab and window identity rather than selecting by URL
    And only one observation target can be attached to the active testing session

    Examples:
      | project_name         | history_path  | first_tab          | second_tab         | page_url                           |
      | my-chrome-utilities | event.history | Checkout tab 1     | Checkout tab 2     | https://shop.example.test/checkout |
