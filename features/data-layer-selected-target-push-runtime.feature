# mutation-stamp: sha256=307024d916d88b47c02d68b941ed694455fb24a00b6bb0f8c36b8d3b037eaa3f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-11T01:18:04.369992104Z","feature_name":"Data layer selected target push runtime","feature_path":"features/data-layer-selected-target-push-runtime.feature","background_hash":"b0b2036fff7a6db2d9b3300aecee47865ddb01c5e2b5329230c0ef3d4a7bd16a","implementation_hash":"sha256:selected-target-event-push-v1","scenarios":[{"index":0,"name":"Data layer selected target push runtime 001","scenario_hash":"ee09594df8cf0e3ed3dc09f81448d873952171ea48db6f1e6adfbf7f5b7b57e2","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-11T01:18:04.369992104Z"},{"index":1,"name":"Data layer selected target push runtime 002","scenario_hash":"ed64b588d622c44718c70536cd2fd76eff9d775afde31e36bc3467777b66ee80","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-07-11T01:18:04.369992104Z"},{"index":2,"name":"Data layer selected target push runtime 003","scenario_hash":"45328029018eedf87f9d5ea59de1581ef6e03366ed85344acacc9924ead67d1d","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-11T01:18:04.369992104Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer selected target push runtime

  Background:
    Given the built extension side panel is running in a browser
    And observation target <page_title> with tab id <tab_id> and URL <page_url> is selected
    And event template <template_name> targets <push_path>

  # Data layer selected target push runtime 001
  Scenario Outline: Data layer selected target push runtime 001
    Given <push_path> is available in the selected target page
    When the user pushes template <template_name>
    Then the exact template payload is pushed to <push_path> in tab <tab_id>
    And the push result identifies <page_title>, <page_url>, and <push_path>
    And the side panel document does not receive the event payload
    And no push result uses <side_panel_url> as the target page

    Examples:
      | page_title | tab_id | page_url                     | template_name         | push_path | side_panel_url                           |
      | Shop       | 42     | https://shop.example.test/p/ | Purchase confirmation | dataLayer | chrome-extension://extension/side-panel.html |

  # Data layer selected target push runtime 002
  Scenario Outline: Data layer selected target push runtime 002
    Given observation target <other_page_title> with tab id <other_tab_id> is also available
    When the user selects observation target <page_title>
    And pushes template <template_name>
    Then the exact template payload is pushed only in tab <tab_id>
    And no payload is pushed in tab <other_tab_id>

    Examples:
      | page_title | tab_id | page_url                     | template_name         | push_path | other_page_title | other_tab_id |
      | Shop       | 42     | https://shop.example.test/p/ | Purchase confirmation | dataLayer | Documentation    | 77           |

  # Data layer selected target push runtime 003
  Scenario Outline: Data layer selected target push runtime 003
    Given <push_path> cannot accept the payload in tab <tab_id>
    When the user pushes template <template_name>
    Then the push result reports failure for <page_title> and <push_path>
    And no successful push result is displayed
    And the template payload remains unchanged

    Examples:
      | page_title | tab_id | page_url                     | template_name         | push_path       |
      | Shop       | 42     | https://shop.example.test/p/ | Purchase confirmation | analytics.queue |
