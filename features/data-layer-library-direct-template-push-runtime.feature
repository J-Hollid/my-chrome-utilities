# mutation-stamp: sha256=c302ed6decbcf22ce017a048041e8d13bb7ca823281c96d6e7d97215f785636a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T18:04:25.005082812Z","feature_name":"Data layer Library direct template push runtime","feature_path":"features/data-layer-library-direct-template-push-runtime.feature","background_hash":"1cd826d2b273414904491d248976bee25e8b64cd1290770ed7dcc3700665ff45","implementation_hash":"sha256:ca5b10daa4b520221e7e36ffcc842e47a24f247999c67f0289ba8f931c227303","scenarios":[{"index":3,"name":"Data layer Library direct template push runtime 004","scenario_hash":"6308611557b01fe084664764a4d141248011e06d1167258c88e4845acd35599d","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T18:04:25.005082812Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Library direct template push runtime

  Background:
    Given the built extension side panel is running with the production Event Library, editor, selected-target push, and feedback controls
    And production Library row Purchase confirmation version 3 stores event purchase, destination dataLayer, and transaction_id test-123
    And production target Signal Shop is selected and ready

  # Data layer Library direct template push runtime 001
  Scenario: Data layer Library direct template push runtime 001
    Given the production Library editor is closed
    When the operator clicks Library row Push on Purchase confirmation
    Then production selected-target execution pushes exactly one saved purchase payload to Signal Shop at dataLayer
    And the production Library editor remains hidden
    And the row list and current search remain rendered
    And production Library feedback announces the successful target and destination

  # Data layer Library direct template push runtime 002
  Scenario: Data layer Library direct template push runtime 002
    Given the production editor contains an unsaved Product detail draft
    When the operator clicks Library row Push on Purchase confirmation
    Then production execution uses Purchase confirmation version 3 and transaction_id test-123
    And the editor still displays the unchanged Product detail draft
    And no editor field is replaced with Purchase confirmation data

  # Data layer Library direct template push runtime 003
  Scenario: Data layer Library direct template push runtime 003
    Given the production editor contains an unsaved Purchase confirmation draft with transaction_id test-456
    When the operator clicks Library row Push on Purchase confirmation
    Then production execution receives saved transaction_id test-123
    And the editor retains unsaved transaction_id test-456
    And clicking Push draft still opens the production draft review for transaction_id test-456

  # Data layer Library direct template push runtime 004
  Scenario Outline: Data layer Library direct template push runtime 004
    Given production direct push encounters <runtime_condition>
    When the operator clicks Library row Push on Purchase confirmation
    Then production creates no page event
    And production Library feedback reports <result>
    And the production editor remains in its prior open or closed state
    And persisted Purchase confirmation remains byte-for-byte unchanged

    Examples:
      | runtime_condition         | result                            |
      | no selected target        | Select a target before pushing     |
      | target access unavailable | Request access for Signal Shop     |
      | page injection failure    | Push to Signal Shop failed         |
