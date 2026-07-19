Feature: Data layer Flow effective schema assignment

  Background:
    Given Shop project contains Base, Checkout Page, Confirmation Page, Purchase Event, Retail Profile, and Trade Profile
    And Retail Purchase and Trade Purchase occurrences reference shared Event Purchase

  # Data layer Flow effective schema assignment 001
  Scenario: Data layer Flow effective schema assignment 001
    Given Base declares /page, /ecommerce, and /customer as optional object containers
    And Confirmation Page requires /page/type equal confirmation
    And Purchase requires string /ecommerce/transaction_id
    And Retail allows /ecommerce/currency to be GBP or EUR
    And Retail Purchase refines /customer/loyalty_id as an optional string
    When the Retail Purchase effective schema is compiled
    Then it contains the Base, Page, Event, Profile, and occurrence requirements
    And /page/type, /ecommerce/transaction_id, and /customer/loyalty_id compile beneath their object containers without a container-child failure
    And every effective requirement identifies its winning origin and complete provenance

  # Data layer Flow effective schema assignment 002
  Scenario Outline: Data layer Flow effective schema assignment 002
    Given Purchase Event and Retail Profile define <conflict> on the same effective path
    When the Event-occurrence schema is compiled
    Then compilation is blocked with origins Purchase Event and Retail Profile and values <incompatible_values>
    And no Assignment can select a partial effective schema

    Examples:
      | conflict                        | incompatible_values          |
      | string and number types         | string and number             |
      | Required and Forbidden presence | Required and Forbidden        |
      | disjoint allowed-value sets     | GBP or EUR and USD            |
      | incompatible conditional rules  | the two plain-language rules  |

  # Data layer Flow effective schema assignment 003
  Scenario Outline: Data layer Flow effective schema assignment 003
    Given Retail Purchase and Trade Purchase share Purchase revision 3
    When the operator chooses <edit_scope> and adds <requirement>
    Then <affected_occurrences> change in effective-schema preview
    And the preview names the affected schema, Assignment, validation example, and documentation consumers

    Examples:
      | edit_scope             | requirement                    | affected_occurrences       |
      | Edit shared Purchase   | required /ecommerce/value       | Retail and Trade Purchase  |
      | Refine this occurrence | optional /customer/loyalty_id   | Retail Purchase only       |

  # Data layer Flow effective schema assignment 004
  Scenario Outline: Data layer Flow effective schema assignment 004
    Given Retail Purchase has <condition>
    When its authoring status is calculated
    Then the displayed status is <status>
    And the direct next action is <next_action>

    Examples:
      | condition                                      | status               | next_action                         |
      | an effective-schema conflict                   | Schema blocked       | Resolve the named schema conflict   |
      | a valid schema and no Assignment               | No Assignment        | Create or select an Assignment      |
      | two equal-priority matching Assignments        | Ambiguous Assignment | Resolve the named matcher overlap   |
      | one deterministic matching Assignment          | Assigned             | Test an Event payload               |
      | an explicit manual-documentation exception     | Documentation only   | Restore automatic validation        |

  # Data layer Flow effective schema assignment 005
  Scenario: Data layer Flow effective schema assignment 005
    Given Retail Purchase has a valid effective schema and no Assignment
    When the operator creates the Assignment named Retail Purchase Assignment for Retail Purchase on Confirmation through human-name selectors
    Then Retail Purchase Assignment persists stable Confirmation Page, Purchase Event, and effective-contract references
    And Retail Purchase Assignment uses current observable Page and Event inputs in its matcher
    And renaming Confirmation or Purchase changes labels without breaking those references
    And Flow name, predecessor, graph position, and manual expectation state are absent from its predicates

  # Data layer Flow effective schema assignment 006
  Scenario: Data layer Flow effective schema assignment 006
    Given Retail Purchase and Trade Purchase Assignments use route channel retail and trade
    When the operator tests route channel retail
    Then Retail Purchase is the winner with matching predicate evidence
    And Trade Purchase is rejected with its failed predicate
    When both Assignments are changed to the same observable predicates and priority
    Then matcher testing shows both human names and no winner
    And graph topology does not break the tie

  # Data layer Flow effective schema assignment 007
  Scenario Outline: Data layer Flow effective schema assignment 007
    Given a Purchase observation violates <constraint>
    When the selected Assignment and effective schema validate it
    Then one issue reports <path>, <code>, Error, <expected>, <actual>, and <origin>
    And the issue opens the exact contributing requirement

    Examples:
      | constraint                          | path                             | code        | expected          | actual | origin         |
      | transaction ID string type          | /ecommerce/transaction_id        | type        | string            | 42     | Purchase Event |
      | currency allowed values             | /ecommerce/currency              | enum        | GBP or EUR        | USD    | Retail Profile |
      | forbidden coupon                    | /ecommerce/coupon                | forbidden   | absent            | SUMMER | Retail Profile |
      | required value                      | /ecommerce/value                 | required    | present           | absent | Purchase Event |

  # Data layer Flow effective schema assignment 008
  Scenario Outline: Data layer Flow effective schema assignment 008
    Given Purchase has a valid independently selected payload
    And the documented Flow has <journey_difference>
    When per-event validation completes
    Then Purchase remains valid against the same Assignment and effective schema
    And <unsupported_verdict> is not produced

    Examples:
      | journey_difference                  | unsupported_verdict        |
      | Purchase before its predecessor      | an ordering verdict         |
      | 11 occurrences where 10 are expected | an occurrence-count verdict |
      | an absent parallel branch            | a branch or join verdict     |

  # Data layer Flow effective schema assignment 009
  Scenario: Data layer Flow effective schema assignment 009
    Given Retail Purchase is bound to Confirmation
    And candidate Assignment Checkout Purchase is explicitly scoped to Checkout
    When Assignment compatibility is checked
    Then Checkout Purchase is rejected with the two human Page names
    And the disjoint Page intersection is unmatchable rather than globally unscoped
    When one observation matches two selected Page definitions
    Then Page resolution is ambiguous with both human Page names and no Assignment winner
    And a supplied Page identifier cannot override contradictory observable Page inputs

  # Data layer Flow effective schema assignment 010
  Scenario Outline: Data layer Flow effective schema assignment 010
    Given Confirmation Purchase uses Page Confirmation and effective contract Confirmation contract
    And enabled Purchase Assignments are <candidate_configuration>
    When Page-aware authoring status is calculated for Confirmation Purchase
    Then the status is <status>
    And the winning Assignment is <winner>
    And the Assignment-backed validation contract is <selected_contract>
    And candidate evidence states <page_evidence>

    Examples:
      | candidate_configuration                                  | status        | winner                | selected_contract     | page_evidence                                                  |
      | Checkout Purchase at priority 20                         | No Assignment | none                  | none                  | Checkout is disjoint from Confirmation                         |
      | Checkout Purchase at 20 and Confirmation Purchase at 10 | Assigned      | Confirmation Purchase | Confirmation contract | higher-priority Checkout cannot shadow another Page            |
      | Checkout Purchase and Confirmation Purchase both at 10  | Assigned      | Confirmation Purchase | Confirmation contract | equal-priority Assignments on disjoint Pages do not form a tie |

  # Data layer Flow effective schema assignment 011
  Scenario Outline: Data layer Flow effective schema assignment 011
    Given Confirmation Page has <field> matcher <operator> <expression>
    When Page context <observable_context> is resolved
    Then the resolved Page is Confirmation
    And normalized Page evidence contains <evidence>
    And no caller-specific fallback interpretation is used

    Examples:
      | field       | operator             | expression                        | observable_context                                    | evidence                          |
      | Environment | exact                | Production                        | environment Production                                | environment Production           |
      | Host        | exact                | shop.example                      | URL https://shop.example/checkout/confirmation        | host shop.example                |
      | Host        | glob                 | *.example                         | URL https://shop.example/checkout/confirmation        | host shop.example                |
      | Host        | regular expression   | ^shop[.]example$                  | URL https://shop.example/checkout/confirmation        | host shop.example                |
      | Path        | exact                | /checkout/confirmation            | URL https://shop.example/checkout/confirmation        | path /checkout/confirmation      |
      | Path        | glob                 | /checkout/*                       | URL https://shop.example/checkout/confirmation        | path /checkout/confirmation      |
      | Path        | regular expression   | ^/checkout/[a-z]+$                | URL https://shop.example/checkout/confirmation        | path /checkout/confirmation      |
      | Path        | named route template | /{channel}/checkout/confirmation  | URL https://shop.example/retail/checkout/confirmation | route variable channel retail    |
      | Query       | exact                | channel=retail                    | URL https://shop.example/checkout?channel=retail      | query channel=retail             |
      | Hash        | exact                | complete                          | URL https://shop.example/checkout#complete            | hash complete                    |
      | SPA route   | exact                | /checkout/confirmation            | SPA route /checkout/confirmation                      | SPA route /checkout/confirmation |

  # Data layer Flow effective schema assignment 012
  Scenario Outline: Data layer Flow effective schema assignment 012
    Given Confirmation Page requires Production, host shop.example, path /checkout/confirmation, query channel=retail, hash complete, and SPA route /checkout/confirmation
    When <field> instead has <actual_value> while every other Page input matches
    Then Confirmation does not resolve
    And Page evidence reports expected <expected_value> and actual <actual_value>
    And no Assignment winner is selected by a supplied Page identifier

    Examples:
      | field       | expected_value         | actual_value  |
      | Environment | Production             | Staging       |
      | Host        | shop.example           | other.example |
      | Path        | /checkout/confirmation | /cart         |
      | Query       | channel=retail         | channel=trade |
      | Hash        | complete               | cancelled     |
      | SPA route   | /checkout/confirmation | /cart         |

  # Data layer Flow effective schema assignment 013
  Scenario Outline: Data layer Flow effective schema assignment 013
    Given Retail Purchase Assignment is enabled for Confirmation Page
    When Page resolution encounters <failure>
    Then Assignment selection is blocked with <reason>
    And no effective contract is selected
    And the visible named repair action is <repair_action>

    Examples:
      | failure                                                 | reason                                                                    | repair_action                                           |
      | neither a URL nor normalized Page context from a caller | missing observable Page context for Retail Purchase Assignment            | Provide Page context for Retail Purchase Assignment     |
      | a stable Page reference that no longer resolves         | Retail Purchase Assignment references its missing Page named Confirmation | Select a replacement Page for Retail Purchase Assignment |

  # Data layer Flow effective schema assignment 014
  Scenario: Data layer Flow effective schema assignment 014
    Given Trade Profile authors the rule /customer/type equals business requires /ecommerce/purchase_order_number
    And Trade Purchase has a selected Assignment and valid effective schema
    And a complete Trade Purchase payload satisfies every other effective requirement:
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
    When the selected Assignment validates the payload
    Then exactly one issue reports path /ecommerce/purchase_order_number, code conditional, severity Error, expected present when /customer/type equals business, actual absent, and origin Trade Profile
    And the issue opens the exact Trade Profile conditional rule

  # Data layer Flow effective schema assignment 015
  Scenario: Data layer Flow effective schema assignment 015
    Given Purchase Event allows /ecommerce/currency to be GBP, EUR, or USD
    And Retail Profile narrows /ecommerce/currency to GBP or EUR
    And Retail Purchase occurrence narrows /ecommerce/currency to exact GBP
    When compilation composes those compatible currency constraints for Retail Purchase
    Then its effective /ecommerce/currency constraint is exact GBP without a conflict
    And the effective-schema inspector, validator input, and documentation export each show exactly this ordered provenance for /ecommerce/currency:
      | order | layer      | entity          | authored constraint       | composition decision                    |
      | 1     | Event      | Purchase        | GBP or EUR or USD allowed | introduce GBP or EUR or USD allowed set |
      | 2     | Profile    | Retail          | GBP or EUR allowed        | narrow allowed set to GBP or EUR        |
      | 3     | occurrence | Retail Purchase | exact GBP                 | narrow allowed set to exact GBP         |

  # Data layer Flow effective schema assignment 016
  Scenario Outline: Data layer Flow effective schema assignment 016
    Given Purchase Event declares /tags as an optional array
    And Purchase Event declares <constraint> on scalar array-item path /tags/*
    When compilation includes the Purchase Event array requirements for Retail Purchase
    Then the effective-schema inspector, validator input, and documentation export each contain /tags/* with <constraint> and provenance Purchase Event
    When Retail Purchase Assignment validates array payload <payload>
    Then exactly one issue reports path /tags/0, code <code>, severity Error, expected <expected>, actual <actual>, and provenance Purchase Event requirement /tags/*

    Examples:
      | constraint                          | payload       | code  | expected             | actual    |
      | string type                         | [42]          | type  | string               | 42        |
      | allowed values primary or secondary | ["legacy"]   | enum  | primary or secondary | legacy    |
      | exact value primary                 | ["secondary"] | exact | primary              | secondary |
