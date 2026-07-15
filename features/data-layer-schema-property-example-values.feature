Feature: Data layer schema property example values

  Background:
    Given the Schema Library contains Product detail current revision 3
    And Product detail defines documented property /login_status
    And an Allowed values rule permits not logged in and logged in at /login_status

  # Data layer schema property example values 001
  Scenario: Data layer schema property example values 001
    When the operator edits documentation for /login_status
    Then Example value offers typed choices not logged in and logged in from the effective Allowed values rule
    And a custom value is available as an alternative
    When the operator selects logged in and saves the documentation
    Then one working draft is created from revision 3
    And its /login_status documentation stores typed string logged in as the example value selected from allowed values
    And the display name and description can remain empty without discarding the example value
    And the schema property, Allowed values rule, and current revision remain unchanged

  # Data layer schema property example values 002
  Scenario Outline: Data layer schema property example values 002
    Given Product detail defines documented property <property_path> with schema type <property_type>
    When the operator enters custom example <custom_example> for <property_path>
    And saves and reopens the working draft
    Then <property_path> retains example value <custom_example> with JSON type <json_type>
    And the documentation identifies the example as custom rather than an allowed-value selection

    Examples:
      | property_path | property_type | custom_example | json_type |
      | /product_name | string        | robot          | string    |
      | /product_id   | number        | 1              | number    |
      | /consent      | boolean       | false          | boolean   |
      | /category     | nullable      | null           | null      |

  # Data layer schema property example values 003
  Scenario: Data layer schema property example values 003
    Given /login_status has custom example value guest
    When its documentation editor is opened
    Then the custom option is selected with guest in the type-aware input
    And the effective allowed values remain available without replacing guest
    When the operator saves an example that conflicts with the effective Allowed values rule
    Then the editor warns that the example does not satisfy the rule
    And the example is not silently coerced, deleted, or reclassified as an allowed value

  # Data layer schema property example values 004
  Scenario: Data layer schema property example values 004
    Given Generic page revision 2 documents /login_status with example value not logged in
    And Product detail inherits Generic page revision 2
    When effective Product detail documentation is resolved
    Then /login_status has one inherited example value not logged in from Generic page revision 2
    When the operator creates a local example value logged in
    Then the Product detail working draft has one local override and Generic page is unchanged
    When the operator restores inherited documentation
    Then not logged in becomes effective again without duplication

  # Data layer schema property example values 005
  Scenario: Data layer schema property example values 005
    Given Product detail revision 3 has /login_status example value not logged in
    And its working draft changes the example value to logged in
    When the draft is published as revision 4
    Then revision 3 retains not logged in and revision 4 owns logged in
    And duplicate, property copy, export, import, and reload preserve each example value, JSON type, selection method, canonical path, ownership, and revision association
    And removing or restoring property documentation includes its example value atomically

  # Data layer schema property example values 006
  Scenario: Data layer schema property example values 006
    Given assigned Product detail revision 3 documents /products/*/id with example value 1
    And a captured event presents property /products/2/id
    When the operator opens its property information in the Live inspector
    Then example value 1 is displayed with the effective property documentation from revision 3
    And the raw property name, concrete path, observed value, payload, and validation result remain unchanged

  # Data layer schema property example values 007
  Scenario: Data layer schema property example values 007
    Given captured event pageview has a selected validation issue at /login_status
    And its assigned schema revision documents /login_status with example value logged in
    When the operator starts a defect report
    Then Custom value or response is not selected automatically
    When the operator selects Custom value or response for /login_status for the first time
    Then its editable response is prefilled with typed string logged in
    And choosing the prefilled response applies logged in once to the expected payload
    And the captured event and schema remain unchanged

  # Data layer schema property example values 008
  Scenario: Data layer schema property example values 008
    Given a missing-event report uses a schema that documents /products/*/id with example value 1
    And the expected payload contains property /products/0/id
    When the operator selects the custom value for /products/0/id
    Then its editable input is prefilled with typed number 1 resolved from /products/*/id
    And the nested expected payload contains products item 1 with id 1
    And the same resolution applies to another concrete array item without sharing its draft input state

  # Data layer schema property example values 009
  Scenario: Data layer schema property example values 009
    Given the operator selected Custom value or response and changed the prefilled /login_status value to member
    When the report rerenders or the operator selects another response method and returns to Custom value or response
    Then member remains unchanged with its JSON type and caret-ready edit state
    And a later documentation or schema refresh does not overwrite the report draft
    Given another documented property has no example value
    When its custom response is selected
    Then the custom input remains empty

  # Data layer schema property example values 010
  Scenario: Data layer schema property example values 010
    Given the effective example value does not satisfy the validation rule used by the defect report
    When the operator selects Custom value or response
    Then the example is prefilled without bypassing the existing custom-override warning and confirmation
    And a missing-event expected payload remains incomplete until its production schema validation passes
    When a valid prefilled or edited value is used in the completed report
    Then preview, copied Jira output, saved defect, reopened preview, and recopied output contain the same typed expected value
    And none adds standalone example-value or documentation-provenance lines to the report
