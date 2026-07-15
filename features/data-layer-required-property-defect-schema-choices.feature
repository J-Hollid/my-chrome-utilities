Feature: Data layer required-property defect schema choices

  Background:
    Given captured pageview is assigned to Generic pageview revision 7
    And /page_type is a required string with allowed values product_detail and product_listing
    And captured pageview has no /page_type property
    And validation reports Required value at /page_type while its allowed-values rule is not applicable

  # Data layer required-property defect schema choices 001
  Scenario: Data layer required-property defect schema choices 001
    When the operator starts a defect report from captured pageview
    Then the selected issue retains Required value, actual missing, rule identity, severity, and pointer /page_type
    And product_detail and product_listing are offered as schema-provided values
    And the choices are derived from the effective assigned schema revision at the same canonical property path
    And no allowed-values failure is required to expose those choices
    And the presence rule and value rule remain distinct validation evidence

  # Data layer required-property defect schema choices 002
  Scenario: Data layer required-property defect schema choices 002
    Given product_detail is selected for missing /page_type
    When Expected result is generated
    Then /page_type is added with string value product_detail
    And its correction operation is add rather than replace
    And its response source is schema-provided value from Generic pageview revision 7
    And Actual result still identifies /page_type as missing
    And the captured pageview remains unchanged

  # Data layer required-property defect schema choices 003
  Scenario Outline: Data layer required-property defect schema choices 003
    Given a missing required property has <schema_constraint>
    When expected-result assistance is displayed
    Then selectable schema values are <schema_values>
    And each choice retains <json_type> rather than being coerced to text

    Examples:
      | schema_constraint                         | schema_values                    | json_type |
      | allowed strings product and content       | product and content              | string    |
      | allowed numbers 1 and 2                   | 1 and 2                          | number    |
      | allowed booleans true and false           | true and false                    | boolean   |
      | exact string product_detail               | product_detail                    | string    |

  # Data layer required-property defect schema choices 004
  Scenario Outline: Data layer required-property defect schema choices 004
    Given a required issue identifies concrete pointer <concrete_pointer>
    And an effective value rule identifies template pointer <template_pointer>
    When schema-provided choices are resolved
    Then the value rule <matching_result> the required issue
    And <choice_result>

    Examples:
      | concrete_pointer       | template_pointer       | matching_result | choice_result                                  |
      | /commerce/currency     | /commerce/currency     | matches         | its values are offered                         |
      | /products/0/name       | /products/*/name       | matches         | its values are offered for products item 1     |
      | /a~1b                  | /a~1b                  | matches         | its values are offered for property a/b        |
      | /tilde~0name           | /tilde~0name           | matches         | its values are offered for property tilde~name |
      | /commerce/currency     | /commerce/country      | does not match  | its values are not offered                     |

  # Data layer required-property defect schema choices 005
  Scenario: Data layer required-property defect schema choices 005
    Given Generic pageview revision 7 inherits an allowed-values rule for /page_type
    And the assigned revision adds a local exact-value constraint product_detail
    And another inherited rule is disabled by the assigned revision
    When schema-provided choices are resolved for missing /page_type
    Then only values satisfying every enabled effective value constraint are offered
    And product_detail is offered once without duplicating its inherited and local provenance
    And disabled, working-draft, later-revision, and unrelated-schema values are excluded

  # Data layer required-property defect schema choices 006
  Scenario Outline: Data layer required-property defect schema choices 006
    Given a value rule for /page_type applies only when /market equals retail
    When expected-result assistance is resolved for captured market <market>
    Then the conditional rule's values are <availability>
    And the decision uses the captured payload without inventing the missing /page_type value

    Examples:
      | market | availability |
      | retail | offered      |
      | trade  | excluded     |

  # Data layer required-property defect schema choices 007
  Scenario: Data layer required-property defect schema choices 007
    Given enabled effective constraints at /page_type have no common permitted value
    When expected-result assistance is displayed
    Then no schema-provided value is presented as valid
    And the conflict identifies the constraining rules for operator review
    And Custom value or response remains available as an explicit override
    And the builder does not silently union incompatible value sets

  # Data layer required-property defect schema choices 008
  Scenario: Data layer required-property defect schema choices 008
    Given missing required /transaction_id has no effective allowed-value or exact-value constraint
    When expected-result assistance is displayed
    Then Use generic constraint and Custom value or response remain available
    And no schema-provided value is fabricated from the property type, description, example prose, or another property

  # Data layer required-property defect schema choices 009
  Scenario: Data layer required-property defect schema choices 009
    Given product_detail is selected for missing /page_type
    When the Required value issue is deselected, selected again, or its response choice is changed
    Then the expected payload respectively removes, restores, or updates /page_type once
    And rerendering does not duplicate the property, correction, or response control
    And focus and report scroll remain associated with the changed control

  # Data layer required-property defect schema choices 010
  Scenario: Data layer required-property defect schema choices 010
    Given Expected result adds schema-provided /page_type product_detail
    When live preview, Jira rich text, Jira plain text, saved defect, reopened preview, and recopied output are compared
    Then each Expected result contains the same typed /page_type value
    And each retains the Required value evidence, value-rule provenance, add operation, and schema revision
    And Actual result continues to show the property as missing
    And report operations do not mutate the captured event, validation result, schema, assignment, or rules
