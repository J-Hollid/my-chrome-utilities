# mutation-stamp: sha256=d65c5f8f3ba611637d136cc80ec731c01406b5a1b253452ebba2e1fe00240e12
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T23:27:54.638848943Z","feature_name":"Data layer schema manual property authoring","feature_path":"features/data-layer-schema-manual-property-authoring.feature","background_hash":"4055b373c09d05f3adc87a79090b14759b2da70a6c43d55203020e5e6357dd42","implementation_hash":"sha256:6215bfc08114642e8c1acd47acb6871fa158522525cdd5ea42892470ae80dc9f","scenarios":[{"index":2,"name":"Data layer schema manual property authoring 003","scenario_hash":"8905632d47b8f29974399d4bb063f2b29e73270888bfd2ade17dfa0475099416","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-13T23:27:54.638848943Z"},{"index":4,"name":"Data layer schema manual property authoring 005","scenario_hash":"826e78c6a79f663f3882879e086c79749fab1e034bff5e9b2572de24a6760f5e","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-13T23:27:54.638848943Z"},{"index":5,"name":"Data layer schema manual property authoring 006","scenario_hash":"674ae409da847c72f5812ca50d06581dc5896c02e75ed91b207bff6fbc6c2e2e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-13T23:27:54.638848943Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema manual property authoring

  Background:
    Given schema Page view has current revision 3
    And its working draft is open in the schema editor

  # Data layer schema manual property authoring 001
  Scenario: Data layer schema manual property authoring 001
    When Property rules are displayed
    Then a persistent Add property action appears above the property tree
    And no global Add validation rule action is displayed
    And property rows retain their own Add rule actions

  # Data layer schema manual property authoring 002
  Scenario: Data layer schema manual property authoring 002
    When the operator activates Add property
    Then a focused manual-property form opens
    And Property path receives keyboard focus
    And Value type offers string, number, boolean, object, and array
    And Array item type is hidden until array is selected
    And Add property and Cancel are available

  # Data layer schema manual property authoring 003
  Scenario Outline: Data layer schema manual property authoring 003
    Given the manual-property form contains path <entered_path>
    When the path preview is displayed
    Then normalized path is <normalized_path>
    And missing object path is <missing_object_path>

    Examples:
      | entered_path        | normalized_path       | missing_object_path |
      | page_category       | /page_category        | none                |
      | commerce.order.id   | /commerce/order/id    | commerce, order     |

  # Data layer schema manual property authoring 004
  Scenario: Data layer schema manual property authoring 004
    Given the manual-property form defines commerce.order.id as string
    When the operator activates Add property
    Then missing commerce and order object properties are created
    And manual property /commerce/order/id has been added to the Page view working draft
    And /commerce/order/id is selected in the property tree with 0 active rules
    And Add rule is available for /commerce/order/id
    And current revision 3 remains unchanged

  # Data layer schema manual property authoring 005
  Scenario Outline: Data layer schema manual property authoring 005
    Given the manual-property form has property definition <property_definition>
    When manual property validation runs
    Then addition result is <addition_result>
    And assistance is <assistance>

    Examples:
      | property_definition                 | addition_result | assistance                                      |
      | empty path                          | blocked         | Enter a property path                           |
      | commerce..id as string              | blocked         | Remove the empty path segment                   |
      | existing page_type as string        | blocked         | Go to existing property page_type               |
      | commerce.order under string commerce | blocked        | commerce cannot contain child properties        |
      | inherited page_name as string       | blocked         | page_name is defined by the parent schema        |
      | items as array without item type    | blocked         | Select an array item type                        |

  # Data layer schema manual property authoring 006
  Scenario Outline: Data layer schema manual property authoring 006
    Given the manual-property form defines property items as array
    When array item type <item_type> is selected
    Then the preview identifies items as an array of <item_type>
    And the property can be added

    Examples:
      | item_type |
      | string    |
      | number    |
      | boolean   |
      | object    |

  # Data layer schema manual property authoring 007
  Scenario: Data layer schema manual property authoring 007
    Given page_type already exists in the property tree
    And duplicate path page_type is blocked in the manual-property form
    When the operator activates Go to existing property page_type
    Then the form closes without changing the working draft
    And page_type is selected and visible in the property tree
    And keyboard focus moves to Add rule for page_type

  # Data layer schema manual property authoring 008
  Scenario: Data layer schema manual property authoring 008
    Given the manual-property form contains an unsaved property definition
    When the operator activates Cancel
    Then the form closes
    And no property or rule is added
    And the Page view working draft remains unchanged
    And keyboard focus returns to Add property

  # Data layer schema manual property authoring 009
  Scenario: Data layer schema manual property authoring 009
    Given manual property /commerce/order/id has been added to the Page view working draft
    When the side panel reloads and Page view is reopened
    Then /commerce/order/id remains in the working-draft property tree
    And it remains identified as Manual with type string and 0 active rules
    And current revision 3 remains unchanged

  # Data layer schema manual property authoring 010
  Scenario: Data layer schema manual property authoring 010
    Given manual property /commerce/order/id has been added without a rule
    When validation preview refreshes
    Then /commerce/order/id is part of the schema data model
    And no validation constraint beyond type string is inferred
    And no reusable or local rule is attached implicitly
