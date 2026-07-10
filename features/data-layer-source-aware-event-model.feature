Feature: Data layer source-aware event model

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer source-aware event model 001
  Scenario Outline: Data layer source-aware event model 001
    When source event <event_name> is captured from <source_id>
    Then the event record contains a stable event id and session id
    And the event record distinguishes source kind <source_kind> from source id <source_id>
    And the event record contains event name, capture time, page URL, payload, raw input, validation state, and provenance
    And source time is retained when the source provides it

    Examples:
      | project_name         | source_kind | source_id             | event_name |
      | my-chrome-utilities | data-layer  | event-history-primary | pageview   |

  # Data layer source-aware event model 002
  Scenario Outline: Data layer source-aware event model 002
    Given source <source_id> emits <input_shape> input with event name <event_name> and payload <payload_label>
    When the input is normalized into a source event
    Then the normalized event name is <event_name>
    And the normalized payload is <payload_label>
    And the complete original input remains available as raw input

    Examples:
      | project_name         | source_id             | input_shape | event_name | payload_label   |
      | my-chrome-utilities | event-history-primary | tuple       | pageview   | pageview-values |
      | my-chrome-utilities | data-layer-primary    | object      | purchase   | purchase-values |

  # Data layer source-aware event model 003
  Scenario Outline: Data layer source-aware event model 003
    Given a normalized event retains raw input <raw_label>
    When the event is saved in session <session_name> and used to create template <template_name>
    Then raw input <raw_label> in session <session_name> remains unchanged
    And template <template_name> records the originating event id without mutating the event

    Examples:
      | project_name         | raw_label    | session_name     | template_name         |
      | my-chrome-utilities | purchase-raw | Checkout capture | Purchase confirmation |

  # Data layer source-aware event model 004
  Scenario Outline: Data layer source-aware event model 004
    Given source adapter <source_kind> declares capabilities <capabilities>
    When actions for an event from that adapter are displayed
    Then only actions supported by <capabilities> are enabled
    And the adapter identity and destination are retained with any executable artifact

    Examples:
      | project_name         | source_kind | capabilities                  |
      | my-chrome-utilities | data-layer  | inspect, save, validate, push |
      | my-chrome-utilities | adobe       | inspect, save, validate       |

  # Data layer source-aware event model 005
  Scenario Outline: Data layer source-aware event model 005
    Given events report source times <source_times> and capture times <capture_times>
    When events from multiple sources are combined
    Then the combined event feed is ordered by <ordering_field>
    And each event retains its distinct source time and capture time

    Examples:
      | project_name         | source_times              | capture_times             | ordering_field |
      | my-chrome-utilities | 10:48:03.000, 10:48:01.000 | 10:48:01.100, 10:48:03.100 | capture time   |

  # Data layer source-aware event model 006
  Scenario Outline: Data layer source-aware event model 006
    Given artifact type <artifact_type> exists
    When its lifecycle contract is inspected
    Then artifact type <artifact_type> has content lifecycle <content_lifecycle>
    And artifact type <artifact_type> has execution behavior <execution_behavior>

    Examples:
      | project_name         | artifact_type     | content_lifecycle          | execution_behavior       |
      | my-chrome-utilities | captured event    | immutable                  | not directly executable  |
      | my-chrome-utilities | saved session     | captured content immutable | not directly executable  |
      | my-chrome-utilities | event template    | versioned edits            | pushable when supported  |
      | my-chrome-utilities | test sequence     | editable steps             | runnable when ready      |
      | my-chrome-utilities | execution record  | immutable                  | not executable           |
