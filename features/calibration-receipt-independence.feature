# mutation-stamp: sha256=962dc2ee5343094578364d68df795d1ba9978ef96b5e612e75e3871aa0adbc12
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-05T18:46:37.281965689Z","feature_name":"Calibration receipt independence","feature_path":"features/calibration-receipt-independence.feature","background_hash":"ff6f660c882a3cfed2b499ff87c84f1e64c12a4d25ca97e87d3b4bf34825e16d","implementation_hash":"sha256:43d06ee18bf5ecb1de44eff0f807d12bcb9256ae566d2cc5c6259469c482ee72","scenarios":[{"index":0,"name":"Calibration receipt independence 001","scenario_hash":"f8c64fe14214d6494e09653bb7340c9dccc24f94b5cb5c035767dd651a04d130","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-09-05T18:46:37.281965689Z"},{"index":1,"name":"Calibration receipt independence 002","scenario_hash":"5261a02377a0b8ba44ff060b3f4bb4c2b8f81dea027ee63f0110b1cd8c96cf11","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-09-05T18:46:37.281965689Z"},{"index":2,"name":"Calibration receipt independence 003","scenario_hash":"53076358538230630d6daadcbf50ad7944b23d3eed046cdde9bdbc7a3cf95dd1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-09-05T18:46:37.281965689Z"},{"index":3,"name":"Calibration receipt independence 004","scenario_hash":"d53392e229a19cb9a26fec5b1d4d9c2954b9c2270ec448e8c7d737e3a4c2aee8","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-05T18:46:37.281965689Z"}]}
# acceptance-mutation-manifest-end

# Calibration receipt independence 001
# Calibration receipt independence 002
# Calibration receipt independence 003
# Calibration receipt independence 004
Feature: Calibration receipt independence

  Background:
    Given historical calibration data is distinct from fresh verification evidence

  # Calibration receipt independence 001
  Scenario Outline: Calibration receipt independence 001
    Given temporary calibration sources are <source_state>
    When the calibration and regression-routing rule tests run with fixed authored inputs
    Then their result is independent of those temporary sources
    And they execute the real calibration rules without changing the committed aggregate

    Examples:
      | source_state |
      | absent |
      | populated with unrelated worker receipts |

  # Calibration receipt independence 002
  Scenario Outline: Calibration receipt independence 002
    Given a fixed calibration input has condition <condition>
    When the raw measurement validator checks it
    Then its result is <result>

    Examples:
      | condition | result |
      | valid declared samples within the cutoff | accepted |
      | an eligible sample omitted from declarations | rejected |
      | duplicate declarations | rejected |
      | a declared sample with no raw or validated compact identity | rejected |
      | a rejected receipt declared as eligible | rejected |
      | a declared receipt from another environment | rejected |
      | a declared receipt after the cutoff | rejected |
      | compact retirement identity differs from available raw evidence | rejected |

  # Calibration receipt independence 003
  Scenario Outline: Calibration receipt independence 003
    Given a declared historical sample has source state <source_state>
    When its aggregate provenance is recorded
    Then it retains disposition <disposition>
    And historical values cannot be presented as fresh verified measurements

    Examples:
      | source_state | disposition |
      | one of the six identified missing raw samples | unavailable with its original digest and no invented completion identity |
      | the seventh sample with an existing validated retirement record | that unchanged compact retirement identity |

  # Calibration receipt independence 004
  Scenario Outline: Calibration receipt independence 004
    Given a receipt has consumer state <consumer_state>
    When calibration retention is determined
    Then it applies <retention>
    And it does not bypass any other active consumer or evidence obligation

    Examples:
      | consumer_state | retention |
      | only the explicitly disposed historical calibration reference | no calibration-only retention or old-ledger read |
      | an active calibration without the historical disposition | existing raw or validated compact input rules |
      | a pending review or active incident | existing consumer retention |
      | malformed or incorrectly bound historical provenance | reject the disposition without authorizing cleanup |
