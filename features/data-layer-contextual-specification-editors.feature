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
    Then Source, Canonical event name, Validation target, Profiles, Applicability, and Occurrence policy are visible
    And selecting references uses searchable names while persisting stable IDs

  # Data layer contextual specification editors 004
  Scenario: Data layer contextual specification editors 004
    Given an Applicability Set is selected
    When the operator edits it
    Then nested All, Any, and Not groups, named predicates, priority, fallback, and plain-language summary are visible
    And current, pasted, and fixture contexts can be tested with candidate and winner evidence

  # Data layer contextual specification editors 005
  Scenario: Data layer contextual specification editors 005
    Given a Flow is selected
    When the operator edits it
    Then Entry, Exit, Timeout, Correlation, Steps, Branches, Joins, Transitions, Profiles, and Applicability are visible
    And Page and Event references are searchable stable selectors rather than free text

  # Data layer contextual specification editors 006
  Scenario: Data layer contextual specification editors 006
    Given a Fixture is selected
    When the operator edits it
    Then Single event and Journey modes expose context, observations, correlation, exact expected winner, step, schema, issues, and release policy
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
      | Fixture |
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
    When the operator combines guided Host, Path, Query, Hash, SPA route, Source, Event, Target, Payload, Raw input, Environment, Session, Flow, and Step predicates
    Then each predicate uses a type-appropriate control and field-local syntax guidance
    And overlap analysis identifies wildcard, regular-expression, shadow, fallback, and equal-priority relationships with exact source links

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
      | Fixture |
      | Schema draft |
      | Assignment |
