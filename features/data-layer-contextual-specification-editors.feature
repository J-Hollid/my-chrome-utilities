# mutation-stamp: sha256=98e70b411ae9c8a8c5488e58b49ed72820aacca35f8573daef9b16dce9caa596
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:33:54.605365871Z","feature_name":"Data layer contextual specification editors","feature_path":"features/data-layer-contextual-specification-editors.feature","background_hash":"1f42a10ae2b349d44e411ff2abefb0f569f1c14fdbd4023366822e8d38af5ef7","implementation_hash":"sha256:3479c8ee683b41229ad4ac5dfd5f98f0c6861f2ce17b989902992369eda4d7e8","scenarios":[{"index":8,"name":"Data layer contextual specification editors 009","scenario_hash":"10b10a6310673ed6fa72f4b48e4b8b73960152a3c40295bb7783438cc507b305","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:33:54.605365871Z"},{"index":12,"name":"Data layer contextual specification editors 013","scenario_hash":"2c67360bae9bc5e9b7fe057645454bed9aed44f97dfce715d08b765d9f068d08","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:33:54.605365871Z"}]}
# acceptance-mutation-manifest-end

# MVP scope notice: the Flow editor now owns context and interaction nodes, documentary relationships, Profiles, Assignments, notes, and layout; timeout, correlation, and Journey Fixture controls are post-MVP.
Feature: Data layer contextual specification editors

  Background:
    Given the full-page workspace has a selected project entity
    And the center editor and inspector derive only from that entity type

  # Data layer contextual specification editors 001
  Scenario: Data layer contextual specification editors 001
    Given a Requirement Profile is selected
    When the operator edits it
    Then a full-width requirement grid exposes Type, Required, Forbidden, Allowed values, Rules, Severity, Description, Example, Origin, and Issues
    And ordered composition plus Effective, Local only, and Provenance views are available

  # Data layer contextual specification editors 002
  Scenario: Data layer contextual specification editors 002
    Given a Page or Page group is selected
    When the operator edits it
    Then Environment, Host, Path, Query, Hash, SPA route, Membership, Expected events, Profiles, and Applicability are visible as appropriate
    And invalid route syntax is reported at its exact field

  # Data layer contextual specification editors 003
  Scenario: Data layer contextual specification editors 003
    Given an Event is selected
    When the operator edits it
    Then Source, Canonical event name, Validation target, Context-setting or interaction role, Profiles, and Applicability are visible
    And selecting references uses searchable names while persisting stable IDs

  # Data layer contextual specification editors 004
  Scenario: Data layer contextual specification editors 004
    Given an Applicability Set is selected
    When the operator edits it
    Then nested All, Any, and Not groups, named predicates, priority, fallback, and plain-language summary are visible
    And current, pasted, and Event validation case contexts can be tested with candidate and winner evidence

  # Data layer contextual specification editors 005
  Scenario: Data layer contextual specification editors 005
    Given a Flow is selected
    When the operator edits it
    Then Purpose, Page contexts, context-setting and interaction Event-occurrence nodes, documentary relationships, Profiles, Assignments, notes, and layout are visible
    And nodes own required, optional, conditional, or informational obligation and multiplicity
    And expected-next, alternative, parallel, and merge relationships are labelled as manual topology expectations
    And Page and Event references are searchable stable selectors rather than free text

  # Data layer contextual specification editors 006
  Scenario: Data layer contextual specification editors 006
    Given an Event validation case is selected
    When the operator edits it
    Then observed context, payload, exact expected Assignment, schema revision, issues, result differences, and release policy are visible
    And raw JSON has field-local syntax and semantic feedback

  # Data layer contextual specification editors 007
  Scenario: Data layer contextual specification editors 007
    Given a Schema draft is selected
    When the operator edits it
    Then Compiled schema, Local overrides, Profiles, Properties, Rules, Conflicts, and Revision history are visible
    And the displayed canonical revision is the revision edited by the side panel

  # Data layer contextual specification editors 008
  Scenario: Data layer contextual specification editors 008
    Given an Assignment is selected
    When the operator edits it
    Then Schema, Event, Applicability Set, Validation target, Version policy, Summary, Conflict preview, and Where used are visible
    And no embedded matcher condition or blank default routing values are created

  # Data layer contextual specification editors 009
  Scenario Outline: Data layer contextual specification editors 009
    Given a <kind> has consumers
    When the operator chooses Rename, Duplicate, or Delete
    Then the change preview names every affected stable reference
    And deletion is blocked until each required dependency is reassigned or removed
    Examples:
      | kind |
      | Profile |
      | Page |
      | Page group |
      | Event |
      | Applicability Set |
      | Flow |
      | Event validation case |
      | Schema draft |
      | Assignment |

  # Data layer contextual specification editors 010
  Scenario: Data layer contextual specification editors 010
    Given the operator switches from a Flow to a Page
    When the Page editor renders
    Then no Flow disclosure, stale field value, or prior entity kind remains interactive
    And cancelling the Page edit changes no draft revision
    And a failed save retains the Page edit with Retry beside the failing field group

  # Data layer contextual specification editors 011
  Scenario: Data layer contextual specification editors 011
    Given Retail and Trade assignments exist
    When the operator searches assignments for Retail
    Then the count, visible rows, empty state, candidate conflict state, and result summary derive from the same filtered assignments
    And no Trade row or unfiltered count remains visible

  # Data layer contextual specification editors 012
  Scenario: Data layer contextual specification editors 012
    Given an Applicability Set is being authored
    When the operator combines guided Host, Path, Query, Hash, SPA route, Source, Event, Target, Payload, Raw input, Environment, and explicit Session predicates
    Then each predicate uses a type-appropriate control and field-local syntax guidance
    And overlap analysis identifies wildcard, regular-expression, shadow, fallback, and equal-priority relationships with exact source links
    And Flow and Event-occurrence references appear only in Where used and never as matcher predicates

  # Data layer contextual specification editors 013
  Scenario Outline: Data layer contextual specification editors 013
    Given a complete <kind> is visible with its type-specific fields
    When the operator Edits, Cancels, Duplicates, Renames, opens Where used, and requests Delete
    Then every action retains stable references and applies dependency rules for that <kind>
    And a simulated save failure retains its edited fields and Retry
    Examples:
      | kind |
      | Profile |
      | Page |
      | Page group |
      | Event |
      | Applicability Set |
      | Flow |
      | Event validation case |
      | Schema draft |
      | Assignment |
