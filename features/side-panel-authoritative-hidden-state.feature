Feature: Side panel authoritative hidden state

  Background:
    Given the built extension side panel is running in a browser

  # Side panel authoritative hidden state 001
  Scenario Outline: Side panel authoritative hidden state 001
    Given <component> has hidden set to true
    And its component layout would otherwise use display <layout_display>
    When its computed presentation is inspected
    Then its computed display is none
    And its offset parent is null
    And it consumes no layout space
    And neither it nor its descendants can receive keyboard focus
    And it is absent from the accessibility tree
    And the side panel's hidden-state primitive overrides component display rules

    Examples:
      | component                         | layout_display |
      | Live setup steps                  | flex           |
      | Library empty state               | grid           |
      | dirty-editor close confirmation   | flex           |
      | target-selection dialog           | flex           |
      | push confirmation                 | flex           |

  # Side panel authoritative hidden state 002
  Scenario: Side panel authoritative hidden state 002
    Given session state is Capturing with observer state Connected
    And the session contains 3 captured events
    When the Live view renders its current state
    Then the session summary, capture controls, and populated event feed are visible
    And these mutually exclusive Live regions have hidden set to true
      | region                         |
      | setup instructions             |
      | disabled Start testing reason  |
      | no-events content              |
      | disconnected recovery          |
      | error recovery                 |
    And every region marked hidden satisfies the global hidden-state contract

  # Side panel authoritative hidden state 003
  Scenario: Side panel authoritative hidden state 003
    Given the Library contains template Purchase confirmation
    When the Library list renders
    Then the template row for Purchase confirmation is visible
    And the Library empty state has hidden set to true
    And the Library empty state satisfies the global hidden-state contract

  # Side panel authoritative hidden state 004
  Scenario: Side panel authoritative hidden state 004
    Given the Purchase confirmation editor has no unsaved changes
    When the clean editor renders
    Then the dirty-editor close confirmation has hidden set to true
    And it satisfies the global hidden-state contract
    When the operator changes transaction_id without saving
    Then the dirty-editor close confirmation remains hidden

  # Side panel authoritative hidden state 005
  Scenario Outline: Side panel authoritative hidden state 005
    Given the Purchase confirmation editor has an unsaved draft
    And the dirty-editor close confirmation is hidden
    When the operator activates <navigation_action>
    Then the dirty-editor close confirmation has hidden set to false
    And the confirmation is visible while the unsaved draft remains unchanged
    When the operator chooses Keep editing
    Then the dirty-editor close confirmation has hidden set to true
    And it satisfies the global hidden-state contract

    Examples:
      | navigation_action      |
      | Close editor           |
      | Back to captured event |

  # Side panel authoritative hidden state 006
  Scenario Outline: Side panel authoritative hidden state 006
    Given <overlay> is closed after rendering at least once
    When its closed presentation is inspected
    Then <overlay> has hidden set to true
    And it satisfies the global hidden-state contract
    When the operator activates <open_action>
    Then <overlay> has hidden set to false and is the displayed overlay
    When the operator activates <close_action>
    Then <overlay> returns to its initial authoritative hidden state

    Examples:
      | overlay                 | open_action        | close_action |
      | target-selection dialog | Choose target      | Escape       |
      | push confirmation       | Push draft         | Cancel       |

  # Side panel authoritative hidden state 007
  Scenario Outline: Side panel authoritative hidden state 007
    Given the automated state-transition suite uses viewport width <panel_width> CSS px
    When it exercises Live, Library, editor close, target picker, and push confirmation states
    Then every transition asserts the hidden value and computed display of each mutually exclusive region
    And every hidden region is checked for null offset parent, zero layout space, keyboard exclusion, and accessibility-tree exclusion
    And a hidden region with computed display other than none fails the automated test

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |
