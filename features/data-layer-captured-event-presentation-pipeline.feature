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
    And the row shows <source_name>, compact capture time, <validation_state>, and <property_preview>
    And the row does not use a raw ISO timestamp as its primary label
    And its accessible name identifies <event_name>, <source_name>, and the capture time without repeating the word event

    Examples:
      | project_name         | page_url                 | source_name   | history_path  | event_name | capture_time             | validation_state | property_preview     |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | purchase   | 2026-07-10T15:04:46.488Z | Not checked      | transaction_id 1234 |

  # Data layer captured event presentation pipeline 004
  Scenario Outline: Data layer captured event presentation pipeline 004
    Given canonical event <event_name> retains payload <payload_label>, raw input <raw_label>, validation state <validation_state>, and provenance <provenance>
    When the user opens the event from the Live feed
    Then the inspector shows event <event_name>, <source_name>, exact capture time, page <page_url>, and destination <history_path>
    And Payload shows <payload_label>
    And Raw input shows <raw_label>
    And Validation shows <validation_state>
    And Provenance shows <provenance>
    And actions offer Copy, Save to Library, and Validate when supported by the source adapter

    Examples:
      | project_name         | page_url                 | source_name   | history_path  | event_name | payload_label   | raw_label     | validation_state | provenance             |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | purchase   | purchase-values | purchase-tuple | Not checked      | captured:event-history |

  # Data layer captured event presentation pipeline 005
  Scenario Outline: Data layer captured event presentation pipeline 005
    Given source <source_name> captures unsupported raw input <raw_label> without an event name
    When the input is displayed in the Live feed
    Then it is retained as a distinct event with explicit label <fallback_label>
    And the row shows <source_name>, compact capture time, and a concise raw-input preview
    And opening the row reveals complete raw input <raw_label>
    And the interface does not imply that <fallback_label> was supplied by the page

    Examples:
      | project_name         | page_url                 | source_name   | history_path  | raw_label      | fallback_label |
      | my-chrome-utilities | https://www.example.com/ | Event history | event.history | scalar-input-7 | Unknown event  |
