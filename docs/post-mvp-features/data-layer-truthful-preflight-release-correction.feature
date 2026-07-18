# mutation-stamp: sha256=7f5f74fd111671285a1c24c47314e64ee5a8e2b039ff2c32c1c8a233c9fd5922
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:10.639685438Z","feature_name":"Data layer truthful preflight release correction","feature_path":"features/data-layer-truthful-preflight-release-correction.feature","background_hash":"0ccc48b73cab55c2d3cea2a56a8cf8ce62eac336f8a088c7d8759df50226f684","implementation_hash":"sha256:52be0de0c06ece4d560c82877438f8905c7e683567037a90e23625b94a0d1d19","scenarios":[{"index":0,"name":"Data layer truthful preflight release correction 001","scenario_hash":"93396021fde0d6dba00f4318fd8d7d48574cf3a5dfd17cb63195c171f694de45","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:34:10.639685438Z"},{"index":12,"name":"Data layer truthful preflight release correction 013","scenario_hash":"25bee3018ad9cdf4a6f26d5fbe3ceaa1a0daa4d104f4a2443940bc472f87808a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:34:10.639685438Z"}]}
# acceptance-mutation-manifest-end

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

  # Data layer truthful preflight release correction 014
  Scenario Outline: Data layer truthful preflight release correction 014
    Given the draft contains <blocking_state>
    When preflight runs
    Then publication is blocked with a human-readable cause and exact repair action
    And review, confirmation, and publication expose the same blocker set
    Examples:
      | blocking_state |
      | zero canonical assignments |
      | zero proving evidence |
      | zero effective coverage cells |
      | applicability ambiguity |
      | compiler failure |
      | validation failure |

  # Data layer truthful preflight release correction 015
  Scenario: Data layer truthful preflight release correction 015
    Given one current preflight result has content identity preflight-23
    When release review opens and publication is confirmed
    Then review displays preflight-23 and publication consumes preflight-23 without recomputation under a different gate
    And any canonical change marks preflight-23 stale and disables confirmation until preflight reruns

  # Data layer truthful preflight release correction 016
  Scenario: Data layer truthful preflight release correction 016
    Given a complete greenfield project has no prior release
    When first release review opens
    Then the structured diff compares against an empty project and lists every introduced Page, Event, Profile, requirement, Flow, transition, Applicability Set, Assignment, Fixture, coverage policy, and schema
    And a zero-change first release cannot be published
