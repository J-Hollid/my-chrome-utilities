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
    When the event is displayed in the Live feed
    Then <event_name> is the event row's primary label
    And the visible event button shows <source_name> without capture time, <validation_state>, or <property_preview>
    And capture time, <validation_state>, and <property_preview> remain available in the event inspector
    And its accessible name identifies <event_name> and <source_name> without serializing the event payload

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
    When the input is displayed in the Live feed
    Then it is retained as a distinct event with explicit label <fallback_label>
    And the visible event button contains only <fallback_label> and <source_name>
    And opening the row makes complete raw input <raw_label> available through a collapsed disclosure
    And the interface does not imply that <fallback_label> was supplied by the page

    Examples:
      | project_name         | page_url                 | source_name   | history_path  | raw_label      | fallback_label |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | scalar-input-7 | Unknown event  |
