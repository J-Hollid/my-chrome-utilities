Feature: Data layer state-aware actions

  Background:
    Given a repository for project my-chrome-utilities
    And the Data Layer workspace is displayed

  # Data layer state-aware actions 001
  Scenario: Data layer state-aware actions 001
    Given captured event purchase has validation state Not checked and no applicable schema
    When Live inspector actions are displayed
    Then Validate is disabled
    And visible accessible text associated with Validate states Select a schema to validate
    And activating the disabled control cannot run validation or change Not checked

  # Data layer state-aware actions 002
  Scenario Outline: Data layer state-aware actions 002
    Given the selected event has Library relationship <library_relationship>
    When Live inspector actions are displayed
    Then the Library action is labelled <action_label> and is <availability>
    And rendering the action creates no additional template identity

    Examples:
      | library_relationship              | action_label             | availability |
      | no linked template                | Save to Library          | enabled      |
      | linked template matches event     | Saved                    | disabled     |
      | linked template differs from event | Update Library template | enabled      |

  # Data layer state-aware actions 003
  Scenario: Data layer state-aware actions 003
    Given template Purchase confirmation has a dirty draft with these unsaved changes
      | property       | saved value | draft value |
      | transaction_id | test-123    | test-456    |
      | revenue        | 39.95       | 49.95       |
      | debug          | absent      | true        |
    When the operator activates Discard draft
    Then a destructive confirmation opens before any draft mutation
    And the confirmation states that transaction_id, revenue, and debug changes will be lost
    And the draft remains unchanged until discard is confirmed

  # Data layer state-aware actions 004
  Scenario: Data layer state-aware actions 004
    Given the dirty-draft confirmation is open for Purchase confirmation
    When Cancel is chosen
    Then the editor restores the complete dirty draft
    When the operator requests Discard draft again and confirms it
    Then the last saved revision replaces the dirty draft
    And feedback states that changes to Purchase confirmation were discarded

  # Data layer state-aware actions 005
  Scenario Outline: Data layer state-aware actions 005
    Given an active testing session has <captured_event_count> captured events with save state <session_save_state>
    When End testing is displayed
    Then visible text associated with End testing states <consequence_text>
    And its accessible description contains the same save consequence
    And End testing retains destructive treatment

    Examples:
      | captured_event_count | session_save_state | consequence_text                       |
      | 12                   | unsaved            | 12 captured events have not been saved |
      | 12                   | saved              | All 12 captured events are saved       |
      | 0                    | nothing to save    | No captured events need saving         |

  # Data layer state-aware actions 006
  Scenario: Data layer state-aware actions 006
    Given Library record template-7 is named Purchase confirmation
    When Duplicate begins
    Then no template is created before a new name is confirmed
    When the operator confirms new name Purchase confirmation copy
    Then one template with a new identity is created as Purchase confirmation copy
    And local feedback reads Duplicated as Purchase confirmation copy
    And template template-7 remains unchanged

  # Data layer state-aware actions 007
  Scenario: Data layer state-aware actions 007
    Given Copy payload, Push draft, and Discard draft are visible in their action contexts
    When their action groups are displayed
    Then Copy payload uses non-destructive quiet treatment
    And Copy payload is grouped with inspector support actions
    And Copy payload is not grouped visually with Push draft or Discard draft
    And Push draft and Discard draft retain their state-changing consequence treatment
