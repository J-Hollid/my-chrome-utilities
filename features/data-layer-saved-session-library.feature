Feature: Data layer saved session library

  Background:
    Given a repository for project <project_name>
    And a completed data layer testing session contains captured events

  # Data layer saved session library 001
  Scenario Outline: Data layer saved session library 001
    When the user saves the completed session as <session_name>
    Then an immutable saved session named <session_name> is added to the Sessions view
    And the saved session shows capture date, page scope, duration, source count, event count, and validation summary
    And subsequent live capture cannot append events to the saved session

    Examples:
      | project_name         | session_name    |
      | my-chrome-utilities | Checkout journey |

  # Data layer saved session library 002
  Scenario Outline: Data layer saved session library 002
    Given saved session <session_name> contains event <event_name> from source <source_name>
    When saved session <session_name> is opened later
    Then the observer workspace is visibly in Archived session mode
    And event <event_name> retains its source, page, capture order, payload, and raw input
    And no live observer is started automatically

    Examples:
      | project_name         | session_name    | event_name | source_name   |
      | my-chrome-utilities | Checkout journey | purchase   | Event history |

  # Data layer saved session library 003
  Scenario Outline: Data layer saved session library 003
    Given saved session <session_name> is open in Archived session mode
    When the user resumes capture from the saved session on page <page_url>
    Then a new active session is created and linked to <session_name>
    And saved session <session_name> remains unchanged
    And new events are captured only in the new active session

    Examples:
      | project_name         | session_name    | page_url                          |
      | my-chrome-utilities | Checkout journey | https://example.test/confirmation |

  # Data layer saved session library 004
  Scenario Outline: Data layer saved session library 004
    Given saved session <session_name> contains events from <source_names>
    When the user exports the saved session and imports it later
    Then the restored session preserves event ids, source identities, capture order, payloads, raw inputs, and provenance
    And the restored session remains an immutable archive

    Examples:
      | project_name         | session_name    | source_names                    |
      | my-chrome-utilities | Checkout journey | Event history and Adobe beacons |

  # Data layer saved session library 005
  Scenario Outline: Data layer saved session library 005
    Given saved sessions <session_names> are listed
    When the user searches for <query>
    Then only saved sessions matching <query> by name, page, source, or event name are listed
    And session actions offer Open, Rename, Export, Create sequence, and Delete

    Examples:
      | project_name         | session_names                         | query    |
      | my-chrome-utilities | Checkout journey, Newsletter signup   | purchase |

  # Data layer saved session library 006
  Scenario Outline: Data layer saved session library 006
    Given saved session <session_name> is listed
    When the user requests deletion
    Then a confirmation names saved session <session_name>
    When the user cancels deletion
    Then saved session <session_name> remains listed
    When the user requests deletion again and confirms it
    Then saved session <session_name> is removed from the Sessions view

    Examples:
      | project_name         | session_name     |
      | my-chrome-utilities | Checkout journey |
