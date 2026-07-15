# mutation-stamp: sha256=d048d66b60adf5266c470315d24290d3c1eeffc79eb78f3da4301128cda6a2ca
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T07:57:51.604530429Z","feature_name":"Data layer defect report semantic differences","feature_path":"features/data-layer-defect-report-semantic-differences.feature","background_hash":"6debdcdef954f0a2a812ccc0723d1e96e2e8d3472ab0d9617fbf766eba38e299","implementation_hash":"sha256:ea08c96a6d40b4f43ab73df098ffb2bc506aaec8eda08b65665c2bbe914c3421","scenarios":[{"index":2,"name":"Data layer defect report semantic differences 003","scenario_hash":"fb704138c005dfdaf6e389222c91a0c44945bcdb17edc39463feb5d8be4ae5e7","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-15T07:57:51.604530429Z"},{"index":3,"name":"Data layer defect report semantic differences 004","scenario_hash":"6db064caea64f1283e4a39e0f2d6a77dc56a3992eb6d424e99683f536ec65440","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T07:57:51.604530429Z"},{"index":5,"name":"Data layer defect report semantic differences 006","scenario_hash":"9511438a23849073db00d30fd5fd8268d2669051437aac3f447d92221ba89ac1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-15T07:57:51.604530429Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report semantic differences

  Background:
    Given captured error event contains undeclared /action and /code properties
    And required /error_action and /error_code properties are missing
    And all four validation issues are selected for the defect report
    And Expected result removes /action and /code and adds /error_action and /error_code

  # Data layer defect report semantic differences 001
  Scenario: Data layer defect report semantic differences 001
    When Differences is generated
    Then /action and /code state undeclared property is present in the actual payload
    And /error_action and /error_code state required property is missing from the actual payload
    And no missing property is described as an invalid actual value
    And no undeclared property is described as a value-rule failure

  # Data layer defect report semantic differences 002
  Scenario: Data layer defect report semantic differences 002
    When Differences is generated
    Then /action and /code state they were removed from the expected payload
    And /error_action and /error_code state they were added to the expected payload
    And no add correction is described only as corrected expected value
    And each line is identifiable by operation and JSON pointer without relying on color or marker alone

  # Data layer defect report semantic differences 003
  Scenario Outline: Data layer defect report semantic differences 003
    Given selected issue at <pointer> has violation <violation>
    When its Actual difference is rendered
    Then its description is <description>

    Examples:
      | pointer          | violation            | description                                           |
      | /action          | Undeclared property   | undeclared property is present in the actual payload |
      | /error_action    | Required value        | required property is missing from the actual payload |
      | /page_type       | Value is not allowed  | actual value is not allowed                          |
      | /transaction_id  | Type mismatch         | actual value has the wrong type                      |
      | /reference       | Value is not exact    | actual value does not equal the required value        |

  # Data layer defect report semantic differences 004
  Scenario Outline: Data layer defect report semantic differences 004
    Given an Expected correction targets <pointer> with operation <operation>
    When its Expected difference is rendered
    Then its description is <description>

    Examples:
      | pointer       | operation | description                              |
      | /action       | remove    | was removed from the expected payload   |
      | /error_action | add       | was added to the expected payload        |
      | /page_type    | replace   | was replaced in the expected payload     |
      | /coupon       | none      | no Expected difference line is displayed |

  # Data layer defect report semantic differences 005
  Scenario: Data layer defect report semantic differences 005
    Given a selected issue has an unfamiliar violation Value violates partner contract
    And Include validation rules covered is selected
    When its Actual difference is rendered
    Then the description includes validation failed: Value violates partner contract
    And the fallback does not claim the property is missing, undeclared, or has an invalid value
    And the original violation remains available in Validation evidence

  # Data layer defect report semantic differences 006
  Scenario Outline: Data layer defect report semantic differences 006
    Given an issue and correction identify pointer <pointer>
    When their difference lines are rendered
    Then the displayed pointer is <pointer>
    And the issue and correction remain associated with the same canonical property

    Examples:
      | pointer            |
      | /commerce/currency |
      | /products/0/name   |
      | /a~1b              |
      | /tilde~0name       |

  # Data layer defect report semantic differences 007
  Scenario: Data layer defect report semantic differences 007
    Given several selected issues include distinct violations at the same pointer
    When the report rerenders Differences three times
    Then each selected issue contributes one Actual line retaining its own issue identity
    And each non-none correction contributes one Expected line retaining its issue identity and operation
    And Actual lines follow selected validation issue order
    And Expected lines follow correction order
    And rerendering does not merge, reorder, or duplicate lines

  # Data layer defect report semantic differences 008
  Scenario: Data layer defect report semantic differences 008
    Given the operator changes issue selection or an expected response
    When Differences refreshes
    Then deselected issue lines and their excluded corrections disappear
    And newly selected issue lines and completed corrections appear once
    And an unresolved required property shows its missing Actual line without inventing an Expected add line
    And changing an added response value does not misclassify its operation as replace

  # Data layer defect report semantic differences 009
  Scenario: Data layer defect report semantic differences 009
    Given Include validation rules covered is selected
    When live preview, Jira rich text, Jira plain text, saved defect, reopened preview, and recopied output are compared
    Then each representation uses the same violation-specific Actual descriptions
    And each representation uses the same add, replace, and remove Expected descriptions
    And pointers, markers, issue identities, and validation evidence remain consistent
    And none reverts to invalid actual value or corrected expected value for classified cases

  # Data layer defect report semantic differences 010
  Scenario: Data layer defect report semantic differences 010
    Given a legacy saved defect lacks stored violation identity for one Actual difference
    When the defect is reopened
    Then it uses a neutral validation failed description
    And it does not infer a more specific failure from the pointer, value, color, or expected operation
    And saving or copying the report does not mutate the captured event, validation result, schema, correction model, or legacy record
