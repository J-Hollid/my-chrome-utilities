# mutation-stamp: sha256=5fbb848760b5f1c56d44dfdf7379d09e036f277e08b884565cf197e6149de53d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T15:43:22.831268881Z","feature_name":"Data layer schema renaming runtime","feature_path":"features/data-layer-schema-renaming-runtime.feature","background_hash":"05fb432bd93461e32da0e39e8f9974ddde15b7ee478a3ecc95f9a70ac56b9865","implementation_hash":"sha256:8ab65dc416e547b42f2fd5728dcca3c48921a0e0211a65db8d606ff78c81118d","scenarios":[{"index":3,"name":"Data layer schema renaming runtime 004","scenario_hash":"2fbe7c961aee319e4e088e37d3a380c2df3920fdb19012d57d9af6daad0ba1ba","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T15:43:22.831268881Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema renaming runtime

  Background:
    Given the built extension side panel is running with the production Schema Library, schema editor, revisions, assignments, inheritance, Event Library attachments, and persistence
    And production Page view has stable identity schema-page-view, current revision 3, and no working draft

  # Data layer schema renaming runtime 001
  Scenario: Data layer schema renaming runtime 001
    Given the actual Page view working-draft editor is open
    When production Name input changes to Generic page view
    Then production storage contains proposed working-draft name Generic page view
    And the stored current name remains Page view
    And one rename pending change identifies both names
    When the editor closes, the side panel reloads, and the actual Page view row is reopened
    Then rendered Name is Generic page view and the pending rename is unchanged

  # Data layer schema renaming runtime 002
  Scenario: Data layer schema renaming runtime 002
    Given production Page view has a pending rename to Generic page view and another pending schema edit
    When the actual publish action opens its review
    Then the rendered review identifies the old name, proposed name, current revision, next revision, and other edit
    And production storage remains byte-equivalent before confirmation
    When the rendered confirmation publishes revision 4
    Then production storage contains current name Generic page view at stable identity schema-page-view
    And read-only revision 3 retains name Page view
    And the other edit is present in revision 4
    And the production Schema Library renders one Generic page view row and no current Page view row

  # Data layer schema renaming runtime 003
  Scenario: Data layer schema renaming runtime 003
    Given production Page view is referenced by an assignment, a child schema, an Event Library template, and a reusable-rule attachment
    When production rename to Generic page view is published
    Then stored references remain byte-equivalent by schema identity
    And their rendered current labels use Generic page view
    And production follow-latest validation reports Generic page view revision 4
    And pinned and previously saved revision 3 validation reports Page view revision 3
    When the side panel reloads
    Then all references resolve and no duplicate schema is restored

  # Data layer schema renaming runtime 004
  Scenario Outline: Data layer schema renaming runtime 004
    Given production Product detail has a different stable identity
    And the actual Page view editor receives Name <proposed_name>
    When production rename readiness renders
    Then Publish revision is disabled
    And rendered Name assistance is <assistance>
    And production storage retains separate Page view and Product detail identities

    Examples:
      | proposed_name  | assistance                                   |
      | empty          | Enter a schema name                          |
      | Product detail | A schema named Product detail already exists |
      | product DETAIL | A schema named Product detail already exists |

  # Data layer schema renaming runtime 005
  Scenario: Data layer schema renaming runtime 005
    Given production Page view has a persisted pending rename to Generic page view
    When the actual working draft is discarded
    Then production storage has no working draft and current name remains Page view
    And reopening the actual editor renders Name Page view
    And Generic page view is absent from current schema choices
