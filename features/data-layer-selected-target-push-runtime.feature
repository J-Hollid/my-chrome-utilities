# mutation-stamp: sha256=b7d12cfc136a3aed5fc267573925280c2eb206ee259e9e80ca27cf2a12324df5
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-11T02:00:52.308368983Z","feature_name":"Data layer selected target push runtime","feature_path":"features/data-layer-selected-target-push-runtime.feature","background_hash":"9e184b6037295b5d4c6a3cc992f0af6844f542e2a797deb20876c772734b27ca","implementation_hash":"sha256:tuple-shaped-event-push-v1","scenarios":[{"index":0,"name":"Data layer selected target push runtime 001","scenario_hash":"6751c50e02cc015c3964bfc14b37cfe5b5fd085ee66fcc68c124f2c40f064012","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-11T02:00:52.308368983Z"},{"index":1,"name":"Data layer selected target push runtime 002","scenario_hash":"de41d81913089d8902fec165ac2316c070f86b98f5024e29ad76568756e91a92","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-11T02:00:52.308368983Z"},{"index":2,"name":"Data layer selected target push runtime 003","scenario_hash":"ec2eca7775367e31d2aef70ab2b7d613f71af0cdfa3cd8a15d43512a68a57ba2","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-07-11T02:00:52.308368983Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer selected target push runtime

  Background:
    Given the built extension side panel is running in a browser
    And observation target <page_title> with tab id <tab_id> and URL <page_url> is selected
    And event template <template_name> targets <push_path>
    And event template <template_name> has event name <event_name> and payload <payload_label>

  # Data layer selected target push runtime 001
  Scenario Outline: Data layer selected target push runtime 001
    Given <push_path> is available in the selected target page
    When the user activates confirmed action Push <event_name> to <page_title>
    Then one history tuple is appended to <push_path> in tab <tab_id>
    And the first tuple item is event name <event_name>
    And the second tuple item is the exact template payload <payload_label>
    And the push result identifies <page_title>, <page_url>, and <push_path>
    And the side panel document does not receive the event payload
    And no push result uses <side_panel_url> as the target page

    Examples:
      | page_title | tab_id | page_url                     | template_name         | event_name | payload_label   | push_path | side_panel_url                           |
      | Shop       | 42     | https://shop.example.test/p/ | Purchase confirmation | pageview   | pageview-values | dataLayer | chrome-extension://extension/side-panel.html |

  # Data layer selected target push runtime 002
  Scenario Outline: Data layer selected target push runtime 002
    Given another available tab is <other_page_title> with id <other_tab_id>
    When the user selects observation target <page_title>
    And the user activates confirmed action Push <event_name> to <page_title>
    Then history tuple for <event_name> and <payload_label> is pushed only in tab <tab_id>
    And no payload is pushed in tab <other_tab_id>

    Examples:
      | page_title | tab_id | page_url                     | template_name         | event_name | payload_label   | push_path | other_page_title | other_tab_id |
      | Shop       | 42     | https://shop.example.test/p/ | Purchase confirmation | pageview   | pageview-values | dataLayer | Documentation    | 77           |

  # Data layer selected target push runtime 003
  Scenario Outline: Data layer selected target push runtime 003
    Given <push_path> cannot accept the payload in tab <tab_id>
    When the user activates confirmed action Push <event_name> to <page_title>
    Then the push result reports failure for <page_title> and <push_path>
    And no successful push result is displayed
    And the template payload remains unchanged

    Examples:
      | page_title | tab_id | page_url                     | template_name         | event_name | payload_label   | push_path       |
      | Shop       | 42     | https://shop.example.test/p/ | Purchase confirmation | pageview   | pageview-values | analytics.queue |
