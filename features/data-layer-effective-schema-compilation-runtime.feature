# mutation-stamp: sha256=035512d0eb0c7bf7ff80b3088ca94dc89e9492326ff1221c64aa7089fca99d01
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:34.802771783Z","feature_name":"Data layer effective schema compilation runtime","feature_path":"features/data-layer-effective-schema-compilation-runtime.feature","background_hash":"fa35579bfbedfa51a585c915ff38e2af0cbe782300b4e5fe2ab36f6139d23243","implementation_hash":"sha256:03bbe08c8ba8c89e29f823fcf9b0b5b974f0e975840808bc8ec34ab01eb6fb41","scenarios":[]}
# acceptance-mutation-manifest-end

# MVP scope notice: production schema compilation and per-event validation remain active; documentary Flow relationships never select or advance validation.
Feature: Data layer effective schema compilation runtime

  Background:
    Given the built unpacked extension has profiles authored through rendered controls
    And the operator has not injected a schema document or project JSON

  # Data layer effective schema compilation runtime 001
  Scenario: Data layer effective schema compilation runtime 001
    When the operator orders Sitewide, Commerce, Purchase, and Retail confirmation profiles
    Then the rendered effective schema marks transaction_id, value, and currency Required
    When the Retail confirmation contract revision passes preflight, review, and publication
    And a permitted Retail confirmation page emits a payload with missing currency
    Then Live validates it against that exact published schema revision

  # Data layer effective schema compilation runtime 002
  Scenario: Data layer effective schema compilation runtime 002
    When the operator orders Sitewide, Commerce, Purchase, Trade account, and Purchase order profiles
    Then the rendered effective schema additionally marks account_id and purchase_order_number Required
    When the Trade confirmation contract revision passes preflight, review, and publication
    And a permitted Trade confirmation page emits a payload missing account_id and purchase_order_number
    Then Live reports those exact missing fields

  # Data layer effective schema compilation runtime 003
  Scenario: Data layer effective schema compilation runtime 003
    Given /ecommerce/value is contributed by three visible profiles
    When the operator switches among Effective, Local only, and Provenance views
    Then origin, precedence, rule, documentation, and release data remain consistent
    And Where used opens each actual Page, Event, Event-occurrence node, Event validation case, and release consumer

  # Data layer effective schema compilation runtime 004
  Scenario: Data layer effective schema compilation runtime 004
    When the operator makes one profile require /account_id and another forbid it
    Then the exact grid cell and effective preview show both origins
    And the invalid effective schema cannot replace the last valid preview or Live plan

  # Data layer effective schema compilation runtime 005
  Scenario: Data layer effective schema compilation runtime 005
    Given reordering two profiles changes 3 effective requirements
    When the operator reviews and cancels the rendered impact dialog
    Then no order, schema revision, or consumer result changes
    When the operator repeats and confirms the reorder
    Then one project transaction updates the order and compiled provenance

  # Data layer effective schema compilation runtime 006
  Scenario: Data layer effective schema compilation runtime 006
    Given a legacy parent chain and its historical revision are visible in migration review
    When the operator adopts the compatible chain
    Then the rendered compiled contract is behavior-equivalent to the legacy validator
    And the historical revision remains accessible and unchanged

  # Data layer effective schema compilation runtime 007
  Scenario: Data layer effective schema compilation runtime 007
    Given one profile allows EUR and USD and a later profile allows only EUR
    When the operator compiles and inspects the effective contract
    Then the rendered allowed values contain only EUR with both origins
    When the allowed-value narrowing contract passes preflight, review, and publication
    And a permitted page emits one USD event and one EUR event
    Then USD fails and EUR passes that published rule in Live

  # Data layer effective schema compilation runtime 008
  Scenario Outline: Data layer effective schema compilation runtime 008
    Given the operator authors <parent_path> and <child_path> through rendered Profile controls in <authoring_order>
    When the installed Builder compiles and renders the effective schema
    Then no silent crash occurs and both paths are visible with their effective types and origins
    And preflight consumes the same successfully compiled document
    Examples:
      | parent_path | child_path | authoring_order |
      | /ecommerce | /ecommerce/transaction_id | parent then child |
      | /ecommerce | /ecommerce/transaction_id | child then parent |
      | /page | /page/type | parent then child |

  # Data layer effective schema compilation runtime 009
  Scenario Outline: Data layer effective schema compilation runtime 009
    Given the published Retail schema declares <constraint>
    When the real page emits <invalid_value>
    Then visible Live contains path <path>, code <code>, severity error, expected <expected>, actual <invalid_value>, and provenance
    And the corresponding negative Event validation case returns the structurally identical issue
    Examples:
      | constraint | invalid_value | path | code | expected |
      | transaction_id is string | 42 | /ecommerce/transaction_id | type | string |
      | currency is EUR or GBP | USD | /ecommerce/currency | enum | EUR or GBP |
      | coupon is forbidden | SUMMER | /ecommerce/coupon | forbidden | absent |

  # Data layer effective schema compilation runtime 010
  Scenario: Data layer effective schema compilation runtime 010
    Given the installed editor authors an items cardinality rule and a trade conditional requirement
    When positive and negative Event validation cases run against the draft plan
    Then valid values pass and each invalid cardinality or conditional case returns one exact issue
    When that plan and its required evidence pass preflight, review, and publication
    And equivalent permitted-page observations run against the published plan
    Then Event validation cases, release review, and Live use the same validation outcome

  # Data layer effective schema compilation runtime 011
  Scenario Outline: Data layer effective schema compilation runtime 011
    Given the installed side panel authors <rule_type> for a <property_type> property through rendered controls
    When the operator adopts it into a canonical Profile, publishes it, and emits proving observations
    Then the installed Builder retains the rule type and typed parameters without a compatibility downgrade
    And Event validation cases and visible Live return the same positive and negative outcomes from the published plan
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

  # Data layer effective schema compilation runtime 012
  Scenario: Data layer effective schema compilation runtime 012
    Given the installed query builder authors a nested All group containing an Any group and a Not group
    And its leaves collectively exercise every supported typed predicate operator
    And one predicate compares a typed property reference with another compatible property reference
    When the operator saves, reloads, compiles, and runs branch-covering positive and negative Event validation cases
    Then the rendered readable query and canonical condition tree remain structurally identical
    And Assignment resolution and conditional rules consume that same condition-tree representation in the selected compiled plan
    And documentary Flow relationships do not consume the executable condition tree
    When the operator preflights, reviews, and publishes that same query
    And real permitted-target observations exercise every branch in Live
    Then the published query produces identical branch outcomes and provenance

  # Data layer effective schema compilation runtime 013
  Scenario: Data layer effective schema compilation runtime 013
    Given an installed reusable rule has custom severity, issue message, enabled state, version, and conditional parameters
    When the operator adopts it, edits it, attaches it to another property, explicitly synchronizes it, toggles it, exports it, imports it, and reloads
    Then every rendered lifecycle state retains the same canonical identity and reviewed version policy
    And the published release remains unchanged until synchronization passes preflight and is published
