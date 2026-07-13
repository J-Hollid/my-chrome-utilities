# mutation-stamp: sha256=9c2a8765f4fd9ed565048a417e0ee444a853eab869d93965f0f6aaa81b4c2cf3
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T15:35:49.617331628Z","feature_name":"Data layer same-page session restart runtime","feature_path":"features/data-layer-same-page-session-restart-runtime.feature","background_hash":"69afdd5c9e3898083df054cb29fd42f68304b1c37f6772c956657fa23367ecdf","implementation_hash":"sha256:50c687f20c94ffcc6a3090bfd599e9816dd9c6f637755d253a42242af6afaeeb","scenarios":[{"index":0,"name":"Data layer same-page session restart runtime 001","scenario_hash":"016b381952d10f591087fb94a04c8aa8c4a9c4281adabf846b3ddb869e3cec1b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-13T15:35:49.617331628Z"},{"index":1,"name":"Data layer same-page session restart runtime 002","scenario_hash":"c467ab57add778182fcb69b9900b243302920bf0ded721229de1880b820a15af","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-13T15:35:49.617331628Z"},{"index":2,"name":"Data layer same-page session restart runtime 003","scenario_hash":"fbd01c04ae782ef5b46666100170ed5da3f276722e727b1c18eb2cf98f488a51","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-07-13T15:35:49.617331628Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer same-page session restart runtime

  Background:
    Given the built extension side panel is running in a browser
    And testing is attached to tab <tab_id> at <page_url>
    And history array <history_path> contains <existing_events>

  # Data layer same-page session restart runtime 001
  Scenario Outline: Data layer same-page session restart runtime 001
    Given the active testing session has captured <existing_events>
    When the user ends testing
    And starts testing again on the same tab and unchanged page
    Then a new testing session with a distinct session identity is active
    And prior session events are cleared before current page history is imported
    And the new Live feed contains <existing_events> exactly once in history order
    And no event entry from the ended session persists in the new session
    And history array <history_path> on the target page remains unchanged

    Examples:
      | tab_id | page_url                  | history_path  | existing_events      |
      | 42     | https://example.test/home | event.history | pageview, banner view |

  # Data layer same-page session restart runtime 002
  Scenario Outline: Data layer same-page session restart runtime 002
    Given testing was ended and restarted on the same tab and unchanged page
    When event <new_event> is appended to <history_path>
    Then <new_event> is captured exactly once in the new testing session
    And each event from <existing_events> remains present exactly once in the new Live feed

    Examples:
      | tab_id | page_url                  | history_path  | existing_events      | new_event |
      | 42     | https://example.test/home | event.history | pageview, banner view | purchase  |

  # Data layer same-page session restart runtime 003
  Scenario Outline: Data layer same-page session restart runtime 003
    Given the active testing session captured <first_page_events> on <page_url>
    When the selected target tab navigates to <next_page_url>
    And events <next_page_events> are observed there
    Then the same testing session identity remains active
    And the Live event feed retains <first_page_events> under <page_url>
    And the Live event feed contains <next_page_events> under <next_page_url>
    And navigation does not apply the same-page new-session reset

    Examples:
      | tab_id | page_url                  | history_path  | existing_events | first_page_events | next_page_url                  | next_page_events |
      | 42     | https://example.test/home | event.history | pageview        | pageview          | https://example.test/checkout | checkout, purchase |
