# mutation-stamp: sha256=4f2ce51caf46b3a17069480a0e91351e1f62852787fd1498154627c355858875
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T23:14:44.154707217Z","feature_name":"Data layer captured event presentation pipeline","feature_path":"features/data-layer-captured-event-presentation-pipeline.feature","background_hash":"88f28310d769435a5603ddc33bebf028b0341d8db86fd18ba24ab4a5914dbe8a","implementation_hash":"sha256:live-event-inspector-ux-v1","scenarios":[{"index":0,"name":"Data layer captured event presentation pipeline 001","scenario_hash":"a9978d84f47c8901e34f9093aaf11949e3a4dca8885b70fbcfacdcbb3388c346","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.154707217Z"},{"index":1,"name":"Data layer captured event presentation pipeline 002","scenario_hash":"1670037d75a79475d82ba47c03f839cc0ae3d091f71c8371fb00cf76edc66cd8","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.154707217Z"},{"index":2,"name":"Data layer captured event presentation pipeline 003","scenario_hash":"d6d452fb81e79e3cae988a26c35655387d0b50ae24fd286df1e047496029d211","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.154707217Z"},{"index":3,"name":"Data layer captured event presentation pipeline 004","scenario_hash":"6470783540896313f17bba4b166fba3251f501d87bb980031b10760deada53f9","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.154707217Z"},{"index":4,"name":"Data layer captured event presentation pipeline 005","scenario_hash":"0e2d9b28539f2f00aaa84ea91f8846b7b5a10647af3957a1f0109b6fd51d4816","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:14:44.154707217Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer captured event presentation pipeline

  Background:
    Given a repository for project <project_name>
    And data layer testing is active on page <page_url>
    And source <source_name> observes history array path <history_path>

  # Data layer captured event presentation pipeline 001
  Scenario Outline: Data layer captured event presentation pipeline 001
    Given before observation starts the history array contains distinct events <event_names> in that order
    And those entries do not contain source occurrence times
    When the existing history is imported during observation start
    Then each imported event receives a distinct stable event id
    And the imported events retain array order <event_names>
    And each event records when it was captured by the observer without inventing a source occurrence time
    And multiple imported events may share capture time <capture_time>
    And equal capture times do not merge, replace, or hide any imported event

    Examples:
      | project_name         | page_url                 | source_name   | history_path  | event_names                 | capture_time             |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | pageview, offer_view, click | 2026-07-10T15:04:44.850Z |

  # Data layer captured event presentation pipeline 002
  Scenario Outline: Data layer captured event presentation pipeline 002
    Given <capture_phase> history input has shape <input_shape>, event name <event_name>, and payload <payload_label>
    When the input is captured
    Then one canonical source event is created with <event_name>, <payload_label>, and the complete raw input
    And the event contains its stable event id, session id, source kind, source id, capture time, page URL, validation state, and provenance
    And the same canonical event id and content are used by the session timeline and Live workspace
    And valid input <input_shape> is not renamed to observed event

    Examples:
      | project_name         | page_url                 | source_name   | history_path  | capture_phase | input_shape | event_name | payload_label   |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | existing      | tuple       | pageview   | pageview-values |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | live push     | object      | purchase   | purchase-values |

  # Data layer captured event presentation pipeline 003
  Scenario Outline: Data layer captured event presentation pipeline 003
    Given canonical event <event_name> from <source_name> has capture time <capture_time>, validation state <validation_state>, and key property <property_preview>
    And feed summary configuration selects key property <property_preview>
    When the captured record is displayed in the Live feed
    Then <event_name> is the event row's primary label
    And the visible event button shows <capture_time>, <source_name>, <validation_state>, and <property_preview>
    And exact capture time, <validation_state>, and <property_preview> remain available in the event inspector
    And its accessible name identifies <event_name>, <capture_time>, <source_name>, page pathname, <validation_state>, and <property_preview> without serializing other payload data

    Examples:
      | project_name         | page_url                 | source_name   | history_path  | event_name | capture_time             | validation_state | property_preview     |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | purchase   | 2026-07-10T15:04:46.488Z | Not checked      | transaction_id 1234 |

  # Data layer captured event presentation pipeline 004
  Scenario Outline: Data layer captured event presentation pipeline 004
    Given canonical event <event_name> retains payload <payload_label>, raw input <raw_label>, validation state <validation_state>, and provenance <provenance>
    When the user opens the event from the Live feed
    Then the inspector header shows event <event_name> and source <source_name>
    And labelled Summary metadata shows exact capture time, page <page_url>, destination <history_path>, validation <validation_state>, and provenance <provenance>
    And the expanded Payload section shows <payload_label> as structured properties
    And Raw input <raw_label> is available through a collapsed disclosure rather than duplicated beside Payload
    And supported actions expose operable Copy payload, Save to Library, and Validate controls
    And each action reports its result next to the controls

    Examples:
      | project_name         | page_url                 | source_name   | history_path  | event_name | payload_label   | raw_label     | validation_state | provenance             |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | purchase   | purchase-values | purchase-tuple | Not checked      | captured:event-history |

  # Data layer captured event presentation pipeline 005
  Scenario Outline: Data layer captured event presentation pipeline 005
    Given source <source_name> captures unsupported raw input <raw_label> without an event name
    When the captured record is displayed in the Live feed
    Then it is retained as a distinct event with explicit label <fallback_label>
    And the visible event button shows <fallback_label>, compact capture time, <source_name>, and validation state without a summary area
    And opening the row makes complete raw input <raw_label> available through a collapsed disclosure
    And the interface does not imply that <fallback_label> was supplied by the page

    Examples:
      | project_name         | page_url                 | source_name   | history_path  | raw_label      | fallback_label |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | scalar-input-7 | Unknown event  |
