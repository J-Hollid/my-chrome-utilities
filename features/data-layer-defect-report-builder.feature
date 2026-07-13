# mutation-stamp: sha256=983f91fca9655a599ef38477d75e195fe7a0c89ac887782382f6aede692122b0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T08:41:36.327555978Z","feature_name":"Data layer defect report builder","feature_path":"features/data-layer-defect-report-builder.feature","background_hash":"2e357f5d9508cd47c719d23db14afd2ebd0f61063c46188c27d9e1e3004afbaf","implementation_hash":"sha256:12515631cb39735ae74cae088594c6bcd464dd532950b9b05ea9bda535667a33","scenarios":[{"index":5,"name":"Data layer defect report builder 006","scenario_hash":"3653d4cc19bf49bedfe19c0cbff56e6cf037b8c8a1b081a6c66be642315927ad","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-13T08:41:36.327555978Z"},{"index":6,"name":"Data layer defect report builder 007","scenario_hash":"3db527338f7c6ee99b6ff55e35c56f856ceb38cc58aa1c4d9a5b813037ff48f2","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-13T08:41:36.327555978Z"},{"index":10,"name":"Data layer defect report builder 011","scenario_hash":"4c06b78416efb7d753040b5a366075cfb122551a073eb6b0a8b82e7d3e9a1487","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-13T08:41:36.327555978Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report builder

  Background:
    Given captured event purchase is invalid under Checkout schema version 4
    And its captured payload is purchase-invalid-json
    And currency violates constraint must be one of EUR or USD
    And page_type violates constraint must be one of homepage, product listing, product detail, or checkout

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
  Scenario: Data layer defect report builder 003
    When expected-result assistance for page_type is displayed
    Then green highlighted Expected response inlines page_type: homepage OR product listing OR product detail OR checkout
    And Use generic constraint is selected and identifies the inlined text as a schema constraint
    And schema-provided values homepage, product listing, product detail, and checkout are separately selectable
    And Custom value or response is available as an alternative
    And custom response input is displayed only after Custom value or response is selected
    And Include all allowed values as a comment is available for the allowed-values rule
    And the invalid actual value is not presented as a schema-provided valid value

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

  # Data layer defect report builder 006
  Scenario Outline: Data layer defect report builder 006
    Given selected issue <issue> reports constraint <constraint>
    When the operator chooses assisted response <response> from <response_source>
    Then Expected result describes <expected_outcome>
    And corrected JSON operation is <json_operation>
    And the response is identified as <response_source>

    Examples:
      | issue    | constraint         | response | response_source          | expected_outcome  | json_operation   |
      | currency | one of EUR or USD  | EUR      | Checkout schema          | currency is EUR   | replace currency |
      | order_id | required string    | A-123    | Custom value or response | order_id is A-123 | add order_id     |
      | debug    | forbidden property | remove   | validation rule          | debug is absent   | remove debug     |

  # Data layer defect report builder 007
  Scenario Outline: Data layer defect report builder 007
    When the operator applies <selection> in the expected-response selector
    Then green highlighted Expected response inlines <expected_response>
    And the response is identified as <response_source>
    And changing the selection replaces the previous inline expression
    And the captured purchase event remains unchanged

    Examples:
      | selection                     | expected_response                                                    | response_source          |
      | Use generic constraint        | page_type: homepage OR product listing OR product detail OR checkout | schema constraint        |
      | schema value product detail   | page_type: product detail                                             | schema-provided value    |
      | custom value category landing | page_type: category landing                                           | operator custom override |

  # Data layer defect report builder 008
  Scenario: Data layer defect report builder 008
    When the operator enters custom expected value category landing
    Then the helper identifies category landing as a Custom value or response
    And the helper warns that category landing does not satisfy the current schema constraint
    And the operator can explicitly keep or replace the custom override
    And a kept override is identified as operator-provided in Expected result

  # Data layer defect report builder 009
  Scenario: Data layer defect report builder 009
    Given the builder was opened from the purchase Live inspector
    When the builder header is displayed
    Then Back to captured event and Back to Live feed are available before report controls
    When the operator activates Back to captured event
    Then the purchase Live inspector is restored
    And focus returns to Create defect report for purchase
    And the Live feed scroll position is unchanged

  # Data layer defect report builder 010
  Scenario: Data layer defect report builder 010
    Given the builder was opened from the purchase Live inspector
    And purchase had focus in the Live feed before its inspector opened
    When the operator activates Back to Live feed
    Then the defect report builder and purchase inspector are closed
    And focus returns to purchase in the Live feed
    And the Live feed scroll position is unchanged

  # Data layer defect report builder 011
  Scenario Outline: Data layer defect report builder 011
    Given schema value homepage is selected for page_type
    And Include all allowed values as a comment is <checkbox_state>
    When the operator reviews the inline Expected response
    Then its page_type line is <expected_line>
    And the selected expected value remains homepage
    And the comment is presentation metadata derived from the schema and is not inserted into the expected JSON payload

    Examples:
      | checkbox_state | expected_line                                                                                              |
      | selected       | page_type: "homepage", // must be of type homepage, product listing, product detail, or checkout          |
      | cleared        | page_type: "homepage"                                                                                     |

  # Data layer defect report builder 012
  Scenario: Data layer defect report builder 012
    Given captured event product has invalid page_type product test
    And its assigned schema has allowed-values rule page_type:product,content
    And the validation issue displays /page_type expected product,content
    When the operator starts a defect report from product
    Then expected-result assistance derives allowed values from the assigned schema rule without requiring one of in the displayed issue text
    And product and content are separately selectable as schema-provided values
    And green highlighted Expected response inlines page_type: product OR content
    And Include all allowed values as a comment is available for the allowed-values rule
    When the operator selects product and includes all allowed values as a comment
    Then green highlighted Expected response inlines page_type: "product", // must be of type product or content
    And the underlying expected JSON payload contains page_type product without the comment
