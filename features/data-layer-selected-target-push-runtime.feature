Feature: Data layer selected target push runtime

  Background:
    Given the built extension side panel is running in a browser
    And observation target <page_title> with tab id <tab_id> and URL <page_url> is selected
    And event template <template_name> targets <push_path>
    And event template <template_name> has event name <event_name> and payload <payload_label>

  # Data layer selected target push runtime 001
  Scenario Outline: Data layer selected target push runtime 001
    Given <push_path> is available in the selected target page
    When the user pushes template <template_name>
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
    Given observation target <other_page_title> with tab id <other_tab_id> is also available
    When the user selects observation target <page_title>
    And pushes template <template_name>
    Then history tuple for <event_name> and <payload_label> is pushed only in tab <tab_id>
    And no payload is pushed in tab <other_tab_id>

    Examples:
      | page_title | tab_id | page_url                     | template_name         | event_name | payload_label   | push_path | other_page_title | other_tab_id |
      | Shop       | 42     | https://shop.example.test/p/ | Purchase confirmation | pageview   | pageview-values | dataLayer | Documentation    | 77           |

  # Data layer selected target push runtime 003
  Scenario Outline: Data layer selected target push runtime 003
    Given <push_path> cannot accept the payload in tab <tab_id>
    When the user pushes template <template_name>
    Then the push result reports failure for <page_title> and <push_path>
    And no successful push result is displayed
    And the template payload remains unchanged

    Examples:
      | page_title | tab_id | page_url                     | template_name         | event_name | payload_label   | push_path       |
      | Shop       | 42     | https://shop.example.test/p/ | Purchase confirmation | pageview   | pageview-values | analytics.queue |
