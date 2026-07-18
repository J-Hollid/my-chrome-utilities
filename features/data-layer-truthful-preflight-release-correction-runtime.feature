Feature: Data layer truthful preflight release correction runtime

  Background:
    Given the built unpacked extension has a project authored through rendered controls
    And preflight and release use the published production compiler and evaluator

  # Data layer truthful preflight release correction runtime 001
  Scenario: Data layer truthful preflight release correction runtime 001
    Given the operator creates one dangling Event reference through a controlled deletion attempt
    When preflight runs
    Then the rendered stable blocker opens the exact Flow step Event selector within 2 actions
    And release review shows the identical blocker code and entity IDs

  # Data layer truthful preflight release correction runtime 002
  Scenario: Data layer truthful preflight release correction runtime 002
    Given the operator creates an equal Retail and Trade confirmation tie in the matcher editor
    When preflight and release review run
    Then both name the same candidates and disable publication
    When the operator adds the visible prior-flow distinction and reruns
    Then the blocker clears and both production results show distinct winners

  # Data layer truthful preflight release correction runtime 003
  Scenario: Data layer truthful preflight release correction runtime 003
    Given one error, policy blocker, and completeness warning are visible
    When the operator changes the warning publication policy
    Then blocker counts, filtered rows, action state, and explanatory text update from one result model
    And no enabled-looking Publish action can bypass an active blocker

  # Data layer truthful preflight release correction runtime 004
  Scenario: Data layer truthful preflight release correction runtime 004
    Given a valid draft changes a requirement, matcher, flow transition, fixture, and coverage cell
    When the rendered release review opens
    Then each structured diff category shows its exact before, after, provenance, affected consumers, and breaking classification
    And summary counts equal the visible details

  # Data layer truthful preflight release correction runtime 005
  Scenario: Data layer truthful preflight release correction runtime 005
    When the operator publishes a clean release through the actual dialog
    Then browser state contains one immutable source snapshot and compiled executable plan with matching content identity
    And Live names that release and its exact schema revisions

  # Data layer truthful preflight release correction runtime 006
  Scenario: Data layer truthful preflight release correction runtime 006
    Given the release repository will fail after the first low-level write
    When the operator confirms publication
    Then failure and Retry remain visible while project and plan bytes equal their pre-action values
    And a successful Retry creates exactly one complete release

  # Data layer truthful preflight release correction runtime 007
  Scenario: Data layer truthful preflight release correction runtime 007
    Given the operator downloaded a full-fidelity release through the browser
    When a fresh isolated extension stages it through the actual file chooser
    Then graph-wide additions, changes, removals, migrations, collisions, dependencies, and impacts are rendered before commit
    And Cancel leaves the fresh installation empty

  # Data layer truthful preflight release correction runtime 008
  Scenario: Data layer truthful preflight release correction runtime 008
    Given all staged import conflicts are resolved through rendered controls
    When the operator commits, reloads, and downloads a new export
    Then an independent semantic comparison preserves metadata, releases, IDs, typed values, order, references, compiled behavior, and fixture outcomes
    And the comparison does not call the production serializer as its oracle

  # Data layer truthful preflight release correction runtime 009
  Scenario: Data layer truthful preflight release correction runtime 009
    When the operator exports standard JSON Schema and its companion manifest
    Then the actual downloaded schema contains the compiled released contract
    And the versioned manifest contains applicability, flow, fixture, release, and loss metadata
    And documentation options include selected semantics rather than merely suppressing omission warnings

  # Data layer truthful preflight release correction runtime 010
  Scenario: Data layer truthful preflight release correction runtime 010
    Given the Publish action opened release review
    When the operator completes Publish using only the keyboard
    Then the workspace stays open and focus lands on the release summary
    When the operator later completes Publish and close using only the keyboard
    Then the workspace closes and focus returns to the exact invoking control

  # Data layer truthful preflight release correction runtime 011
  Scenario: Data layer truthful preflight release correction runtime 011
    Given the operator selects Applicability, Flows, Fixtures, Provenance, Where used, and Release metadata in documentation export
    When the actual preview and clipboard output are generated
    Then each selected category contains labelled released-project semantics
    And deselecting Flows adds an explicit flow omission without changing the project draft

  # Data layer truthful preflight release correction runtime 012
  Scenario: Data layer truthful preflight release correction runtime 012
    Given release 5 is visible and immutable
    When the operator activates Restore as draft
    Then a new draft opens with every stable reference and release 5 as its origin
    And rendered release 5 content and persisted release bytes remain unchanged

  # Data layer truthful preflight release correction runtime 013
  Scenario: Data layer truthful preflight release correction runtime 013
    When the operator searches side-panel and full-page navigation for Build specification
    Then no legacy authoring action with that name is available
    And Generate documentation table opens the lossy documentation workflow
    And Specification Builder opens only the full project workspace

  # Data layer truthful preflight release correction runtime 014
  Scenario Outline: Data layer truthful preflight release correction runtime 014
    Given documentation export is rendered at <width>
    When the operator previews selected project semantics and copies them
    Then <presentation> and explicit loss metadata remain readable with Copy and Close reachable
    And computed layout has one primary scroll owner and no horizontal page overflow
    Examples:
      | width | presentation |
      | 360 CSS px | selected-column cards |
      | 520 CSS px | selected-column cards |
      | 720 CSS px | responsive selected columns |
      | 1280 CSS px | complete table preview |
