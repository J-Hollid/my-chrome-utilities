# mutation-stamp: sha256=c33acea8a2b773dc8fef784caf5a4660e7f594871716388146465e009717f311
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T01:23:35.165901459Z","feature_name":"Data layer defect report builder","feature_path":"features/data-layer-defect-report-builder.feature","background_hash":"4791487a825067ce1c819551acc030fec1bf3599215696a058d0174fe87c6404","implementation_hash":"sha256:388ce8455e37761d629239c60034be4fd41f95760eb8fca1765e323061e672ea","scenarios":[{"index":2,"name":"Data layer defect report builder 003","scenario_hash":"655ff088d335a995158a0140b470790a657d05f599f1a630484ae1a79c4e8507","mutation_count":30,"result":{"Total":30,"Killed":30,"Survived":0,"Errors":0},"tested_at":"2026-07-13T01:22:09.832248058Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report builder

  Background:
    Given captured event purchase is invalid under Checkout schema version 4
    And its captured payload is purchase-invalid-json

  # Data layer defect report builder 001
  Scenario: Data layer defect report builder 001
    Given purchase has error issues currency and order_id, warning issue coupon, and passing evaluations
    When the operator starts a defect report from purchase
    Then the report builder is associated with the captured purchase event
    And currency and order_id are selected for the report
    And coupon is available but not selected
    And passing evaluations are not offered as defect issues
    And error and warning issues can be selected or deselected

  # Data layer defect report builder 002
  Scenario: Data layer defect report builder 002
    Given selected issue currency identifies JSON pointer /commerce/currency
    When the operator reviews Actual result
    Then Actual result contains canonical JSON purchase-invalid-json without changing the captured payload
    And /commerce/currency is highlighted as invalid with red treatment and a minus marker
    And the issue remains identifiable by JSON pointer without relying on color

  # Data layer defect report builder 003
  Scenario Outline: Data layer defect report builder 003
    Given selected issue <issue> reports constraint <constraint>
    When the operator chooses expected result method <method> with response <response>
    Then Expected result describes <expected_outcome>
    And corrected JSON operation is <json_operation>
    And the builder does not invent a corrected value

    Examples:
      | issue        | constraint                   | method                   | response | expected_outcome                         | json_operation        |
      | currency     | one of EUR or USD             | choose an allowed value  | EUR      | currency is EUR                          | replace currency      |
      | currency     | one of EUR or USD             | enter a valid response   | USD      | currency is USD                          | replace currency      |
      | order_id     | required string               | enter a valid response   | A-123    | order_id is A-123                        | add order_id          |
      | debug        | forbidden property            | apply the rule           | none     | debug is absent                          | remove debug          |
      | total        | number greater than or equal to 0 | keep the rule generic | none     | total satisfies its validation rule      | none                  |

  # Data layer defect report builder 004
  Scenario: Data layer defect report builder 004
    Given currency will be replaced with EUR and debug will be removed
    When the operator reviews Expected result
    Then it contains a copy of purchase-invalid-json with only those corrections applied
    And corrected fields are highlighted with green treatment and a plus marker
    And uncorrected fields retain their captured values
    And the captured purchase event remains unchanged

  # Data layer defect report builder 005
  Scenario: Data layer defect report builder 005
    Given the report contains selected validation issues
    When report details are generated
    Then Summary and Description are prefilled from the captured event and selected issues
    And Summary, Description, and Expected result explanation are editable
    And schema name and version, rule identity and version, severity, JSON pointer, expected constraint, and actual value remain available as validation evidence
    And event name, source, page URL, and capture time remain available as capture evidence
