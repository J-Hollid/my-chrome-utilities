# mutation-stamp: sha256=ca6b531fa3fe33e7c04021944574e76e9577be659dec4f8cd403f80ed3e4d5ac
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T12:44:45.502895134Z","feature_name":"Data layer observer workspace","feature_path":"features/data-layer-observer-workspace.feature","background_hash":"b7c2d967b2afd5e05cda1c062cc34a0fec38fd55953fe98585ee959f07b95a99","implementation_hash":"sha256:live-observer-semantic-v1","scenarios":[{"index":2,"name":"Data layer observer workspace 003","scenario_hash":"46f00d22694bc4d3502adf025700412917d6b01c0edb3b29007ac11f0ca65f5d","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:44:20.873056216Z"},{"index":0,"name":"Data layer observer workspace 001","scenario_hash":"c40857eddc2aa9d0845e5a877d0990f1563a15f495851df2e821d8cbddf2b158","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:43:43.074930099Z"},{"index":1,"name":"Data layer observer workspace 002","scenario_hash":"15674e0ba224371b92345c1d0b572a14039abff0e3de043302ba7489fdeaff0e","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:43:43.074930099Z"},{"index":3,"name":"Data layer observer workspace 004","scenario_hash":"9e266b5b9c6d03f75d08d3a302701d757ee0f256fcc374405ed6d19f46b11c67","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:43:43.074930099Z"},{"index":4,"name":"Data layer observer workspace 005","scenario_hash":"1f59bc75a559c2570618b328de7fd3cc6097c29503b33e0e46e38a9b0463fabb","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:43:43.074930099Z"},{"index":5,"name":"Data layer observer workspace 006","scenario_hash":"6bc8a93e1b0040ce9bb1065318990e8bca8595a25d271a49324acaa47c9e0aff","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:43:43.074930099Z"},{"index":6,"name":"Data layer observer workspace 007","scenario_hash":"5b52a5f9a65d04f6bcd603b9f9aa892055d3de88166c96c340e28fc874676f66","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:43:43.074930099Z"},{"index":7,"name":"Data layer observer workspace 008","scenario_hash":"defc6ec937d175e22168ce11e9f221e5155aac758cc68856c9de9c0cfa6d7677","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:43:43.074930099Z"},{"index":8,"name":"Data layer observer workspace 009","scenario_hash":"d9553f636b306b0d56d10df5b3d41989cbe561676a986fc92335cdccb42ac820","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:43:43.074930099Z"}]}
# acceptance-mutation-manifest-end

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
    And the active page is shown once above the event feed

    Examples:
      | project_name         | view_name | session_state | event_count | source_count | session_actions         |
      | my-chrome-utilities | Live      | Live          | 2           | 1            | Pause capture, Stop, and Save |

  # Data layer observer workspace 003
  Scenario Outline: Data layer observer workspace 003
    Given observation source <source_name> has configuration state <configuration_state> and attachment state <attachment_state>
    When the live source status is displayed
    Then one source status summary shows <source_name> with status <visible_status>
    And contradictory source status <hidden_status> is not shown
    And Restart observation is <restart_visibility>

    Examples:
      | project_name         | source_name   | configuration_state | attachment_state | visible_status | hidden_status | restart_visibility |
      | my-chrome-utilities | event.history | valid               | attached         | Connected      | Path missing  | hidden             |
      | my-chrome-utilities | event.history | missing             | detached         | Path missing   | Connected     | visible            |

  # Data layer observer workspace 004
  Scenario Outline: Data layer observer workspace 004
    When control command <command_id> completes with message <message>
    Then message <message> is announced next to the session controls
    And message <message> is not inserted into the observed event feed

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
      | my-chrome-utilities | pageview   | Paused       | Live       |
