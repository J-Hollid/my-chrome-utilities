# mutation-stamp: sha256=7fb27b108d40f63fc2e59f9ae3b119e35bee3fbada90957cfbb1b118b15b8a9e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T15:35:30.241194271Z","feature_name":"Data layer event timeline","feature_path":"features/data-layer-event-timeline.feature","background_hash":"7eff79698fd64e8f9a3868028adc9e1e92c8ecb38c6e280eb613d153d0449040","implementation_hash":"sha256:d0cbed267d35bb9c58954731a34b7264f86998473b9436a9c87aaf75cb79a3af","scenarios":[{"index":5,"name":"Data layer event timeline 006","scenario_hash":"9fa9bfc3f2cd7b98790269222434ec10a41881dd01c2dd210b0508cd71274644","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-13T15:32:40.920854230Z"},{"index":7,"name":"Data layer event timeline 008","scenario_hash":"8ac414073f46b3c37241bf23650a35ebc3902219b426f645e7af0857da970a4e","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-13T15:27:12.355410278Z"},{"index":0,"name":"Data layer event timeline 001","scenario_hash":"4d195051995f214787162dc8729fc7bf38671c63d12ff8539f3d3961ee648043","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-13T15:25:11.387759342Z"},{"index":4,"name":"Data layer event timeline 005","scenario_hash":"cf2ce3718af2982ee8e1611f39615875c0cea05b4f27f84dc5d94fde1866bd67","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-13T15:25:11.387759342Z"},{"index":1,"name":"Data layer event timeline 002","scenario_hash":"c36cbd9c251bcd4cb0d46692f3490a9f354c6950298af5ba4e3fac3a2e613a03","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:44:36.526884385Z"},{"index":2,"name":"Data layer event timeline 003","scenario_hash":"7a15a9a99c8e8206aac3345cf5b0b6e3f95ef3e096eef8648cc24aec00eb80e5","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:44:36.526884385Z"},{"index":3,"name":"Data layer event timeline 004","scenario_hash":"4bcc713eb304eb051e0fc371b16edf5df2cc9b4fb19d9ce334c182cffa11425c","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:44:36.526884385Z"},{"index":6,"name":"Data layer event timeline 007","scenario_hash":"0fbcb2377436540c6d4258d0175421f07795b87fce5434448326d3f8b52bf8cd","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:44:36.526884385Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer event timeline

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer event timeline 001
  Scenario Outline: Data layer event timeline 001
    Given observed event <event_name> is recorded from source <source_name> on page <page_url>
    When the live event feed is displayed
    Then event rows are grouped into contiguous pathname visits derived from capture chronology
    And visit blocks and their event rows are shown newest first
    And the row for <event_name> shows compact capture time, source kind, source name <source_name>, event name, validation state, and key properties
    And the pathname from page URL <page_url> is shown once in its visit header
    And complete page URL <page_url> remains available in event details
    And full event metadata is not repeated in every collapsed row

    Examples:
      | project_name         | page_url                | source_name   | event_name |
      | my-chrome-utilities | https://example.test/p/ | Event history | pageview   |

  # Data layer event timeline 002
  Scenario Outline: Data layer event timeline 002
    Given timeline entry <event_name> is visible
    When the user opens the event inspector
    Then the inspector shows event name <event_name>, exact timestamp, page URL <page_url>, source <source_name>, and destination <destination>
    And Fields, Raw, and Validation views are available
    And the Fields view shows payload <payload_label>
    And the Raw view shows raw input <raw_label>
    And actions offer Copy, Save to Library, and Validate

    Examples:
      | project_name         | page_url                | source_name   | destination   | event_name | payload_label  | raw_label   |
      | my-chrome-utilities | https://example.test/p/ | Event history | event.history | pageview   | pageview-values | pageview-raw |

  # Data layer event timeline 003
  Scenario Outline: Data layer event timeline 003
    Given visible events differ by text, source, event name, and validation state
    When the user applies <filter_kind> filter <filter_value>
    Then only events matching <filter_value> for <filter_kind> are visible
    And the feed reports the matching count and active filter
    When all filters are cleared
    Then every captured event is visible again

    Examples:
      | project_name         | filter_kind     | filter_value  |
      | my-chrome-utilities | text            | purchase      |
      | my-chrome-utilities | source          | Adobe beacons |
      | my-chrome-utilities | event name      | pageview      |
      | my-chrome-utilities | validation state | 2 issues      |

  # Data layer event timeline 004
  Scenario Outline: Data layer event timeline 004
    Given event <event_name> contains field <field_name> with value <field_value>
    When the user chooses <filter_action> for that field
    Then a visible field filter for <field_name> and <field_value> is applied
    And the filter can be removed without closing the event inspector

    Examples:
      | project_name         | event_name | field_name | field_value | filter_action |
      | my-chrome-utilities | purchase   | currency   | EUR         | Filter for    |
      | my-chrome-utilities | purchase   | currency   | EUR         | Filter out    |

  # Data layer event timeline 005
  Scenario Outline: Data layer event timeline 005
    Given automatic following is active at the feed head
    When the user <exploration_action>
    Then automatic following is paused
    And newly captured events do not move the user's viewport
    And a visible <new_event_count> new events action returns to the newest event

    Examples:
      | project_name         | exploration_action        | new_event_count |
      | my-chrome-utilities | scrolls to an older event | 8               |
      | my-chrome-utilities | opens an event inspector  | 8               |

  # Data layer event timeline 006
  Scenario Outline: Data layer event timeline 006
    Given the feed contains <event_count> loaded records
    When another event is appended
    Then assistive technology can identify and move between event records
    And the feed exposes the updated event position and count
    And keyboard focus is not moved away from the user's current event

    Examples:
      | project_name         | event_count |
      | my-chrome-utilities | 24          |

  # Data layer event timeline 007
  Scenario Outline: Data layer event timeline 007
    Given the session contains <event_count> captured events
    When the live feed renders a window of <visible_count> events
    Then older events can be loaded on demand
    And filtering and event counts apply to all <event_count> events
    And no captured event is removed from the session archive

    Examples:
      | project_name         | event_count | visible_count |
      | my-chrome-utilities | 1000        | 100           |

  # Data layer event timeline 008
  Scenario Outline: Data layer event timeline 008
    Given project <project_name> has a current session containing captured events across multiple pathname visits
    When the Data Layer workspace is displayed
    Then the current session page and event journey is presented once through the Live event feed
    And a duplicate session timeline is absent below or beside the Data Layer views
    And Library, Sessions, and Schemas do not display another current-session event list
    And the canonical captured chronology remains available for saved sessions and defect report reproduction

    Examples:
      | project_name         |
      | my-chrome-utilities |
