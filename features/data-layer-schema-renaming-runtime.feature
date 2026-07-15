Feature: Data layer schema renaming runtime

  Background:
    Given the built extension side panel is running with the production Schema Library, schema editor, revisions, assignments, inheritance, Event Library attachments, and persistence
    And production Page view has stable identity schema-page-view, current revision 3, and no working draft

  # Data layer schema renaming runtime 001
  Scenario: Data layer schema renaming runtime 001
    Given the actual Page view working-draft editor is open
    When production Name input changes to Generic page view
    Then production storage contains proposed working-draft name Generic page view
    And the stored current name remains Page view
    And one rename pending change identifies both names
    When the editor closes, the side panel reloads, and the actual Page view row is reopened
    Then rendered Name is Generic page view and the pending rename is unchanged

  # Data layer schema renaming runtime 002
  Scenario: Data layer schema renaming runtime 002
    Given production Page view has a pending rename to Generic page view and another pending schema edit
    When the actual publish action opens its review
    Then the rendered review identifies the old name, proposed name, current revision, next revision, and other edit
    And production storage remains byte-equivalent before confirmation
    When the rendered confirmation publishes revision 4
    Then production storage contains current name Generic page view at stable identity schema-page-view
    And read-only revision 3 retains name Page view
    And the other edit is present in revision 4
    And the production Schema Library renders one Generic page view row and no current Page view row

  # Data layer schema renaming runtime 003
  Scenario: Data layer schema renaming runtime 003
    Given production Page view is referenced by an assignment, a child schema, an Event Library template, and a reusable-rule attachment
    When production rename to Generic page view is published
    Then stored references remain byte-equivalent by schema identity
    And their rendered current labels use Generic page view
    And production follow-latest validation reports Generic page view revision 4
    And pinned and previously saved revision 3 validation reports Page view revision 3
    When the side panel reloads
    Then all references resolve and no duplicate schema is restored

  # Data layer schema renaming runtime 004
  Scenario Outline: Data layer schema renaming runtime 004
    Given production Product detail has a different stable identity
    And the actual Page view editor receives Name <proposed_name>
    When production rename readiness renders
    Then Publish revision is disabled
    And rendered Name assistance is <assistance>
    And production storage retains separate Page view and Product detail identities

    Examples:
      | proposed_name  | assistance                                   |
      | empty          | Enter a schema name                          |
      | Product detail | A schema named Product detail already exists |
      | product DETAIL | A schema named Product detail already exists |

  # Data layer schema renaming runtime 005
  Scenario: Data layer schema renaming runtime 005
    Given production Page view has a persisted pending rename to Generic page view
    When the actual working draft is discarded
    Then production storage has no working draft and current name remains Page view
    And reopening the actual editor renders Name Page view
    And Generic page view is absent from current schema choices
