# mutation-stamp: sha256=035512d0eb0c7bf7ff80b3088ca94dc89e9492326ff1221c64aa7089fca99d01
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:34.802771783Z","feature_name":"Data layer effective schema compilation runtime","feature_path":"features/data-layer-effective-schema-compilation-runtime.feature","background_hash":"fa35579bfbedfa51a585c915ff38e2af0cbe782300b4e5fe2ab36f6139d23243","implementation_hash":"sha256:03bbe08c8ba8c89e29f823fcf9b0b5b974f0e975840808bc8ec34ab01eb6fb41","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer effective schema compilation runtime

  Background:
    Given the built unpacked extension has profiles authored through rendered controls
    And the operator has not injected a schema document or project JSON

  # Data layer effective schema compilation runtime 001
  Scenario: Data layer effective schema compilation runtime 001
    When the operator orders Sitewide, Commerce, Purchase, and Retail confirmation profiles
    Then the rendered effective schema marks transaction_id, value, and currency Required
    And Live validates a missing currency against that exact compiled schema revision

  # Data layer effective schema compilation runtime 002
  Scenario: Data layer effective schema compilation runtime 002
    When the operator orders Sitewide, Commerce, Purchase, Trade account, and Purchase order profiles
    Then the rendered effective schema additionally marks account_id and purchase_order_number Required
    And Live reports those exact missing fields for a Trade confirmation

  # Data layer effective schema compilation runtime 003
  Scenario: Data layer effective schema compilation runtime 003
    Given /ecommerce/value is contributed by three visible profiles
    When the operator switches among Effective, Local only, and Provenance views
    Then origin, precedence, rule, documentation, and release data remain consistent
    And Where used opens each actual page, event, flow step, fixture, and release consumer

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
    And a page-emitted USD event fails and a page-emitted EUR event passes that compiled rule in Live
