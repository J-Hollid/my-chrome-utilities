Feature: Data layer event template renaming

  Background:
    Given Library template Purchase confirmation has id template-7, event name purchase, and version 3
    And its originating captured event remains purchase

  # Data layer event template renaming 001
  Scenario: Data layer event template renaming 001
    When the Purchase confirmation row actions are displayed
    Then a separate Rename action and rename dialog are absent
    When the operator activates Edit
    Then the saved-template editor contains directly editable fields Template name and Event name
    And Template name contains Purchase confirmation
    And Event name contains purchase
    And keyboard focus moves to Template name

  # Data layer event template renaming 002
  Scenario Outline: Data layer event template renaming 002
    Given the editor changes <changed_field> to <new_value>
    When the identity draft is inspected
    Then Template name is <expected_template_name> and Event name is <expected_event_name>
    And the unchanged identity field retains its saved value
    And template template-7 remains unchanged at version 3 until a revision is confirmed

    Examples:
      | changed_field | new_value          | expected_template_name | expected_event_name |
      | Template name | Checkout purchase  | Checkout purchase      | purchase            |
      | Event name    | checkout_completed | Purchase confirmation  | checkout_completed  |

  # Data layer event template renaming 003
  Scenario: Data layer event template renaming 003
    Given the editor changes Template name to Completed checkout
    And it changes Event name from purchase to checkout_completed
    When the operator activates Save revision
    Then no template mutation occurs before revision review
    And the review shows Purchase confirmation changing to Completed checkout
    And it shows event purchase changing to checkout_completed
    And it states that future pushes from the saved revision use checkout_completed
    And it states that the originating captured purchase event remains unchanged

  # Data layer event template renaming 004
  Scenario: Data layer event template renaming 004
    Given revision review contains Template name Completed checkout and Event name checkout_completed
    When the operator confirms Save revision 4
    Then template template-7 becomes Completed checkout with event name checkout_completed at version 4
    And version 3 remains available with Template name Purchase confirmation and Event name purchase
    And the payload, source, tags, schema assignment, and provenance remain unchanged
    And the renamed template row and search index use Completed checkout and checkout_completed
    And the renamed template persists after the side panel reloads

  # Data layer event template renaming 005
  Scenario: Data layer event template renaming 005
    Given the unsaved editor draft changes Event name from purchase to checkout_completed
    When the operator opens Push confirmation
    Then the review shows purchase changing to checkout_completed
    And the final action is labelled Push checkout_completed to the active target
    When the operator confirms the push
    Then the source adapter receives checkout_completed as the executable event name
    And the immutable execution record stores event name checkout_completed
    And template template-7 remains saved at version 3 with event name purchase
    And the originating captured purchase event remains unchanged

  # Data layer event template renaming 006
  Scenario Outline: Data layer event template renaming 006
    Given the editor contains <template_name> and <event_name>
    When identity validation runs
    Then Save revision and Push draft are disabled with reason <disabled_reason>
    And the error is programmatically associated with <invalid_field>

    Examples:
      | template_name         | event_name     | invalid_field | disabled_reason       |
      | whitespace only       | purchase       | Template name | Enter a template name |
      | Purchase confirmation | whitespace only | Event name   | Enter an event name    |
