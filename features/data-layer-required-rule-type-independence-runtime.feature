# mutation-stamp: sha256=e5b40773a1ced6872d12b10388a1622961417c1e828cefd9d9e3848727847458
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-17T20:28:42.510730239Z","feature_name":"Data layer Required rule type independence runtime","feature_path":"features/data-layer-required-rule-type-independence-runtime.feature","background_hash":"cc19b614fdc8b018722e08f0cb677ae7acd4a36a90475495fe1f516b7b752b8c","implementation_hash":"sha256:1078f3b796a2663f97a7bc83a8cb433d3608c7b4b7b23cb7e2530bbf24bf6225","scenarios":[{"index":0,"name":"Data layer Required rule type independence runtime 001","scenario_hash":"b5d62970c181b675ca4b2ab70860827314952afa7b128bcf4e54f4ea62742de7","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-17T20:28:42.510730239Z"},{"index":2,"name":"Data layer Required rule type independence runtime 003","scenario_hash":"48147d6ed4eb6fa4984e1ed19da4aec020cb5aa3cdf6fc3da8b535c90c6681e7","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-17T20:28:42.510730239Z"},{"index":4,"name":"Data layer Required rule type independence runtime 005","scenario_hash":"477a2a4d7d8558d486bdc22637377ab25411aa69e5a522e3d534e7dc0ca52bf3","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-17T20:28:42.510730239Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Required rule type independence runtime

  Background:
    Given the built extension is running with production Rule Library, schema editor, validation, and persistence systems
    And reusable stable id reusable-required-7 says Required when /page_type Equals product_detail

  # Data layer Required rule type independence runtime 001
  Scenario Outline: Data layer Required rule type independence runtime 001
    Given the production schema editor contains property <property_path> with type <property_type>
    When the actual property rule picker opens
    Then the production DOM offers reusable-required-7 as an enabled attachment action

    Examples:
      | property_path | property_type |
      | /title        | string        |
      | /quantity     | number        |
      | /consented    | boolean       |
      | /customer     | object        |
      | /products     | array         |

  # Data layer Required rule type independence runtime 002
  Scenario: Data layer Required rule type independence runtime 002
    When the operator attaches reusable-required-7 to string, number, boolean, object, and array properties through the actual DOM
    Then production persistence stores 5 attachments pinned to reusable-required-7 revision 1
    And the Rule Library stores 1 reusable-required-7 definition
    And every attachment retains its canonical consequence property path
    And serialization and reload preserve the reusable identity, condition, and attachments

  # Data layer Required rule type independence runtime 003
  Scenario Outline: Data layer Required rule type independence runtime 003
    Given reusable-required-7 is attached to a <property_type> property
    When production validation receives page_type product_detail with the consequence property <property_state>
    Then the production conditional result is <rule_result>
    And production validation creates <issue_count> Required issues

    Examples:
      | property_type | property_state | rule_result | issue_count |
      | string        | missing        | Failed      | 1           |
      | number        | missing        | Failed      | 1           |
      | boolean       | missing        | Failed      | 1           |
      | object        | missing        | Failed      | 1           |
      | array         | missing        | Failed      | 1           |
      | array         | present        | Passed      | 0           |

  # Data layer Required rule type independence runtime 004
  Scenario: Data layer Required rule type independence runtime 004
    Given production storage contains reusable-required-7 revision 3 with former applicable type string
    When the Rule Library is loaded, rendered, serialized, and reloaded
    Then production compatibility offers reusable-required-7 for all 5 property types
    And stored stable id reusable-required-7 and revision 3 remain unchanged
    And the condition, revision history, severity, message, and existing attachments are byte-for-byte unchanged
    And no migration-created reusable rule or revision exists

  # Data layer Required rule type independence runtime 005
  Scenario Outline: Data layer Required rule type independence runtime 005
    Given the production Rule Library contains <rule_definition>
    And the destination property has type <property_type>
    When the actual property rule picker opens
    Then the production DOM reports <picker_outcome>

    Examples:
      | rule_definition             | property_type | picker_outcome                               |
      | Allowed values type string  | number        | no attachment action for that reusable rule  |
      | Numeric range type number   | string        | no attachment action for that reusable rule  |
