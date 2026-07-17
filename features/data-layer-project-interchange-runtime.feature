Feature: Data layer project interchange runtime

  Background:
    Given the built extension is running with production project serialization, migration, diff, import, export, persistence, and validation systems
    And a complete released project plus draft is loaded

  # Data layer project interchange runtime 001
  Scenario: Data layer project interchange runtime 001
    When actual download controls export the full project package
    And a fresh isolated extension imports it through actual file-selection and review controls
    Then production storage and rendered project restore every entity, draft, release, and stable graph reference
    And production applicability, composition, flow, fixture, and validation outcomes match the source project

  # Data layer project interchange runtime 002
  Scenario: Data layer project interchange runtime 002
    When the restored project is exported a second time
    Then semantic comparison reports no difference from the first package
    And stable identities, revision numbers, references, typed values, and ordered flow steps are equal

  # Data layer project interchange runtime 003
  Scenario: Data layer project interchange runtime 003
    Given a production import has additions, removals, collisions, renames, and dependency changes
    When actual staged diff choices are reviewed, canceled, reopened, and committed
    Then cancel leaves production storage byte-for-byte unchanged
    And commit applies the complete resolved graph in one transaction
    And reload contains no dangling or silently remapped reference

  # Data layer project interchange runtime 004
  Scenario Outline: Data layer project interchange runtime 004
    Given production import encounters <failure_case>
    When commit runs
    Then all project storage retains its pre-import bytes
    And the actual DOM reports <operator_outcome>

    Examples:
      | failure_case              | operator_outcome                          |
      | unsupported format        | supported-version guidance                |
      | unresolved dependency     | linked blocking dependency                |
      | persistence failure       | complete staged import available to retry |

  # Data layer project interchange runtime 005
  Scenario: Data layer project interchange runtime 005
    When Standard JSON Schema and its companion manifest are downloaded and inspected
    Then actual JSON Schema contains supported contract semantics and explicit loss metadata
    And the versioned manifest contains applicability, flow, fixture, draft, release, and stable-reference data
    And recombining both never claims to equal the full-fidelity package unless semantic comparison passes

  # Data layer project interchange runtime 006
  Scenario: Data layer project interchange runtime 006
    When a large import diff is resolved with keyboard-only controls
    Then actual virtualization, scroll restoration, focus, accessible conflict state, and commit announcement are correct
    And no clipboard or downloaded-content assertion is replaced by source scanning
