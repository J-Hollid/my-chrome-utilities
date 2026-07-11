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
    And End testing remains reachable from the same context
    And a Stop button is absent from the Live session actions
    And the selected target page is shown once as session context rather than repeated as an event heading

    Examples:
      | project_name         | session_state | event_count | source_count | primary_actions |
      | my-chrome-utilities | Capturing     | 42          | 3            | Pause capture   |
      | my-chrome-utilities | Paused        | 42          | 3            | Resume capture  |

  # Data layer live operator layout 002
  Scenario Outline: Data layer live operator layout 002
    Given source <source_name> has adapter kind <adapter_kind> and aggregate observer status <observer_status>
    When the source summary is displayed
    Then a compact source control shows <source_name> and <adapter_kind> without repeating observer status <observer_status>
    And observer status <observer_status> appears once in the session summary
    And filtering to source <source_name> is available from the source summary
    And configuration and recovery actions are visually subordinate to the session actions

    Examples:
      | project_name         | source_name    | adapter_kind | observer_status  |
      | my-chrome-utilities | event.history  | Data Layer   | Connected        |
      | my-chrome-utilities | Adobe beacons  | Adobe        | Disconnected     |
      | my-chrome-utilities | GA4 collect    | GTAG         | Waiting for path |

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
    Given captured event <event_name> came from source <source_name>
    When the event is shown in the feed
    Then <event_name> is the row's primary label
    And the visible event button contains only <event_name> and <source_name>
    And capture time, destination, validation, and payload are available from the inspector rather than repeated in the visible event button
    And the event button's accessible name identifies <event_name> and <source_name> without serializing payload data

    Examples:
      | project_name         | event_name | source_name   |
      | my-chrome-utilities | purchase   | Event history |
      | my-chrome-utilities | page_view  | Adobe beacons |

  # Data layer live operator layout 005
  Scenario Outline: Data layer live operator layout 005
    Given captured event <event_name> is selected
    When its inspector is displayed
    Then an inspector header identifies <event_name> and its source before detailed content
    And the corresponding event row exposes a selected state
    And labelled Summary metadata presents capture time, page, destination, validation, and provenance without a semicolon-delimited text block
    And the Payload section presents formatted property paths and selectable values
    And Raw input is collapsed by default and can be disclosed on demand without duplicating payload in the default presentation
    And Copy payload, Save to Library, and Validate are interactive controls rather than action names in text
    And an action unsupported for the selected event is absent or disabled with an explanation
    And the action controls remain reachable while a long payload is inspected
    And activating event action <event_action> produces visible success or failure feedback without closing the inspector

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

  # Data layer live operator layout 007
  Scenario Outline: Data layer live operator layout 007
    Given events <oldest_event>, <middle_event>, and <latest_event> were captured in that order
    When the Live event feed is displayed
    Then visible event rows are ordered <latest_event>, <middle_event>, and <oldest_event>
    And equal capture times are ordered by reverse capture sequence without dropping an event

    Examples:
      | project_name         | oldest_event | middle_event | latest_event |
      | my-chrome-utilities | pageview     | banner       | purchase     |

  # Data layer live operator layout 008
  Scenario Outline: Data layer live operator layout 008
    Given event <selected_event> is selected in the inspector
    When event <new_event> is captured
    Then <new_event> is prepended to the feed
    And event <selected_event> remains selected in the inspector
    And keyboard focus and the user's feed scroll position remain unchanged
    And when the feed is scrolled away from the top a new-events control makes <new_event> reachable without jumping the feed

    Examples:
      | project_name         | selected_event | new_event |
      | my-chrome-utilities | banner         | checkout  |
