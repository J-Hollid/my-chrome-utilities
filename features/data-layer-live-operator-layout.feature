# mutation-stamp: sha256=b60a2d97117b446e45467d07ab58ca407d7357f9d0be48af9993925cd635e031
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T14:48:24.702339584Z","feature_name":"Data layer live operator layout","feature_path":"features/data-layer-live-operator-layout.feature","background_hash":"943f0ca383aa9d62dbc07900def5a21947650222fb7339a72c22ee12c675f99f","implementation_hash":"sha256:operator-interface-semantic-v2","scenarios":[{"index":0,"name":"Data layer live operator layout 001","scenario_hash":"1c111c3aaed45869284950357f9e6ff64e68d5082d27daf8f0912babfdc863b7","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:24.702339584Z"},{"index":1,"name":"Data layer live operator layout 002","scenario_hash":"024531ec5e8216c9ab3c96cb70fd3f2ba7960da658e9a8c4a05277713c9a79cc","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:24.702339584Z"},{"index":2,"name":"Data layer live operator layout 003","scenario_hash":"ba00b9b6d295d4f3014c7434cb7cb9ab54c38071e24294a148e4724538b41c2d","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:24.702339584Z"},{"index":3,"name":"Data layer live operator layout 004","scenario_hash":"b9c70e19985d35b73660ea81f8d285073fbb82be352cd608f9ec31ded99ec25b","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:24.702339584Z"},{"index":4,"name":"Data layer live operator layout 005","scenario_hash":"bee659ade6a8766bca5887bc898e9dc8cf6f9d5d246fcbe7bb102f59bf21c2fd","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:24.702339584Z"},{"index":5,"name":"Data layer live operator layout 006","scenario_hash":"ed7d95bfbf8d168ed7f62a944894d24685e7d488383dc5bb61acc80e0b9a5b00","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:24.702339584Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer live operator layout

  Background:
    Given a repository for project <project_name>
    And the Data Layer Live view is displayed
    And a testing session is active

  # Data layer live operator layout 001
  Scenario Outline: Data layer live operator layout 001
    Given the session has state <session_state>, <event_count> captured events, and <source_count> configured sources
    When the Live view header is displayed
    Then it shows state <session_state>, <event_count> events, and <source_count> sources before the event feed
    And primary actions <primary_actions> are visible without opening another region
    And less frequent session actions remain reachable from the same context
    And the active page is shown once as session context rather than repeated as an event heading

    Examples:
      | project_name         | session_state | event_count | source_count | primary_actions |
      | my-chrome-utilities | Live          | 42          | 3            | Pause and Stop  |
      | my-chrome-utilities | Paused        | 42          | 3            | Resume and Stop |

  # Data layer live operator layout 002
  Scenario Outline: Data layer live operator layout 002
    Given source <source_name> has adapter kind <adapter_kind> and status <source_status>
    When the source summary is displayed
    Then a compact source control shows <source_name>, <adapter_kind>, and <source_status>
    And filtering to source <source_name> is available from the source summary
    And configuration and recovery actions are visually subordinate to the session actions

    Examples:
      | project_name         | source_name    | adapter_kind | source_status |
      | my-chrome-utilities | event.history  | Data Layer   | Connected     |
      | my-chrome-utilities | Adobe beacons  | Adobe        | Disconnected  |
      | my-chrome-utilities | GA4 collect    | GTAG         | Connected     |

  # Data layer live operator layout 003
  Scenario Outline: Data layer live operator layout 003
    Given events from multiple sources and validation states are captured
    When the event feed controls are displayed
    Then search, source, adapter-kind, event-name, and validation-state filters are grouped before the feed
    And active filters are visible and individually removable
    And the feed reports <visible_count> visible events out of <total_count>
    And a single action clears all active filters

    Examples:
      | project_name         | visible_count | total_count |
      | my-chrome-utilities | 7             | 42          |

  # Data layer live operator layout 004
  Scenario Outline: Data layer live operator layout 004
    Given captured event <event_name> came from source <source_name> with validation state <validation_state>
    When the event is shown in the feed
    Then <event_name> is the row's primary label
    And the row shows <source_name>, capture time, <validation_state>, and a concise payload preview
    And source identity and validation state are communicated with text in addition to any icon or color
    And secondary metadata does not displace <event_name>

    Examples:
      | project_name         | event_name | source_name    | validation_state |
      | my-chrome-utilities | purchase   | event.history  | Valid            |
      | my-chrome-utilities | page_view  | Adobe beacons  | 2 issues         |

  # Data layer live operator layout 005
  Scenario Outline: Data layer live operator layout 005
    Given captured event <event_name> is selected
    When its inspector is displayed
    Then the inspector identifies the event and its source before detailed content
    And detail groups offer Summary, Payload, Raw input, Validation, and Provenance when available
    And formatted property paths and values remain selectable and readable
    And event action <event_action> remains available while inspecting long payloads

    Examples:
      | project_name         | event_name | event_action    |
      | my-chrome-utilities | purchase   | Save to Library |

  # Data layer live operator layout 006
  Scenario Outline: Data layer live operator layout 006
    Given observation settings for source <source_name> are available
    When the user opens Live settings
    Then settings are presented as contextual Live content without leaving the active session
    And the settings identify source <source_name> before its path or adapter fields
    And closing settings restores the previous Live feed or inspector state
    And observation settings are not appended below every Data Layer view

    Examples:
      | project_name         | source_name   |
      | my-chrome-utilities | event.history |
