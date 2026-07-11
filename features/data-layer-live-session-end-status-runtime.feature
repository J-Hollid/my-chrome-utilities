Feature: Data layer Live session end status runtime

  Background:
    Given the built extension side panel is running in a browser
    And the Data Layer Live view is displayed

  # Data layer Live session end status runtime 001
  Scenario Outline: Data layer Live session end status runtime 001
    Given an active testing session shows session status <initial_session_status> and observer status <initial_observer_status>
    When the user activates End testing
    Then the testing session ends intentionally
    And the Live summary immediately shows exactly one session status Ended and one observer status Disconnected
    And prior statuses <initial_session_status> and <initial_observer_status> are absent from visible and accessible persistent status content
    And Start testing replaces End testing as the available session action
    And temporary notification Testing ended does not substitute for or outlive the Ended status

    Examples:
      | initial_session_status | initial_observer_status |
      | Capturing              | Connected               |
      | Paused                 | Waiting for path        |

  # Data layer Live session end status runtime 002
  Scenario Outline: Data layer Live session end status runtime 002
    Given testing is attached to target <old_page_title> in tab <old_tab_id>
    And eligible target <new_page_title> in tab <new_tab_id> has observer path <observer_path> ready
    When the user activates End testing
    Then no observation target remains attached
    And <old_page_title> is retained only as the recent target
    And the runtime listener and page hook for tab <old_tab_id> are removed
    When Start testing is activated for selected target <new_page_title>
    Then a new testing session is attached only to tab <new_tab_id>
    And the new session reports Capturing with a Connected observer
    And observer status Error is absent
    And tab <old_tab_id> is not reattached

    Examples:
      | old_page_title | old_tab_id | new_page_title      | new_tab_id | observer_path |
      | Checkout       | 42         | Order confirmation | 73         | event.history |
