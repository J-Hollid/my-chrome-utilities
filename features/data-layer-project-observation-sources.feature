# User-approved 2026-09-08: project-multiple-observation-sources.
# Data layer project observation sources 001 through 013
Feature: Data layer project observation sources

  Background:
    Given Retail is the active project with default push path commandQueue
    And Retail has enabled sources Marketing at dataLayer and Application at event.history
    And the selected target tab has separate arrays at both observation paths

  # Data layer project observation sources 001
  Scenario Outline: Data layer project observation sources 001
    Given the selected target has an array at <path>
    When the operator adds enabled source <name> at <path> in Data Layer Settings
    Then the source list contains Marketing, Application, and <name> at their configured paths
    And <name> has a stable source identity and its own Ready status
    When the project is saved and reopened
    Then all three source identities, names, paths, and enabled states return unchanged
    And Default push path remains commandQueue

    Examples:
      | name     | path          |
      | Checkout | checkoutQueue |
      | Consent  | consent.log   |

  # Data layer project observation sources 002
  Scenario Outline: Data layer project observation sources 002
    Given the operator has entered source name <name> and path <path>
    When the operator tries to save that source
    Then the source edit shows <error>
    And the committed source list and active subscriptions remain unchanged

    Examples:
      | name      | path              | error                          |
      | Duplicate | window.dataLayer  | Observation path already added |
      | Duplicate | event.history     | Observation path already added |
      | Invalid   | queue..history    | Enter a valid array path       |
      | Invalid   | __proto__.history | Enter a valid array path       |

  # Data layer project observation sources 003
  Scenario Outline: Data layer project observation sources 003
    Given both source arrays are empty
    When Live capture starts and receives <receipt_order> in that order
    Then All sources shows <receipt_order> once each in that order
    And each event and its inspector identify its configured source name and path
    When the source filter is set to <selected_source>
    Then the visible source is <selected_source> with count <count>
    And capture continues for both sources
    When the source filter is cleared
    Then All sources shows <receipt_order> again without creating new events

    Examples:
      | receipt_order                          | selected_source | count |
      | Marketing:A, Application:B, Marketing:C | Marketing       | 2     |
      | Application:A, Marketing:B             | Application     | 1     |

  # Data layer project observation sources 004
  Scenario Outline: Data layer project observation sources 004
    Given Application resolves to <value> instead of an array
    When testing starts
    Then Marketing is Ready and Application shows <status>
    And Marketing captures its pushed events while Application captures none
    When the page creates an array at event.history containing <event>
    Then Application becomes Ready without another Start testing action
    And <event> appears once with Application source identity
    And Marketing remains connected without repeating earlier events

    Examples:
      | value   | status           | event            |
      | missing | Waiting for path | checkout_started |
      | 17      | Not an array     | consent_updated  |

  # Data layer project observation sources 005
  Scenario Outline: Data layer project observation sources 005
    Given each source has captured one event named <event_name> with payload <payload>
    And an Assignment for <event_name> targets Marketing only
    When the operator inspects both captured events
    Then two distinct events retain their respective source identities
    And the Marketing Assignment is not applied to the Application event
    And source identity is retained in saved session and defect evidence

    Examples:
      | event_name | payload       |
      | purchase   | {"value":10}  |
      | pageview   | {"page":"/"} |

  # Data layer project observation sources 006
  Scenario Outline: Data layer project observation sources 006
    Given Marketing has captured <first> from the current dataLayer array
    When the operator disables Marketing and the page pushes <later> to dataLayer
    Then Marketing shows Disabled and <later> is not captured while disabled
    And Application continues capturing its events
    When the operator enables Marketing again
    Then Marketing contains <first> followed by <later> once each
    When the operator removes Marketing and confirms removal
    Then Marketing configuration is removed and no further Marketing events are captured
    And its captured events retain their source identity, name, and path

    Examples:
      | first    | later    |
      | pageview | purchase |
      | consent  | signup   |

  # Data layer project observation sources 007
  Scenario Outline: Data layer project observation sources 007
    Given Marketing has captured <first> from the current dataLayer array
    And the selected target has an array at <path>
    When the operator renames Marketing to <name> and changes its path to <path>
    Then the configured source retains its stable identity and observes only <path>
    And earlier events retain the Marketing name and dataLayer path
    And later events show <name> and <path>
    And Application and commandQueue remain unchanged

    Examples:
      | first    | name      | path           |
      | pageview | Analytics | analyticsQueue |
      | purchase | Store     | store.history  |

  # Data layer project observation sources 008
  Scenario Outline: Data layer project observation sources 008
    Given project Partner has only enabled source Partner at partnerQueue
    When the operator switches from Retail to Partner and starts its next capture
    Then subsequent capture uses only Partner at partnerQueue
    And late Retail callbacks cannot enter Partner capture
    When the operator returns to Retail through <route>
    Then Marketing and Application return with their stored identities and enabled states
    And previous observations retain their original project and source identities

    Examples:
      | route                    |
      | project switching        |
      | durable extension reload |

  # Data layer project observation sources 009
  Scenario Outline: Data layer project observation sources 009
    Given an older project has only observationHistoryPath <path> and defaultPushPath <push_path>
    When that project is loaded twice through the supported migration
    Then it has exactly one enabled source at <path> with the same identity on both loads
    And existing source references and default push path <push_path> are preserved
    And no production revision is created
    When the operator adds another source and exports and imports the project
    Then the imported project retains both source configurations and internal source references
    And the source project remains unchanged

    Examples:
      | path          | push_path |
      | queue.history | queue     |
      | dataLayer     | dataLayer |

  # Data layer project observation sources 010
  Scenario Outline: Data layer project observation sources 010
    Given a saved Library event has explicit Destination analyticsQueue
    When the operator filters Live to <source> and directly pushes a new event
    Then only commandQueue receives the direct push
    When a captured <source> event becomes a new Library draft
    Then the draft Destination starts as commandQueue
    When the saved Library event is pushed
    Then only analyticsQueue receives its exact saved payload
    And observation paths and saved Library destinations remain unchanged

    Examples:
      | source      |
      | Marketing   |
      | Application |

  # Data layer project observation sources 011
  Scenario: Data layer project observation sources 011
    When the operator disables both sources
    Then Start testing is unavailable with Enable an observation source guidance
    When the operator removes both sources with confirmation and reloads Retail
    Then the source list remains empty and no default source is added
    When the operator closes the active project
    Then source settings are unavailable with Open project guidance
    And no project or source is selected implicitly

  # Data layer project observation sources 012
  Scenario: Data layer project observation sources 012
    Given a source edit is ready to save
    When its durable save fails
    Then the last committed configuration remains active
    And the edit remains available with a save error and retry action
    When the same edit is retried and durable read-back succeeds
    Then the edit becomes active once and reopens unchanged

  # Data layer project observation sources 013
  Scenario Outline: Data layer project observation sources 013
    Given the operator is editing a source
    And the operator clears <field>
    When the operator tries to save that source
    Then the edit shows <error> at that field
    And the committed source list and active subscriptions remain unchanged

    Examples:
      | field | error                    |
      | Name  | Enter a source name      |
      | Path  | Enter a valid array path |
