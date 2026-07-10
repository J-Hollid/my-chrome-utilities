# mutation-stamp: sha256=445367e760cc8945a9c9069ffb60015ed2e265ab8aa0b6397845cbf4ed886e90
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T17:15:07.866795525Z","feature_name":"Data layer observation target selection","feature_path":"features/data-layer-observation-target-selection.feature","background_hash":"7d473f8456657ed0cbfa1d75689fb4a4ed7abd2080e091333d9fec71e8009cba","implementation_hash":"sha256:architect-semantic-review-v3","scenarios":[{"index":0,"name":"Data layer observation target selection 001","scenario_hash":"c8bcd731297a031ac7db5a5de4edc4317f4a5b597dc7f84223abefde0326033f","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:07.866795525Z"},{"index":1,"name":"Data layer observation target selection 002","scenario_hash":"c1524f8f163fe96e49511efe8072750d9f300d5e0adb619e0e547d6cf08098ff","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:07.866795525Z"},{"index":2,"name":"Data layer observation target selection 003","scenario_hash":"0fead5a8d7a2f7beb52d467c8157da9a5b1e91626f803307da7932dbd70a0008","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:07.866795525Z"},{"index":3,"name":"Data layer observation target selection 004","scenario_hash":"ec4e1c813d06ced8ab5507ce6a7622f49a9ac89da8976d00537b4ee230e63663","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:07.866795525Z"},{"index":4,"name":"Data layer observation target selection 005","scenario_hash":"2dd872fe7c937ca3fed6357260330ae83dc8f792951f2f2dc9eb53e36617f8a5","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:07.866795525Z"},{"index":5,"name":"Data layer observation target selection 006","scenario_hash":"c8d99b52b81e65af063b6fd85dc6af4ad121e5b2e82b0264489c58f87f32b39d","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:07.866795525Z"},{"index":6,"name":"Data layer observation target selection 007","scenario_hash":"14ca9f6b08fa7530b15f020cdceb3f286e56db5336c971f29f6d371a0362ad67","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:07.866795525Z"},{"index":7,"name":"Data layer observation target selection 008","scenario_hash":"56bec34fc6bbe16481cb506f13640d820c447dd4d06a8a5d076c02df1953b372","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:07.866795525Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer observation target selection

  Background:
    Given a repository for project <project_name>
    And the Data Layer Live view is displayed
    And history array path <history_path> is configured

  # Data layer observation target selection 001
  Scenario Outline: Data layer observation target selection 001
    Given no observation target is selected
    When the Live session header is displayed
    Then target state <target_state> is shown before the session actions
    And Start testing identifies that a target page must be selected
    And the extension side-panel URL is not presented as a target page
    And visible action <selection_action> opens observation target selection

    Examples:
      | project_name         | history_path  | target_state | selection_action |
      | my-chrome-utilities | event.history | Detached     | Choose target    |

  # Data layer observation target selection 002
  Scenario Outline: Data layer observation target selection 002
    Given discovery contains eligible pages in browser windows <window_names>
    When the observation target picker is displayed
    Then candidates are grouped by browser window with the current window first
    And each candidate shows page title, hostname and path, window context, active-tab state, access state, and prior-session state
    And the current target is listed before the current active tab, recent targets, and remaining candidates
    And page URLs remain secondary to recognizable page titles

    Examples:
      | project_name         | history_path  | window_names          |
      | my-chrome-utilities | event.history | Main and Test checkout |

  # Data layer observation target selection 003
  Scenario Outline: Data layer observation target selection 003
    Given target candidates include pages <page_titles>
    When the user searches for <query>
    Then only candidates matching <query> by title, hostname, URL, or window context are shown
    And the picker reports the matching target count
    When the search is cleared
    Then candidates <page_titles> are shown again

    Examples:
      | project_name         | history_path  | page_titles                              | query    |
      | my-chrome-utilities | event.history | Home, Checkout, and Purchase confirmation | purchase |

  # Data layer observation target selection 004
  Scenario Outline: Data layer observation target selection 004
    Given candidate page <page_title> has access state <access_state>
    When its target row is displayed
    Then status <access_state> and explanation <status_explanation> are shown without relying on color alone
    And target action <target_action> is available only when it can advance attachment

    Examples:
      | project_name         | history_path  | page_title            | access_state        | status_explanation                    | target_action      |
      | my-chrome-utilities | event.history | Purchase confirmation | Ready               | Page can be observed                   | Select             |
      | my-chrome-utilities | event.history | Checkout              | Permission required | Site access is required                | Request access     |
      | my-chrome-utilities | event.history | Extensions            | Restricted          | Chrome pages cannot be observed        | unavailable        |
      | my-chrome-utilities | event.history | Closed checkout       | Closed              | The browser tab is no longer available | unavailable        |

  # Data layer observation target selection 005
  Scenario Outline: Data layer observation target selection 005
    Given eligible page <page_title> at <page_url> is selected
    When the extension checks <history_path> on that target
    Then the selected target retains its exact tab id, window id, <page_url>, title, and origin
    And page access state <page_access_state> is shown separately from history-path state <path_state>
    And a missing history path does not cause another tab to be selected implicitly

    Examples:
      | project_name         | history_path  | page_title            | page_url                              | page_access_state | path_state   |
      | my-chrome-utilities | event.history | Purchase confirmation | https://shop.example.test/confirmation | Available         | Ready        |
      | my-chrome-utilities | event.history | Checkout              | https://shop.example.test/checkout     | Available         | Path missing |

  # Data layer observation target selection 006
  Scenario Outline: Data layer observation target selection 006
    Given selected target <page_title> has tab id <tab_id> and page URL <page_url>
    When data layer testing starts
    Then the active testing session is pinned to tab id <tab_id>
    And the Live header shows state <target_state>, <page_title>, <page_url>, and <history_path>
    And observation reads and hooks only the selected target
    And changing the browser's visibly active tab does not change the session target

    Examples:
      | project_name         | history_path  | page_title            | tab_id | page_url                              | target_state |
      | my-chrome-utilities | event.history | Purchase confirmation | 42     | https://shop.example.test/confirmation | Attached     |

  # Data layer observation target selection 007
  Scenario Outline: Data layer observation target selection 007
    Given an active session is attached to target <current_target>
    When the user selects different target <new_target>
    Then the existing session remains attached to <current_target>
    And a confirmation offers Keep current session or End and attach to <new_target>
    When the user chooses Keep current session
    Then no observer is attached to <new_target>
    And captured events in the current session remain unchanged

    Examples:
      | project_name         | history_path  | current_target | new_target            |
      | my-chrome-utilities | event.history | Checkout       | Purchase confirmation |

  # Data layer observation target selection 008
  Scenario Outline: Data layer observation target selection 008
    Given two open tabs <first_tab> and <second_tab> have the same page URL <page_url>
    When same-URL target candidates are resolved
    Then <first_tab> and <second_tab> are distinct candidates
    And selecting <second_tab> stores its tab and window identity rather than selecting by URL
    And only one observation target can be attached to the active testing session

    Examples:
      | project_name         | history_path  | first_tab          | second_tab         | page_url                           |
      | my-chrome-utilities | event.history | Checkout tab 1     | Checkout tab 2     | https://shop.example.test/checkout |
