Feature: Data layer schema renaming

  Background:
    Given schema Page view has stable identity schema-page-view and current revision 3
    And Page view has no pending working-draft changes
    And its working draft is open in the schema editor

  # Data layer schema renaming 001
  Scenario: Data layer schema renaming 001
    When the operator changes Name from Page view to Generic page view
    Then proposed name Generic page view is saved in the Page view working draft
    And Rename schema from Page view to Generic page view is recorded as 1 pending change
    And current revision 3 retains published name Page view
    When the editor is closed, the side panel reloads, and Page view is reopened
    Then Name is restored as Generic page view
    And the pending rename remains available to publish or discard

  # Data layer schema renaming 002
  Scenario: Data layer schema renaming 002
    Given the working draft proposes name Generic page view and contains pending property and rule changes
    When the operator requests Publish revision
    Then the review identifies renaming Page view to Generic page view
    And it identifies the other pending changes
    And schema-page-view remains Page view revision 3 before confirmation
    When the operator confirms Publish revision 4
    Then schema-page-view has current name Generic page view and current revision 4
    And revision 3 remains in read-only history with name Page view
    And the pending property and rule changes are published in revision 4
    And the working draft is cleared
    And exactly 1 schema with identity schema-page-view remains in the Schema Library

  # Data layer schema renaming 003
  Scenario: Data layer schema renaming 003
    Given Page view is referenced by an assignment, a child schema, an Event Library template, and a reusable-rule attachment
    And a saved validation record identifies Page view revision 3
    When the rename to Generic page view is published as revision 4
    Then every live reference retains schema identity schema-page-view
    And current schema choices, assignment details, parent details, template details, and rule attachment details display Generic page view
    And follow-latest validation identifies Generic page view revision 4
    And pinned revision 3 validation and the saved validation record retain Page view revision 3

  # Data layer schema renaming 004
  Scenario Outline: Data layer schema renaming 004
    Given saved schema Product detail has a different stable identity
    And the Page view working-draft Name is changed to <proposed_name>
    When rename readiness is evaluated
    Then the rename is blocked
    And Name assistance is <assistance>
    And no schema is overwritten or merged

    Examples:
      | proposed_name  | assistance                                   |
      | empty          | Enter a schema name                          |
      | Product detail | A schema named Product detail already exists |
      | product DETAIL | A schema named Product detail already exists |

  # Data layer schema renaming 005
  Scenario: Data layer schema renaming 005
    Given the working draft proposes name Generic page view
    When the operator confirms Discard draft
    Then the proposed name and rename pending change are removed
    And schema-page-view remains Page view revision 3
    And reopening the schema editor displays Name Page view
