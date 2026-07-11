Feature: Data layer detail view headers

  Background:
    Given a repository for project my-chrome-utilities
    And the Data Layer workspace is displayed

  # Data layer detail view headers 001
  Scenario Outline: Data layer detail view headers 001
    Given captured event <event_name> from source <source_name> has validation state <validation_state>
    When the event inspector is displayed
    Then its header presents Back to events, <event_name>, <source_name>, <validation_state>, and primary action <primary_action> in that order
    And capture time, page, destination, and provenance are grouped below the header
    And no secondary metadata separates the object identity from primary action <primary_action>
    When the detail content scrolls beyond the header's initial position
    Then the event inspector header remains visible

    Examples:
      | event_name | source_name   | validation_state | primary_action  |
      | purchase   | event.history | Not checked      | Validate        |
      | page_view  | GA4 collect   | Valid            | Save to Library |

  # Data layer detail view headers 002
  Scenario Outline: Data layer detail view headers 002
    Given template Purchase confirmation version 3 has editing status <editing_status> and origin event purchase in session Checkout journey
    When the Library editor is displayed
    Then its header presents Close editor, Purchase confirmation, version 3, <editing_status>, origin event purchase in session Checkout journey, and primary action <primary_action> in that order
    And Back to captured event is available from the header
    And validation, destination, schema, and tags are grouped below the header
    And no secondary metadata separates the object identity from primary action <primary_action>
    When the detail content scrolls beyond the header's initial position
    Then the Library editor header remains visible

    Examples:
      | editing_status  | primary_action |
      | Saved           | Push           |
      | Unsaved changes | Save revision  |
