Feature: Data layer project library and active context

  Background:
    Given the project library contains
      | stable identity | name           | website             | published revision | draft status |
      | project-retail  | Retail website | retail.example.com  | 3                  | Saved        |
      | project-trade   | Trade portal   | trade.example.com   | 1                  | Saved        |

  # Data layer project library and active context 001
  Scenario: Data layer project library and active context 001
    Given the Projects projection marks Retail website Active
    When the operator opens the Projects side-panel tab
    Then an Active project card identifies Retail website, retail.example.com, Saved Draft, Published revision 3, and last-modified state
    And project-level actions are Open in Specification Studio, Edit details, and Export
    And the searchable Project library marks Retail website Active and offers Switch, Edit details, and Export for Trade portal
    And Create project and Import project are contextual library actions
    And project creation, switching, metadata, import, and export are not presented as schema actions

  # Data layer project library and active context 002
  Scenario: Data layer project library and active context 002
    Given all repository writes for project-retail have settled
    When the operator opens Create project
    Then Name rejects blank text and a case-insensitive existing project name before creation review
    When the operator enters Agency platform with purpose Client implementation, website agency.example.com, owner Delivery team, and notes Initial discovery
    Then impact review states that Agency platform will become active while Retail website remains saved
    When Create project review is accepted
    Then Agency platform is stored with a new stable project identity and an empty canonical project graph
    And Agency platform is the only active project
    And Retail website and Trade portal remain unchanged in the library
    And Open in Specification Studio is the recommended next action

  # Data layer project library and active context 003
  Scenario: Data layer project library and active context 003
    Given the metadata form loads canonical project-retail
    When the operator changes its name to Retail data layer and updates purpose, website, owner, and notes
    Then one project-metadata command preserves project-retail and every project-owned entity identity
    And the Projects tab, active-project header, Specification Studio, and deep links display Retail data layer
    And every project entity collection, Saved Draft, and Published revision 3 remain associated with project-retail
    And one Undo restores the previous metadata without changing project context

  # Data layer project library and active context 004
  Scenario: Data layer project library and active context 004
    Given the context coordinator can safely leave saved project-retail
    When the operator requests Switch to Trade portal
    Then the consequence review names the current and target projects and every project-bound surface that will change
    When the operator authorizes replacement of project-retail by project-trade
    Then project-trade is the sole active project identity
    And Shared Profiles, Page Groups, Pages, Events, Applicability, Flows, Fixtures, Assignments, documentation, and Specification Studio show only Trade portal records
    And Retail website remains saved without becoming a second active context

  # Data layer project library and active context 005
  Scenario: Data layer project library and active context 005
    Given Retail website Draft token draft-retail-14 has an unresolved stale property command
    When the operator requests Switch to Trade portal
    Then the active identity remains project-retail and the switch is blocked before any Trade portal subscription starts
    And the exact pending command offers merge, reject, or retry without discarding the Retail website Draft
    When the operator resolves the command with Draft token draft-retail-15 and retries the switch
    Then Trade portal becomes active and the saved Retail website Draft remains available unchanged
    And Retail website Published revision 3 has not advanced

  # Data layer project library and active context 006
  Scenario: Data layer project library and active context 006
    Given no selection record exists for project context
    When the operator opens any project-bound collection or documentation tab
    Then the surface states No active project and offers Open project and Create project
    And no library entry is selected implicitly because it is first, recent, or the only result
    And the global Saved Schema Library remains available without inventing a project context

  # Data layer project library and active context 007
  Scenario: Data layer project library and active context 007
    Given the Active project card represents project-retail
    When the operator activates Open in Specification Studio from the project card or active-project header
    Then Specification Studio opens project-retail at its Project overview with Retail website in the title and route
    And no schema is implicitly selected as the owner of the workspace
    And the schema editor does not present Open specification builder as a schema-level launch action
    When the operator activates Open schema in Specification Studio for Sitewide
    Then the same project-retail workspace deep-links to Sitewide while retaining project-level navigation

  # Data layer project library and active context 008
  Scenario: Data layer project library and active context 008
    Given the last locations are Retail website Page Cart and Trade portal Flow Trade checkout
    When the operator switches to Trade portal and later switches back to Retail website
    Then each project restores its own last valid location without resolving an entity from the other project
    When a deep link targets Trade portal Event Purchase while Retail website is active
    Then the interface names Trade portal and the active-context consequence before navigation
    When the deep-link context change proceeds
    Then Trade portal becomes active before Event Purchase is resolved by its stable project-scoped reference

  # Data layer project library and active context 009
  Scenario: Data layer project library and active context 009
    Given the global Saved Schema Library contains Purchase revision 4 and no project is active
    When the operator activates Add to project for Purchase
    Then the project picker lists Retail website and Trade portal without adopting into either project
    When the operator chooses Trade portal and confirms the context switch and adoption
    Then Trade portal becomes active and owns one canonical Purchase Draft with source revision 4 lineage
    And Retail website has no new Purchase contribution
    And the global Purchase revision 4 remains unchanged

  # Data layer project library and active context 010
  Scenario: Data layer project library and active context 010
    Given Retail website is active and the Projects tab is displayed at 360 pixels
    When the operator uses keyboard navigation to search for Trade portal, inspect its metadata, and switch to it
    Then one vertical scroll owner keeps the active card, result, and contextual actions reachable without horizontal page scrolling
    And every repeated project action has an accessible name containing its project name
    And focus enters the switch review, reaches confirmation and cancellation, and returns to Trade portal after confirmation
    And the active-project header updates without moving focus into another side-panel tab

  # Data layer project library and active context 011
  Scenario Outline: Data layer project library and active context 011
    Given Retail website is active and the Inspector is closed
    And the <overview> overview contains <entity>
    When project navigation selects <overview>
    Then the main workspace identifies <overview> and exposes <add action> as its contextual primary action
    And the <entity> row exposes Open <entity> and Remove <entity>
    And no Add, Open, or Remove capability requires the Inspector
    When the operator activates <add action>
    Then a project-scoped <creation page> opens in the main workspace
    And it explains the entity purpose, prerequisites, and Used by relationships before its type-specific fields
    And Cancel and Create <singular> are available without a generic entity-kind selector

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

  # Data layer project library and active context 012
  Scenario Outline: Data layer project library and active context 012
    Given Retail website is active and <overview> contains no entities
    When the operator opens <overview> with the Inspector closed
    Then a guided empty state explains <purpose>
    And it gives one example, names its prerequisites and consumers, and exposes <add action>
    When keyboard controls activate <add action>
    Then the same main-workspace creation page used by a populated overview opens
    And focus moves to its heading without opening or focusing the Inspector

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

  # Data layer project library and active context 013
  Scenario: Data layer project library and active context 013
    Given the Pages overview contains Cart and unreferenced Landing
    When Remove Landing is invoked from its overview row
    Then an impact review in the main workspace names Landing, one Page removal, zero dependent references, and Draft consequences
    And Cancel removal and Remove Landing are available while the Inspector remains closed
    When the operator confirms Remove Landing
    Then one canonical command removes only Landing's stable Page identity
    And feedback names Landing, Draft status, stale evidence, and one Undo action
    And focus returns to Cart in the Pages overview
    When the operator invokes Undo once
    Then Landing returns with its original stable identity and focus returns to Landing

  # Data layer project library and active context 014
  Scenario: Data layer project library and active context 014
    Given Purchase Event is referenced by Checkout journey, Retail Purchase assignment, and Valid purchase fixture
    When deletion is requested for Purchase from the Events overview
    Then the removal review names all three dependent entities and their relationship to Purchase
    And confirmation is blocked with Open Checkout journey, Open Retail Purchase, and Open Valid purchase repair actions
    And no Event, Flow, Assignment, Fixture, Saved Draft, Published revision, or evidence state changes
    When the operator removes every dependency through its named workspace and returns to the review
    Then Remove Purchase becomes available without silently deleting another entity

  # Data layer project library and active context 015
  Scenario Outline: Data layer project library and active context 015
    Given the Pages overview at 360 pixels contains <ordered Pages>
    And keyboard focus is on Remove <removed Page> while the Inspector is closed
    When the operator completes the safe removal using only keyboard controls
    Then computed 360px geometry keeps the overview, impact review, and result within one vertical scrolling region and the viewport width
    And accessible-name inspection identifies the owning Page on every repeated row action
    And focus returns to <focus target>

    Examples:
      | ordered Pages        | removed Page | focus target |
      | Alpha, Landing, Cart | Landing      | Cart         |
      | Alpha, Landing       | Landing      | Alpha        |
      | Landing              | Landing      | Add Page     |

  # Data layer project library and active context 016
  Scenario: Data layer project library and active context 016
    Given Retail website has empty project collections and its Inspector is closed
    When the operator uses only collection overviews and main-workspace creation pages to create
      | overview        | entity             |
      | Shared Profiles | Sitewide           |
      | Page Groups     | Checkout           |
      | Pages           | Cart               |
      | Events          | Purchase           |
      | Applicability   | Retail checkout    |
      | Flows           | Checkout journey   |
      | Assignments     | Retail Purchase    |
      | Fixtures        | Valid purchase     |
    And the operator reloads Specification Studio
    Then every overview restores exactly its created row with Open and Remove actions
    And each row opens its dedicated project-scoped workspace
    And the contextual Inspector contains no generic Add entity form, entity-kind selector, or exclusive removal action
    And no Schemas overview, Add Schema route, or schemaDrafts collection exists
    And one canonical project graph owns every created stable identity and reference

  # Data layer project library and active context 017
  Scenario: Data layer project library and active context 017
    Given Retail website is active and Pages and Events overviews are openable
    When the operator opens Add Page
    Then Create Page identifies a Page as a context-setting event and requires its observed event name
    And no Events-catalog choice, nested occurrence, or documentary role is required
    When the operator creates Cart with observed event name pageview
    And creates Button click from Add Event with observed event name button_click
    Then Pages contains Cart identified as context-setting pageview
    And Events contains Button click identified as interaction button_click
    And neither canonical entity stores a role selector, Page-context binding, or duplicate schema
