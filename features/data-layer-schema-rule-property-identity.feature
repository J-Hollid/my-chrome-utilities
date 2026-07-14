# mutation-stamp: sha256=765d34061f28ca58e6161c624908814c1d18f4b260b8bf69ae8e630d41058ca0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T22:57:54.327695392Z","feature_name":"Data layer schema rule property identity","feature_path":"features/data-layer-schema-rule-property-identity.feature","background_hash":"cd38ea476247c0c62b2d9b6fca32e96e369acb5a05486e15af4fa40129d623b7","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Data layer schema rule property identity 001","scenario_hash":"4243d98620d4a1a11f22b05e8a345afff0054a6eab1a96b4972cac886b084fdd","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-14T22:57:54.327695392Z"},{"index":1,"name":"Data layer schema rule property identity 002","scenario_hash":"0223cc4acf126c25785d51e8efaf4d731a615ecac65615eba5f0a23182870558","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T22:57:54.327695392Z"},{"index":3,"name":"Data layer schema rule property identity 004","scenario_hash":"759b3ce978c5ed1bcfbea778d38f9911c526dc85c4ed0a881a07c2bd5740adf9","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T22:57:54.327695392Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema rule property identity

  Background:
    Given schema Page view working draft is open in the schema editor
    And property rows and attached rules are associated by canonical payload path

  # Data layer schema rule property identity 001
  Scenario Outline: Data layer schema rule property identity 001
    Given the draft contains <schema_representation>
    When the property tree is displayed
    Then canonical property <canonical_path> is displayed in exactly one property row
    And that row displays path <displayed_path> with the property's type, origin, documentation, and active-rule count

    Examples:
      | schema_representation                                      | canonical_path       | displayed_path    |
      | path-keyed root property /page_type                        | /page_type           | page_type         |
      | nested root property page_type                             | /page_type           | page_type         |
      | path-keyed array /page_levels and item /page_levels/0      | /page_levels/0       | page_levels.0     |
      | nested array item property products every item name        | /products/*/name     | products.*.name   |
      | inherited path-keyed property /customer/id                 | /customer/id         | customer.id       |

  # Data layer schema rule property identity 002
  Scenario Outline: Data layer schema rule property identity 002
    Given path-keyed property /page_type is displayed once with 0 active rules
    And the draft schema document and ordered canonical property rows are recorded
    When the operator completes <rule_action> for page_type
    Then <attached_rule> is attached once to canonical property /page_type
    And the page_type active-rule count is 1
    And the draft schema document is byte-for-byte unchanged
    And the ordered canonical property rows are unchanged
    And page_type remains displayed in exactly one property row
    And the current published Page view revision remains unchanged

    Examples:
      | rule_action                                             | attached_rule                    |
      | local Required rule creation                            | one local Required rule          |
      | reusable Approved page types version 2 attachment       | Approved page types version 2    |
      | local conditional Exact value rule creation             | one local conditional Exact value rule |

  # Data layer schema rule property identity 003
  Scenario: Data layer schema rule property identity 003
    Given path-keyed property /page_type is displayed once with 0 active rules
    And the draft schema document is recorded
    When the operator creates a local Required rule for page_type
    And the operator creates a local Allowed values rule for page_type
    Then both distinct rules are attached to canonical property /page_type
    And the page_type active-rule count is 2
    And page_type is still displayed in exactly one property row
    And the recorded draft schema document is unchanged
    And no additional page_type property definition exists

  # Data layer schema rule property identity 004
  Scenario Outline: Data layer schema rule property identity 004
    Given <property_representation> is displayed once in the Page view working draft
    And the draft schema document is recorded
    When a compatible reusable rule is attached from that property's rule picker
    Then the rule attachment targets <canonical_path>
    And the recorded draft schema document is unchanged
    And canonical property <canonical_path> remains displayed once
    And its parent, child, and sibling property rows retain their order and metadata

    Examples:
      | property_representation                              | canonical_path       |
      | path-keyed array item /page_levels/0                 | /page_levels/0       |
      | nested array item products every item name           | /products/*/name     |
      | inherited path-keyed property /customer/id           | /customer/id         |

  # Data layer schema rule property identity 005
  Scenario: Data layer schema rule property identity 005
    Given Approved page types version 2 is attached to path-keyed property /page_type
    And page_type is displayed once with 1 active rule
    When the operator reopens the property rule picker and retries that attachment
    Then the existing attachment is identified as already attached
    And no rule or property definition is added
    And page_type remains displayed once with 1 active rule

  # Data layer schema rule property identity 006
  Scenario: Data layer schema rule property identity 006
    Given a local rule and a reusable rule are attached to path-keyed property /page_type
    And the working draft has one canonical property definition and one page_type row
    When the working draft is persisted and the schema editor is reopened
    Then both rule attachments remain associated with canonical property /page_type
    And page_type is displayed once with 2 active rules
    And reopening does not add or migrate a property definition

  # Data layer schema rule property identity 007
  Scenario: Data layer schema rule property identity 007
    Given a rule has been attached to the selected page_type property row
    When the property tree refreshes after attachment
    Then the selected row, expansion state, editor scroll position, and keyboard return target are preserved
    And the row's origin, type, documentation, and property actions remain unchanged

