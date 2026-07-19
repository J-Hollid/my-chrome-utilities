Feature: Data layer Flow effective schema assignment runtime

  Background:
    Given the built extension is running with production composition, Assignment, and per-event validation systems
    And Retail Purchase and Trade Purchase reference one shared Purchase Event

  # Data layer Flow effective schema assignment runtime 001
  Scenario: Data layer Flow effective schema assignment runtime 001
    When production compilation resolves Base, Page, Event, ordered Profile, and occurrence layers
    Then the graph inspector, effective-schema view, validation input, and documentation projection contain identical paths, values, revisions, and provenance
    And structural containers and children are both present
    And neither occurrence creates a copied Purchase schema

  # Data layer Flow effective schema assignment runtime 002
  Scenario: Data layer Flow effective schema assignment runtime 002
    Given Checkout and Confirmation have different observable Page matchers
    When actual controls create Purchase on Confirmation by human Page and Event names
    Then production Assignment data retains stable Confirmation and Purchase references
    And no raw Page or Event identifier is entered
    And duplicate Page or Event labels are visibly disambiguated before selection
    When a Confirmation Purchase and a Checkout Purchase are tested
    Then the Confirmation observation selects Purchase on Confirmation
    And the Checkout observation rejects it with named Page-matcher evidence
    When an equal-priority Assignment with identical observable inputs is enabled
    Then production matcher testing renders both names and no winner

  # Data layer Flow effective schema assignment runtime 003
  Scenario Outline: Data layer Flow effective schema assignment runtime 003
    Given production Purchase schema contains <constraint>
    When actual per-event validation receives <payload_value>
    Then the rendered issue is <code> at <path> with expected <expected>, actual <actual>, severity Error, and origin <origin>

    Examples:
      | constraint                  | payload_value                   | code        | path                             | expected          | actual | origin         |
      | string transaction ID       | transaction_id is 42            | type        | /ecommerce/transaction_id        | string            | 42     | Purchase Event |
      | GBP or EUR currency         | currency is USD                 | enum        | /ecommerce/currency              | GBP or EUR        | USD    | Retail Profile |
      | forbidden coupon            | coupon is SUMMER                | forbidden   | /ecommerce/coupon                | absent            | SUMMER | Retail Profile |
      | required value              | value is absent                 | required    | /ecommerce/value                 | present           | absent | Purchase Event |

  # Data layer Flow effective schema assignment runtime 004
  Scenario: Data layer Flow effective schema assignment runtime 004
    Given one Purchase observation has a selected Assignment and valid payload result
    When documentary predecessor, branch, layout, and multiplicity records are changed
    Then production validation returns the same Assignment, effective schema, and payload result
    And serialized and rendered results contain no active Flow, current node, transition, branch, join, occurrence, or journey verdict

  # Data layer Flow effective schema assignment runtime 005
  Scenario: Data layer Flow effective schema assignment runtime 005
    Given production Retail Purchase is bound to Confirmation
    And production Assignment Checkout Purchase is scoped to Checkout
    When the same observation is tested in editor, captured validation, and matcher test
    Then all three production paths reject Checkout Purchase with named Page evidence
    And an empty Page-scope intersection never selects it globally
    When two production Page matchers cover the same observation
    Then all three paths report Page ambiguity and no winner
    And a contradictory supplied Page identifier cannot bypass observable matching

  # Data layer Flow effective schema assignment runtime 006
  Scenario Outline: Data layer Flow effective schema assignment runtime 006
    Given actual controls create Confirmation Purchase on Confirmation
    And actual controls create <candidate_configuration>
    When the graph inspector and Assignment matcher calculate Confirmation Purchase
    Then both production paths show status <status>
    And both production paths show winner <winner> and contract <selected_contract>
    And both production paths render <page_evidence>

    Examples:
      | candidate_configuration                                  | status        | winner                | selected_contract     | page_evidence                                          |
      | Checkout Purchase at priority 20                         | No Assignment | none                  | none                  | Checkout is disjoint from Confirmation                 |
      | Checkout Purchase at 20 and Confirmation Purchase at 10 | Assigned      | Confirmation Purchase | Confirmation contract | higher-priority Checkout is rejected by Page           |
      | Checkout Purchase and Confirmation Purchase both at 10  | Assigned      | Confirmation Purchase | Confirmation contract | disjoint Pages are not reported as an equal-priority tie |

  # Data layer Flow effective schema assignment runtime 007
  Scenario Outline: Data layer Flow effective schema assignment runtime 007
    Given actual controls save Confirmation Page with <matcher>
    When <observation> is tested in the Assignment editor, a saved Event example, and captured side-panel validation
    Then all three paths resolve <resolved_page>
    And all three paths serialize the same Page-resolution semantic identity, normalized Page context, and predicate evidence <evidence>
    And all three paths select Assignment <winner>

    Examples:
      | matcher                                         | observation                                           | resolved_page | evidence                           | winner                   |
      | exact host shop.example                         | URL https://shop.example/checkout/confirmation        | Confirmation  | host shop.example                  | Purchase on Confirmation |
      | environment Production                          | environment Staging and an otherwise matching URL     | none          | expected Production actual Staging | none                     |
      | path glob /checkout/*                           | URL https://shop.example/checkout/confirmation        | Confirmation  | path /checkout/confirmation        | Purchase on Confirmation |
      | path regular expression ^/checkout/.*$          | URL https://shop.example/checkout/confirmation        | Confirmation  | path /checkout/confirmation        | Purchase on Confirmation |
      | route template /{channel}/checkout/confirmation | URL https://shop.example/retail/checkout/confirmation | Confirmation  | route variable channel retail      | Purchase on Confirmation |
      | query channel=retail                            | URL https://shop.example/checkout?channel=trade       | none          | expected retail actual trade       | none                     |
      | hash complete                                   | URL https://shop.example/checkout#cancelled           | none          | expected complete actual cancelled | none                     |
      | SPA route /checkout/confirmation                | SPA route /checkout/confirmation                      | Confirmation  | SPA route /checkout/confirmation   | Purchase on Confirmation |

  # Data layer Flow effective schema assignment runtime 008
  Scenario: Data layer Flow effective schema assignment runtime 008
    Given only Confirmation matches one Purchase observation
    And Purchase on Confirmation is the winner in the Assignment editor, a saved Event example, and captured validation
    When actual controls change an otherwise unreferenced Checkout Page matcher to cover that observation
    Then all three Page-resolution semantic identities change
    And all three paths report Checkout and Confirmation, identical normalized predicate evidence, and no winner
    And both Page matcher fields are available as direct repair actions
    When only Checkout and Confirmation display names are renamed
    Then their stable references and Page-resolution semantic identities remain unchanged
    And all visible candidate, ambiguity, and repair labels use the new names

  # Data layer Flow effective schema assignment runtime 009
  Scenario: Data layer Flow effective schema assignment runtime 009
    Given actual controls create Retail Purchase Assignment for Confirmation Page
    When captured side-panel validation invokes Page resolution without a URL or normalized Page context
    Then the production resolver selects no Assignment and no effective contract
    And the rendered reason is missing observable Page context for Retail Purchase Assignment
    And Provide Page context for Retail Purchase Assignment opens the caller input that must be repaired

  # Data layer Flow effective schema assignment runtime 010
  Scenario: Data layer Flow effective schema assignment runtime 010
    Given the built extension opens a saved canonical project where Retail Purchase Assignment retains the last Page label Confirmation but its stable Page reference no longer resolves
    When the graph inspector, Assignment editor, and captured side-panel validation resolve Retail Purchase Assignment
    Then all three production paths block it with Retail Purchase Assignment references its missing Page named Confirmation
    And all three paths select no Assignment and no effective contract
    And Select a replacement Page for Retail Purchase Assignment opens its Page selector

  # Data layer Flow effective schema assignment runtime 011
  Scenario: Data layer Flow effective schema assignment runtime 011
    Given actual controls author the Trade Profile rule /customer/type equals business requires /ecommerce/purchase_order_number
    And the complete Trade Purchase payload satisfies every other effective requirement:
      """json
      {
        "event": "purchase",
        "page": { "type": "confirmation" },
        "customer": { "type": "business" },
        "ecommerce": {
          "transaction_id": "TRADE-1001",
          "currency": "EUR",
          "value": 125.00
        }
      }
      """
    When actual Assignment-backed per-event validation receives the payload
    Then exactly one rendered issue reports path /ecommerce/purchase_order_number, code conditional, severity Error, expected present when /customer/type equals business, actual absent, and origin Trade Profile
    And its repair link opens the authored Trade Profile conditional rule

  # Data layer Flow effective schema assignment runtime 012
  Scenario: Data layer Flow effective schema assignment runtime 012
    Given actual schema controls allow GBP, EUR, or USD at Purchase Event /ecommerce/currency
    And actual schema controls narrow that path to GBP or EUR in Retail Profile
    And actual schema controls narrow that path to exact GBP in Retail Purchase occurrence
    When production composition combines those compatible currency constraints for Retail Purchase
    Then the effective /ecommerce/currency constraint is exact GBP without a conflict
    And the graph inspector, validator input, and documentation export each render exactly this ordered provenance:
      | order | layer      | entity          | authored constraint       | composition decision                    |
      | 1     | Event      | Purchase        | GBP or EUR or USD allowed | introduce GBP or EUR or USD allowed set |
      | 2     | Profile    | Retail          | GBP or EUR allowed        | narrow allowed set to GBP or EUR        |
      | 3     | occurrence | Retail Purchase | exact GBP                 | narrow allowed set to exact GBP         |

  # Data layer Flow effective schema assignment runtime 013
  Scenario Outline: Data layer Flow effective schema assignment runtime 013
    Given actual schema controls declare /tags as an optional array on Purchase Event
    And actual schema controls declare <constraint> on scalar array-item path /tags/*
    When production composition compiles the Purchase Event array requirements for Retail Purchase
    Then the graph inspector, validator input, and documentation export each retain /tags/* with <constraint> and provenance Purchase Event
    When actual Assignment-backed validation receives array payload <payload>
    Then exactly one rendered issue reports path /tags/0, code <code>, severity Error, expected <expected>, actual <actual>, and provenance Purchase Event requirement /tags/*

    Examples:
      | constraint                          | payload       | code  | expected             | actual    |
      | string type                         | [42]          | type  | string               | 42        |
      | allowed values primary or secondary | ["legacy"]   | enum  | primary or secondary | legacy    |
      | exact value primary                 | ["secondary"] | exact | primary              | secondary |

  # Data layer Flow effective schema assignment runtime 014
  Scenario Outline: Data layer Flow effective schema assignment runtime 014
    Given actual controls author <event_constraint> in Purchase Event and <profile_constraint> in Retail Profile on the same effective path
    When production composition compiles Retail Purchase
    Then compilation is blocked without an executable partial contract
    And the installed diagnostic names Purchase Event, Retail Profile, <event_constraint>, and <profile_constraint>

    Examples:
      | event_constraint        | profile_constraint       |
      | string type             | number type              |
      | Required presence       | Forbidden presence       |
      | allowed GBP or EUR      | allowed USD              |
      | rule value above 0      | rule value below 0       |
