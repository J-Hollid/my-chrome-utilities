# mutation-stamp: sha256=8d9443c97a0a9892d0d1ab723e707ca59513ebf4ff3f45e65cd40adc8941eb05
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T23:58:52.161634484Z","feature_name":"Data layer local rule promotion availability hardening","feature_path":"features/data-layer-local-rule-promotion-availability-hardening.feature","background_hash":"932de434b47b1dc981094d142ba4b9edad977f8f2d585516333e246ae1eb2eb9","implementation_hash":"unknown","scenarios":[{"index":1,"name":"Data layer local rule promotion availability hardening 002","scenario_hash":"b79996335d47823e44c39bc5eda02286a9b5ea4bd357c45f7e3b958570a898d9","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-07-14T23:58:52.161634484Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer local rule promotion availability hardening

  Background:
    Given Page view revision 3 contains local rule Known page types at /page_type
    And Page view is opened in the editable schema editor

  # Data layer local rule promotion availability hardening 001
  Scenario: Data layer local rule promotion availability hardening 001
    Given Page view has no stored working draft
    When the attached actions for Known page types are displayed
    Then Promote to reusable rule is immediately available
    And no unrelated schema edit is required to reveal it
    And rendering the action does not create or persist a working draft

  # Data layer local rule promotion availability hardening 002
  Scenario Outline: Data layer local rule promotion availability hardening 002
    Given the displayed rule has <rule_context>
    When its attached-rule actions are displayed in <editor_context>
    Then Promote to reusable rule is <action_state>

    Examples:
      | rule_context                              | editor_context                  | action_state |
      | local rule in the current revision        | editable current schema         | available    |
      | local rule in an existing working draft   | editable working draft          | available    |
      | newly created local rule                  | editable working draft          | available    |
      | local rule in a new unpublished schema    | editable new-schema draft       | available    |
      | reusable Rule Library attachment          | editable current schema         | absent       |
      | inherited local rule from a parent        | editable child schema           | absent       |
      | local rule in a historical revision       | read-only revision comparison   | absent       |

  # Data layer local rule promotion availability hardening 003
  Scenario: Data layer local rule promotion availability hardening 003
    Given Page view has no stored working draft
    When the operator opens promotion for Known page types
    Then the review identifies Page view revision 3 as the source for a new working draft
    And the reviewed property path, rule identity, and complete rule configuration are retained
    And Page view storage and the Rule Library remain unchanged before confirmation

  # Data layer local rule promotion availability hardening 004
  Scenario: Data layer local rule promotion availability hardening 004
    Given Page view has no stored working draft
    And promotion review is ready to create Approved page types
    When the operator confirms promotion
    Then a Page view working draft is created from revision 3
    And Known page types is replaced once at /page_type by Approved page types revision 1
    And Approved page types is created once in the Rule Library
    And the replacement retains the source rule's configuration, enabled state, and attachment position
    And published Page view revision 3 remains byte-for-byte unchanged

  # Data layer local rule promotion availability hardening 005
  Scenario: Data layer local rule promotion availability hardening 005
    Given Page view has no stored working draft
    When the operator opens and cancels promotion for Known page types
    Then no working draft is created
    And no reusable rule is created or attached
    And reopening the schema editor still displays Promote to reusable rule

  # Data layer local rule promotion availability hardening 006
  Scenario: Data layer local rule promotion availability hardening 006
    Given revision 4 has just been published with local rule Required page name still attached to /page_name
    When the operator closes and reopens Page view in the editable schema editor
    Then Promote to reusable rule is available for Required page name
    And its availability does not depend on pending changes from the former working draft
    And promoted reusable attachments remain ineligible for another promotion

  # Data layer local rule promotion availability hardening 007
  Scenario: Data layer local rule promotion availability hardening 007
    Given Page view uses path-keyed property /page_type
    And Known page types has a generated local-rule identity and canonical attachment path /page_type
    When the property and attached-rule rows are rendered and rerendered
    Then Promote to reusable rule remains associated with that exact local identity and canonical property
    And property-path normalization does not hide, duplicate, or retarget the action

  # Data layer local rule promotion availability hardening 008
  Scenario: Data layer local rule promotion availability hardening 008
    Given a new unpublished schema draft contains local rule Known page types
    When the operator confirms promotion to Approved page types
    Then the draft attachment is replaced once by the reusable rule
    And Approved page types is available in the Rule Library
    When the operator later discards the unpublished schema
    Then Approved page types remains as a standalone reusable rule
    And it has no dangling attachment to the discarded schema

  # Data layer local rule promotion availability hardening 009
  Scenario: Data layer local rule promotion availability hardening 009
    Given /page_type has two distinct local rules and no stored working draft
    When the operator promotes the second rule
    Then one working draft is created
    And only the selected local identity is replaced
    And the first local rule remains promotable
    And promotion does not create duplicate property rows or rule attachments

  # Data layer local rule promotion availability hardening 010
  Scenario: Data layer local rule promotion availability hardening 010
    Given promotion must establish a working draft and persist a reusable rule
    When either persistence operation fails
    Then schema and Rule Library storage equal their pre-confirmation snapshots
    And the current revision remains editable with Promote to reusable rule available for retry

