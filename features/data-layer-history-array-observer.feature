# mutation-stamp: sha256=ee3308a8c4df8fbbb264f8cb9c340876ff75831a89af2494eb7d4a933a534506
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T14:52:28.197303994Z","feature_name":"Data layer history array observer","feature_path":"features/data-layer-history-array-observer.feature","background_hash":"97a8a64aaa748292b8377b9c3963c2e12fe45af9505e0d2b7819e08554310b72","implementation_hash":"sha256:4d593652048c949e3b38c911a0a27fddd953996195eca9e991129a90ed07ba84","scenarios":[{"index":0,"name":"Data layer history array observer 001","scenario_hash":"4bb36fdd3ae82ed68203e2eec690fd5126cbb8368e5a089645d81cdf9cbdff9b","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:00:15.682851565Z"},{"index":1,"name":"Data layer history array observer 002","scenario_hash":"a311213492c477f6df5f53111a948f98ea5a19c3a72f6e5552036dcfc67720c5","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:00:15.682851565Z"},{"index":2,"name":"Data layer history array observer 003","scenario_hash":"566ca19dd2807bcc402fb21c08317285124803bb6997a562db0cb71deb4c41c9","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:00:15.682851565Z"},{"index":3,"name":"Data layer history array observer 004","scenario_hash":"5be9fe6d159d5993e291a840d258bf633fc37c4d60440f05632d23b9b14b5281","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:00:15.682851565Z"},{"index":4,"name":"Data layer history array observer 005","scenario_hash":"80356c25abf3093621403dc7f94dda2c3d0698ab571eb98db3598c7b801ce891","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:00:15.682851565Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer history array observer

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer history array observer 001
  Scenario Outline: Data layer history array observer 001
    When page <page_url> appends history entry <event_name> with payload <payload_label>
    Then the extension records a new observed event entry
    And the observed event entry URL is <page_url>
    And the observed event entry timestamp is recorded
    And the observed event entry observer path is <history_path>
    And the observed event entry name is <event_name>
    And the observed event entry payload is <payload_label>
    And the observed event entry raw value is retained

    Examples:
      | project_name         | history_path  | page_url                | event_name | payload_label |
      | my-chrome-utilities | queue.history | https://example.test/p/ | signup     | signup-values |

  # Data layer history array observer 002
  Scenario Outline: Data layer history array observer 002
    When the page calls push on the configured history array with entry <event_name>
    Then the page push return value is preserved
    And the original page push behavior is preserved
    And the page-owned history array remains readable by page scripts
    And the extension records entry <event_name> without causing a page script error

    Examples:
      | project_name         | history_path  | event_name |
      | my-chrome-utilities | queue.history | signup     |

  # Data layer history array observer 003
  Scenario Outline: Data layer history array observer 003
    Given the observer is attached on page <start_url>
    When the active tab navigates to page <next_url>
    Then the observer is reinstalled for history array path <history_path>
    And exactly one observer is active for the page
    And entries added after navigation are captured once with URL <next_url>

    Examples:
      | project_name         | history_path  | start_url             | next_url                 |
      | my-chrome-utilities | queue.history | https://example.test/ | https://example.test/p/  |

  # Data layer history array observer 004
  Scenario Outline: Data layer history array observer 004
    When the configured history array path cannot be observed
    Then the observer reports status <status>
    And the observer does not break the page

    Examples:
      | project_name         | history_path | status       |
      | my-chrome-utilities | missing.path | path missing |
      | my-chrome-utilities | queue.value  | not an array |

  # Data layer history array observer 005
  Scenario Outline: Data layer history array observer 005
    When data layer observer capabilities are inspected
    Then object push events with event fields are not observed
    And analytics beacons are not observed
    And object snapshots are not captured

    Examples:
      | project_name         | history_path  |
      | my-chrome-utilities | queue.history |
