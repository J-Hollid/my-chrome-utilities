Feature: Data layer project library and active context

  Background:
    Given the project library contains
      | stable identity | name           | website             | draft revision |
      | project-retail  | Retail website | retail.example.com  | 14             |
      | project-trade   | Trade portal   | trade.example.com   | 7              |

  # Data layer project library and active context 001
  Scenario: Data layer project library and active context 001
    Given the Projects projection marks Retail website Active
    When the operator opens the Projects side-panel tab
    Then an Active project card identifies Retail website, retail.example.com, Draft revision 14, and last-modified state
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
    And its schemas, Pages, Page Groups, Events, Flows, assignments, and Draft revision remain associated with project-retail
    And one Undo restores the previous metadata without changing project context

  # Data layer project library and active context 004
  Scenario: Data layer project library and active context 004
    Given the context coordinator can safely leave saved project-retail
    When the operator requests Switch to Trade portal
    Then the consequence review names the current and target projects and every project-bound surface that will change
    When the operator authorizes replacement of project-retail by project-trade
    Then project-trade is the sole active project identity
    And Schema, Pages, Page Groups, Events, Flows, documentation, and Specification Studio show only Trade portal records
    And Retail website remains saved without becoming a second active context

  # Data layer project library and active context 005
  Scenario: Data layer project library and active context 005
    Given Retail website revision 14 has an unresolved stale property command
    When the operator requests Switch to Trade portal
    Then the active identity remains project-retail and the switch is blocked before any Trade portal subscription starts
    And the exact pending command offers merge, reject, or retry without discarding the Retail website Draft
    When the operator resolves the command as Retail website revision 15 and retries the switch
    Then Trade portal becomes active and Retail website revision 15 remains available unchanged

  # Data layer project library and active context 006
  Scenario: Data layer project library and active context 006
    Given no selection record exists for project context
    When the operator opens a project-bound Schema, Page, Event, Flow, or documentation tab
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
