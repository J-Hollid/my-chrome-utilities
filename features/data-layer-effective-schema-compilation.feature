# mutation-stamp: sha256=6bf83d02918070f63912e40b691b4557ffcf6aacaeebc81dd4764dd2f7ede17a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:33:55.725138602Z","feature_name":"Data layer effective schema compilation","feature_path":"features/data-layer-effective-schema-compilation.feature","background_hash":"5d913d12016759e598b234a9f9cdda26961fbf898c2ae2325db60a98ad425775","implementation_hash":"sha256:86707518c39384facf5b4b78bc9cc8524349be124ad7f4b91d2a1db2a3062fe1","scenarios":[{"index":3,"name":"Data layer effective schema compilation 004","scenario_hash":"f06e66974b9fad993855ed5b5888557ec2dadbadf7ca758e7286c91e5cff3780","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:33:55.725138602Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer effective schema compilation

  Background:
    Given requirement profiles are ordered explicitly for a validation context

  # Data layer effective schema compilation 001
  Scenario: Data layer effective schema compilation 001
    Given Sitewide, Commerce, Purchase, and Retail confirmation profiles are ordered
    When the effective Retail contract is compiled
    Then transaction_id, value, and currency are Required
    And every structural parent and configured rule, description, example, and allowed value is present

  # Data layer effective schema compilation 002
  Scenario: Data layer effective schema compilation 002
    Given Sitewide, Commerce, Purchase, Trade account, and Purchase order profiles are ordered
    When the effective Trade contract is compiled
    Then transaction_id, value, currency, account_id, and purchase_order_number are Required
    And the compiled schema has a stable revision identity

  # Data layer effective schema compilation 003
  Scenario: Data layer effective schema compilation 003
    Given several profiles contribute to /ecommerce/value
    When the operator inspects the effective requirement
    Then every contributing profile, precedence position, release introduction, and override or disable decision is visible
    And Effective, Local only, and Provenance views agree on the winning value

  # Data layer effective schema compilation 004
  Scenario Outline: Data layer effective schema compilation 004
    Given two ordered profiles introduce a <conflict>
    When compilation runs
    Then the effective schema is blocked at the conflicting requirement
    And both origins and the incompatible values are visible
    Examples:
      | conflict |
      | string and number types |
      | Required and Forbidden states |
      | disjoint allowed-value sets |
      | incompatible validation rules |

  # Data layer effective schema compilation 005
  Scenario: Data layer effective schema compilation 005
    Given a compatible later profile narrows allowed values and adds documentation
    When compilation runs
    Then allowed values are intersected and documentation is retained deterministically
    And no silent last-write-wins result is reported

  # Data layer effective schema compilation 006
  Scenario: Data layer effective schema compilation 006
    Given changing profile order would alter 3 effective requirements
    When the operator stages the reorder
    Then a before-and-after impact preview names the 3 requirements and every consumer
    And cancelling leaves the order and compiled revision unchanged

  # Data layer effective schema compilation 007
  Scenario: Data layer effective schema compilation 007
    Given a supported legacy parent-schema chain has published revisions
    When migration converts it to ordered profiles
    Then effective validation remains behavior-equivalent
    And historical revisions remain immutable with parent-to-profile provenance
    And cycles or missing parents block migration without replacing source data

  # Data layer effective schema compilation 008
  Scenario Outline: Data layer effective schema compilation 008
    Given one Profile declares container <parent_path> as object and child <child_path> as string
    When requirements are compiled in <authoring_order>
    Then the effective schema contains the object container and child without a compiler exception
    And the rendered effective schema and executable plan contain the same paths, types, and provenance
    Examples:
      | parent_path | child_path | authoring_order |
      | /ecommerce | /ecommerce/transaction_id | parent then child |
      | /ecommerce | /ecommerce/transaction_id | child then parent |
      | /page | /page/type | parent then child |
      | /page | /page/type | child then parent |

  # Data layer effective schema compilation 009
  Scenario Outline: Data layer effective schema compilation 009
    Given an effective requirement at <path> declares <constraint>
    When payload value <actual_value> is validated
    Then one error issue contains <path>, <code>, <expected_value>, <actual_value>, and complete requirement provenance
    And the issue deep-links to the exact contributing field
    Examples:
      | path | constraint | actual_value | code | expected_value |
      | /ecommerce/transaction_id | string type | 42 | type | string |
      | /ecommerce/currency | allowed values EUR and GBP | USD | enum | EUR or GBP |
      | /ecommerce/coupon | forbidden | SUMMER | forbidden | absent |
      | /ecommerce/value | required | absent | required | present |

  # Data layer effective schema compilation 010
  Scenario Outline: Data layer effective schema compilation 010
    Given an effective schema contains <rule>
    When the operator validates <observation>
    Then validation returns <outcome> at <issue_path>
    And the same outcome appears in Fixture and Live evaluation
    Examples:
      | rule | observation | outcome | issue_path |
      | items cardinality 1 through 10 | zero items | cardinality error | /ecommerce/items |
      | items cardinality 1 through 10 | 11 items | cardinality error | /ecommerce/items |
      | purchase_order_number required when account_type is trade | trade without purchase_order_number | conditional rule error | /ecommerce/purchase_order_number |
      | coupon forbidden when discount_code is absent | coupon without discount_code | conditional rule error | /ecommerce/coupon |

  # Data layer effective schema compilation 011
  Scenario Outline: Data layer effective schema compilation 011
    Given the side panel can author <rule_type> for a <property_type> property
    When that capability is adopted into a canonical Profile and compiled
    Then <rule_type> remains available through a typed guided editor with no loss of parameters
    And positive and negative observations execute the same constraint in Preview, Fixture, preflight, release, and Live
    Examples:
      | rule_type | property_type |
      | Required | boolean |
      | Exact value | string |
      | Allowed values | number |
      | Regular expression | string |
      | Text length | string |
      | Digits only | string |
      | Numeric range | number |
      | Item count | array |
      | Allow undeclared properties | object |

  # Data layer effective schema compilation 012
  Scenario: Data layer effective schema compilation 012
    Given a conditional rule query nests All, Any, and Not groups
    And its typed leaves use Exists, Does not exist, Equals, Does not equal, Is one of, Matches pattern, Is greater than, Is at least, Is less than, and Is at most
    And comparison operands can be typed literals, typed sets, patterns, or compatible property references
    When the operator saves and compiles the query through guided controls
    Then the canonical rule stores one recursively typed condition tree and one typed consequence
    And the same condition-tree representation is reusable for Applicability, Flow entry, exit, and transition conditions, and conditional validation rules
    And a plain-language preview explains the complete Boolean expression, referenced paths, and consequence
    And positive and negative observations prove every branch through the same production evaluator
    And no free-form JavaScript or inert expression is accepted

  # Data layer effective schema compilation 013
  Scenario: Data layer effective schema compilation 013
    Given an enabled side-panel rule has a custom severity, issue message, reusable identity, version, and property attachment
    When it is adopted, edited, promoted, attached elsewhere, explicitly synchronized, disabled, re-enabled, exported, imported, and reloaded
    Then every lifecycle operation preserves its canonical identity, typed parameters, condition tree, consequence, metadata, version policy, and provenance
    And published consumers remain pinned until an explicit reviewed synchronization and release
