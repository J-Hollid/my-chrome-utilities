# mutation-stamp: sha256=880e2a62a285f6913fb64491c529ba33c5cd8b7f5dcc3546409a2af32443e067
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T18:37:49.733286505Z","feature_name":"Data layer local rule promotion runtime","feature_path":"features/data-layer-local-rule-promotion-runtime.feature","background_hash":"156d5275b29ac5e536c5d830f7d79256dbdf0a29abf8b5a7cf0b3629ef2a96ab","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Data layer local rule promotion runtime 001","scenario_hash":"54c086bbe176b86d1815f89ecce2f780e69a605f5a33fb1922cd75324ed82e74","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:49.733286505Z"},{"index":2,"name":"Data layer local rule promotion runtime 003","scenario_hash":"a0d076e0b91959b5b5f59653d3fee3b14b4d80f151c29c7499ea8d51c7bb0b7a","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:49.733286505Z"},{"index":3,"name":"Data layer local rule promotion runtime 004","scenario_hash":"b2327006c5f872530506911984e11e9ea9996cbb556afa717690b6a5be14cc35","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:49.733286505Z"},{"index":5,"name":"Data layer local rule promotion runtime 006","scenario_hash":"6402d871ffca0ce9dc97ee2506b353e4ce1e4753815babf6317da1269e47f8cc","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:49.733286505Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer local rule promotion runtime

  Background:
    Given the built extension is running with production schema editor, Rule Library, validation, and persistence systems
    And Page view revision 3 has an open working draft
    And local rule stable id local-41 is attached to /page_type

  # Data layer local rule promotion runtime 001
  Scenario Outline: Data layer local rule promotion runtime 001
    Given the actual attached-rule row resolves <resolved_origin>
    When the row is rendered in the schema editor DOM
    Then it contains <promotion_control_count> enabled Promote to reusable rule controls

    Examples:
      | resolved_origin                      | promotion_control_count |
      | local stable id absent from library  | 1                       |
      | reusable stable id present in library | 0                      |
      | inherited stable id from parent      | 0                       |

  # Data layer local rule promotion runtime 002
  Scenario: Data layer local rule promotion runtime 002
    Given local-41 is between local-40 and local-42 in the stored attachment order
    When the operator confirms promotion as Approved page types through the actual DOM
    Then production persistence atomically saves reusable stable id reusable-51 revision 1
    And it replaces local-41 at the same attachment index and canonical path /page_type
    And the replacement is pinned to reusable-51 revision 1
    And local-40 and local-42 are byte-for-byte unchanged
    And one pending change contains local-41 and reusable-51
    And reloading storage preserves one Rule Library entry and one replacement attachment

  # Data layer local rule promotion runtime 003
  Scenario Outline: Data layer local rule promotion runtime 003
    Given local-41 contains <source_configuration>
    When local-41 is promoted, serialized, reloaded, and evaluated by production validation
    Then reusable-51 and its attachment retain <retained_configuration>
    And the before-and-after evaluation is <evaluation_equivalence>

    Examples:
      | source_configuration                                  | retained_configuration                            | evaluation_equivalence                  |
      | number Allowed values containing 1                    | number parameter 1 distinct from string parameter 1 | identical for number 1 and string 1     |
      | warning with issue message Use a known page type      | warning and issue message                         | identical issue severity and message    |
      | condition /site Equals consumer                       | complete condition group                          | identical applicable and skipped states |
      | disabled Regular expression beginning with SKU-       | disabled attachment state                         | Not applicable in both states           |

  # Data layer local rule promotion runtime 004
  Scenario Outline: Data layer local rule promotion runtime 004
    Given the Rule Library contains <library_state>
    When the operator reviews local-41 for promotion
    Then the production review reports <review_outcome>
    And confirming <selected_action> produces <persistence_outcome>

    Examples:
      | library_state                                      | review_outcome                         | selected_action            | persistence_outcome                        |
      | semantically equivalent reusable-50 revision 2     | equivalent revision 2 is recommended   | use existing reusable rule | attach reusable-50 revision 2 without creation |
      | semantically equivalent reusable-50 revision 2     | duplicate-definition warning            | create Consumer page types | create one distinct revision 1             |
      | same normalized name with a different definition   | conflicting existing rule is identified | blocked confirmation       | no storage mutation                        |

  # Data layer local rule promotion runtime 005
  Scenario: Data layer local rule promotion runtime 005
    Given /page_type contains local stable ids local-40 and local-41 with the same display name
    When promotion is opened from local-41 and confirmed
    Then production mutation targets local-41 by stable identity and canonical path
    And local-40 remains byte-for-byte unchanged
    And exactly one effective replacement attachment exists

  # Data layer local rule promotion runtime 006
  Scenario Outline: Data layer local rule promotion runtime 006
    Given valid promotion is ready to persist
    And production persistence will fail at <failure_point>
    When confirmation runs
    Then stored schemas and reusable rules equal their pre-confirmation snapshots
    And reopening the editor shows local-41 with no partial reusable replacement

    Examples:
      | failure_point              |
      | reusable-rule save         |
      | schema working-draft save  |

  # Data layer local rule promotion runtime 007
  Scenario: Data layer local rule promotion runtime 007
    Given local-41 has been replaced by reusable-51 in the working draft
    When Page view revision 4 is published and the extension is reloaded
    Then production validation attributes current results to reusable-51 revision 1
    And persisted Page view revision 3 still attributes historical results to local-41
    And no schema other than Page view contains reusable-51

  # Data layer local rule promotion runtime 008
  Scenario: Data layer local rule promotion runtime 008
    Given the attached-rule disclosure is open in a 320 CSS pixel wide side panel
    When the operator opens promotion, cancels, reopens, and confirms it using keyboard controls
    Then the actual DOM workflow remains operable without horizontal page scrolling
    And /page_type disclosure, editor scroll, and selected schema are restored
    And focus returns to the originating control or replacement attachment
    And the exercised path uses production origin resolution, transaction, persistence, and validation code
