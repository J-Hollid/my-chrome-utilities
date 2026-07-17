# mutation-stamp: sha256=77d2489acd701b62df2cb3e30cd1e169745f741a7ad27d0fccf31a4f26725d42
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-17T18:40:33.034696560Z","feature_name":"Data layer schema property filtering and sorting runtime","feature_path":"features/data-layer-schema-property-filtering-sorting-runtime.feature","background_hash":"da8b6e63fd947ebe4685d56a01ed30609bf1af91c62fd09649645f2e8c6a50d5","implementation_hash":"sha256:71bc2207ebbe16ed2c7d3fe05b0ea2c7e32ac178793f34c1e266fad90a450713","scenarios":[{"index":1,"name":"Data layer schema property filtering and sorting runtime 002","scenario_hash":"f2f18ca5249f0ea5f6e01f67d36044192b849536e5ffd3afe15605c0cfe1c95d","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-15T15:58:15.148164504Z"},{"index":2,"name":"Data layer schema property filtering and sorting runtime 003","scenario_hash":"948848cd058650496cb57aeebbb3be4390cb1d14dd8498535b23fcc6a8036052","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-15T15:58:15.148164504Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema property filtering and sorting runtime

  Background:
    Given the built extension side panel is running with the production Schema Library, schema editor, property tree, rules, documentation, and persistence
    And the actual Page view working draft contains page_type, commerce.order.id, and object-item array products
    And production products items contain product_name, product_id, and price_monthly
    And the rendered unfiltered property tree contains 9 canonical rows

  # Data layer schema property filtering and sorting runtime 001
  Scenario: Data layer schema property filtering and sorting runtime 001
    When the actual Page view property editor is rendered
    Then production controls render Filter properties and Sort properties above the property tree
    And the filter is empty, Schema order is selected, and status renders 9 of 9 properties
    And production Add property remains available

  # Data layer schema property filtering and sorting runtime 002
  Scenario Outline: Data layer schema property filtering and sorting runtime 002
    When the production property filter receives <query>
    Then rendered direct matches are <matching_rows>
    And rendered context rows are <context_rows>
    And each context-only row renders Filter context metadata
    And the actual result status is <result_status>
    And hidden rows have no visible or keyboard-reachable property actions

    Examples:
      | query             | matching_rows                                                        | context_rows                 | result_status                   |
      | product_id        | /products/*/product_id                                                | /products, /products/*       | 1 of 9 properties, 2 context    |
      | products          | /products, /products/*, /products/*/product_name, /products/*/product_id, /products/*/price_monthly | none | 5 of 9 properties, 0 context |
      | /commerce/order   | /commerce/order, /commerce/order/id                                   | /commerce                    | 2 of 9 properties, 1 context    |
      | PRODUCT_NAME      | /products/*/product_name                                              | /products, /products/*       | 1 of 9 properties, 2 context    |

  # Data layer schema property filtering and sorting runtime 003
  Scenario Outline: Data layer schema property filtering and sorting runtime 003
    When the production sort control selects <sort_order>
    Then rendered root order is <root_order>
    And rendered products item-property order is <item_property_order>
    And the production wildcard item row remains between its array and named item properties
    And no property row is duplicated or flattened

    Examples:
      | sort_order   | root_order                    | item_property_order                         |
      | Schema order | page_type, commerce, products | product_name, product_id, price_monthly     |
      | Name A-Z     | commerce, page_type, products | price_monthly, product_id, product_name     |
      | Name Z-A     | products, page_type, commerce | product_name, product_id, price_monthly     |

  # Data layer schema property filtering and sorting runtime 004
  Scenario: Data layer schema property filtering and sorting runtime 004
    Given production schema storage and editor presentation are recorded
    When actual controls filter by product_ and sort by Name A-Z
    Then rendered matches are product_id then product_name beneath products and its wildcard context row
    And production schema storage remains byte-equivalent
    When the rendered Add rule action for product_id refreshes the tree
    Then production filter value, sort choice, hierarchy, selected row, scroll position, and keyboard return target are preserved
    And only the accepted rule change is added to the working draft

  # Data layer schema property filtering and sorting runtime 005
  Scenario: Data layer schema property filtering and sorting runtime 005
    Given the production property filter contains missing_property
    When the rendered property tree has no match
    Then status renders 0 of 9 properties and No properties match missing_property
    And Clear filter is keyboard reachable
    When Clear filter is activated
    Then all production rows return in the selected sort order
    And focus returns to Filter properties without horizontal side-panel overflow
