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
