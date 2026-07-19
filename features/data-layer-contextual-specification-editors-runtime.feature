# mutation-stamp: sha256=710f8593825f367fc76326ece3c54a9c17a44d376cba55d01f41150decd24799
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:34.668940068Z","feature_name":"Data layer contextual specification editors runtime","feature_path":"features/data-layer-contextual-specification-editors-runtime.feature","background_hash":"91ca42472f5e0458db0f2382fe0c6f1c3e434acd12da289b76de0ddb4f107e6e","implementation_hash":"sha256:da03f8cf338cfc92aa96fb36b712ac26b1373f1a10d16b30902527d5d9879b5c","scenarios":[{"index":12,"name":"Data layer contextual specification editors runtime 013","scenario_hash":"351d568d16371ac4742aeb9a92243be41bf78060468416e42da74d363ce19b95","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:34:34.668940068Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer contextual specification editors runtime

  Background:
    Given the built unpacked extension has a blank project created through rendered controls
    And no rich entity state or raw stable ID has been injected

  # Data layer contextual specification editors runtime 001
  Scenario: Data layer contextual specification editors runtime 001
    When the operator creates a Profile and authors one complete requirement row
    Then the rendered grid and persisted canonical draft contain its type, Required state, allowed values, rule, severity, description, and example
    And the effective preview shows the same origin without reading storage IDs

  # Data layer contextual specification editors runtime 002
  Scenario: Data layer contextual specification editors runtime 002
    When the operator creates a Page group and a Page with host, route, environment, expected event, profile, and applicability selectors
    Then reopening each rendered editor shows every value and stable relationship
    And malformed route syntax focuses and describes the exact field

  # Data layer contextual specification editors runtime 003
  Scenario: Data layer contextual specification editors runtime 003
    When the operator creates an Event with source, canonical name, target, profile, applicability, and occurrence policy
    Then the event is selectable by name from a Page and Flow editor
    And renaming it updates labels without changing its persisted stable identity

  # Data layer contextual specification editors runtime 004
  Scenario: Data layer contextual specification editors runtime 004
    When the operator builds nested All, Any, and Not matcher groups through rendered controls
    Then the plain-language summary and test bench expose candidates, reasons, winner, shadow, and tie states
    And a natural payload path is normalized inline or rejected at the exact invalid segment

  # Data layer contextual specification editors runtime 005
  Scenario: Data layer contextual specification editors runtime 005
    When the operator creates a Flow with searchable Page, Event, Profile, and Applicability selectors
    And configures entry, exit, timeout, correlation, branches, joins, and transitions
    Then reopening the Flow editor shows stable named references and every configured semantic field
    And no free-text nonexistent reference can be saved

  # Data layer contextual specification editors runtime 006
  Scenario: Data layer contextual specification editors runtime 006
    When the operator creates one event Fixture and one journey Fixture through rendered controls
    Then each editor retains its context, observations, correlation, expected winner, step, schema, issues, and policy after reload
    And malformed fixture JSON remains an uncommitted field-local error

  # Data layer contextual specification editors runtime 007
  Scenario: Data layer contextual specification editors runtime 007
    When the operator opens a Schema draft in the full-page editor and then in the side panel
    Then both display the same compiled document, overrides, rules, conflicts, history, and canonical revision
    And an edit made in either view appears in the other without a reload

  # Data layer contextual specification editors runtime 008
  Scenario: Data layer contextual specification editors runtime 008
    When the operator creates an Assignment with named Schema, Event, and Applicability selectors
    Then its rendered summary names those entities and its real version policy
    And candidate preview uses the selected Applicability Set without creating a copied condition

  # Data layer contextual specification editors runtime 009
  Scenario: Data layer contextual specification editors runtime 009
    Given a selected Page is referenced by a Flow and Fixture
    When the operator attempts to delete it
    Then the rendered dependency review links both consumers and blocks deletion
    When the operator reassigns both consumers and confirms deletion
    Then one transaction removes the Page while retaining valid stable references

  # Data layer contextual specification editors runtime 010
  Scenario: Data layer contextual specification editors runtime 010
    Given the Flow editor has expanded disclosures and entered values
    When the operator selects a Page and simulates one failed save
    Then only Page controls are present in the accessibility tree
    And the pending Page value, local error, and Retry survive rerender
    And Cancel leaves the canonical project revision unchanged

  # Data layer contextual specification editors runtime 011
  Scenario: Data layer contextual specification editors runtime 011
    Given rendered assignment rows contain Retail and Trade
    When the operator types Retail into the assignment search field
    Then exactly the Retail row and a count of 1 assignment are rendered
    And empty and conflict states reflect only that filtered result
    When the query is cleared
    Then both rows and a count of 2 assignments return from the same state

  # Data layer contextual specification editors runtime 012
  Scenario: Data layer contextual specification editors runtime 012
    When the operator builds Host, Path, Query, Hash, SPA route, Source, Event, Target, Payload, Raw input, Environment, Session, Flow, and Step predicates through rendered controls
    Then each saved predicate reopens with its typed value and plain-language summary
    And the rendered overlap analysis detects a wildcard shadow, regular-expression overlap, fallback, and equal-priority tie
    And every diagnostic opens its exact predicate field

  # Data layer contextual specification editors runtime 013
  Scenario Outline: Data layer contextual specification editors runtime 013
    Given a complete <kind> was created through its rendered editor and reloaded
    When the operator Edits, Cancels, Duplicates, Renames, opens Where used, requests Delete, and faults one save
    Then actual controls preserve all type-specific fields, stable references, dependencies, and pending recovery for that <kind>
    And Retry commits once without stale inspector state
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
