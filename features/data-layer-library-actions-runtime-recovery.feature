Feature: Data layer Library actions runtime recovery

  Background:
    Given the packaged extension side panel is running in a browser
    And the Data Layer Event templates Library is displayed
    And template Purchase confirmation is persisted in the Library

  # Data layer Library actions runtime recovery 001
  Scenario: Data layer Library actions runtime recovery 001
    When the rendered Library action surface is inspected
    Then Add new event, Import Library, Export Library, and Clear Library are present
    And the Purchase confirmation row contains Rename and Delete actions
    And Save latest event to Library is absent from visible and accessible content
    And each action is connected to an executable interface transition rather than static text

  # Data layer Library actions runtime recovery 002
  Scenario Outline: Data layer Library actions runtime recovery 002
    Given the saved-template editor is closed at <panel_width> CSS px
    And Rename for Purchase confirmation has keyboard focus
    When the operator activates Rename
    Then the rename dialog is open and has hidden set to false
    And its computed display is not none and its bounding rectangle has positive width and height
    And the dialog has no hidden ancestor
    And Template name, Event name, Save names, and Cancel are visibly rendered
    And keyboard focus is inside the visible dialog
    When the operator presses Escape
    Then the dialog closes and focus returns to Rename for Purchase confirmation

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |

  # Data layer Library actions runtime recovery 003
  Scenario: Data layer Library actions runtime recovery 003
    Given no captured event or Live session is available
    When the operator activates Add new event
    Then a visible unpersisted new-event editor opens with empty identity, routing, and payload fields
    And completing required fields enables Save new event
    When the operator saves new event Scroll milestone
    Then Scroll milestone version 1 appears in the rendered Library list
    And the persisted Library contains Scroll milestone after the side panel reloads

  # Data layer Library actions runtime recovery 004
  Scenario: Data layer Library actions runtime recovery 004
    Given the Library contains Purchase confirmation and Scroll milestone
    When the operator activates Export Library
    Then the browser produces 1 Library file containing both templates, their names, payloads, revisions, and execution settings
    When the operator clears the templates and activates Import Library with that file
    Then a visible import review offers Replace entire Library and Append to Library
    When the operator confirms Replace entire Library
    Then both exported templates return to the rendered and persisted Library

  # Data layer Library actions runtime recovery 005
  Scenario: Data layer Library actions runtime recovery 005
    Given the Library contains Purchase confirmation and Scroll milestone
    When the operator activates Delete for Purchase confirmation
    Then a visible confirmation identifies Purchase confirmation and remains outside hidden editor content
    When the operator confirms deletion
    Then only Scroll milestone remains in the rendered and persisted Library
    When the operator activates Clear Library and confirms complete deletion
    Then the rendered and persisted Event templates Library is empty
    And Add new event and Import Library remain available

  # Data layer Library actions runtime recovery 006
  Scenario Outline: Data layer Library actions runtime recovery 006
    Given the clean Purchase confirmation editor is visibly open at <panel_width> CSS px
    When the operator activates Close editor
    Then the complete editor pane has hidden set to true
    And its computed display is none and its offset parent is null
    And the template list remains visible
    And focus returns to Edit for Purchase confirmation

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |

  # Data layer Library actions runtime recovery 007
  Scenario: Data layer Library actions runtime recovery 007
    When the automated Library recovery browser suite is inspected
    Then it starts from the packaged side panel's natural rendered state
    And it activates Rename, Add new event, Export Library, Import Library, Delete, Clear Library, and Close editor through their DOM controls
    And it asserts visible geometry, persisted results, and focus behavior after each transition
    And it does not force hidden elements visible before asserting action behavior
    And it does not substitute direct model calls for the interface transitions
