# mutation-stamp: sha256=432220d71c361a9564317be7ddeaa3bdad33ccb13741d7b96319dbc5a1148b23
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-26T19:17:15.867399104Z","feature_name":"Data layer side-panel schema relationship tree","feature_path":"features/data-layer-side-panel-schema-relationship-tree.feature","background_hash":"bca4bfc5e8cbc0fe76931b0cf7a79f0556fd6bafbe0b0c13679e64da4ab0a7d1","implementation_hash":"sha256:4f39f09fcfd5af1c8d0875ab90e93230905a6199aaa91c1541320ca651de08c0","scenarios":[{"index":3,"name":"Data layer side-panel schema relationship tree 004","scenario_hash":"300bdc329acdbbb314b1a3b7fc4b74b17ea48b7c3722548146ec892f50415d85","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-07-26T19:17:15.867399104Z"},{"index":4,"name":"Data layer side-panel schema relationship tree 005","scenario_hash":"9aa52fc9d9731c5116720e30bb667032512196220f01b5d0477fb2a5e2bad4eb","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-26T19:17:15.867399104Z"},{"index":8,"name":"Data layer side-panel schema relationship tree 009","scenario_hash":"ee448d3675cd5a600844e0cc3f0e16e37ae45437a448ff8ab520c814ee9f7623","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-26T19:17:15.867399104Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer side-panel schema relationship tree

  Background:
    Given Shop is the active project
    And Shop contains Shared Profile Sitewide, Page Groups Checkout and Promotions, Page Cart, and Event Purchase
    And Cart belongs to Checkout and Promotions
    And Checkout journey and Express checkout each contain a Cart Page instance with a Purchase Event occurrence
    And global Saved Schema Opened Article exists

  # Data layer side-panel schema relationship tree 001
  Scenario: Data layer side-panel schema relationship tree 001
    When the operator opens the side-panel Schema Library
    Then its one Schema list contains branches Saved schemas and Project Shop
    And every Shop project schema remains available inside that Schema Library
    And Project Shop exposes relationship categories Shared Profiles, Page Groups, Pages, Events, and Flows
    And Flow Page instances and Event occurrences appear beneath their owning Flow relationships
    And every schema-bearing row identifies its derived contributor role and human relationship path
    And no category tag, free-form category field, or duplicate schema record is created

  # Data layer side-panel schema relationship tree 002
  Scenario: Data layer side-panel schema relationship tree 002
    When the operator expands Page Groups
    Then Checkout contains one Cart reference
    And Promotions contains one Cart reference
    And Pages contains one canonical Cart row with references to both Flow Page instances
    When either Page Group Cart reference is selected
    Then the established editor opens the same canonical Cart contributor
    And Cart storage contains one stable identity and its existing two Page Group memberships

  # Data layer side-panel schema relationship tree 003
  Scenario: Data layer side-panel schema relationship tree 003
    When the operator expands Events and Flows
    Then Event Purchase contains references to the Checkout journey and Express checkout Purchase occurrences
    And each Flow contains its Cart Page instance and nested Purchase occurrence
    When any Purchase occurrence reference is selected
    Then the established editor opens that one occurrence contributor through its stable Flow and occurrence identities
    And the reusable Purchase Event and the other occurrence remain unchanged

  # Data layer side-panel schema relationship tree 004
  Scenario Outline: Data layer side-panel schema relationship tree 004
    Given all relationship categories are visible
    When the operator filters the tree to <category>
    Then the visible schema-bearing results are <results>
    And structural ancestors required to locate those results remain visible
    And unrelated schema-bearing categories and descendants are hidden
    And filtering changes no project, schema, Flow, or Library data

    Examples:
      | category            | results                                                          |
      | Saved schemas       | Opened Article                                                   |
      | Shared Profiles     | Sitewide                                                         |
      | Page Groups         | Checkout, Promotions                                             |
      | Pages               | Cart                                                             |
      | Events              | Purchase                                                         |
      | Flow Page instances | Checkout journey Cart, Express checkout Cart                      |
      | Event occurrences   | Checkout journey Cart Purchase, Express checkout Cart Purchase   |

  # Data layer side-panel schema relationship tree 005
  Scenario Outline: Data layer side-panel schema relationship tree 005
    Given category filter <category_filter> is active
    When the operator searches the complete filtered hierarchy for <query>
    Then matching rows are <matches>
    And each match retains breadcrumb <breadcrumb>
    And every collapsed ancestor on a matching path expands
    And unrelated siblings remain hidden

    Examples:
      | category_filter    | query           | matches                                                       | breadcrumb                                      |
      | All                | Cart Purchase   | both Cart Purchase occurrence references                       | Shop, Flow, Page instance, Event occurrence     |
      | Page Groups        | Cart            | Cart beneath Checkout and Cart beneath Promotions               | Shop, Page Groups, owning Page Group, Cart       |
      | Event occurrences  | Express         | Express checkout Cart Purchase                                  | Shop, Express checkout, Cart, Purchase occurrence |
      | Shared Profiles    | site            | Sitewide                                                        | Shop, Shared Profiles, Sitewide                  |

  # Data layer side-panel schema relationship tree 006
  Scenario: Data layer side-panel schema relationship tree 006
    Given search shows Cart through its Pages row and both Page Group references
    When the operator opens Cart from one result and returns to the tree
    Then the same single in-panel Schema editor was used
    And the query, category filter, expansion state, scroll position, and invoking reference are restored
    And selecting another Cart reference reuses the same canonical editor state without mounting a second editor

  # Data layer side-panel schema relationship tree 007
  Scenario: Data layer side-panel schema relationship tree 007
    Given the relationship tree is open
    When Cart is removed from Promotions, the Checkout journey Cart instance is renamed Basket step, and its Purchase occurrence moves to another Page instance
    Then the tree removes only the Promotions Cart reference
    And it updates Basket step and the moved occurrence beneath their current human relationship paths
    And the canonical Cart Page, Purchase Event, moved occurrence identity, and unaffected Express checkout references remain unchanged
    And no stored category value requires synchronization or repair

  # Data layer side-panel schema relationship tree 008
  Scenario: Data layer side-panel schema relationship tree 008
    Given Shop tree state contains a Pages filter and query Cart
    When the operator switches to Trade portal
    Then the tree shows only Trade portal contributors and relationships
    And no Shop relationship reference resolves in Trade portal
    When the operator switches back to Shop
    Then its Pages filter, query Cart, and valid expansion state return
    When the operator closes the active project
    Then the same Schema Library retains only its global Saved schemas branch with Open project guidance

  # Data layer side-panel schema relationship tree 009
  Scenario Outline: Data layer side-panel schema relationship tree 009
    Given the relationship tree contains repeated Cart and Purchase references at <panel_width> CSS pixels
    When the operator uses keyboard controls to filter, search, expand, collapse, and open a result
    Then one vertical scroll owner keeps category controls, breadcrumbs, and tree rows within the viewport width
    And tree semantics expose level, expanded state, selected state, and result count
    And repeated accessible names include their owning relationship path
    And focus returns to the exact invoking reference after the editor closes

    Examples:
      | panel_width |
      | 360         |
      | 520         |
