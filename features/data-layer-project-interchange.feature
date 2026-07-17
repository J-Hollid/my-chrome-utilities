Feature: Data layer project interchange

  Background:
    Given Shop data specification contains a draft and immutable releases
    And its graph contains profiles, pages, groups, events, applicability, flows, steps, fixtures, policies, and stable references

  # Data layer project interchange 001
  Scenario: Data layer project interchange 001
    When the operator exports Full-fidelity Specification Project
    Then one versioned project package contains the complete project graph, draft, releases, migration metadata, and stable references
    And export identifies its project and format version
    And no transient browser permission or capture connection is included

  # Data layer project interchange 002
  Scenario: Data layer project interchange 002
    Given a full-fidelity package was exported
    When it is imported into an empty extension, reloaded, and exported again
    Then project semantics and stable references are identical
    And applicability winners, profile composition, flow traversal, fixture outcomes, and release history are unchanged
    And ordering differences without semantic effect do not create a false change

  # Data layer project interchange 003
  Scenario: Data layer project interchange 003
    Given an imported project contains additions, changes, removals, ID collisions, renames, and dependency changes
    When staged import review opens
    Then validation and migration run before project mutation
    And item-level diff identifies every downstream impact
    And collision, rename, replace, remap, and dependency choices are explicit
    And no import change is committed before all blocking choices are resolved

  # Data layer project interchange 004
  Scenario Outline: Data layer project interchange 004
    Given staged import encounters <failure_case>
    When the operator attempts commit
    Then import result is <import_outcome>
    And the current project, draft, releases, and references equal their pre-import snapshots

    Examples:
      | failure_case                    | import_outcome                              |
      | unsupported future format       | blocked with supported-version guidance     |
      | unresolved ID collision         | blocked at the conflicting items            |
      | missing dependency              | blocked with dependant links                |
      | persistence failure             | rolled back with retry available            |
      | operator cancellation           | canceled without changes                    |

  # Data layer project interchange 005
  Scenario: Data layer project interchange 005
    Given an older supported project package is selected
    When migration preview runs
    Then each format migration and semantic change is listed
    And the original package remains available as source evidence
    And confirmation imports one current-format project without losing stable references

  # Data layer project interchange 006
  Scenario: Data layer project interchange 006
    When the operator exports Standard JSON Schema
    Then reusable structural and validation requirements are represented where the standard supports them
    And applicability, flow, fixture, draft, and release semantics are explicitly identified as omitted from JSON Schema
    And one versioned companion applicability and flow manifest preserves those extension semantics and stable references
    And the output directs complete interchange to Full-fidelity Specification Project

  # Data layer project interchange 007
  Scenario: Data layer project interchange 007
    Given an import diff contains hundreds of linked changes
    When review and resolution are completed using only the keyboard
    Then virtualized diff rows preserve selection, filters, and dependency context
    And every conflict and action has an accessible name and non-color state
    And focus returns to the import action after cancel or commit
