# mutation-stamp: sha256=e506eb2c6f144c33bb72173db14cdb192b510ccbf10b4bb43df57cadc1ae6f41
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T20:30:20.970470757Z","feature_name":"Data layer canonical project schema drafts runtime","feature_path":"features/data-layer-canonical-project-schema-drafts-runtime.feature","background_hash":"09a943a0763d3b71e2e8978940adbd4082293833182f317c13b4fb12f5d74514","implementation_hash":"sha256:5464c2706d5b6afc23434a504b1950ee50e7e10be7f04805d485ae1674c6d199","scenarios":[{"index":16,"name":"Data layer canonical project schema drafts runtime 017","scenario_hash":"b01fe7ff31eb082f40f42f7ac0413102412f58d40433fa3a9b3b8391c596880e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-18T20:14:32.708740479Z"},{"index":18,"name":"Data layer canonical project schema drafts runtime 019","scenario_hash":"ff12cfd2b48ca017381bad0b0a16d66f4d514ea395625820e97228b4fca631e8","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-18T20:14:32.708740479Z"},{"index":14,"name":"Data layer canonical project schema drafts runtime 015","scenario_hash":"b2f997ae9b287efc8e3cc840fe6676e9782dd308ef43f134cc94cd9eb2133d15","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:34:25.128847783Z"}]}
# acceptance-mutation-manifest-end

