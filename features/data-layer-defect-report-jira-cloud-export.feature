# mutation-stamp: sha256=2c430827c483dc15d7a408ac1c04fb35667981b83abbaf86e8a1888be6b73d3f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T16:46:59.093963870Z","feature_name":"Data layer defect report Jira Cloud export","feature_path":"features/data-layer-defect-report-jira-cloud-export.feature","background_hash":"0e81d348740b657bc7427c5994d847eb9296a3a1b4329bdbd559a73daaa27bee","implementation_hash":"sha256:fc47fcbe4ed835ad100f97279a5ef529f19a25fbc8fd3ac6b094814ad7ff3f31","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report Jira Cloud export

  Background:
    Given a completed defect report is previewed for Jira Cloud
    And Actual result contains invalid field /commerce/currency
    And Expected result replaces /commerce/currency with EUR
    And Include validation rules covered and Include capture metadata are selected

  # Data layer defect report Jira Cloud export 001
  Scenario: Data layer defect report Jira Cloud export 001
    When the final report preview is displayed
    Then it contains Summary, Description, Steps to reproduce, Actual result, Expected result, Differences, and Validation evidence
    And Supporting timeline is included when the operator selected timeline evidence
    And the invalid actual field has a red background and a minus marker
    And the corrected expected field has a green background and a plus marker
    And text on each highlighted background has a contrast ratio of at least 4.5 to 1
    And both differences identify JSON pointer /commerce/currency without relying on color

  # Data layer defect report Jira Cloud export 002
  Scenario: Data layer defect report Jira Cloud export 002
    Given rich and plain-text clipboard writing are available
    When Copy for Jira Cloud is activated
    Then the clipboard contains rich HTML and plain-text representations of the same report
    And rich HTML distinguishes the invalid actual field with a red background from the corrected expected field with a green background
    And formatting does not insert annotation characters into either JSON payload
    And success feedback appears only after the clipboard write succeeds

  # Data layer defect report Jira Cloud export 003
  Scenario: Data layer defect report Jira Cloud export 003
    Given the rich clipboard representation was produced by Copy for Jira Cloud
    When it is pasted into the Jira Cloud description editor
    Then report headings, numbered reproduction steps, and Supporting timeline retain their structure
    And the invalid actual field retains its red background
    And the corrected expected field retains its green background
    And both JSON payloads remain readable as monospace structured content

  # Data layer defect report Jira Cloud export 004
  Scenario: Data layer defect report Jira Cloud export 004
    Given rich clipboard writing is unavailable but plain-text clipboard writing is available
    When Copy for Jira Cloud is activated
    Then the plain-text report is copied
    And the invalid actual field is identified by a minus marker while the corrected expected field is identified by a plus marker
    And both fields identify JSON pointer /commerce/currency
    And feedback warns that Jira Cloud color highlighting was not copied

  # Data layer defect report Jira Cloud export 005
  Scenario: Data layer defect report Jira Cloud export 005
    Given rich and plain-text clipboard writes both fail
    When Copy for Jira Cloud is activated
    Then copy failure is reported
    And current report content is not cleared
    And success is not reported

  # Data layer defect report Jira Cloud export 006
  Scenario: Data layer defect report Jira Cloud export 006
    Given Expected response uses schema constraint must be one of homepage, product listing, product detail, or checkout for page_type
    When the final preview and rich clipboard representation are produced
    Then both inline page_type: homepage OR product listing OR product detail OR checkout
    And the inlined expected response has green highlighting and schema-constraint identification
    And it is not represented as a selected literal JSON value

  # Data layer defect report Jira Cloud export 007
  Scenario: Data layer defect report Jira Cloud export 007
    Given page_type has selected expected value homepage
    And Include all allowed values as a comment is selected
    When the final preview and rich clipboard representation are produced
    Then both inline page_type: "homepage", // must be of type homepage, product listing, product detail, or checkout
    And the page_type value has green expected-result highlighting
    And the schema-derived comment remains adjacent to the value
    And the underlying expected JSON payload contains homepage without the comment
