# mutation-stamp: sha256=de8cc4d9a265a1d67343505bc6e93a7791f24227aace775abdb3e2e87c6beb72
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T17:15:21.767535708Z","feature_name":"Data layer observation target lifecycle","feature_path":"features/data-layer-observation-target-lifecycle.feature","background_hash":"99218bee3332e5401661ba5a6c5a3b24be69edd1a586f0e55941c576886723b9","implementation_hash":"sha256:architect-semantic-review-v3","scenarios":[{"index":0,"name":"Data layer observation target lifecycle 001","scenario_hash":"9312cba2f47217457f7299649e5e025f7eb080dec70fd7898b46eaec007d0439","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:21.767535708Z"},{"index":1,"name":"Data layer observation target lifecycle 002","scenario_hash":"bb23e205c137e96265b52b3f4ba6ab9079116d8056f2dcd953298563d8eb7be2","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:21.767535708Z"},{"index":2,"name":"Data layer observation target lifecycle 003","scenario_hash":"6140cf1a970ea5543280e02eaada8f2836b85ad7eedbb655b776e085678f133a","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:21.767535708Z"},{"index":3,"name":"Data layer observation target lifecycle 004","scenario_hash":"aa987cd43f77c5a4244f3e5a3b5783dc1baed27d2262e880a7c6036d0369aaa4","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:21.767535708Z"},{"index":4,"name":"Data layer observation target lifecycle 005","scenario_hash":"54d0d65c50ca859abbf65aa133bbe153c986c035efb52de045b027e3b9b45010","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:21.767535708Z"},{"index":5,"name":"Data layer observation target lifecycle 006","scenario_hash":"d18fda610f83d5976bdb3a411c011c118fd4055427998ec8b92e65e803986ad4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:21.767535708Z"},{"index":6,"name":"Data layer observation target lifecycle 007","scenario_hash":"7248c476d5040a8bf2a0da7ff12236d2c78ca78cebd2400e18c347c7fd465151","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:21.767535708Z"},{"index":7,"name":"Data layer observation target lifecycle 008","scenario_hash":"8a32f81e74fa58b618f4ea81f16b6022dfa48ff5554dcffcc99af5311885bec5","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:21.767535708Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer observation target lifecycle

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is attached to target <page_title> in tab <tab_id>
    And history array path <history_path> is configured

  # Data layer observation target lifecycle 001
  Scenario Outline: Data layer observation target lifecycle 001
    When the user activates another browser tab <other_tab>
    Then observation remains attached to <page_title> in tab <tab_id>
    And the Live header indicates when the target is not the visibly active tab
    And events pushed in <page_title> continue to enter the active session
    And events pushed in <other_tab> are not captured by that session

    Examples:
      | project_name         | history_path  | page_title | tab_id | other_tab |
      | my-chrome-utilities | event.history | Checkout   | 42     | Docs      |

  # Data layer observation target lifecycle 002
  Scenario Outline: Data layer observation target lifecycle 002
    Given target <page_title> is at page <start_url>
    When tab <tab_id> navigates to <next_url>
    Then the same testing session remains pinned to tab <tab_id>
    And its current target URL becomes <next_url>
    And observation is reattached once for <history_path> on the new page
    And existing captured events retain page <start_url>

    Examples:
      | project_name         | history_path  | page_title | tab_id | start_url                           | next_url                               |
      | my-chrome-utilities | event.history | Checkout   | 42     | https://shop.example.test/checkout | https://shop.example.test/confirmation |

  # Data layer observation target lifecycle 003
  Scenario Outline: Data layer observation target lifecycle 003
    When target tab <tab_id> is closed
    Then capture stops for target <page_title>
    And the active session enters target state <target_state> without losing captured events
    And actions offer Save session, End session, and Choose target
    And observation is not transferred to another tab automatically

    Examples:
      | project_name         | history_path  | page_title | tab_id | target_state       |
      | my-chrome-utilities | event.history | Checkout   | 42     | Target unavailable |

  # Data layer observation target lifecycle 004
  Scenario Outline: Data layer observation target lifecycle 004
    When session action <session_action> intentionally ends the session
    Then all runtime listeners and page hooks for tab <tab_id> are removed
    And target <page_title> is retained as the recent target in detached state
    And the ended session remains ended
    And target <page_title> is not reattached automatically

    Examples:
      | project_name         | history_path  | page_title | tab_id | session_action |
      | my-chrome-utilities | event.history | Checkout   | 42     | End testing   |

  # Data layer observation target lifecycle 005
  Scenario Outline: Data layer observation target lifecycle 005
    Given the prior session ended with recent target <page_title>
    When a new testing session is prepared and tab <tab_id> is still available
    Then <page_title> is preselected as the recent target
    And its current URL and access state are revalidated
    And observation starts only after an explicit Start testing action

    Examples:
      | project_name         | history_path  | page_title | tab_id |
      | my-chrome-utilities | event.history | Checkout   | 42     |

  # Data layer observation target lifecycle 006
  Scenario Outline: Data layer observation target lifecycle 006
    When the side panel is reopened while the session is active
    Then persisted target identity is checked against open tab <tab_id>
    And observation resumes only when the tab, page access, and active session still match
    And successful recovery restores target <page_title> without choosing the currently visible tab
    And failed recovery shows a target-specific recovery state without creating a new session

    Examples:
      | project_name         | history_path  | page_title | tab_id |
      | my-chrome-utilities | event.history | Checkout   | 42     |

  # Data layer observation target lifecycle 007
  Scenario Outline: Data layer observation target lifecycle 007
    Given access to target origin <origin> is revoked while the session is active
    When the next page read or history push would be processed
    Then observation detaches from tab <tab_id>
    And the session enters target state <target_state>
    And no further page content or events are read without permission
    And captured session content remains available

    Examples:
      | project_name         | history_path  | page_title | tab_id | origin                    | target_state       |
      | my-chrome-utilities | event.history | Checkout   | 42     | https://shop.example.test | Permission required |

  # Data layer observation target lifecycle 008
  Scenario Outline: Data layer observation target lifecycle 008
    Given an active session is attached to <page_title>
    When the user confirms End and attach to <new_target>
    Then the current session ends without changing its captured events or target provenance
    And a new session is created for <new_target>
    And no captured event is moved between the two sessions
    And only the new session owns an active observer

    Examples:
      | project_name         | history_path  | page_title | tab_id | new_target            |
      | my-chrome-utilities | event.history | Checkout   | 42     | Purchase confirmation |
