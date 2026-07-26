Feature: Data layer side-panel schema relationship tree runtime

  Background:
    Given the built extension is running with the production project repository, Flow graph projection, and established side-panel Schema editor
    And production Shop contains Sitewide, Checkout, Promotions, Cart, and Purchase under stable project identities
    And production Cart belongs to Checkout and Promotions
    And production Checkout journey and Express checkout each contain a Cart Page instance with a Purchase occurrence
    And production Saved Schema Opened Article exists globally

  # Data layer side-panel schema relationship tree runtime 001
  Scenario: Data layer side-panel schema relationship tree runtime 001
    When actual controls open the installed side-panel Schema Library
    Then its one rendered Schema list contains Saved schemas and Project Shop branches
    And every production Shop project schema remains reachable inside that Schema Library
    And Project Shop renders Shared Profiles, Page Groups, Pages, Events, and Flows branches
    And rendered Flow branches contain their Page instances and Event occurrences
    And schema-bearing rows expose derived role and human relationship-path metadata
    And repository inspection finds no category tag, category field, or duplicated canonical record

  # Data layer side-panel schema relationship tree runtime 002
  Scenario: Data layer side-panel schema relationship tree runtime 002
    When actual controls expand Page Groups
    Then DOM tree paths contain Checkout to Cart and Promotions to Cart
    And the Pages path contains one canonical Cart row with two Flow Page-instance references
    When actual controls open either Page Group Cart reference
    Then exactly one established editor opens canonical Cart by the same stable identity
    And serialized Cart retains one record and both Page Group membership references

  # Data layer side-panel schema relationship tree runtime 003
  Scenario: Data layer side-panel schema relationship tree runtime 003
    When actual controls expand Events and Flows
    Then the Purchase branch references both production Purchase occurrences
    And each Flow branch contains its Cart Page instance and nested Purchase occurrence
    When actual controls open each occurrence reference
    Then the established editor resolves the exact stable Flow and occurrence identities
    And production Purchase Event and the unselected occurrence bytes remain unchanged

  # Data layer side-panel schema relationship tree runtime 004
  Scenario Outline: Data layer side-panel schema relationship tree runtime 004
    Given installed category filter All is selected
    When actual controls select category <category>
    Then rendered schema-bearing results are <results>
    And DOM inspection retains only required structural ancestors
    And unrelated contributor categories and descendants are absent
    And production project, schema, Flow, and Library bytes remain unchanged

    Examples:
      | category            | results                                                        |
      | Saved schemas       | Opened Article                                                 |
      | Shared Profiles     | Sitewide                                                       |
      | Page Groups         | Checkout, Promotions                                           |
      | Pages               | Cart                                                           |
      | Events              | Purchase                                                       |
      | Flow Page instances | Checkout journey Cart, Express checkout Cart                   |
      | Event occurrences   | Checkout journey Cart Purchase, Express checkout Cart Purchase |

  # Data layer side-panel schema relationship tree runtime 005
  Scenario Outline: Data layer side-panel schema relationship tree runtime 005
    Given installed category filter <category_filter> is active
    When actual input searches the filtered tree for <query>
    Then rendered matches are <matches>
    And accessible breadcrumb text is <breadcrumb>
    And every matching ancestor has expanded state true
    And unrelated sibling rows are absent

    Examples:
      | category_filter    | query         | matches                                                     | breadcrumb                                        |
      | All                | Cart Purchase | both Cart Purchase occurrence references                     | Shop, Flow, Page instance, Event occurrence       |
      | Page Groups        | Cart          | Cart beneath Checkout and Cart beneath Promotions             | Shop, Page Groups, owning Page Group, Cart         |
      | Event occurrences  | Express       | Express checkout Cart Purchase                                | Shop, Express checkout, Cart, Purchase occurrence  |
      | Shared Profiles    | site          | Sitewide                                                      | Shop, Shared Profiles, Sitewide                    |

  # Data layer side-panel schema relationship tree runtime 006
  Scenario: Data layer side-panel schema relationship tree runtime 006
    Given installed search renders Cart through Pages and both Page Group paths
    When actual controls open Cart from one result and close the editor
    Then DOM inspection finds one schema-editor region throughout the interaction
    And the prior query, category, expanded node keys, scroll offset, and invoking element are restored
    And opening another Cart reference reuses the same canonical editor projection

  # Data layer side-panel schema relationship tree runtime 007
  Scenario: Data layer side-panel schema relationship tree runtime 007
    Given the production relationship tree subscription is active
    When production commands remove Cart membership from Promotions, rename the Checkout journey instance Basket step, and move its Purchase occurrence
    Then rendered tree updates remove only Promotions to Cart and show current Basket step and occurrence paths
    And serialized Cart, Purchase, occurrence identity, and Express checkout references preserve their unaffected bytes
    And durable project bytes contain no category value or category synchronization command

  # Data layer side-panel schema relationship tree runtime 008
  Scenario: Data layer side-panel schema relationship tree runtime 008
    Given production Shop tree state has Pages filter, query Cart, and expanded matching paths
    When actual controls switch to project-trade
    Then rendered rows use only project-trade identities and no project-shop reference resolves
    When actual controls switch back to project-shop
    Then the installed Pages filter, Cart query, and still-valid expanded node keys return
    When actual controls close the active project
    Then the same Schema Library retains only its global Saved schemas branch and Open project guidance

  # Data layer side-panel schema relationship tree runtime 009
  Scenario Outline: Data layer side-panel schema relationship tree runtime 009
    Given the installed tree has repeated Cart and Purchase references at <panel_width> CSS pixels
    When actual keyboard events filter, search, expand, collapse, and open a result
    Then measured geometry has one vertical scroll owner and no horizontal document overflow
    And accessibility inspection finds tree level, expanded, selected, result-count, and relationship-path names
    And document focus returns to the exact invoking reference when the editor closes

    Examples:
      | panel_width |
      | 360         |
      | 520         |
