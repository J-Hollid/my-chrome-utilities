Feature: Data layer durable authoring drafts

  Background:
    Given schema Sitewide page context is open for editing in the side panel
    And its current published revision is 1

  # Data layer durable authoring drafts 001
  Scenario: Data layer durable authoring drafts 001
    When the operator enters project name Shop specification and description Shared event envelope
    And adds property /page/type with a Required rule
    Then each accepted edit autosaves to one working draft
    And no field-specific save action is required
    And the visible autosave state becomes Saved
    And published revision 1 remains unchanged

  # Data layer durable authoring drafts 002
  Scenario Outline: Data layer durable authoring drafts 002
    Given the working draft contains unsaved-to-release name, description, property, documentation, and rule edits
    When authoring is interrupted by <interruption>
    Then every draft edit is recovered exactly once
    And the same selected property and expanded path are restored
    And published revision 1 remains unchanged

    Examples:
      | interruption              |
      | an editor rerender        |
      | navigation to Assignments |
      | an extension reload       |
      | browser restart recovery  |

  # Data layer durable authoring drafts 003
  Scenario: Data layer durable authoring drafts 003
    Given the working draft has valid pending changes and no assignment
    When the operator confirms Publish revision 2
    Then revision 2 becomes current without creating an assignment
    And no blank source, event, target, or matcher is persisted
    And revision 1 remains immutable history

  # Data layer durable authoring drafts 004
  Scenario Outline: Data layer durable authoring drafts 004
    Given a valid working draft is ready to publish
    When the operator completes publication with <publication_action>
    Then revision 2 is published
    And the authoring surface is <workspace_state>
    And keyboard focus is <focus_destination>

    Examples:
      | publication_action | workspace_state                      | focus_destination             |
      | Publish            | open on Sitewide page context        | release result                |
      | Publish and close  | closed with the schema row selected  | invoking schema row action    |

  # Data layer durable authoring drafts 005
  Scenario: Data layer durable authoring drafts 005
    Given draft persistence becomes unavailable after the operator changes the description
    When autosave fails
    Then Save failed is displayed beside the draft state with a retry action
    And the entered description remains in the editor
    And navigation or publication is protected from silently discarding the edit
    When persistence recovers and the operator retries
    Then the same description is saved without duplication

  # Data layer durable authoring drafts 006
  Scenario: Data layer durable authoring drafts 006
    Given an invalid regular-expression rule is being edited
    When the operator attempts to continue
    Then the failing Pattern field identifies the invalid segment
    And actionable syntax guidance is displayed beside Pattern
    And the first invalid field receives focus from the error summary
    And no invalid draft transaction is committed

  # Data layer durable authoring drafts 007
  Scenario Outline: Data layer durable authoring drafts 007
    Given the schema editor is displayed at <surface_width>
    When the operator edits identity, property, and rule fields using only the keyboard
    Then one primary vertical scroll owner contains the active work
    And the title, context, and draft state remain available
    And modal focus is contained and restored to its invoking control

    Examples:
      | surface_width         |
      | 360 CSS px side panel |
      | 520 CSS px side panel |
      | 720 CSS px side panel |

  # Data layer durable authoring drafts 008
  Scenario: Data layer durable authoring drafts 008
    Given the property draft contains a saved type and description
    When the operator changes both fields in one property-edit transaction
    Then one Undo restores the prior type and description together
    And one Redo reapplies the complete property edit
    And neither action changes the published revision
