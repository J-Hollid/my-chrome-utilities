# mutation-stamp: sha256=e0404aa8496ba67261e98864d0e2c6c298697b53350756e99035f8990d6b150f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-17T20:12:41.314270864Z","feature_name":"Data layer reusable rule sync publication runtime","feature_path":"features/data-layer-reusable-rule-sync-publication-runtime.feature","background_hash":"75e58a9d7065a3ebdfa844a94ece390a9f93e58804f1cd0148bdb80c1a618bcb","implementation_hash":"sha256:660e0d50b1f6b08327341ec7be0fa8bbb79793b9bdf46dc13eed19d23b1a0f67","scenarios":[{"index":3,"name":"Data layer reusable rule sync publication runtime 004","scenario_hash":"2cfe95770c99ec0550a772218fc9a25cb90ee422e4f18ed48c5b490238c9cd27","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-17T20:12:41.314270864Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer reusable rule sync publication runtime

  Background:
    Given the built extension is running with production Rule Library, schema revision, validation, and persistence systems
    And reusable stable id reusable-51 revision 1 is attached to Page view revision 3 and Product detail revision 5

  # Data layer reusable rule sync publication runtime 001
  Scenario: Data layer reusable rule sync publication runtime 001
    When the operator saves reusable-51 revision 2 through the actual Rule Library DOM
    Then production storage retains Page view revision 3 and Product detail revision 5 byte-for-byte
    And production validation still attributes both schemas to reusable-51 revision 1
    And the actual DOM offers Sync attached schemas and publish revisions

  # Data layer reusable rule sync publication runtime 002
  Scenario: Data layer reusable rule sync publication runtime 002
    Given Page view attaches reusable-51 twice and Product detail attaches it once
    When the operator opens sync review through the actual DOM
    Then the rendered review identifies 2 schemas and 3 attachments
    And it identifies schema revision changes 3 to 4 and 5 to 6
    And production storage remains byte-for-byte unchanged

  # Data layer reusable rule sync publication runtime 003
  Scenario: Data layer reusable rule sync publication runtime 003
    When the operator confirms a valid sync review through the actual DOM
    Then production persistence atomically publishes Page view revision 4 and Product detail revision 6
    And all 3 current attachments are pinned to reusable-51 revision 2
    And production validation attributes new results to the new schema and reusable-rule revisions
    And persisted historical revisions and validation evidence retain reusable-51 revision 1
    And reloading storage preserves the complete revision histories

  # Data layer reusable rule sync publication runtime 004
  Scenario Outline: Data layer reusable rule sync publication runtime 004
    Given production sync encounters <sync_condition>
    When the operator attempts confirmation
    Then production storage has <storage_outcome>
    And the actual DOM reports <operator_outcome>

    Examples:
      | sync_condition                              | storage_outcome                  | operator_outcome                                      |
      | Product detail has an existing working draft | its complete pre-sync snapshot   | Publish or discard the Product detail draft first     |
      | Product detail revision publication fails  | every schema pre-sync snapshot   | no schema revision was published                      |
      | the operator cancels                       | every schema pre-sync snapshot   | sync review closed without publication                |
