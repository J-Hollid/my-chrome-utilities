Feature: Data layer captured event template workflow

  Background:
    Given Live has selected this capture
      | event    | event id | session          | session id |
      | purchase | event-42 | Checkout journey | session-7  |

  # Data layer captured event template workflow 001
  Scenario: Data layer captured event template workflow 001
    Given the Library has no provenance link for event event-42
    When Save to Library succeeds for the selected event
    Then exactly one persisted editable template is linked to event event-42 and session session-7
    And success feedback identifies the saved template and offers Open in Library
    And the Live inspector remains open until the operator chooses a transition

  # Data layer captured event template workflow 002
  Scenario: Data layer captured event template workflow 002
    Given event event-42 was saved as template Purchase
    When the operator activates Open in Library
    Then the Library view selects exactly template Purchase
    And the editor for template Purchase opens without requiring another search or Edit action
    And the editor header provenance is "purchase (event-42) · Checkout journey (session-7)"
    And editor actions include Close editor and Back to captured event

  # Data layer captured event template workflow 003
  Scenario: Data layer captured event template workflow 003
    Given the editor is open for template Purchase
    When the operator activates Close editor
    Then template Purchase is the current Library item
    And the template editor is closed

  # Data layer captured event template workflow 004
  Scenario Outline: Data layer captured event template workflow 004
    Given the editor is open for template Purchase
    And event event-42 had keyboard focus at feed scroll position <scroll_position> before leaving Live
    When the operator activates Back to captured event
    Then the Live inspector displays event event-42
    And keyboard focus returns to event event-42
    And the Live event feed restores scroll position <scroll_position>

    Examples:
      | scroll_position |
      | 960 px          |

  # Data layer captured event template workflow 005
  Scenario Outline: Data layer captured event template workflow 005
    Given existing Library result Purchase differs from capture event-42
    When Update Library template is activated for event event-42
    Then no additional template is created without confirmation
    And the operator is asked to choose Update existing or Create copy
    When the operator chooses <duplicate_choice>
    Then the Library contains <template_count> templates linked to event event-42
    And the save result is <duplicate_result>

    Examples:
      | duplicate_choice | template_count | duplicate_result       |
      | Update existing  | 1              | Purchase updated       |
      | Create copy      | 2              | distinct copy created  |
