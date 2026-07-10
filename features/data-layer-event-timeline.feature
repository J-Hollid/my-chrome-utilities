# mutation-stamp: sha256=6cb6ce639c4b896df0b90766cfd60d4ad6269b7db67ecd7f66105fc4e6467b78
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T20:35:42.356600707Z","feature_name":"Data layer event timeline","feature_path":"features/data-layer-event-timeline.feature","background_hash":"7eff79698fd64e8f9a3868028adc9e1e92c8ecb38c6e280eb613d153d0449040","implementation_hash":"sha256:d0cbed267d35bb9c58954731a34b7264f86998473b9436a9c87aaf75cb79a3af","scenarios":[{"index":0,"name":"Data layer event timeline 001","scenario_hash":"f5db5d52ddfb5f58e1acf17afe8cd9fb16cd72e85e314239b18420f05cae2a86","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:06:05.039967153Z"},{"index":1,"name":"Data layer event timeline 002","scenario_hash":"02a5931d93c5bb4d44756c71d739ec43f76ba9bdf021a2dccdac5b87917881cb","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:06:05.039967153Z"},{"index":2,"name":"Data layer event timeline 003","scenario_hash":"409105f2bca3b19e7122ab6310512a19c56bfce1246f087fe298a0921886e90d","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:06:05.039967153Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer event timeline

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer event timeline 001
  Scenario Outline: Data layer event timeline 001
    Given observed event <event_name> is recorded from source <source_name> on page <page_url>
    When the live event feed is displayed
    Then event rows are shown in capture order
    And the row for <event_name> shows compact capture time, source kind, source name <source_name>, event name, validation state, and key properties
    And page URL <page_url> is shown once as a journey separator
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
    Given the live feed is following the newest event
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
    Given <event_count> events are loaded in the live feed
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
