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
