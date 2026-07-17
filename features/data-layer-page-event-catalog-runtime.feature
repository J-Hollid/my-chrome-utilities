Feature: Data layer page and event catalog runtime

  Background:
    Given the built extension is running with production project catalog, persistence, indexing, and validation systems

  # Data layer page and event catalog runtime 001
  Scenario: Data layer page and event catalog runtime 001
    When Checkout confirmation, Checkout pages, and Purchase are created through actual workspace controls
    Then production storage persists three unequal stable identities without captured traffic
    And reload renders each under its correct catalog section
    And global search returns each by name and semantic metadata

  # Data layer page and event catalog runtime 002
  Scenario: Data layer page and event catalog runtime 002
    Given production page, event, applicability, and profile records are linked
    When one linked definition is edited, serialized, and reloaded
    Then stored references retain their stable target identities
    And actual validation resolves the linked event and profiles without copied definitions

  # Data layer page and event catalog runtime 003
  Scenario: Data layer page and event catalog runtime 003
    Given Purchase has flow, fixture, and release dependants
    When delete and replacement reviews are exercised through the actual DOM
    Then deletion is blocked with rendered deep links to every dependant
    And confirmed replacement changes all selected draft references in one production transaction

  # Data layer page and event catalog runtime 004
  Scenario: Data layer page and event catalog runtime 004
    Given production legacy storage contains page_view and purchase assignments
    When migration preview, defer, commit, and reload are exercised
    Then behavior-equivalent named candidates preserve every supported reference
    And unresolved contexts never become silently active

  # Data layer page and event catalog runtime 005
  Scenario: Data layer page and event catalog runtime 005
    When keyboard-only catalog navigation selects pages, groups, and events
    Then actual compact rows and inspector controls follow tree-grid keyboard semantics
    And computed content, accessible names, issue states, and focus agree
