Feature: Data layer event template renaming

  Background:
    Given Library template Purchase confirmation has id template-7, event name purchase, and version 3
    And its originating captured event remains purchase

  # Data layer event template renaming 001
  Scenario: Data layer event template renaming 001
    When the template row actions are displayed
    Then a Rename action is available beside the other template actions
    And its accessible name identifies Purchase confirmation
    When the operator activates Rename
    Then a rename form opens with separate labelled fields Template name and Event name
    And Template name contains Purchase confirmation
    And Event name contains purchase
    And keyboard focus moves to Template name

  # Data layer event template renaming 002
  Scenario Outline: Data layer event template renaming 002
    Given the rename form changes <changed_field> to <new_value>
    When the rename draft is inspected
    Then Template name is <expected_template_name> and Event name is <expected_event_name>
    And the unchanged name field retains its prior value
    And template template-7 remains unchanged at version 3 until Save names completes

    Examples:
      | changed_field | new_value          | expected_template_name | expected_event_name |
      | Template name | Checkout purchase  | Checkout purchase      | purchase            |
      | Event name    | checkout_completed | Purchase confirmation  | checkout_completed  |

  # Data layer event template renaming 003
  Scenario: Data layer event template renaming 003
    Given the rename form changes Template name to Checkout purchase
    And Event name remains purchase
    When the operator activates Save names
    Then template template-7 becomes Checkout purchase with event name purchase at version 4
    And version 3 remains available in revision history as Purchase confirmation
    And the payload, destination, source, tags, schema assignment, and provenance remain unchanged
    And the renamed template row and search index use Checkout purchase
    And the renamed template persists after the side panel reloads

  # Data layer event template renaming 004
  Scenario: Data layer event template renaming 004
    Given the rename form changes Template name to Completed checkout
    And it changes Event name from purchase to checkout_completed
    When the operator requests Save names
    Then no template mutation occurs before confirmation
    And a consequence review shows purchase changing to checkout_completed
    And the review states that future pushes use checkout_completed
    And the review states that the originating captured purchase event remains unchanged
    And the final action is labelled Save names and use checkout_completed
    When the operator confirms Save names and use checkout_completed
    Then template template-7 becomes Completed checkout with event name checkout_completed at version 4
    And version 3 remains available in revision history with event name purchase
    And the payload, destination, source, tags, schema assignment, and provenance remain unchanged
    And the renamed template row and search index use Completed checkout and checkout_completed
    And the renamed template persists after the side panel reloads

  # Data layer event template renaming 005
  Scenario: Data layer event template renaming 005
    Given template template-7 was renamed to event checkout_completed at version 4
    When its draft is reviewed and pushed to a ready target
    Then Push confirmation identifies Event checkout_completed
    And the source adapter receives checkout_completed as the executable event name
    And exactly 1 checkout_completed event is created
    And the immutable execution record stores template template-7, version 4, and event name checkout_completed
    And the originating captured purchase event and its saved session remain unchanged

  # Data layer event template renaming 006
  Scenario Outline: Data layer event template renaming 006
    Given the rename form contains <template_name> and <event_name>
    When name validation runs
    Then Save names is disabled with reason <disabled_reason>
    And the error is programmatically associated with <invalid_field>
    And no template revision is created

    Examples:
      | template_name         | event_name     | invalid_field | disabled_reason       |
      | whitespace only       | purchase       | Template name | Enter a template name |
      | Purchase confirmation | whitespace only | Event name   | Enter an event name    |

  # Data layer event template renaming 007
  Scenario: Data layer event template renaming 007
    Given Rename was opened from the Purchase confirmation row
    And the operator has changed both name fields without saving
    When the operator cancels with Escape
    Then the rename form closes without changing template template-7 or creating a revision
    And keyboard focus returns to Rename for Purchase confirmation

  # Data layer event template renaming 008
  Scenario: Data layer event template renaming 008
    Given the rename consequence review is open for event name checkout_completed
    And keyboard focus is contained within the review
    When the operator cancels the review with Escape
    Then the rename form returns with both edited names intact
    And template template-7 remains unchanged at version 3
    And keyboard focus returns to Save names
