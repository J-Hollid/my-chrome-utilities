# mutation-stamp: sha256=d655f7541e83ac700afa60208e4622b9d52d5fad2382e8160ee49b6148096468
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-17T20:12:07.973065337Z","feature_name":"Data layer local rule editing","feature_path":"features/data-layer-local-rule-editing.feature","background_hash":"83864b9c91579fceb5b01493f8da326b6bac21e538ffe4ab297a727faf7b76a0","implementation_hash":"sha256:e9528bd306ab986785ef56d8539b3dbc9231c37cd1108f51252b96cfa80e5d42","scenarios":[{"index":3,"name":"Data layer local rule editing 004","scenario_hash":"b12e5378f473c640c060fdb185d7cd71b4f3e19b34d44d8c91a9af9f786eeb5c","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-17T20:12:07.973065337Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer local rule editing

  Background:
    Given Page view revision 3 contains local rule Known page types at /page_type
    And Page view is open in the schema editor

  # Data layer local rule editing 001
  Scenario: Data layer local rule editing 001
    When the operator activates Edit for the attached rule
    Then local rule configuration opens with its operator, typed parameters, severity, issue message, condition, and enabled state
    And the configuration identifies /page_type and Local rule origin
    And reusable Rule Library metadata is not editable there
    And keyboard focus moves to the local rule configuration

  # Data layer local rule editing 002
  Scenario: Data layer local rule editing 002
    Given Known page types allows page and product
    When the operator changes its allowed values to page, product, and checkout
    And saves the local rule
    Then one Page view working draft contains the changed rule with its original stable local identity at /page_type
    And no duplicate rule or reusable rule is created
    And the working-draft validation preview uses page, product, and checkout
    And Page view revision 3 remains published and unchanged

  # Data layer local rule editing 003
  Scenario: Data layer local rule editing 003
    Given Page view already has a working draft with unrelated pending changes
    When the operator saves a valid edit to Known page types
    Then the edit is added to the same working draft
    And the unrelated pending changes remain unchanged
    And publishing the working draft creates Page view revision 4 containing both sets of changes
    And revision 3 retains the former local rule definition

  # Data layer local rule editing 004
  Scenario Outline: Data layer local rule editing 004
    Given local rule configuration contains <configuration>
    When the operator attempts to finish editing by <completion>
    Then <edit_outcome>
    And the stored working draft remains unchanged

    Examples:
      | configuration                  | completion          | edit_outcome                                      |
      | page, product, and checkout    | cancelling          | the local rule configuration closes               |
      | malformed regular expression [ | saving the changes  | saving is blocked with Correct the regular expression |

  # Data layer local rule editing 005
  Scenario: Data layer local rule editing 005
    Given /page_type has two local rules named Known page types with different stable identities
    When the operator edits the second rule
    Then only the selected stable local identity changes
    And the first rule remains unchanged and evaluates independently
    And the schema editor restores /page_type, its attached-rule disclosure, scroll position, and keyboard focus

  # Data layer local rule editing 006
  Scenario: Data layer local rule editing 006
    Given reusable rule Approved page types revision 2 is attached to /page_name
    When the operator activates Edit for the attached rule
    Then the Rule Library opens with Approved page types revision 2 selected
    And reusable rule configuration opens in the Rule Library
    And it does not open as local rule configuration in the schema editor
    And the operator can return to Page view at /page_name
