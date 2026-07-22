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
    And production Shared Profiles, Page Groups, Pages, Events, Applicability, Flows, Fixtures, Assignments, documentation, and Studio projections contain no Retail website record
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
      | Fixtures        | Valid purchase    | Add Fixture               | Create Fixture                   | Fixture           |
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
      | Fixtures        | Add Fixture               | saved per-Event validation evidence                    |
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
    And serialized Event, Flow, Assignment, Fixture, revision, and evidence bytes remain identical
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
      | Fixtures        | Valid purchase     |
    And the built Specification Studio reloads
    Then each installed overview restores exactly its created row with Open and Remove controls
    And each row opens its dedicated project-scoped workspace
    And the production Inspector DOM contains no generic Add entity form, entity-kind selector, or exclusive removal action
    And the installed Studio and serialized project contain no Schemas overview, Add Schema route, or schemaDrafts collection
    And canonical project-retail storage owns every created stable ID and reference exactly once
