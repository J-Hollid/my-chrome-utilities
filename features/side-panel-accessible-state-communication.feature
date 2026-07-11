Feature: Side panel accessible state communication

  Background:
    Given the side panel is displayed

  # Side panel accessible state communication 001
  Scenario: Side panel accessible state communication 001
    Given these pageview events are displayed within pathname visit blocks
      | event id | pathname block | capture time | source        | validation state |
      | event-41 | /products      | 10:02:15     | Event history | Valid            |
      | event-42 | /checkout      | 10:03:00     | Event history | Not checked      |
      | event-43 | /confirmation  | 10:04:20     | Event history | 2 issues         |
    When their event-row controls are inspected
    Then each pathname is visibly presented by its visit-block heading rather than repeated in every row
    And each event-row accessible name contains pageview, its associated pathname-block heading as the page identifier, capture time, source, and validation state
    And the 3 event-row accessible names are pairwise distinct
    And an event without configured summary properties still exposes all required naming fields

  # Side panel accessible state communication 002
  Scenario Outline: Side panel accessible state communication 002
    Given state <state_name> is displayed in <state_context>
    When its visual and accessibility semantics are inspected
    Then visible text includes <state_name>
    And color, a dot, and an icon are not the sole means of identifying <state_name>
    And assistive technology can determine <state_name> from text

    Examples:
      | state_context          | state_name          |
      | session status         | Capturing           |
      | observer status        | Connected           |
      | path warning           | Permission required |
      | observer failure       | Error               |

  # Side panel accessible state communication 003
  Scenario: Side panel accessible state communication 003
    Given the Library editor displays persistent help, validation feedback, and action feedback
    When the editor's announcement regions are inspected
    Then persistent help is outside assertive and polite live regions
    And validation feedback and action feedback use separate status elements
    And updating one status does not announce the other status or persistent help

  # Side panel accessible state communication 004
  Scenario Outline: Side panel accessible state communication 004
    Given <result_kind> produces result <result_text> with consequence <consequence>
    When the local result status updates
    Then the result uses announcement priority <announcement_priority>
    And assistive technology announces only <result_text>
    And persistent explanatory copy is not repeated
    And assertive announcement priority is reserved for a blocking error

    Examples:
      | result_kind       | result_text                                      | consequence    | announcement_priority |
      | validation result | Draft is valid                                   | non-blocking   | polite                |
      | action result     | Saved Purchase confirmation as version 4        | non-blocking   | polite                |
      | validation error  | Correct invalid JSON before saving               | blocking error | assertive             |
      | action error      | Choose another target before pushing purchase    | blocking error | assertive             |

  # Side panel accessible state communication 005
  Scenario Outline: Side panel accessible state communication 005
    Given action <action_name> is disabled because <disabled_reason>
    When the action is reached by assistive technology
    Then <action_name> is exposed as disabled
    And its accessible description includes <disabled_reason>
    And the reason remains visible near the action

    Examples:
      | action_name   | disabled_reason                    |
      | Start testing | Select a ready target               |
      | Validate      | Select a schema to validate         |
      | Push draft    | Correct the JSON draft              |

  # Side panel accessible state communication 006
  Scenario Outline: Side panel accessible state communication 006
    Given input <input_name> has error <error_message>
    When the invalid form is displayed
    Then <input_name> is programmatically exposed as invalid
    And the accessible description for <input_name> includes <error_message>
    And the visible error identifies the field that requires correction

    Examples:
      | input_name       | error_message                         |
      | JSON payload     | Enter valid JSON                       |
      | Destination path | Enter an array destination path        |
      | Observer path    | Resolve a path containing an array     |

  # Side panel accessible state communication 007
  Scenario Outline: Side panel accessible state communication 007
    Given color scheme <color_scheme> is active
    When text, borders, selected tabs, focus rings, success states, and error states are measured
    Then normal text and state text have contrast of at least 4.5 to 1 against their backgrounds
    And essential borders, selected-tab indicators, and focus rings have contrast of at least 3 to 1 against adjacent colors
    And success and error states satisfy the applicable WCAG 2.2 AA text and non-text contrast thresholds
    And selected, success, and error meaning remains available without color alone

    Examples:
      | color_scheme |
      | light        |
      | dark         |
