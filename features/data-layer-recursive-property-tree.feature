# mutation-stamp: sha256=26ba804132624c4ca195f9f64ad9f65cbaed8f399057777753192d7720e395c6
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T09:55:49.189486099Z","feature_name":"Data layer recursive property tree","feature_path":"features/data-layer-recursive-property-tree.feature","background_hash":"350abc1497960e38db4285aef51ddd843604696d8e18102a595275e8643899f3","implementation_hash":"sha256:92baae7dd38e46c8e304521a96cfb58be96c50fb39deafbb03d44e1ebfc1a734","scenarios":[{"index":0,"name":"Data layer recursive property tree 001","scenario_hash":"6bc094b01b61b45b376ad7d9ec7ac768f94cffdd459cddf79e47695ed0bbba31","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-14T09:24:32.375823862Z"},{"index":4,"name":"Data layer recursive property tree 005","scenario_hash":"ddfec418912e291eeebba9418b4e44812c17a88a6aee99745f9660d3f81a507f","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T09:24:32.375823862Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer recursive property tree

  Background:
    Given captured event order_complete contains object oOrder
    And oOrder contains array aProducts with 6 product objects

  # Data layer recursive property tree 001
  Scenario Outline: Data layer recursive property tree 001
    Given the <surface> represents order_complete properties
    When its property hierarchy is displayed
    Then objects and arrays are nested disclosure nodes rather than a flat path list
    And each property appears beneath its containing object, array, or item node
    And expanding a node reveals its children without repeating sibling paths
    And complete technical paths remain available for the displayed nodes

    Examples:
      | surface                         |
      | Live event inspector            |
      | advanced schema editor          |

  # Data layer recursive property tree 002
  Scenario: Data layer recursive property tree 002
    Given each product contains sku, name, and nested object pricing with amount
    When oOrder and aProducts are expanded
    Then aProducts is summarized as Array with 6 items
    And one Every item node represents the 6 repeating product objects
    And Every item exposes sku, name, and pricing once
    And expanding pricing exposes amount at path /oOrder/aProducts/*/pricing/amount
    And no value is presented as object Object or as a comma-joined object string

  # Data layer recursive property tree 003
  Scenario: Data layer recursive property tree 003
    Given orders contains arrays of order objects whose items properties are arrays of item objects
    When the operator expands orders, Every item, items, and its Every item node
    Then sku is available at path /orders/*/items/*/sku
    And every finite observed object and array level can be expanded recursively
    And no fixed nesting depth prevents sku from being reached

  # Data layer recursive property tree 004
  Scenario: Data layer recursive property tree 004
    Given sku is present in 5 of the 6 product objects
    And price is observed as Number in 4 products and String in 2 products
    When the aProducts Every item subtree is displayed
    Then sku reports presence in 5 of 6 observed items
    And price reports Mixed types with the Number and String observation counts
    And choosing a type-specific validation for price requires an expected type
    And the operator can inspect the concrete items contributing each observed type

  # Data layer recursive property tree 005
  Scenario Outline: Data layer recursive property tree 005
    Given array property <array_property> has observed content <observed_content>
    When <array_property> is expanded
    Then repeating structure is <repeating_structure>
    And assistance is <assistance>

    Examples:
      | array_property | observed_content            | repeating_structure                    | assistance                                  |
      | tags           | 3 strings                   | Every item with type String             | 3 observed values                           |
      | matrices       | arrays containing numbers   | nested Every item levels                | number values remain reachable              |
      | discounts      | an empty array              | no inferred item subtree                | No item structure was observed              |

  # Data layer recursive property tree 006
  Scenario: Data layer recursive property tree 006
    Given aProducts Every item is expanded
    When Specific items is expanded
    Then product objects are available as Item 1 through Item 6 with zero-based indexes 0 through 5
    And expanding Item 2 exposes its concrete descendants without expanding every other item
    And the corresponding wildcard and concrete paths remain distinguishable

  # Data layer recursive property tree 007
  Scenario: Data layer recursive property tree 007
    Given the property tree is collapsed
    When the operator searches for pricing amount
    Then matching amount nodes are displayed within their hierarchy
    And oOrder, aProducts, Every item, and pricing are expanded to reveal each match
    And clearing search restores the prior expansion state rather than a flat result list

  # Data layer recursive property tree 008
  Scenario: Data layer recursive property tree 008
    Given the operator has expanded oOrder, aProducts, Every item, and pricing
    And keyboard focus is on amount
    When a validation flow opens and returns to the property tree
    Then the same nodes remain expanded
    And amount remains visible at the prior scroll position
    And keyboard focus returns to the originating amount row action

  # Data layer recursive property tree 009
  Scenario: Data layer recursive property tree 009
    Given the property tree is displayed at 320 CSS px wide
    When nested property rows include status and actions
    Then hierarchy, property summary, and complete path remain readable
    And property actions occupy a separate wrapping row from the property summary
    And indentation does not reduce any action to an unusable width
