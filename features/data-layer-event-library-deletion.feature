Feature: Data layer event Library deletion

  Background:
    Given the Data Layer Event templates Library is displayed

  # Data layer event Library deletion 001
  Scenario: Data layer event Library deletion 001
    Given the Library contains saved event templates Purchase confirmation and Scroll milestone
    When Library actions are displayed
    Then each template row has a destructive Delete action identifying that template
    And an open saved-template editor provides the same Delete action
    And a separate destructive Clear Library action is available for the complete Event templates Library
    And Delete and Clear Library are separated from primary save, edit, and push actions

  # Data layer event Library deletion 002
  Scenario: Data layer event Library deletion 002
    Given template Purchase confirmation has id template-7, event name purchase, current version 4, and 3 earlier revisions
    When the operator activates Delete for Purchase confirmation
    Then no Library mutation occurs before confirmation
    And the confirmation identifies Purchase confirmation, event purchase, and all 4 saved versions
    And it states that deletion does not remove captured events, saved sessions, or execution records
    And the final destructive action is labelled Delete Purchase confirmation

  # Data layer event Library deletion 003
  Scenario: Data layer event Library deletion 003
    Given templates template-7 and template-9 share display name Purchase confirmation
    And Delete confirmation is open for template-7
    When the operator confirms Delete Purchase confirmation
    Then template-7 and all its revisions are removed
    And template-9 remains unchanged
    And the Library count decreases by 1
    And keyboard focus moves to Delete for template-9
    And the deletion persists after the side panel reloads
    And local feedback identifies the deleted template

  # Data layer event Library deletion 004
  Scenario: Data layer event Library deletion 004
    Given sequence Checkout journey pins template-7 version 3
    And immutable execution record execution-12 refers to template-7 version 3
    When template-7 is deleted
    Then sequence Checkout journey remains with a Missing template status and cannot run
    And the sequence reference is not silently changed to another template
    And execution record execution-12 remains unchanged
    And schemas, captured events, and saved sessions remain unchanged

  # Data layer event Library deletion 005
  Scenario: Data layer event Library deletion 005
    Given Purchase confirmation is open with unsaved editor changes
    When the operator requests Delete for Purchase confirmation
    Then the confirmation identifies the unsaved draft and saved versions that will be lost
    And choices are Keep editing and Discard draft and delete
    And neither the draft nor template changes before a choice completes
    When the operator chooses Discard draft and delete
    Then the entire editor closes and template Purchase confirmation is removed

  # Data layer event Library deletion 006
  Scenario: Data layer event Library deletion 006
    Given the Library contains 12 templates while the current search displays 2
    And a saved-template editor has unsaved changes
    When the operator activates Clear Library
    Then no Library mutation occurs before confirmation
    And the confirmation states that all 12 templates and their saved revisions will be removed
    And it states that clearing is not limited to the 2 filtered results
    And it identifies the unsaved editor changes that clearing will discard
    And it offers Export Library before clearing
    And the final destructive action is labelled Delete all 12 events

  # Data layer event Library deletion 007
  Scenario: Data layer event Library deletion 007
    Given Clear Library confirmation covers 12 templates
    When the operator confirms Delete all 12 events
    Then the Event templates Library contains 0 templates and 0 template revisions
    And the template count and plain-language empty state update immediately
    And Add new event and Import Library remain available
    And Library sequences, schemas, captured sessions, and immutable execution records remain unchanged
    And the cleared state persists after the side panel reloads
    And local feedback reports 12 events deleted
    And keyboard focus moves to Add new event

  # Data layer event Library deletion 008
  Scenario: Data layer event Library deletion 008
    Given the Event templates Library is empty
    When Library actions are displayed
    Then Clear Library is disabled with reason No saved events to clear
    And no deletion confirmation can open

  # Data layer event Library deletion 009
  Scenario Outline: Data layer event Library deletion 009
    Given <confirmation_kind> was opened from <origin_control>
    When the operator cancels with Escape
    Then no template or draft is changed
    And keyboard focus returns to <origin_control>

    Examples:
      | confirmation_kind            | origin_control                    |
      | individual delete confirmation | Delete for Purchase confirmation |
      | complete Library confirmation  | Clear Library                    |

  # Data layer event Library deletion 010
  Scenario: Data layer event Library deletion 010
    When the automated Event templates deletion browser test is inspected
    Then it deletes one stable template identity without deleting a same-named template
    And it clears the complete Library while a filter is active
    And it covers cancel, dirty-editor protection, dependency reporting, persistence, and empty-state action availability
