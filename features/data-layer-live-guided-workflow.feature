Feature: Data layer Live guided workflow

  Background:
    Given a repository for project my-chrome-utilities
    And the Data Layer Live view is displayed

  # Data layer Live guided workflow 001
  Scenario Outline: Data layer Live guided workflow 001
    Given no observation target is selected and no testing session is active
    When Live opens before a target is selected
    Then setup steps are ordered <first_step>, <second_step>, and <third_step>
    And enabled primary action <primary_action> advances the first incomplete step
    And action <disabled_action> is disabled with accessible explanation <disabled_reason>
    And the current incomplete step is identifiable without scanning unrelated controls

    Examples:
      | first_step    | second_step             | third_step    | primary_action | disabled_action | disabled_reason                        |
      | Choose target | Confirm access and path | Start testing | Choose target  | Start testing   | Choose a ready target before starting |

  # Data layer Live guided workflow 002
  Scenario Outline: Data layer Live guided workflow 002
    Given selected target <page_title> has access state <access_state> and observer path <observer_path> has status <path_status>
    When target readiness becomes Ready
    Then target and path readiness are shown before the session action
    And primary action <primary_action> includes target name <page_title> in its accessible name
    And Choose target remains a secondary action for changing the selection

    Examples:
      | page_title | access_state | observer_path | path_status | primary_action |
      | Checkout   | Ready        | event.history | ready       | Start testing  |

  # Data layer Live guided workflow 003
  Scenario Outline: Data layer Live guided workflow 003
    Given testing is in capture state <capture_state>
    When capture begins
    Then Live regions are ordered Session summary, Capture controls, Live event feed, and Collapsed Settings
    And primary controls are <primary_controls>
    And action Save session is displayed and no session action is labelled only Save
    And Choose target, observer path configuration, and source setup are contained in a collapsed secondary Settings section
    And the live event feed is available without opening Settings

    Examples:
      | capture_state | primary_controls                       |
      | Capturing     | Pause capture and End testing          |
      | Paused        | Resume capture and End testing         |

  # Data layer Live guided workflow 004
  Scenario Outline: Data layer Live guided workflow 004
    Given testing is active and the setup target has readiness <target_readiness>
    When the user activates End testing
    Then the ordered target-selection setup becomes current again
    And Pause capture, Resume capture, and End testing actions are absent
    And setup primary action is <setup_action>
    And no control retains a stale capturing or paused state

    Examples:
      | target_readiness | setup_action           |
      | Ready            | Start testing Checkout |
      | Unavailable      | Choose target           |