# MVP scope notice: production revision and concurrency guarantees remain; Flow commands target nodes and documentary relationships rather than temporal state.
Feature: Data layer canonical project schema drafts runtime

  Background:
    Given the built unpacked extension is running in an isolated Chrome QA profile
    And a blank Specification Project was created through rendered controls
    And the test has not written project or schema state directly

  # Data layer canonical project schema drafts runtime 001
  Scenario: Data layer canonical project schema drafts runtime 001
    When the operator adds /ecommerce/transaction_id in the rendered side-panel schema editor
    And renames an unrelated Page in the rendered full-page editor
    Then both rendered surfaces show the property and Page name without reload
    And persisted browser state contains one canonical schema document with both changes

  # Data layer canonical project schema drafts runtime 002
  Scenario: Data layer canonical project schema drafts runtime 002
    When the operator adds /account_id in the rendered full-page schema editor
    And edits its documentation in the rendered side-panel editor
    Then both surfaces show one newer shared revision and both edits
    And no library refresh or one-way synchronization action is required

  # Data layer canonical project schema drafts runtime 003
  Scenario: Data layer canonical project schema drafts runtime 003
    Given two actual extension pages have opened the same project revision
    When one page saves a description and the stale page saves a property
    Then the stale page displays a field-level revision conflict
    And browser storage retains the newer description
    And choosing Reapply edit creates one revision containing both edits

  # Data layer canonical project schema drafts runtime 004
  Scenario: Data layer canonical project schema drafts runtime 004
    Given the storage adapter will fail the next canonical-envelope write
    When the operator adds a Required rule through rendered controls
    Then Save failed and Retry are visible beside the affected editor
    And persisted bytes equal the captured pre-action bytes
    When the operator activates Retry after storage recovers
    Then the Required rule is stored once and the failure message clears

  # Data layer canonical project schema drafts runtime 005
  Scenario: Data layer canonical project schema drafts runtime 005
    Given rendered controls have changed project metadata, a schema property, and an assignment
    When the workspace rerenders, navigates away, reloads, and restores its recovery journal
    Then the rendered editors recover every value and selected entity
    And persisted revision identities remain stable and unique

  # Data layer canonical project schema drafts runtime 006
  Scenario: Data layer canonical project schema drafts runtime 006
    Given compatible legacy schemas and a conflicting project-owned schema are visible
    When the operator opens migration and cancels after inspecting the conflict
    Then both legacy and project data remain byte-identical
    When the operator reopens migration and explicitly merges the fields
    Then the canonical draft shows provenance for both sources without changing historical revisions

  # Data layer canonical project schema drafts runtime 007
  Scenario: Data layer canonical project schema drafts runtime 007
    Given the operator published project release 1 through the release dialog
    When a schema is edited and an unrelated Page is saved
    Then the release view still shows the original schema revision
    And the draft view shows the newer schema and Page revisions
    And Publish keeps the workspace open while Publish and close restores focus to its invoker

  # Data layer canonical project schema drafts runtime 008
  Scenario: Data layer canonical project schema drafts runtime 008
    Given a version 1 project file is selected through the actual migration file chooser
    When the operator stages it
    Then rendered review lists every entity kind, reference mapping, compatibility path, and blocker before mutation
    And legacy journey records are visibly post-MVP and absent from production per-event validation input
    And browser persistence still equals the captured canonical and legacy bytes

  # Data layer canonical project schema drafts runtime 009
  Scenario: Data layer canonical project schema drafts runtime 009
    Given legacy assignments include one supported condition, one blank record, one ID collision, and one pin without a revision
    When the operator stages migration
    Then the supported condition becomes a named Applicability Set and assignment reference
    And the 3 invalid records remain individually quarantined with exact repair controls

  # Data layer canonical project schema drafts runtime 010
  Scenario: Data layer canonical project schema drafts runtime 010
    Given two staged legacy Flows have the same normalized selector
    When the operator reviews their assignment reference
    Then migration remains blocked with both source identities visible
    When the operator chooses the intended Flow by name and confirms
    Then one stable Flow ID is stored without hand-entering it

  # Data layer canonical project schema drafts runtime 011
  Scenario: Data layer canonical project schema drafts runtime 011
    Given canonical and legacy browser bytes were recorded before migration
    When migration validation fails and the subsequent repository write is faulted
    Then the recorded bytes remain exact and no partial project appears
    And correcting the stage and activating Retry commits one canonical revision

  # Data layer canonical project schema drafts runtime 012
  Scenario: Data layer canonical project schema drafts runtime 012
    Given legacy schemas, reusable rules, captured events, and supported imports have not been adopted
    When the operator follows each rendered compatibility entry
    Then its existing behavior and data remain accessible
    And cancelling an adoption returns to that same compatibility state

  # Data layer canonical project schema drafts runtime 013
  Scenario: Data layer canonical project schema drafts runtime 013
    Given the rendered schema draft contains no assignment
    When the operator publishes its project release
    Then the actual assignment view shows zero count, zero rows, its empty state, and no conflict
    And persisted canonical state contains no invented assignment

  # Data layer canonical project schema drafts runtime 014
  Scenario: Data layer canonical project schema drafts runtime 014
    Given the operator creates two same-schema Purchase assignments with different named Applicability Sets
    When one is pinned and the other is edited through rendered controls
    Then their displayed and persisted IDs are stable and unique and the pin names a real revision
    And the edit preserves source, target, Applicability Set, compatible unedited fields, and prior release bytes

  # Data layer canonical project schema drafts runtime 015
  Scenario Outline: Data layer canonical project schema drafts runtime 015
    Given the operator commits a rendered <edit> transaction
    When Undo and Redo are activated through actual controls
    Then visible and persisted state returns to the exact before and after revisions
    And no consumer or compiled result is partially changed
    Examples:
      | edit |
      | property and rule |
      | nested matcher group |
      | Event-occurrence node and documented relationship |

  # Data layer canonical project schema drafts runtime 016
  Scenario: Data layer canonical project schema drafts runtime 016
    Given a pending schema and assignment edit has reached the recovery journal
    When the actual extension page process is terminated before canonical commit and reopened
    Then the rendered recovery view restores every pending field and base revision
    And accepting recovery commits once while discarding recovery restores exact prior bytes

  # Data layer canonical project schema drafts runtime 017
  Scenario Outline: Data layer canonical project schema drafts runtime 017
    Given Builder and side panel show the same canonical base revision in two installed extension pages
    When the operator saves <edit_order> through rendered controls
    Then storage records command-scoped patches with their declared base revisions
    And both installed pages update through canonical change subscriptions
    And the final visible schema composition and property set contain every intended edit exactly once
    Examples:
      | edit_order |
      | Builder composition then stale side-panel property |
      | side-panel property then stale Builder composition |

  # Data layer canonical project schema drafts runtime 018
  Scenario: Data layer canonical project schema drafts runtime 018
    Given the installed project contains 2 rendered legacy assignment rows and zero production assignments
    When the operator completes the visible canonical migration
    Then the Assignment view and compiled executable plan each contain the same 2 named assignments
    And documentation, release review, and Live consume those 2 canonical records
    And no production assertion reads schema-owned assignment clones

  # Data layer canonical project schema drafts runtime 019
  Scenario Outline: Data layer canonical project schema drafts runtime 019
    Given installed Schema Library contains Purchase revision 4 outside the active Retail and Trade project
    When the operator adopts it from <entry_surface> through rendered controls
    Then review shows the named source revision, project, destination Profile, lineage, conflicts, and affected consumers
    And one command creates an equivalent project-owned canonical draft without manual rule or property recreation
    And compiled input contains the canonical project draft once while the library renders Retail and Trade under Used by
    Examples:
      | entry_surface |
      | side panel |
      | standalone Builder |

  # Data layer canonical project schema drafts runtime 020
  Scenario: Data layer canonical project schema drafts runtime 020
    Given Purchase revision 4 was adopted and the installed library publishes revision 5
    When the operator opens the relationship from Builder and side panel
    Then both render the project pin, available revision, and identical semantic diff
    When synchronization is reviewed and committed from either surface
    Then one persisted project revision contains only reviewed changes and preserved local overrides and lineage
    And affected Event cases, Assignment readiness, preflight, and release evidence becomes visibly stale

  # Data layer canonical project schema drafts runtime 021
  Scenario: Data layer canonical project schema drafts runtime 021
    Given installed Live has captured and validated one real Retail Purchase observation
    When the operator chooses Continue in project and creates a guided Event validation case through rendered human-name selectors
    Then the standalone Builder opens that canonical Event validation case with the captured observation and proposed assertions
    And running it uses the same evaluator result previously shown in Live
    And no clipboard, project import, raw ID, direct storage write, or duplicate legacy schema participates

  # Data layer canonical project schema drafts runtime 022
  Scenario: Data layer canonical project schema drafts runtime 022
    Given Builder and side panel subscribe to one canonical project revision
    When Open in Builder, Open in side panel, and Back are used for a schema field, Event validation case, and validation issue
    Then each installed destination restores the same named context, exact field, source surface, and base revision
    And every pending command is visibly committed, retained, or discarded before navigation
