Feature: Data layer authoritative Live state

  Background:
    Given the Data Layer Live view has selected target Checkout
    And observer path event.history is configured

  # Data layer authoritative Live state 001
  Scenario: Data layer authoritative Live state 001
    Given the canonical Live snapshot is session Capturing, connection Connected, and path readiness Ready
    When session summary, Settings, transition feedback, and warnings are displayed
    Then persistent content shows exactly one Capturing, one Connected, and one labelled path status Ready
    And Checking target is absent from visible and accessible persistent content
    And no stale readiness message implies that setup is incomplete

  # Data layer authoritative Live state 002
  Scenario Outline: Data layer authoritative Live state 002
    Given target access is <access_state> and the target probe returns <probe_outcome>
    When the canonical Live snapshot is updated from that result
    Then exactly one labelled path status <path_readiness> is displayed
    And the path status is one of Ready, Waiting for path, Permission required, or Error
    And raw probe result <probe_outcome> is not displayed as another path status

    Examples:
      | access_state        | probe_outcome | path_readiness     |
      | Granted             | array         | Ready              |
      | Granted             | path missing  | Waiting for path   |
      | Permission required | not read      | Permission required |
      | Granted             | not an array  | Error              |
      | Granted             | read failed   | Error              |

  # Data layer authoritative Live state 003
  Scenario: Data layer authoritative Live state 003
    Given Details and editable Settings are expanded
    When observer path occurrences are inspected
    Then event.history appears once as the Observer path value in session summary Details
    And event.history appears once in the editable observer path field in Settings
    And event.history is absent from transition feedback, warnings, source statuses, and other persistent Live content

  # Data layer authoritative Live state 004
  Scenario Outline: Data layer authoritative Live state 004
    Given canonical path readiness is Waiting for path while transient message <transition_message> is announced
    When the pending operation finishes with readiness <new_path_readiness>
    Then transient message <transition_message> is cleared from visible and accessible content
    And the single persistent path status changes to <new_path_readiness>

    Examples:
      | transition_message | new_path_readiness  |
      | Checking target    | Ready               |
      | Requesting access  | Permission required |

  # Data layer authoritative Live state 005
  Scenario Outline: Data layer authoritative Live state 005
    Given Checkout requires recovery from <path_readiness> because <failure_reason>
    When the Live warning is displayed
    Then one warning identifies affected target Checkout
    And the warning exposes required recovery action <recovery_action>
    And the warning does not create another path status
    When a successful target probe is accepted
    Then the warning and its recovery action are removed

    Examples:
      | path_readiness     | failure_reason            | recovery_action    |
      | Waiting for path   | event.history is missing  | Edit observer path |
      | Permission required | site access is missing   | Request access     |
      | Error              | the target read failed    | Retry target check |
