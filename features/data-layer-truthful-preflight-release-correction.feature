Feature: Data layer truthful preflight release correction

  Background:
    Given preflight and release consume the compiled production plan, evaluator results, and effective coverage

  # Data layer truthful preflight release correction 001
  Scenario Outline: Data layer truthful preflight release correction 001
    Given the project contains a <defect>
    When preflight runs
    Then a stable blocker names the affected entities and exact editable field
    And release review reports the same blocker identity
    Examples:
      | defect |
      | dangling stable reference |
      | unreachable required branch |
      | profile compilation conflict |
      | unpinned required revision |
      | uncovered release context |
      | resolver ambiguity |
      | unexpected fixture outcome |
      | unresolved migration conflict |

  # Data layer truthful preflight release correction 002
  Scenario: Data layer truthful preflight release correction 002
    Given Retail and Trade applicability tie at confirmation
    When preflight runs
    Then publication is blocked with both candidates and missing flow-state distinction evidence
    When the operator repairs the matcher through its linked field
    Then the same evaluator clears that blocker and produces distinct winners

  # Data layer truthful preflight release correction 003
  Scenario: Data layer truthful preflight release correction 003
    Given an error, policy blocker, and completeness warning are present
    When preflight and release review render
    Then each has a distinct classification, policy explanation, and source link
    And only configured blocker classes disable publication

  # Data layer truthful preflight release correction 004
  Scenario: Data layer truthful preflight release correction 004
    Given release 4 and a valid draft differ
    When release review opens
    Then it shows structured requirement, provenance, routing, flow, fixture, coverage, compatibility, impact, and breaking-change diffs
    And every summary count equals its visible filtered details

  # Data layer truthful preflight release correction 005
  Scenario: Data layer truthful preflight release correction 005
    Given all release blockers are cleared
    When project release 5 is published
    Then source project and executable plan are snapshotted atomically with a content identity
    And every linked schema revision, assignment pin, flow, fixture, and coverage record belongs to release 5

  # Data layer truthful preflight release correction 006
  Scenario: Data layer truthful preflight release correction 006
    Given publication storage fails after a partial low-level write
    When rollback completes
    Then exact prior project and executable-plan bytes remain authoritative
    And no release 5, schema revision, or assignment pin is partially visible
    And Retry can publish one complete release 5

  # Data layer truthful preflight release correction 007
  Scenario: Data layer truthful preflight release correction 007
    Given release 5 was published
    When the operator chooses Restore as draft
    Then release 5 remains immutable
    And a new draft retains every stable reference and identifies release 5 as its origin

  # Data layer truthful preflight release correction 008
  Scenario: Data layer truthful preflight release correction 008
    Given release 5 is fully exported
    When it is staged in a fresh installation
    Then additions, changes, removals, collisions, migrations, dependencies, and impacts are reviewed before commit
    And cancelling or any validation failure changes nothing

  # Data layer truthful preflight release correction 009
  Scenario: Data layer truthful preflight release correction 009
    Given a staged full-fidelity import has all collisions resolved
    When it commits, reloads, and reexports
    Then project metadata, releases, stable IDs, typed values, order, references, compiled semantics, and validation outcomes are identical
    And standard JSON Schema remains explicitly lossy with a versioned applicability and flow manifest

  # Data layer truthful preflight release correction 010
  Scenario: Data layer truthful preflight release correction 010
    Given release review was opened from Publish release
    When publication succeeds through Publish
    Then the workspace remains open and focus reaches the release summary
    When publication succeeds through Publish and close
    Then the workspace closes and focus returns to the invoking control

  # Data layer truthful preflight release correction 011
  Scenario: Data layer truthful preflight release correction 011
    Given documentation export includes Applicability, Flows, Fixtures, Provenance, Where used, and Release metadata
    When its preview is generated
    Then each selected semantic category contributes labelled content from the released project
    And every unavailable or omitted category is named as lossy rather than hidden by its checkbox

  # Data layer truthful preflight release correction 012
  Scenario: Data layer truthful preflight release correction 012
    Given the full-page authoring workspace is available
    When the operator reviews product navigation and documentation export
    Then Specification Builder names only the project authoring workspace
    And the legacy Build specification label is absent or redirected to Generate documentation table with explicit loss metadata

  # Data layer truthful preflight release correction 013
  Scenario Outline: Data layer truthful preflight release correction 013
    Given documentation export is open at <width>
    When the operator previews selected project semantics
    Then <presentation> keeps columns or cards, loss metadata, Copy, and Close reachable
    And one primary scroll owner contains the preview without horizontal page overflow
    Examples:
      | width | presentation |
      | 360 CSS px | selected-column cards |
      | 520 CSS px | selected-column cards |
      | 720 CSS px | responsive selected columns |
      | full-page desktop | complete table preview |
