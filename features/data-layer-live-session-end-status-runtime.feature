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
