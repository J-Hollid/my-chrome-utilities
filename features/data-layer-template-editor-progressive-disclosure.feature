Feature: Data layer template editor progressive disclosure

  Background:
    Given Library template Purchase confirmation has last saved revision 3
    And the Event templates list is displayed

  # Data layer template editor progressive disclosure 001
  Scenario: Data layer template editor progressive disclosure 001
    When the operator selects Edit for Purchase confirmation
    Then a named detail pane for Purchase confirmation opens
    And the pane edits only template Purchase confirmation
    And its header provides Close editor
    And Properties is the first selected editing section

  # Data layer template editor progressive disclosure 002
  Scenario: Data layer template editor progressive disclosure 002
    Given the Properties section sufficiently summarizes the saved payload
    When default editing sections are inspected
    Then formatted or raw JSON is not expanded by default
    And JSON is available through its own disclosure or tab
    And destination, adapter readiness, and other execution settings are available through a separate disclosure or tab
    And opening either advanced section preserves the same draft shown by Properties

  # Data layer template editor progressive disclosure 003
  Scenario: Data layer template editor progressive disclosure 003
    Given the Purchase confirmation editor has no unsaved changes
    When the operator activates Close editor
    Then Library selection returns to the Purchase confirmation row
    And saved revision 3 remains unchanged
    And no editor-only content continues to dominate the Library view

  # Data layer template editor progressive disclosure 004
  Scenario: Data layer template editor progressive disclosure 004
    Given the dirty draft delta includes transaction_id and revenue
    When the operator activates Close editor
    Then the editor remains open until a closing choice is completed
    And the confirmation loss summary lists transaction_id and revenue
    And the choices are Keep editing, Save revision, and Discard changes

  # Data layer template editor progressive disclosure 005
  Scenario: Data layer template editor progressive disclosure 005
    Given the dirty-editor close confirmation is displayed
    When the operator chooses Keep editing
    Then the confirmation closes and the detail pane remains open
    And the complete dirty draft remains available

  # Data layer template editor progressive disclosure 006
  Scenario: Data layer template editor progressive disclosure 006
    Given the dirty-editor close confirmation is displayed
    When the operator chooses Save revision
    Then the draft is saved as revision 4
    And the detail pane closes to the Event templates list
    When Purchase confirmation is reopened
    Then the revision selector is 4 and Properties contains the committed draft

  # Data layer template editor progressive disclosure 007
  Scenario: Data layer template editor progressive disclosure 007
    Given the dirty-editor close confirmation is displayed
    When the operator chooses Discard changes
    Then the detail pane closes without changing saved revision 3
    When Purchase confirmation is reopened
    Then Properties derives from revision 3 and excludes the abandoned edits
    And the abandoned draft is absent
