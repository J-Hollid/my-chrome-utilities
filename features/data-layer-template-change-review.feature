Feature: Data layer template change review

  Background:
    Given Purchase confirmation version 3 is open in the Library editor
    And its saved event name is purchase and destination is event.history
    And its saved payload contains ecommerce.value 18, legacy.debug true, and items[0].quantity 1

  # Data layer template change review 001
  Scenario: Data layer template change review 001
    Given the editor changes Template name to Completed checkout
    And it changes Event name to checkout_completed and Destination to queue.history
    And it changes ecommerce.value to 19 and items[0].quantity to 2
    And it adds experiment.variant treatment-b and removes legacy.debug
    When the operator activates Save revision
    Then a revision confirmation opens without saving version 4
    And labelled decision data identifies operation Save revision, current version 3, resulting version 4, and validation state
    And identity changes show Template name and Event name with their saved and revised values
    And execution changes show Destination with its saved and revised values
    And payload changes contain these rows
      | Path               | Previous    | Revised      | Change  |
      | ecommerce.value    | 18          | 19           | changed |
      | items[0].quantity  | 1           | 2            | changed |
      | experiment.variant | Not present | treatment-b  | added   |
      | legacy.debug       | true        | Not present  | removed |
    And the final action is labelled Save revision 4

  # Data layer template change review 002
  Scenario: Data layer template change review 002
    Given revision confirmation is open for the changed draft
    When the operator cancels with Escape
    Then no revision is created and the complete draft remains in the editor
    And keyboard focus returns to Save revision
    When the operator reopens and confirms Save revision 4
    Then exactly 1 revision is created with all reviewed identity, execution, and payload values
    And local feedback identifies version 4 and summarizes the saved changes

  # Data layer template change review 003
  Scenario: Data layer template change review 003
    Given the same identity, execution, and payload changes remain unsaved in version 3
    When the operator activates Push draft
    Then Push confirmation uses the same ordered identity, execution, and payload change summary as revision confirmation
    And payload change legacy.debug shows previous value true, pushed value Not present, and change Removed
    And decision data identifies Event checkout_completed and saved template version 3
    And the final action is labelled Push checkout_completed to the active target
    And opening the review does not save the draft or execute the push

  # Data layer template change review 004
  Scenario Outline: Data layer template change review 004
    Given <review_kind> is displaying the changed draft
    When its shared change-summary component is inspected
    Then every changed, added, and removed path supplied by the complete diff is rendered once
    And identity, execution, and payload groups use the same field order and value formatting
    And absent values are displayed as Not present
    And unchanged values are omitted
    And the proposed-value label is <proposed_label>

    Examples:
      | review_kind         | proposed_label |
      | revision confirmation | Revised      |
      | Push confirmation     | Pushed        |

  # Data layer template change review 005
  Scenario: Data layer template change review 005
    Given only Template name or Event name differs from saved version 3
    When revision confirmation or Push confirmation is displayed
    Then the identity change remains visible even though no payload property changed
    And the payload section states No payload changes

  # Data layer template change review 006
  Scenario: Data layer template change review 006
    When Purchase confirmation first opens in the editor
    Then Revision history and Properties are separate disclosure controls
    And both disclosures start collapsed
    And the Revision history summary identifies the number of saved revisions
    And the Properties summary identifies that draft properties are available
    And their collapsed content is absent from keyboard navigation and accessibility reading order

  # Data layer template change review 007
  Scenario: Data layer template change review 007
    Given the operator expands Properties and Revision history
    When a draft field changes or a confirmation is opened and cancelled
    Then both disclosure states remain expanded
    And updated draft properties and saved revision entries remain available
    When the editor is closed and later reopened
    Then both disclosures start collapsed again

  # Data layer template change review 008
  Scenario: Data layer template change review 008
    When the automated Library change-review browser test is inspected
    Then it edits both names directly in the saved-template editor
    And it asserts that no separate Rename action or rename dialog is rendered
    And it opens Save revision and Push confirmations through their interface actions
    And it asserts changed, added, and removed property rows in both rendered reviews
    And it asserts event-name changes and exact final action labels
    And it verifies Revision history and Properties start collapsed without forcing disclosure state
