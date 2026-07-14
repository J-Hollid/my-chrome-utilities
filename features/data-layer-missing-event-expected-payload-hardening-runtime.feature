# mutation-stamp: sha256=8fbbbc550c87fd2eabe085cae529416e93467ffba97d6ef4a6ace202ae1aeb3d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T22:02:29.711201977Z","feature_name":"Data layer missing-event expected payload hardening runtime","feature_path":"features/data-layer-missing-event-expected-payload-hardening-runtime.feature","background_hash":"74f7a83d64ea4348d2c47376e3b2884d455b3dfab52b66d9b21edced3c27f028","implementation_hash":"unknown","scenarios":[{"index":3,"name":"Data layer missing-event expected payload hardening runtime 004","scenario_hash":"7a3e98a026596e595835864c8b3a56a4b133a66896d15923c57ff8a0e2fa599e","mutation_count":28,"result":{"Total":28,"Killed":28,"Survived":0,"Errors":0},"tested_at":"2026-07-14T22:02:29.711201977Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer missing-event expected payload hardening runtime

  Background:
    Given the built extension side panel is running with production missing-event reporting, schema validation, Jira export, and Defect Library persistence
    And persisted Generic pageview revision 4 uses flat canonical property paths including /page_levels, /page_levels/0, /page_type, /page_section, /login_status, and /b_id
    And a rendered missing pageview report uses that revision

  # Data layer missing-event expected payload hardening runtime 001
  Scenario: Data layer missing-event expected payload hardening runtime 001
    When the production recursive expected-payload editor is rendered
    Then DOM fields use canonical pointers /page_levels, /page_levels/0, /page_type, /page_section, /login_status, and /b_id
    And no DOM field or draft payload key uses /~1page_levels or another escaped leading-slash property
    And the stored schema snapshot remains byte-for-byte unchanged

  # Data layer missing-event expected payload hardening runtime 002
  Scenario: Data layer missing-event expected payload hardening runtime 002
    Given production schema path /page_levels/0 supplies the item definition for flat array path /page_levels
    When the actual Add page_levels item control is activated
    Then no window error, unhandled rejection, or console error is observed
    And one page_levels item editor appears at /page_levels/0
    When schema value d is selected
    Then production draft payload is {"page_levels":["d"]}

  # Data layer missing-event expected payload hardening runtime 003
  Scenario: Data layer missing-event expected payload hardening runtime 003
    Given the actual custom input for /login_status has focus and an empty value
    When keyboard and input events enter logged in one character at a time
    Then the same HTML input element retains focus after every event
    And its value and caret position retain every entered character
    And the rendered preview reflects each prefix without replacing the editor DOM

  # Data layer missing-event expected payload hardening runtime 004
  Scenario Outline: Data layer missing-event expected payload hardening runtime 004
    Given production attached rule <rule_id> revision <rule_revision> allows <allowed_values> at <template_path>
    When actual expected field <field_pointer> is inspected and <selected_value> is selected
    Then its schema-value controls contain <allowed_values>
    And production draft stores <stored_value> at <field_pointer>
    And response provenance contains <rule_id> revision <rule_revision>

    Examples:
      | rule_id      | rule_revision | template_path  | field_pointer   | allowed_values               | selected_value | stored_value |
      | page-levels  | 2             | /page_levels/* | /page_levels/0  | d and c                      | d              | d            |
      | indexed-levels | 4           | /page_levels/0 | /page_levels/0  | d and e                      | e              | e            |
      | page-type    | 3             | /page_type     | /page_type      | product_detail and content   | product_detail | product_detail |
      | login-state  | 1             | /login_status  | /login_status   | not logged in and logged in  | logged in      | logged in    |

  # Data layer missing-event expected payload hardening runtime 005
  Scenario: Data layer missing-event expected payload hardening runtime 005
    Given production expected fields contain missing, empty, and disallowed values
    When the draft is validated through the selected schema revision
    Then rendered issues identify the exact invalid fields
    And Copy for Jira Cloud, Save as reported defect, and Save as reported defect and copy are disabled
    When page_levels is d, page_type is product_detail, page_section is product, login_status is logged in, and b_id is 123
    Then production validation reports Valid
    And all report completion actions are enabled without a Create missing-event report action

  # Data layer missing-event expected payload hardening runtime 006
  Scenario: Data layer missing-event expected payload hardening runtime 006
    Given the production expected payload is valid
    When the live preview, Jira clipboard text, and saved Defect Library record are produced
    Then each contains pageview is fired with once
    And each contains one formatted payload equal to {"page_levels":["d"],"page_type":"product_detail","page_section":"product","login_status":"logged in","b_id":"123"}
    And the DOM preview renders the payload in one preformatted block rather than a whitespace-collapsing paragraph
    And no representation contains literal keys /page_levels/0, /page_type, /page_section, /login_status, or /b_id

  # Data layer missing-event expected payload hardening runtime 007
  Scenario: Data layer missing-event expected payload hardening runtime 007
    Given flat array path /untyped_list has no resolvable item definition
    When the actual editor is used at 320 CSS pixels wide
    Then Add untyped_list item is not actionable and inline assistance is visible
    And the remaining editor controls stay keyboard operable without horizontal page scrolling
    And runtime coverage exercises production normalization, DOM input events, validation, export, and persistence rather than source-string inspection
