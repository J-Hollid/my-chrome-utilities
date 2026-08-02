# mutation-stamp: sha256=70adbafb7b996805f40cd7403bbb409ab083bec6a64ca6898658b41201ee6ec0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-02T23:49:19.080923058Z","feature_name":"Data layer Property Set and Flow Section separation","feature_path":"features/data-layer-property-set-and-flow-section-separation.feature","background_hash":"b742eab3559af9096c1382c8922a7e6be96f35cd0c32dde92bb6f5bb9fb24176","implementation_hash":"sha256:54f8f94544530ee3f02a4433fd9497a626b916c59798f352bbf2ee1925125550","scenarios":[{"index":2,"name":"Data layer Property Set and Flow Section separation 003","scenario_hash":"fcb8b5e6763abcd8e63b2b4b5042e9cb978ab9ab307771c8daa994467e105848","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-08-02T22:33:43.080672091Z"},{"index":7,"name":"Data layer Property Set and Flow Section separation 008","scenario_hash":"a98a87739138823d905034db593b4af246e4beb5896385168892a50bda504c80","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-02T22:33:43.080672091Z"},{"index":10,"name":"Data layer Property Set and Flow Section separation 011","scenario_hash":"50679bfe9192c1a2dc25809c73df45a01c17dd8cf876c46de0bdba03164d1144","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-08-02T22:33:43.080672091Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Property Set and Flow Section separation

  Background:
    Given Shop contains Shared Profiles Sitewide and Commerce
    And Property Sets Checkout base and Retail commerce have canonical properties and Shared Profile sources
    And Pages Cart and Product detail apply those Property Sets
    And Flow Checkout journey contains Cart and Product detail Page instances

  # Data layer Property Set and Flow Section separation 001
  Scenario: Data layer Property Set and Flow Section separation 001
    When the operator opens the project collections
    Then Property Sets is a top-level collection with Add Property Set, Open, and guarded Remove actions
    And Flow Sections exist only inside their owning Flow canvas
    And Page Groups is absent from project navigation, creation, search, Assignment kinds, and schema categories
    When the operator opens Checkout base
    Then its workspace shows details, Shared Profile sources, its canonical schema, and Pages using it
    And it exposes no Flow lane, Section, or canvas-placement setting

  # Data layer Property Set and Flow Section separation 002
  Scenario: Data layer Property Set and Flow Section separation 002
    When the operator opens Cart
    Then Property composition shows its applied Property Sets in general-to-specific order
    And each application identifies its Property Set, applicability, effective contribution, and provenance
    And the operator can search, add, reorder, remove, and open a Property Set
    And the interface never says that Cart belongs to a Property Set
    And Shared Profile inheritance remains separately identified as selective source inheritance

  # Data layer Property Set and Flow Section separation 003
  Scenario Outline: Data layer Property Set and Flow Section separation 003
    Given Checkout base and Retail commerce define different ordinary values for funnel_step
    When the operator sets Cart Property composition order to <ordered sets>
    Then <winner> supplies effective funnel_step <effective value>
    And <superseded> remains visible as superseded provenance
    And impact review names funnel_step and both Property Sets before commit
    And one confirmed command changes only Cart's application order
    And invariant or structurally incompatible definitions remain blocked

    Examples:
      | ordered sets                        | winner          | effective value | superseded      |
      | Checkout base then Retail commerce  | Retail commerce | retail          | Checkout base   |
      | Retail commerce then Checkout base  | Checkout base   | checkout        | Retail commerce |

  # Data layer Property Set and Flow Section separation 004
  Scenario: Data layer Property Set and Flow Section separation 004
    Given Retail commerce is unconditional on Cart and uses Retail customers on Product detail
    When a Product detail applicability preview excludes Retail customers
    Then Retail commerce is absent only from the Product detail preview
    And Cart continues to include Retail commerce
    And Retail commerce, Retail customers, and both Page application records remain unchanged
    When a matching Product detail Fixture is evaluated
    Then the Product detail application participates through Retail customers
    And applicability evaluation does not compete with Cart or another Page application

  # Data layer Property Set and Flow Section separation 005
  Scenario: Data layer Property Set and Flow Section separation 005
    Given Cart applies Checkout base and has a local Description facet for checkout_type
    When Checkout base changes checkout_type Description and adds checkout_version
    Then Cart keeps its local checkout_type Description
    And Cart receives checkout_version through the live Property Set application
    And another applying Page without a local Description receives the changed checkout_type Description
    When Commerce adds a property not selected by Checkout base
    Then that property remains a Checkout base Parent addition until explicitly included
    And no Page receives it through Checkout base before that inclusion

  # Data layer Property Set and Flow Section separation 006
  Scenario: Data layer Property Set and Flow Section separation 006
    Given Assignment Retail checkout targets Checkout base
    When the operator reviews Assignments and the side-panel Schema tree
    Then Retail checkout identifies Checkout base as a Property Set target by stable identity
    And Property Sets contains Checkout base with Cart and Product detail references
    And Pages contains one canonical row for each Page
    And Flow Sections are absent from the Schema tree and appear only on their owning Flow canvas and outline
    And no Flow Section is offered as an Assignment target or schema contributor

  # Data layer Property Set and Flow Section separation 007
  Scenario: Data layer Property Set and Flow Section separation 007
    Given Checkout journey contains no Sections
    When the operator creates named Section Checkout phase on the canvas
    And places Cart and Product detail inside it
    Then Checkout phase stores one Flow-owned identity, name, bounds, and presentation order
    And both Page frames store that Section identity with their own stable frame identities and relative positions
    And Pages without a shared Property Set are equally eligible for Checkout phase
    And relationships may connect Page frames inside and outside Checkout phase
    And no Property Set catalog or lane-order control appears in the Flow workspace

  # Data layer Property Set and Flow Section separation 008
  Scenario Outline: Data layer Property Set and Flow Section separation 008
    Given Cart has unchanged Property composition and effective schema
    When the operator <section action>
    Then Cart retains the same Property Set applications, application order, applicability, effective schema, and provenance
    And Assignment targets and schema production identities remain unchanged
    And only Flow presentation records change in one undoable command

    Examples:
      | section action                                      |
      | moves Cart from Checkout phase to Review phase      |
      | moves Cart outside every Section                    |
      | moves Checkout phase with its contained Page frames |
      | resizes and renames Checkout phase                  |

  # Data layer Property Set and Flow Section separation 009
  Scenario: Data layer Property Set and Flow Section separation 009
    Given Checkout phase contains Cart and Product detail
    When the operator removes Checkout phase with the default action
    Then the Section is removed and both Page frames remain at their canvas positions without a Section
    And their Events and relationships remain unchanged
    When the operator reviews removing Review phase together with its contents
    Then the review names every Page frame and relationship that would be removed
    And nothing is removed until the destructive action is confirmed
    And either completed removal offers one Undo action

  # Data layer Property Set and Flow Section separation 010
  Scenario: Data layer Property Set and Flow Section separation 010
    Given a saved legacy project uses Page Groups as Page schema layers, Assignment targets, Flow lanes, and Page-frame placement
    When the project is upgraded
    Then each Page Group becomes one Property Set with the same contributor identity and complete schema content
    And each Page membership becomes an ordered Property Set application with its prior applicability
    And each Flow lane becomes a new Flow-owned Section with its human name and presentation
    And Page-frame, occurrence, relationship, Page, Event, Assignment, and Property Set identities remain stable
    And Page Group Assignment targets become Property Set targets
    And effective schemas and Flow topology remain equivalent
    And verified storage contains no second Page Group model
    When the upgraded project is exported and imported again
    Then the separated model and all stable references round-trip without another migration

  # Data layer Property Set and Flow Section separation 011
  Scenario Outline: Data layer Property Set and Flow Section separation 011
    Given Property composition and a Flow with two Sections are open at <viewport width> CSS pixels
    When the operator uses keyboard and pointer controls to apply a Property Set and organize Page frames
    Then each control has an unambiguous accessible name and visible focus
    And Property Set search, application actions, Section actions, and contained Page frames remain reachable
    And one vertical workspace scroll owner prevents horizontal document overflow
    And reopening each workspace restores the current application order, Section bounds, selection, and invoking focus

    Examples:
      | viewport width |
      | 360            |
      | 1440           |
