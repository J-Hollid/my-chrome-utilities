# mutation-stamp: sha256=50dc8dc4bef6b6e759f58e9c6a8d9662ade384a3c564f65854e7bd9ebd4a56e0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-12T06:06:05.713797761Z","feature_name":"Tealium connection recovery","feature_path":"features/tealium-connection-recovery.feature","background_hash":"5c8f9e188a006c1652def01549a488bfda39c0763bf05ef69636bff3a0d04f68","implementation_hash":"sha256:a422f9ea9de086dd8a34176f6aa139c85024a68b630a334b9ccf5c3db2a4f5ae","scenarios":[{"index":0,"name":"Tealium connection recovery 001","scenario_hash":"6b31247d4618b0446fbb8a42401b63550bb271d2f29b265c9dd5853e12a5bc23","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-09-12T06:03:05.248671674Z"},{"index":1,"name":"Tealium connection recovery 002","scenario_hash":"e8c4fbc85762176bce057930037e937eaad97b71a049a291afb44fd13d91d74e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-09-12T06:03:05.248671674Z"},{"index":2,"name":"Tealium connection recovery 003","scenario_hash":"e830e4d952d14fad5e59c9907dbae2c04a21d08d7ea046ff4e288d37f7fdf075","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-09-12T06:03:05.248671674Z"}]}
# acceptance-mutation-manifest-end

# Tealium connection recovery 001 through 003; user resumed implementation on 2026-09-12.
Feature: Tealium connection recovery

  Background:
    Given Tealium Live observes a bound website with its DevTools open

  # Tealium connection recovery 001
  Scenario Outline: Tealium connection recovery 001
    Given the connection has recovered after <shutdowns> separate worker shutdowns
    And each recovered connection was accepted without a selected tag or source request
    When the worker stops again and a new connection is accepted
    Then source navigation recovers without reopening DevTools or restarting Live
    And selecting a current tag permits a new explicit source action

    Examples:
      | shutdowns |
      | 6         |
      | 8         |

  # Tealium connection recovery 002
  Scenario Outline: Tealium connection recovery 002
    Given a previously confirmed connection is lost
    When recovery has outcome <outcome>
    Then the connection feedback is <feedback>
    And observation and a valid selection remain intact
    And recovery does not repeat an old source action

    Examples:
      | outcome                     | feedback                                    |
      | another attempt is pending  | Reconnecting to DevTools...                  |
      | six retries fail            | Cannot connect to DevTools for this website. |

  # Tealium connection recovery 003
  Scenario Outline: Tealium connection recovery 003
    Given the recovery controller receives <condition>
    When it evaluates another connection attempt
    Then it applies <outcome>
    And no stale message enables a source action

    Examples:
      | condition                        | outcome                                 |
      | a current accepted connection    | reset the consecutive failure allowance |
      | a port without confirmation      | retain the consecutive failure count    |
      | a confirmation from a replaced port | retain the consecutive failure count |
      | six consecutive failed retries   | stop automatic retries                  |
      | an invalid extension context     | stop automatic retries                  |
      | disposal                         | stop automatic retries                  |
