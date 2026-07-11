Feature: Data layer observer workspace

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And the Data Layer workspace is displayed

  # Data layer observer workspace 001
  Scenario Outline: Data layer observer workspace 001
    Then Data Layer views are ordered <first_view>, <second_view>, <third_view>, and <fourth_view>
    And only the first Data Layer view is visible by default
    And each Data Layer view selector exposes its selected state and associated panel
    And the global command palette remains available outside the Data Layer views

    Examples:
      | project_name         | first_view | second_view | third_view | fourth_view |
      | my-chrome-utilities | Live       | Library     | Sessions   | Schemas     |

  # Data layer observer workspace 002
  Scenario Outline: Data layer observer workspace 002
    Given a live session has <event_count> captured events from <source_count> observation sources
    When Data Layer view <view_name> is displayed
    Then the session header shows state <session_state>, <event_count> events, and <source_count> sources
    And visible session actions offer <session_actions>
    And each session action is available through the command registry
    And the selected target page is shown once above the event feed

    Examples:
      | project_name         | view_name | session_state | event_count | source_count | session_actions         |
      | my-chrome-utilities | Live      | Capturing     | 2           | 1            | Pause capture, End testing, and Save |

  # Data layer observer workspace 003
  Scenario Outline: Data layer observer workspace 003
    Given observation source <source_name> has configuration state <configuration_state> and attachment state <attachment_state>
    When the Live observer status is displayed
    Then exactly one observer status shows <visible_status>
    And contradictory source status <hidden_status> is not shown
    And source <source_name> remains identifiable without another equivalent status fragment
    And Restart observation is <restart_visibility>

    Examples:
      | project_name         | source_name   | configuration_state | attachment_state | visible_status | hidden_status | restart_visibility |
      | my-chrome-utilities | event.history | valid               | attached         | Connected        | Waiting for path | hidden             |
      | my-chrome-utilities | event.history | missing             | detached         | Waiting for path | Connected        | visible            |

  # Data layer observer workspace 004
  Scenario Outline: Data layer observer workspace 004
    When control command <command_id> completes with message <message>
    Then message <message> is announced next to the session controls
    And message <message> is not inserted into the observed event feed
    And message <message> is temporary rather than retained as another session or observer status

    Examples:
      | project_name         | command_id               | message                        |
      | my-chrome-utilities | data-layer.start-testing | Data Layer observation started |
      | my-chrome-utilities | data-layer.end-testing   | Data Layer observation stopped |

  # Data layer observer workspace 005
  Scenario Outline: Data layer observer workspace 005
    Given the event list and event inspector cannot fit side by side
    When the user opens event <event_name>
    Then the event inspector replaces the event list
    And a visible Back to events action restores the event list

    Examples:
      | project_name         | event_name |
      | my-chrome-utilities | pageview   |

  # Data layer observer workspace 006
  Scenario Outline: Data layer observer workspace 006
    Given the event list and event inspector fit side by side
    When the user opens event <event_name>
    Then the event list remains visible beside the event inspector
    And event <event_name> is exposed as selected

    Examples:
      | project_name         | event_name |
      | my-chrome-utilities | pageview   |

  # Data layer observer workspace 007
  Scenario Outline: Data layer observer workspace 007
    When Data Layer navigation command <command_id> runs
    Then only Data Layer view <view_name> is visible
    And Data Layer view <view_name> remains selected after the side panel reloads
    And command <command_id> is available in the command palette and for hotkey assignment

    Examples:
      | project_name         | command_id               | view_name |
      | my-chrome-utilities | data-layer.show-live      | Live      |
      | my-chrome-utilities | data-layer.show-library   | Library   |
      | my-chrome-utilities | data-layer.show-sessions  | Sessions  |
      | my-chrome-utilities | data-layer.show-schemas   | Schemas   |

  # Data layer observer workspace 008
  Scenario Outline: Data layer observer workspace 008
    Given Data Layer view <initial_view> has keyboard focus
    When view navigation key <navigation_key> is pressed
    Then keyboard focus and selection move to Data Layer view <view_name>
    And only Data Layer view <view_name> is visible

    Examples:
      | project_name         | initial_view | navigation_key | view_name |
      | my-chrome-utilities | Live         | ArrowRight    | Library   |
      | my-chrome-utilities | Schemas      | ArrowRight    | Live      |
      | my-chrome-utilities | Schemas      | Home          | Live      |
      | my-chrome-utilities | Live         | End           | Schemas   |

  # Data layer observer workspace 009
  Scenario Outline: Data layer observer workspace 009
    Given a live session has captured event <event_name>
    When the user pauses capture
    Then the session enters state <paused_state>
    And new source events are not appended while capture is paused
    And the existing feed and source attachments remain available
    When the user resumes capture
    Then the session returns to state <live_state>
    And subsequent source events are appended to the same session

    Examples:
      | project_name         | event_name | paused_state | live_state |
      | my-chrome-utilities | pageview   | Paused       | Capturing  |
