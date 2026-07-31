# mutation-stamp: sha256=59366a7dfaa757207121993791a744204bba8e01dffc737397e53590a7da3130
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-31T21:45:37.405402820Z","feature_name":"Data layer project library and active context runtime","feature_path":"features/data-layer-project-library-and-active-context-runtime.feature","background_hash":"15c0d61a5e2321d2d5cf9f766a3caf820e6af8b13c7b5ad796295dbb35ecc091","implementation_hash":"sha256:9eebdcf8250800274dabc9aa143d7963c57400464e1651cdb949ae8d1cbe6f19","scenarios":[{"index":20,"name":"Data layer project library and active context runtime 021","scenario_hash":"49edf536c75575c9b097c4a8acfba93fbab74bc39240b2825757bf0a4c09c09d","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-31T21:45:37.405402820Z"},{"index":10,"name":"Data layer project library and active context runtime 011","scenario_hash":"71bd90ac94e407b3763c8d119049fb242c4b4f8aef7b97cdcf6c7b2d529a57bc","mutation_count":40,"result":{"Total":40,"Killed":40,"Survived":0,"Errors":0},"tested_at":"2026-07-31T20:31:21.371759880Z"},{"index":11,"name":"Data layer project library and active context runtime 012","scenario_hash":"47fea06aa67116e5412215771409fe78b379c3d63fea4541ac5ead35c12a4141","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-31T20:31:21.371759880Z"},{"index":14,"name":"Data layer project library and active context runtime 015","scenario_hash":"34a132d859838d421db79c2957af11a6af9108f5e9039e317682b3fb4abeb4c8","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-24T07:50:01.442285322Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer project library and active context runtime

  Background:
    Given the built extension is running with the production project repository, side panel, and Specification Studio
    And canonical project storage contains
      | stable identity | name           | website             | published revision | draft status |
      | project-retail  | Retail website | retail.example.com  | 3                  | Saved        |
      | project-trade   | Trade portal   | trade.example.com   | 1                  | Saved        |

  # Data layer project library and active context runtime 001
  Scenario: Data layer project library and active context runtime 001
    Given the production Projects projection reads selected identity project-retail
    When actual controls open the Projects side-panel tab
    Then the rendered Active project card identifies Retail website, retail.example.com, Saved Draft, Published revision 3, and last-modified state
    And installed project actions are Open in Specification Studio, Edit details, and Export
    And the searchable production library marks Retail website Active and renders Switch, Edit details, and Export for Trade portal
    And Create project and Import project render as library actions
    And no schema-editor region owns project creation, switching, metadata, import, or export controls

  # Data layer project library and active context runtime 002
  Scenario: Data layer project library and active context runtime 002
    Given the production write queue for project-retail is empty
    When actual controls open Create project
    Then installed Name validation rejects blank text and a case-insensitive library collision before review
    When actual controls enter Agency platform with purpose Client implementation, website agency.example.com, owner Delivery team, and notes Initial discovery
    Then the rendered impact review states that Agency platform will become active while Retail website remains saved
    When the new Agency platform transaction is submitted
    Then canonical storage contains Agency platform under a new project identity with empty project collections
    And the active-project store contains only that new identity
    And serialized project-retail and project-trade bytes remain unchanged
    And the installed next action is Open in Specification Studio

  # Data layer project library and active context runtime 003
  Scenario: Data layer project library and active context runtime 003
    Given the metadata editor reads canonical record project-retail
    When actual metadata controls save Retail data layer with changed purpose, website, owner, and notes
    Then one production metadata command retains project-retail and every contained stable identity
    And installed Projects, active header, Studio title, and deep links render Retail data layer
    And every serialized project entity collection, Saved Draft, and Published revision 3 remain owned by project-retail
    When actual Undo runs once
    Then prior metadata returns without issuing an activation command

  # Data layer project library and active context runtime 004
  Scenario: Data layer project library and active context runtime 004
    Given the context coordinator can safely leave persisted project-retail
    When actual controls request Switch to Trade portal
    Then the installed review names both project identities and every project-bound surface that will change
    When selection storage changes from project-retail to project-trade through the review
    Then active-project persistence contains only project-trade
    And production Shared Profiles, Page Groups, Pages, Events, Applicability, Flows, Test cases, Assignments, documentation, and Studio projections contain no Retail website record
    And serialized project-retail remains saved and inactive

  # Data layer project library and active context runtime 005
  Scenario: Data layer project library and active context runtime 005
    Given project-retail Draft token draft-retail-14 has a production stale property command awaiting resolution
    When actual controls request Switch to Trade portal
    Then active-project persistence remains project-retail and no project-trade subscription is established
    And the installed conflict flow offers merge, reject, or retry for the exact command without deleting Retail website Draft bytes
    When actual controls resolve Draft token draft-retail-15 and retry switching
    Then project-trade becomes active and the stored project-retail Draft is unchanged
    And project-retail Published revision 3 has not advanced

  # Data layer project library and active context runtime 006
  Scenario: Data layer project library and active context runtime 006
    Given the production selection record has no project ID
    When actual controls open any project-bound collection or documentation tab
    Then the installed surface renders No active project, Open project, and Create project
    And no project ID is inferred from storage order, recency, or result count
    And actual Saved Schema Library controls remain usable without an active-project write

  # Data layer project library and active context runtime 007
  Scenario: Data layer project library and active context runtime 007
    Given the installed Active project card represents project-retail
    When the project card launches Specification Studio
    Then the installed Studio route and title identify project-retail and Retail website at Project overview
    And no schema selection owns or substitutes for the project workspace
    And the schema editor DOM contains no Open specification builder project-launch control
    When the Sitewide row invokes its Studio deep link
    Then the same project-retail Studio instance resolves Sitewide and retains project navigation

  # Data layer project library and active context runtime 008
  Scenario: Data layer project library and active context runtime 008
    Given persisted navigation stores project-retail Page Cart and project-trade Flow Trade checkout
    When actual controls switch to project-trade and back to project-retail
    Then each installed workspace restores its project-scoped location without cross-project entity lookup
    When a production deep link targets project-trade Event Purchase while project-retail is active
    Then installed navigation names Trade portal and waits for context confirmation
    When consent permits the deferred Trade portal route
    Then active-project persistence changes before Event Purchase resolves within project-trade

  # Data layer project library and active context runtime 009
  Scenario: Data layer project library and active context runtime 009
    Given production Saved Schema Library contains immutable Purchase revision 4 and active-project state is absent
    When actual controls activate Add to project for Purchase
    Then the installed picker renders Retail website and Trade portal without changing either serialized project
    When actual controls choose Trade portal and confirm switching plus adoption
    Then project-trade becomes active with one project-owned Purchase Draft carrying revision 4 source lineage
    And canonical project-retail bytes contain no Purchase addition
    And the Saved Schema Library Purchase bytes remain unchanged

  # Data layer project library and active context runtime 010
  Scenario: Data layer project library and active context runtime 010
    Given production project-retail is active and the installed Projects tab is 360 pixels wide
    When actual keyboard events search Trade portal, inspect metadata, and invoke its switch action
    Then one measured vertical scroll owner contains the active card, result, and contextual actions without horizontal page overflow
    And accessible names for repeated controls contain their project names
    And production focus enters the review, reaches confirm and cancel, and returns to Trade portal after confirmation
    And active-project header rendering does not focus another tab

  # Data layer project library and active context runtime 011
  Scenario Outline: Data layer project library and active context runtime 011
    Given production project-retail is active and the installed Inspector is closed
    And the production <overview> collection contains <entity>
    When actual project navigation opens <overview>
    Then the rendered main workspace identifies <overview> and exposes <add action> as its contextual primary action
    And the rendered <entity> row exposes Open <entity> and Remove <entity>
    And installed Add, Open, and Remove controls remain operable while the Inspector pane is closed
    When production pointer input invokes <add action>
    Then the installed project-scoped <creation page> replaces the collection workspace
    And rendered guidance explains purpose, prerequisites, and Used by relationships before type-specific fields
    And Cancel plus Create <singular> render without a generic entity-kind selector

    Examples:
      | overview        | entity            | add action                | creation page                    | singular          |
      | Shared Profiles | Sitewide          | Add Shared Profile        | Create Shared Profile            | Shared Profile    |
      | Page Groups     | Checkout          | Add Page Group            | Create Page Group                | Page Group        |
      | Pages           | Cart              | Add Page                  | Create Page                      | Page              |
      | Events          | Purchase          | Add Event                 | Create Event                     | Event             |
      | Applicability   | Retail checkout   | Add Applicability Set     | Create Applicability Set         | Applicability Set |
      | Flows           | Checkout journey  | Add Flow                  | Create Flow                      | Flow              |
      | Test cases      | Valid purchase    | Add Test case             | Create Test case                 | Test case         |
      | Assignments     | Retail Purchase   | Add Assignment            | Create Assignment                | Assignment        |

  # Data layer project library and active context runtime 012
  Scenario Outline: Data layer project library and active context runtime 012
    Given production project-retail is active and <overview> has zero records
    When actual controls open <overview> with the installed Inspector closed
    Then the rendered empty state explains <purpose>
    And it renders one example, prerequisites, consumers, and <add action>
    When Enter invokes <add action> from the empty state
    Then the same production creation route used by a populated overview opens in the main workspace
    And document focus moves to its heading without mounting or focusing the Inspector

    Examples:
      | overview        | add action                | purpose                                               |
      | Shared Profiles | Add Shared Profile        | reusable schema rules and documentation               |
      | Page Groups     | Add Page Group            | shared Page context and inherited requirements         |
      | Pages           | Add Page                  | observable Page context and specific requirements      |
      | Events          | Add Event                 | reusable interaction schema and documentation           |
      | Applicability   | Add Applicability Set     | named observation matching and assignment eligibility |
      | Flows           | Add Flow                  | documentary journey topology                           |
      | Test cases      | Add Test case             | saved input plus reviewed expectations rerunnable against the current Draft |
      | Assignments     | Add Assignment            | production schema selection for matching observations  |

  # Data layer project library and active context runtime 013
  Scenario: Data layer project library and active context runtime 013
    Given production Pages contain Cart and unreferenced Landing
    When the installed Landing row invokes its removal review
    Then the installed main-workspace impact review renders Landing, one Page removal, zero dependent references, and Draft consequences
    And Cancel removal and Remove Landing are operable while the Inspector is absent
    When the installed confirmation commits Landing deletion
    Then one production command removes only Landing's stable Page ID
    And rendered feedback names Landing, Draft status, stale evidence, and one Undo action
    And focus returns to the Cart row in the installed Pages overview
    When actual Undo runs once
    Then production Landing returns under its original ID and focus returns to its row

  # Data layer project library and active context runtime 014
  Scenario: Data layer project library and active context runtime 014
    Given production Purchase Event is referenced by Checkout journey, Retail Purchase assignment, and Valid purchase fixture
    When the production Purchase row requests deletion
    Then the installed review renders all three human dependent names and relationship descriptions
    And confirmation is disabled with Open Checkout journey, Open Retail Purchase, and Open Valid purchase controls
    And serialized Event, Flow, Assignment, Test case, revision, and evidence bytes remain identical
    When actual controls remove every dependency through its production workspace and return
    Then Remove Purchase is enabled without any implicit dependent deletion

  # Data layer project library and active context runtime 015
  Scenario Outline: Data layer project library and active context runtime 015
    Given the production Pages overview at 360 CSS pixels contains <ordered Pages>
    And actual keyboard focus is on Remove <removed Page> while the Inspector is absent
    When production keyboard events complete the safe removal
    Then computed overview, review, and result bounds share one vertical scrolling region and fit the 360 CSS pixel viewport
    And accessible names for every repeated Open and Remove control contain the owning Page name
    And production focus returns to <focus target>

    Examples:
      | ordered Pages        | removed Page | focus target |
      | Alpha, Landing, Cart | Landing      | Cart         |
      | Alpha, Landing       | Landing      | Alpha        |
      | Landing              | Landing      | Add Page     |

  # Data layer project library and active context runtime 016
  Scenario: Data layer project library and active context runtime 016
    Given canonical project-retail collections are all empty
    And production layout starts without the Inspector pane
    When actual overview and main-workspace controls create
      | overview        | entity             |
      | Shared Profiles | Sitewide           |
      | Page Groups     | Checkout           |
      | Pages           | Cart               |
      | Events          | Purchase           |
      | Applicability   | Retail checkout    |
      | Flows           | Checkout journey   |
      | Assignments     | Retail Purchase    |
      | Test cases      | Valid purchase     |
    And the built Specification Studio reloads
    Then each installed overview restores exactly its created row with Open and Remove controls
    And each row opens its dedicated project-scoped workspace
    And the production Inspector DOM contains no generic Add entity form, entity-kind selector, or exclusive removal action
    And the installed Studio and serialized project contain no Schemas overview, Add Schema route, or schemaDrafts collection
    And canonical project-retail storage owns every created stable ID and reference exactly once

  # Data layer project library and active context runtime 017
  Scenario: Data layer project library and active context runtime 017
    Given production project-retail is active and its Pages and Events routes are available
    When actual controls open Add Page
    Then installed Create Page describes context-setting event semantics and requires Observed event name
    And rendered controls require no Events-catalog reference, nested occurrence, or role selector
    When actual controls create Cart with pageview
    And create Button click from Add Event with button_click
    Then production Pages stores Cart as context-setting pageview
    And production Events stores Button click as interaction button_click
    And serialized entities contain no role, context binding, or copied schema

  # Data layer project library and active context runtime 018
  Scenario: Data layer project library and active context runtime 018
    Given production Checkout journey owns Payment Page frames and nested interaction Event instances
    And no production Test case, Assignment, or other entity references Checkout journey
    When actual controls open and confirm Remove Checkout journey from the Flows overview
    Then the installed review treats the complete Flow topology as owned removal content rather than a dependency or Open action
    And one production command removes the Flow record and its exact documentation Flow graph
    And the installed Payment removal review contains neither a deleted-Flow dependency nor an Open Checkout journey control
    When another installed surface restores the deleted Flow route
    Then production navigation falls back to the Flows overview with no uncaught exception
    And hashes for unrelated entities and Published revision 3 remain unchanged
    When actual Undo runs once
    Then production restores the same Flow ID and byte-identical Flow graph

  # Data layer project library and active context runtime 019
  Scenario: Data layer project library and active context runtime 019
    Given production Checkout Page Group bytes contain obsolete environment and matcher properties
    When actual controls open the installed Add Page Group route
    Then its creation form renders one optional Description textarea with associated purpose guidance
    And DOM inspection finds no Environment or Membership matcher control
    When actual controls create Regional checkout with description Checkout Pages used by the regional storefronts
    Then repository bytes and the dedicated workspace contain that plain-text description
    When actual controls edit Checkout, save description Shared checkout requirements, and reload
    Then repository bytes and the dedicated workspace contain the new description without environment or matcher properties
    And hashes for Page memberships, effective schemas, Applicability Sets, and Flow graphs remain unchanged
    When production portability exports and imports the project
    Then both description values survive exactly and no production matcher reads either value

  # Data layer project library and active context runtime 020
  Scenario: Data layer project library and active context runtime 020
    Given production Cart bytes contain obsolete environment, host, query, hash, spa, expectedEventIds, and applicabilitySetId properties
    When actual controls open the installed Cart Page details
    Then the form renders Name, optional Description, required Page-view event name, and optional Exact URL path with associated guidance
    And DOM inspection finds none of the obsolete controls
    And Save Page details is the only form commit control
    And DOM inspection finds no Duplicate or Generate Page specification documentation action
    When actual controls save description Checkout basket and Page-view event name pageview
    Then repository bytes and the reloaded workspace contain trimmed Page details without any obsolete property
    And hashes for Cart identity, memberships, inheritance recipes, local schema, Flow graphs, and documentation configuration remain unchanged

  # Data layer project library and active context runtime 021
  Scenario Outline: Data layer project library and active context runtime 021
    Given production Cart has pathname /checkout/cart
    When the installed Test URL control receives <url>
    Then its non-persistent recognition result is <result>
    And project repository bytes remain identical

    Examples:
      | url                                      | result                                |
      | https://shop.example/checkout/cart?x=1#y | matches exact pathname /checkout/cart |
      | https://other.example/checkout/cart      | matches exact pathname /checkout/cart |
      | https://shop.example/checkout/cart/      | does not match /checkout/cart         |
      | checkout/cart                            | Enter a full URL                       |

  # Data layer project library and active context runtime 022
  Scenario: Data layer project library and active context runtime 022
    Given production Cart can inherit Sitewide and has ordered Page Group memberships
    When actual controls open its installed workspace
    Then landmark inspection finds Page details, Page recognition, Inherited schema, and Effective and local schema regions
    And exactly one visible Add to Page Group action opens production membership search without an adjacent duplicate menu command
    And every membership row retains Open Page Group, Move earlier, Move later, and Remove controls
    And Add Shared Profile mounts the production selective-inheritance recipe while no raw profileIds multi-select exists
    And applicability controls are adjacent to the effective-schema preview and described as Preview only — not saved
    When actual navigation leaves Cart and returns
    Then every transient applicability control is checked and durable Page bytes remain unchanged
    And the Page workspace contains no local documentation generator
