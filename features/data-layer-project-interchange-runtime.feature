# mutation-stamp: sha256=a973b99837093ca431ee7dff2dea84e3846f8b0e67ab55276ad65e120f06cbc3
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:03:37.070694763Z","feature_name":"Data layer project interchange runtime","feature_path":"features/data-layer-project-interchange-runtime.feature","background_hash":"accc78e1eb34a7dfeea21d8790b49741f2f9e757967626cba25b2422ed0ba38a","implementation_hash":"sha256:d81f43f3f1c5872182d4f48eb5fa340e13a8a203b0aef3c074e7c542e04638b4","scenarios":[{"index":3,"name":"Data layer project interchange runtime 004","scenario_hash":"81a0b81d091a487b1cd3afec2f614c3f2ace0a3a1944fe54c19339869d1a71f5","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:37.070694763Z"}]}
# acceptance-mutation-manifest-end

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
