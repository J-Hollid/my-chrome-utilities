Feature: Data layer JSON Schema 2020-12 export

  Background:
    Given Product detail revision 4 is a published Payload schema
    And its stable schema identity is schema-product-detail

  # Data layer JSON Schema 2020-12 export 001
  Scenario: Data layer JSON Schema 2020-12 export 001
    When Product detail is exported as JSON Schema Draft 2020-12
    Then the document has $schema https://json-schema.org/draft/2020-12/schema
    And its absolute $id deterministically identifies schema-product-detail revision 4
    And its title identifies Product detail
    And its standard description and examples are retained when configured
    And no nonstandard version keyword is added
    And the filename identifies Product detail and revision 4

  # Data layer JSON Schema 2020-12 export 002
  Scenario Outline: Data layer JSON Schema 2020-12 export 002
    Given <extension_rule> is active for <property_path>
    When Product detail is exported as JSON Schema Draft 2020-12
    Then <property_path> contains standard assertion <standard_assertion>

    Examples:
      | property_path   | extension_rule                       | standard_assertion                 |
      | /page_name      | type string                          | type string                        |
      | /page_name      | Required                             | parent required contains page_name |
      | /page_type      | Exact value product_detail           | const product_detail               |
      | /currency       | Allowed values EUR and USD            | enum EUR and USD                   |
      | /transaction_id | Regular expression ^[A-Z]+-[0-9]+$   | pattern ^[A-Z]+-[0-9]+$           |
      | /product_id     | Digits only                          | pattern ^[0-9]+$                   |
      | /page_name      | Non-empty string                     | minLength 1                        |
      | /revenue        | Numeric range minimum 0 maximum 1000 | minimum 0 and maximum 1000         |
      | /debug          | Forbidden property                   | parent not required debug          |

  # Data layer JSON Schema 2020-12 export 003
  Scenario Outline: Data layer JSON Schema 2020-12 export 003
    Given <rule_type> compares its cardinality <comparison> 50
    When Product detail is exported as JSON Schema Draft 2020-12
    Then the standard assertion is <standard_assertion>

    Examples:
      | rule_type   | comparison | standard_assertion                 |
      | Text length | >          | minLength 51                       |
      | Text length | >=         | minLength 50                       |
      | Text length | ==         | minLength 50 and maxLength 50      |
      | Text length | <          | maxLength 49                       |
      | Text length | <=         | maxLength 50                       |
      | Item count  | >          | minItems 51                        |
      | Item count  | >=         | minItems 50                        |
      | Item count  | ==         | minItems 50 and maxItems 50        |
      | Item count  | <          | maxItems 49                        |
      | Item count  | <=         | maxItems 50                        |

  # Data layer JSON Schema 2020-12 export 004
  Scenario: Data layer JSON Schema 2020-12 export 004
    Given Only declared properties are allowed is active
    And Allow undeclared properties is active for object /metadata
    When Product detail is exported as JSON Schema Draft 2020-12
    Then additionalProperties is false at every closed declared object boundary
    And /metadata permits additional properties
    And nested declared object boundaries remain closed unless they have their own exception

  # Data layer JSON Schema 2020-12 export 005
  Scenario Outline: Data layer JSON Schema 2020-12 export 005
    Given a conditional rule uses trigger <trigger> and consequence Required /currency
    When Product detail is exported as JSON Schema Draft 2020-12
    Then standard if and then applicators preserve <trigger_behavior>
    And the then schema requires currency

    Examples:
      | trigger                              | trigger_behavior                     |
      | /page_type Equals product_detail     | property const product_detail        |
      | /page_type Does not equal internal   | property not const internal          |
      | /page_type Is one of product, cart   | property enum product and cart       |
      | /page_type Matches pattern ^product_ | property pattern ^product_           |
      | /revenue Is greater than 0           | property exclusiveMinimum 0          |
      | /revenue Is at least 0               | property minimum 0                   |
      | /coupon Exists                       | parent required contains coupon      |
      | /coupon Does not exist               | parent not required coupon           |

  # Data layer JSON Schema 2020-12 export 006
  Scenario: Data layer JSON Schema 2020-12 export 006
    Given Product detail inherits active rules and properties from Generic page view revision 3
    And Product detail has local rules, disabled inherited rules, assignments, examples, revision history, and a working draft
    When Product detail is exported as JSON Schema Draft 2020-12
    Then the exported resource contains the effective active validation of revision 4
    And inherited and reusable rules are resolved into standard schema keywords
    And disabled rules and pending working-draft changes are absent
    And parent references, rule identities, assignments, severities, issue messages, revision history, and extension storage metadata are absent
    And no extension-specific or custom vocabulary keyword is present

  # Data layer JSON Schema 2020-12 export 007
  Scenario: Data layer JSON Schema 2020-12 export 007
    Given Product detail has warning constraints and custom issue messages that have standard assertion equivalents
    When JSON Schema Draft 2020-12 export compatibility is reviewed
    Then the review states that warning constraints become standard pass or fail assertions
    And it states that severities and custom issue messages are omitted
    And export requires confirmation before applying those conversions

  # Data layer JSON Schema 2020-12 export 008
  Scenario: Data layer JSON Schema 2020-12 export 008
    Given an active rule has no exact JSON Schema Draft 2020-12 representation
    When JSON Schema Draft 2020-12 export compatibility is reviewed
    Then the rule name, property path, and unsupported behavior are identified
    And the review warns that the unsupported rule will be omitted from the standard document
    And the operator can cancel or confirm the lossy export
    When the operator confirms the lossy export
    Then the unsupported rule is absent from the standard document
    And all standard-compatible active rules remain present
    And no custom placeholder keyword is emitted for the unsupported rule

  # Data layer JSON Schema 2020-12 export 009
  Scenario: Data layer JSON Schema 2020-12 export 009
    Given the Schema Library contains 3 published schemas and 1 unpublished new-schema draft
    When the library is exported as a JSON Schema Draft 2020-12 bundle
    Then 1 Compound Schema Document contains 3 current published schema resources under $defs
    And each schema resource has the Draft 2020-12 dialect and its own revision-specific absolute $id
    And each resource can be loaded independently by its $id
    And the unpublished draft, historical revisions, assignments, and reusable-rule records are absent
