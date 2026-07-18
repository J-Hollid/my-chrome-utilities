# mutation-stamp: sha256=1779bf45ce3c7ebfbb3461c4fc1b4936e524b542381ee5ab09714bcd5618980c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:34.737810464Z","feature_name":"Data layer effective requirement coverage correction runtime","feature_path":"features/data-layer-effective-requirement-coverage-correction-runtime.feature","background_hash":"80ebddc58467358dacbaef5dd62fddcf9ff07a45071da667e3f53df29303c7c4","implementation_hash":"sha256:5b71936fb9cbcb8de5add9dfff635c66f4e0858a96f9ad0b7882ce5591a28678","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer effective requirement coverage correction runtime

  Background:
    Given the built unpacked extension has compiled contexts and current fixture evidence

  # Data layer effective requirement coverage correction runtime 001
  Scenario: Data layer effective requirement coverage correction runtime 001
    When the operator opens coverage for Retail and Trade confirmation
    Then rendered row and column headers identify Page, Purchase Event, Confirmation step, and effective requirement paths
    And a name-only incomplete entity is visibly Missing rather than Covered

  # Data layer effective requirement coverage correction runtime 002
  Scenario: Data layer effective requirement coverage correction runtime 002
    When the operator inspects the covered Retail /ecommerce/value cell
    Then visible evidence names the Retail applicability winner, origin profile, schema revision, passing fixture, and release scope
    And each named source opens through its rendered link

  # Data layer effective requirement coverage correction runtime 003
  Scenario: Data layer effective requirement coverage correction runtime 003
    Given no fixture proves Trade /account_id
    When coverage and preflight run
    Then the exact Trade confirmation cell is Missing and the same stable finding blocks release
    When a proving fixture passes
    Then that cell alone becomes Covered with the fixture evidence revision

  # Data layer effective requirement coverage correction runtime 004
  Scenario: Data layer effective requirement coverage correction runtime 004
    When the operator opens a Missing cell and follows its issue link
    Then focus reaches the exact editable source field within 2 actions
    When the operator returns
    Then matrix pivot, filter, selected cell, and scroll offset are restored

  # Data layer effective requirement coverage correction runtime 005
  Scenario: Data layer effective requirement coverage correction runtime 005
    Given a valid waiver is entered for optional Upsell coverage
    When the matrix reloads
    Then Waived, author, reason, expiry, release scope, and impact are visible without relying on color
    And an expired waiver becomes Missing and blocks according to policy

  # Data layer effective requirement coverage correction runtime 006
  Scenario: Data layer effective requirement coverage correction runtime 006
    Given a 500-property and 50-flow project was imported through the visible benchmark path
    When the operator scrolls to matrix rows 41, 250, and 500 and changes pivots
    Then the requested cells render with correct semantic evidence
    And DOM inspection proves bounded windowing rather than a fixed first-40 truncation
    And measured interaction tasks remain within 100 milliseconds

  # Data layer effective requirement coverage correction runtime 007
  Scenario: Data layer effective requirement coverage correction runtime 007
    Given a contributing Applicability Set changes after fixture execution
    When coverage rerenders and the extension reloads
    Then only affected cells are visibly Stale
    And rerunning their production fixtures refreshes those cells without changing unrelated evidence

  # Data layer effective requirement coverage correction runtime 008
  Scenario: Data layer effective requirement coverage correction runtime 008
    Given the installed project renders Profiles, Schemas, Flows, 2 legacy assignments, and empty Fixtures but has zero canonical assignments
    When the operator opens Coverage
    Then a blocking explanation identifies missing canonical assignments and proving Fixture assertions
    And the view cannot present an empty 0-of-0 matrix as complete or release-ready

  # Data layer effective requirement coverage correction runtime 009
  Scenario: Data layer effective requirement coverage correction runtime 009
    Given canonical Retail and Trade assignments and guided proving Fixtures exist
    When the installed coverage matrix opens
    Then its nonzero Page, Event, Flow step, and effective requirement cells use human names
    And opening a cell reaches its exact Fixture assertion and provenance source
