# mutation-stamp: sha256=6109826a367765d3a23f6cd80685211d636c76c83e97b366b692a2797af4f0c0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T14:45:44.432853743Z","feature_name":"Data layer session recovery","feature_path":"features/data-layer-session-recovery.feature","background_hash":"7eff79698fd64e8f9a3868028adc9e1e92c8ecb38c6e280eb613d153d0449040","implementation_hash":"sha256:a861be1c43607d590eebcca328c010e3d7d5c55e4d4647fc93c335765a6e9efb","scenarios":[{"index":0,"name":"Data layer session recovery 001","scenario_hash":"a4c52ef998a6c60eb4e7f99e353df6b18bf52718b568b540529e65ca8bb60aa4","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:14:24.269934264Z"},{"index":1,"name":"Data layer session recovery 002","scenario_hash":"e3a74ef30ca880133e11b2ac70a9676c5792698b665b728255515f4db357902b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:14:24.269934264Z"},{"index":2,"name":"Data layer session recovery 003","scenario_hash":"d2d2b3c714f574d3775fea6b4bc8461b06206dc84446f0b6928e36296047f15a","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:14:24.269934264Z"},{"index":3,"name":"Data layer session recovery 004","scenario_hash":"7d69cc3c44317e434f994a1f0dfc4d5aa25ffa852f7a1ec192bd6fe3eee02810","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:14:24.269934264Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer session recovery

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer session recovery 001
  Scenario Outline: Data layer session recovery 001
    Given observed event entry <event_name> was captured on page <page_url>
    When the side panel is reopened after same-tab navigation to <next_url>
    Then the timeline still includes event entry <event_name>
    And the configured history array path <history_path> is restored
    And the event entry remains associated with page <page_url>

    Examples:
      | project_name         | history_path  | page_url                | next_url                    | event_name |
      | my-chrome-utilities | queue.history | https://example.test/p/ | https://example.test/cart/  | signup     |

  # Data layer session recovery 002
  Scenario Outline: Data layer session recovery 002
    When the active tab refreshes during a data layer testing session
    Then observer attachment status <status> is shown
    And the user can restart observation for the active tab

    Examples:
      | project_name         | status     |
      | my-chrome-utilities | attached   |
      | my-chrome-utilities | needs sync |

  # Data layer session recovery 003
  Scenario Outline: Data layer session recovery 003
    Given a data layer testing session was intentionally ended
    When the side panel is reopened
    Then the ended session remains ended
    And the observer is not reattached automatically

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Data layer session recovery 004
  Scenario Outline: Data layer session recovery 004
    When data layer session recovery features are inspected
    Then cross-device sync is not present
    And automatic background monitoring of every tab is not present

    Examples:
      | project_name         |
      | my-chrome-utilities |
