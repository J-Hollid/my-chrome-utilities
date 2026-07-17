# mutation-stamp: sha256=27c432b4af0832c1ee24f51a5d516f920a48707118973339c5c762eabcb1b826
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-17T20:27:59.980173638Z","feature_name":"Data layer Required rule type independence","feature_path":"features/data-layer-required-rule-type-independence.feature","background_hash":"b74bfebd495c8f421e52a4ca8e4929bfe9f88d6722721c52ade343c21c3c1df1","implementation_hash":"sha256:b467f314a5f38b48ea0f1f6753d6b5a5bd701c1c81529c6fdd12aef396b77c51","scenarios":[{"index":1,"name":"Data layer Required rule type independence 002","scenario_hash":"288830898cfea255785b6401e1d82e6492831dede6e4268da2ea1814fac6b41e","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-17T20:27:59.980173638Z"},{"index":3,"name":"Data layer Required rule type independence 004","scenario_hash":"95600545df0645bcbb3dd2d7be75ac1755714a1610b8dee3d0479ba181f37fbd","mutation_count":35,"result":{"Total":35,"Killed":35,"Survived":0,"Errors":0},"tested_at":"2026-07-17T20:27:59.980173638Z"},{"index":4,"name":"Data layer Required rule type independence 005","scenario_hash":"f4b2f3c708be81bb1c83296a598c5360bcdf5fc011f21cb4c6a2b42ab8180375","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-17T20:27:59.980173638Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Required rule type independence

  Background:
    Given reusable rule Product-detail requirement says Required when /page_type Equals product_detail
    And the reusable rule is enabled in the Rule Library

  # Data layer Required rule type independence 001
  Scenario: Data layer Required rule type independence 001
    When Product-detail requirement is displayed in the Rule Library
    Then its consequence is identified as applicable to every property type
    And its trigger path, trigger type, predicate, severity, message, and revision remain visible
    And the operator is not required to create one Required rule per consequence property type

  # Data layer Required rule type independence 002
  Scenario Outline: Data layer Required rule type independence 002
    Given the attachment target is <property_path>
    And the destination property has type <property_type>
    When compatible reusable rules are displayed for the property
    Then Product-detail requirement is available to attach to <property_path>

    Examples:
      | property_path | property_type |
      | /title        | string        |
      | /quantity     | number        |
      | /consented    | boolean       |
      | /customer     | object        |
      | /products     | array         |

  # Data layer Required rule type independence 003
  Scenario: Data layer Required rule type independence 003
    Given Product-detail requirement revision 2 is attached to differently typed properties in Page view and Purchase
    When the attachments are reviewed
    Then every attachment is pinned to the same reusable rule identity and revision
    And no type-specific duplicate reusable rule is created
    And each schema retains its own consequence property path
    And changing the reusable rule continues through one reusable-rule revision history

  # Data layer Required rule type independence 004
  Scenario Outline: Data layer Required rule type independence 004
    Given Product-detail requirement is attached to a <property_type> property
    And page_type has value <page_type_value>
    And the consequence property is <property_state>
    When the payload is validated
    Then the reusable rule result is <rule_result>
    And validation creates <issue_count> Required issues

    Examples:
      | property_type | page_type_value | property_state | rule_result    | issue_count |
      | string        | product_detail  | missing        | Failed         | 1           |
      | number        | product_detail  | missing        | Failed         | 1           |
      | boolean       | product_detail  | missing        | Failed         | 1           |
      | object        | product_detail  | missing        | Failed         | 1           |
      | array         | product_detail  | missing        | Failed         | 1           |
      | array         | product_detail  | present        | Passed         | 0           |
      | array         | category        | missing        | Not applicable | 0           |

  # Data layer Required rule type independence 005
  Scenario Outline: Data layer Required rule type independence 005
    Given reusable rule <rule_name> has consequence operator <operator>
    And the destination property has type <property_type>
    When compatible reusable rules are displayed for the property
    Then <availability_outcome>

    Examples:
      | rule_name           | operator           | property_type | availability_outcome                                  |
      | Approved page types | Allowed values     | number        | Approved page types is absent from attachable results  |
      | Revenue range       | Numeric range      | string        | Revenue range is absent from attachable results        |
      | Product count       | Item count         | object        | Product count is absent from attachable results        |

  # Data layer Required rule type independence 006
  Scenario: Data layer Required rule type independence 006
    Given Product-detail requirement was saved under the former model with applicable type string
    When the Rule Library is loaded under the current model
    Then the existing Required rule becomes attachable to every property type
    And its stable identity, revision history, condition, parameters, severity, message, and existing attachments remain unchanged
    And no replacement rule or reusable-rule revision is created by the compatibility correction
