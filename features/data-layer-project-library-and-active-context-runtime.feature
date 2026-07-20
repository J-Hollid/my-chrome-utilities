Feature: Data layer project library and active context runtime

  Background:
    Given the built extension is running with the production project repository, side panel, and Specification Studio
    And canonical project storage contains
      | stable identity | name           | website             | draft revision |
      | project-retail  | Retail website | retail.example.com  | 14             |
      | project-trade   | Trade portal   | trade.example.com   | 7              |

  # Data layer project library and active context runtime 001
  Scenario: Data layer project library and active context runtime 001
    Given the production Projects projection reads selected identity project-retail
    When actual controls open the Projects side-panel tab
    Then the rendered Active project card identifies Retail website, retail.example.com, Draft revision 14, and last-modified state
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
    And serialized schemas, Pages, Page Groups, Events, Flows, assignments, and Draft revision remain owned by project-retail
    When actual Undo runs once
    Then prior metadata returns without issuing an activation command

  # Data layer project library and active context runtime 004
  Scenario: Data layer project library and active context runtime 004
    Given the context coordinator can safely leave persisted project-retail
    When actual controls request Switch to Trade portal
    Then the installed review names both project identities and every project-bound surface that will change
    When selection storage changes from project-retail to project-trade through the review
    Then active-project persistence contains only project-trade
    And production Schema, Pages, Page Groups, Events, Flows, documentation, and Studio projections contain no Retail website record
    And serialized project-retail remains saved and inactive

  # Data layer project library and active context runtime 005
  Scenario: Data layer project library and active context runtime 005
    Given project-retail revision 14 has a production stale property command awaiting resolution
    When actual controls request Switch to Trade portal
    Then active-project persistence remains project-retail and no project-trade subscription is established
    And the installed conflict flow offers merge, reject, or retry for the exact command without deleting Retail website Draft bytes
    When actual controls resolve revision 15 and retry switching
    Then project-trade becomes active and stored project-retail revision 15 is unchanged

  # Data layer project library and active context runtime 006
  Scenario: Data layer project library and active context runtime 006
    Given the production selection record has no project ID
    When actual controls open a project-bound Schema, Page, Event, Flow, or documentation tab
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
