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
