Feature: Data Layer workflow focus management

  Background:
    Given the side panel is displayed with keyboard input

  # Data Layer workflow focus management 001
  Scenario Outline: Data Layer workflow focus management 001
    Given <tab_set> tab <initial_tab> is selected and has keyboard focus
    When the operator presses <navigation_key>
    Then <tab_set> tab <target_tab> is selected and has keyboard focus
    And only the panel associated with <target_tab> is displayed
    And the selected tab is the only tab in <tab_set> with tab stop position 0

    Examples:
      | tab_set            | initial_tab | navigation_key | target_tab |
      | Workspace          | Data Layer  | ArrowRight    | Hotkeys    |
      | Workspace          | Data Layer  | ArrowLeft     | Hotkeys    |
      | Workspace          | Hotkeys     | ArrowRight    | Data Layer |
      | Workspace          | Hotkeys     | ArrowLeft     | Data Layer |
      | Workspace          | Hotkeys     | Home          | Data Layer |
      | Workspace          | Data Layer  | End           | Hotkeys    |
      | Data Layer         | Live        | ArrowRight    | Library    |
      | Data Layer         | Live        | ArrowLeft     | Schemas    |
      | Data Layer         | Schemas     | ArrowRight    | Live       |
      | Data Layer         | Library     | ArrowLeft     | Live       |
      | Data Layer         | Sessions    | Home          | Live       |
      | Data Layer         | Library     | End           | Schemas    |

  # Data Layer workflow focus management 002
  Scenario Outline: Data Layer workflow focus management 002
    Given event purchase has keyboard focus at feed scroll position 960 CSS px
    When the operator opens event purchase
    Then keyboard focus moves to the visible Back to events control in the inspector header
    And keyboard focus does not remain in the hidden event list
    When the operator uses <return_action>
    Then the inspector closes and event purchase has keyboard focus
    And the feed scroll position is restored to 960 CSS px

    Examples:
      | return_action           |
      | Back to events          |
      | Escape                  |

  # Data Layer workflow focus management 003
  Scenario: Data Layer workflow focus management 003
    Given Edit for template Purchase confirmation has keyboard focus
    When the operator opens the template editor
    Then keyboard focus moves to the Purchase confirmation editor heading
    And keyboard focus does not move into the JSON editor
    When the operator activates Close editor without unsaved changes
    Then the template editor closes
    And keyboard focus returns to Edit for template Purchase confirmation

  # Data Layer workflow focus management 004
  Scenario: Data Layer workflow focus management 004
    Given Push draft has keyboard focus for a push-ready purchase draft
    When the operator opens push confirmation
    Then keyboard focus moves to the push confirmation heading
    And Tab from the last focusable confirmation control wraps to its first focusable control
    And Shift+Tab from the first focusable confirmation control wraps to its last focusable control
    And background editor controls cannot receive keyboard focus
    When the operator presses Escape
    Then push confirmation closes without executing the draft
    And keyboard focus returns to Push draft

  # Data Layer workflow focus management 005
  Scenario: Data Layer workflow focus management 005
    Given Choose target has keyboard focus
    When the operator opens the target-selection dialog
    Then keyboard focus moves to target search
    And Tab from the last focusable target-dialog control wraps to its first focusable control
    And Shift+Tab from the first focusable target-dialog control wraps to its last focusable control
    And background side-panel controls cannot receive keyboard focus
    When the operator closes the target-selection dialog with Escape
    Then the target selection remains unchanged
    And keyboard focus returns to Choose target

  # Data Layer workflow focus management 006
  Scenario: Data Layer workflow focus management 006
    Given a captured event purchase and its saved template Purchase confirmation are available
    When the automated keyboard workflow runs without pointer input
    Then each transition places keyboard focus as follows
      | transition                              | focused element                            |
      | Inspect purchase                        | Back to events                             |
      | Save to Library                         | Save to Library                            |
      | Open in Library                         | Purchase confirmation editor heading       |
      | Edit Purchase confirmation              | Purchase confirmation editor heading       |
      | Save revision                           | Save revision                              |
      | Open push confirmation                  | push confirmation heading                  |
      | Cancel push confirmation                | Push draft                                 |
      | Close Purchase confirmation editor      | Edit for Purchase confirmation             |
      | Back to captured event                  | originating purchase event row              |
    And the workflow verifies push-confirmation focus containment with Tab and Shift+Tab
    And no transition leaves focus on the document body, hidden content, or an unrelated control
