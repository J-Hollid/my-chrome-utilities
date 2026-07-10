# mutation-stamp: sha256=a39b1eb0191e5f36d6a810be09a3662dc979f1598c2b15eb6b904da05048d741
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T12:51:53.360366050Z","feature_name":"Data layer saved session library","feature_path":"features/data-layer-saved-session-library.feature","background_hash":"a9e7cc50a3ef2e769935c5769ef92652d212fdfd2ccb6fcdf638752e617b00a7","implementation_hash":"sha256:saved-sessions-semantic-v1","scenarios":[{"index":0,"name":"Data layer saved session library 001","scenario_hash":"398593fb316fbc7e537dfb8f2ea06f63d6b0d8bb8fa3837061b44e7fe7e65039","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:51:53.360366050Z"},{"index":1,"name":"Data layer saved session library 002","scenario_hash":"722dfb0bcfc2ec01300a2eeb619cd4e6783c964407460558dfdb11abc052000d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:51:53.360366050Z"},{"index":2,"name":"Data layer saved session library 003","scenario_hash":"d28cfaa1c705d2e231da7152ebcc1e9da769407e965ba254db783131c2d1bc10","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:51:53.360366050Z"},{"index":3,"name":"Data layer saved session library 004","scenario_hash":"d628b1466bbabaa641e83e0b94398c8c19f63abf9abaaa38a598f1e2cbfba930","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:51:53.360366050Z"},{"index":4,"name":"Data layer saved session library 005","scenario_hash":"851a9baa4b9afa0d1218cf312c64c7fc08bb70efd8dbe078fc21f66d7fc7e674","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:51:53.360366050Z"},{"index":5,"name":"Data layer saved session library 006","scenario_hash":"f2d9d6988eaaab159fa11405ea8b2a7f10f21d41adeda91f56ac1f62df5e6c80","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:51:53.360366050Z"}]}
# acceptance-mutation-manifest-end

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
