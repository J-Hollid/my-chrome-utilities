# mutation-stamp: sha256=88c015ba1ecb0bdb7824ece129f6c0fa9c0c058b3cdb897acbe9a09e0fb3fcde
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T23:14:44.207478631Z","feature_name":"Data layer live operator layout","feature_path":"features/data-layer-live-operator-layout.feature","background_hash":"943f0ca383aa9d62dbc07900def5a21947650222fb7339a72c22ee12c675f99f","implementation_hash":"sha256:live-event-inspector-ux-v1","scenarios":[{"index":0,"name":"Data layer live operator layout 001","scenario_hash":"2d3238a22ba1337e52790cde54afcad734337fcfd92765525fc126aa779c4519","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.207478631Z"},{"index":1,"name":"Data layer live operator layout 002","scenario_hash":"024531ec5e8216c9ab3c96cb70fd3f2ba7960da658e9a8c4a05277713c9a79cc","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.207478631Z"},{"index":2,"name":"Data layer live operator layout 003","scenario_hash":"ba00b9b6d295d4f3014c7434cb7cb9ab54c38071e24294a148e4724538b41c2d","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.207478631Z"},{"index":3,"name":"Data layer live operator layout 004","scenario_hash":"1f2fe8c34c368c28c20d06d84dccaa9e5b3ddf889b62b061e248cf4a05be76bb","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.207478631Z"},{"index":4,"name":"Data layer live operator layout 005","scenario_hash":"8e058c82b9d189f5f7d90989bee81c6f3fb3832bfd5c140eeeedd0829ff47685","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.207478631Z"},{"index":5,"name":"Data layer live operator layout 006","scenario_hash":"ed7d95bfbf8d168ed7f62a944894d24685e7d488383dc5bb61acc80e0b9a5b00","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.207478631Z"},{"index":6,"name":"Data layer live operator layout 007","scenario_hash":"98c815e0535339c98eb01bf7342995845f88eaef55b00f8f3c93d947f9d52a16","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.207478631Z"},{"index":7,"name":"Data layer live operator layout 008","scenario_hash":"b20257db791177931643b804ab2a8241b77d2f4df3e76acd72ea926d6d161580","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.207478631Z"}]}
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
    And the selected target page is shown once as session context rather than repeated as an event heading

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
