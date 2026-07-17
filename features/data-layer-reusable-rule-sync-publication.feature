Feature: Data layer reusable rule sync publication

  Background:
    Given reusable rule Approved page types revision 1 is attached to current Page view revision 3 and Product detail revision 5
    And the reusable rule is open in the Rule Library

  # Data layer reusable rule sync publication 001
  Scenario: Data layer reusable rule sync publication 001
    When the operator saves Approved page types revision 2
    Then Page view revision 3 and Product detail revision 5 remain pinned to reusable rule revision 1
    And their validation behavior and schema revision numbers remain unchanged
    And Sync attached schemas and publish revisions is available for reusable rule revision 2

  # Data layer reusable rule sync publication 002
  Scenario: Data layer reusable rule sync publication 002
    When the operator requests Sync attached schemas and publish revisions
    Then a review identifies Page view revision 3 and Product detail revision 5 as schemas pinned to reusable rule revision 1
    And it identifies Page view revision 4 and Product detail revision 6 as the revisions to publish with reusable rule revision 2
    And it identifies every attachment that will change
    And no reusable rule attachment or schema revision changes before confirmation

  # Data layer reusable rule sync publication 003
  Scenario: Data layer reusable rule sync publication 003
    Given the sync review contains no blocked schema
    When the operator confirms the sync and publication
    Then Page view revision 4 and Product detail revision 6 become current
    And every current attachment to Approved page types in those schemas is pinned to reusable rule revision 2
    And one new revision is published per attached schema
    And historical schema revisions remain pinned to reusable rule revision 1
    And schemas without an Approved page types attachment remain unchanged

  # Data layer reusable rule sync publication 004
  Scenario: Data layer reusable rule sync publication 004
    Given Product detail revision 5 has a working draft with unrelated pending changes
    When the operator requests Sync attached schemas and publish revisions
    Then Product detail is blocked with assistance to publish or discard its working draft first
    And confirmation of the bulk sync is unavailable
    And the existing Product detail working draft remains unchanged
    And Approved page types revision 2 remains saved for a later sync

  # Data layer reusable rule sync publication 005
  Scenario Outline: Data layer reusable rule sync publication 005
    Given a valid sync review is open
    When sync completes by <completion_event>
    Then <schema_outcome>
    And Approved page types revision 2 remains saved

    Examples:
      | completion_event            | schema_outcome                                      |
      | the operator cancels        | all attached schemas remain at their current revisions |
      | publication fails           | no attached schema receives a partial new revision  |
      | confirmation succeeds       | all reviewed schema revisions are published         |
