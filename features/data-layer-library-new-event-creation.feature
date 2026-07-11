Feature: Data layer Library new event creation

  Background:
    Given the Data Layer Event templates Library is displayed

  # Data layer Library new event creation 001
  Scenario: Data layer Library new event creation 001
    When Library actions are displayed
    Then Add new event is available
    And Save latest event to Library is absent
    And no Library action depends on a captured event being available
    When the operator activates Add new event
    Then an unpersisted editor titled New event opens
    And keyboard focus moves to Template name
    And the Library template count remains unchanged

  # Data layer Library new event creation 002
  Scenario: Data layer Library new event creation 002
    When the operator activates Add new event
    Then the new-event editor starts with these labelled fields
      | field         | initial value        |
      | Template name | empty                |
      | Event name    | empty                |
      | Source        | no source selected   |
      | Destination   | empty                |
      | JSON payload  | {}                   |
      | Validation    | Not checked          |
    And its status is Unsaved new event
    And it has no captured event id or captured session id
    And no empty template record has been persisted

  # Data layer Library new event creation 003
  Scenario Outline: Data layer Library new event creation 003
    Given the new-event editor has readiness problem <readiness_problem>
    When editor actions are displayed
    Then Save new event is disabled with reason <disabled_reason>
    And the reason is visibly and programmatically associated with the affected field

    Examples:
      | readiness_problem | disabled_reason             |
      | Template name empty | Enter a template name      |
      | Event name empty    | Enter an event name         |
      | Source not selected | Select an event source      |
      | Destination empty   | Enter a destination path    |
      | JSON invalid        | Correct the JSON draft      |

  # Data layer Library new event creation 004
  Scenario: Data layer Library new event creation 004
    Given the new-event editor contains these valid values
      | field         | value                                  |
      | Template name | Scroll milestone                       |
      | Event name    | scroll                                 |
      | Source        | Event history                          |
      | Destination   | event.history                          |
      | JSON payload  | {"scroll_percentage": 25}             |
    When the operator activates Save new event
    Then one Library template named Scroll milestone is created at version 1
    And its executable event name is scroll
    And its source, destination, and payload equal the editor values
    And its provenance identifies creation in the Library without claiming a captured origin
    And the template persists after the side panel reloads
    And subsequent changes use Save revision rather than Save new event

  # Data layer Library new event creation 005
  Scenario: Data layer Library new event creation 005
    Given no Live session or captured event exists
    When the operator creates and saves a valid new event
    Then the Library template is created successfully
    And no synthetic captured event or saved session is created
    And opening Live does not show the Library-created template as captured history

  # Data layer Library new event creation 006
  Scenario: Data layer Library new event creation 006
    Given the untouched new-event editor is open from Add new event
    When the operator activates Close editor
    Then the editor closes without creating a template or confirmation
    And keyboard focus returns to Add new event

  # Data layer Library new event creation 007
  Scenario: Data layer Library new event creation 007
    Given the new-event editor has unsaved field or payload changes
    When the operator activates Close editor
    Then a confirmation offers Keep editing, Save new event, and Discard new event
    And no template is created before a closing choice completes
    When the operator chooses Discard new event
    Then the editor closes without adding a Library record
    And keyboard focus returns to Add new event

  # Data layer Library new event creation 008
  Scenario Outline: Data layer Library new event creation 008
    Given Add new event opens the editor at <panel_width> CSS px
    When the creation form is displayed
    Then its labels, fields, validation, and actions remain in the Library detail workflow
    And all inputs use the available editor width without horizontal document scrolling
    And Add new event is absent while the unpersisted editor is open

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |
