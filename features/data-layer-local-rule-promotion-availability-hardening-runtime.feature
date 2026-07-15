# mutation-stamp: sha256=dc23077c2d600df7430d927b321f0790f9d9e8e6933e4a96eea57e4581d91597
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T23:59:01.399173720Z","feature_name":"Data layer local rule promotion availability hardening runtime","feature_path":"features/data-layer-local-rule-promotion-availability-hardening-runtime.feature","background_hash":"85a98a45f57e7cda8e7ca6eda9f67638fb8f2277e93cc61f8c039fece3da44dc","implementation_hash":"unknown","scenarios":[{"index":5,"name":"Data layer local rule promotion availability hardening runtime 006","scenario_hash":"efd2e98dc91fdbe8b418bfeabe630936a75956731c8d040f8d85fc75758437fb","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-14T23:59:01.399173720Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer local rule promotion availability hardening runtime

  Background:
    Given the built extension side panel is running with production schema editing, local-rule promotion, Rule Library, and persistence
    And persisted Page view revision 3 has local rule local-41 attached at /page_type
    And Page view has no workingDraft property in storage

  # Data layer local rule promotion availability hardening runtime 001
  Scenario: Data layer local rule promotion availability hardening runtime 001
    When the operator activates Edit working draft for Page view
    And opens the actual /page_type attached-rule disclosure
    Then the local-41 row contains one enabled Promote to reusable rule control
    And storage still has no Page view workingDraft
    And the action appears without changing another schema field

  # Data layer local rule promotion availability hardening runtime 002
  Scenario: Data layer local rule promotion availability hardening runtime 002
    Given the actual promotion control for local-41 is visible
    When the operator opens and cancels the production promotion dialog
    Then production schema and Rule Library storage are byte-for-byte unchanged
    And reopening Page view restores one enabled promotion control for local-41

  # Data layer local rule promotion availability hardening runtime 003
  Scenario: Data layer local rule promotion availability hardening runtime 003
    Given production storage has no Page view workingDraft
    And the actual promotion dialog is valid for Approved page types
    When the operator confirms promotion
    Then production storage atomically creates one Page view workingDraft from revision 3
    And its /page_type attachment replaces local-41 with one new reusable identity
    And the Rule Library contains the same reusable identity at revision 1
    And stored published revision 3 and its local-41 attachment remain byte-for-byte unchanged

  # Data layer local rule promotion availability hardening runtime 004
  Scenario: Data layer local rule promotion availability hardening runtime 004
    Given Page view revision 4 has been published with unpromoted local rule local-42 at /page_name
    When the actual schema editor is closed and reopened
    Then the local-42 row immediately contains one enabled Promote to reusable rule control
    And the promoted reusable attachment at /page_type contains no promotion control
    And production storage does not require a pending working draft before rendering eligibility

  # Data layer local rule promotion availability hardening runtime 005
  Scenario: Data layer local rule promotion availability hardening runtime 005
    Given production /page_type is stored as a canonical path-keyed property
    And its local attachment uses a generated local-rule identity
    When actual property rendering, rule attachment, editor reopening, and rerendering occur
    Then one canonical /page_type row contains that local rule and one promotion control
    And the action retains the generated identity and /page_type target
    And no duplicate schema property or attachment is persisted

  # Data layer local rule promotion availability hardening runtime 006
  Scenario Outline: Data layer local rule promotion availability hardening runtime 006
    Given the production attached-rule row resolves <resolved_origin>
    When promotion eligibility is rendered in the actual schema editor
    Then the row contains <promotion_control_count> enabled promotion controls

    Examples:
      | resolved_origin                                    | promotion_control_count |
      | current-revision local identity without a draft    | 1                       |
      | working-draft local identity                       | 1                       |
      | reusable identity present in Rule Library          | 0                       |
      | inherited identity from parent schema              | 0                       |
      | historical read-only local identity                | 0                       |

  # Data layer local rule promotion availability hardening runtime 007
  Scenario: Data layer local rule promotion availability hardening runtime 007
    Given a production new-schema draft contains one newly created local rule
    When the operator promotes it and then discards the unpublished schema through actual controls
    Then the reusable rule remains once in the Rule Library without an attachment to the discarded schema
    And no unpublished schema, local attachment, or provisional schema identifier remains in storage

  # Data layer local rule promotion availability hardening runtime 008
  Scenario: Data layer local rule promotion availability hardening runtime 008
    Given production promotion will fail while creating a working draft or saving the Rule Library
    When the actual confirmation action runs
    Then both storage keys equal their pre-confirmation values
    And the editor rerenders local-41 with one enabled promotion control
    And no partial dialog success, reusable identity, or working draft is displayed
    And runtime coverage exercises production editor opening, origin resolution, dialog actions, transaction persistence, publication, reopening, and new-schema discard rather than source-string inspection
