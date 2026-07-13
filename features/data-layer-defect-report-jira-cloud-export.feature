# mutation-stamp: sha256=2797b39b0b31fa71c74e27ef3c87e0e58337662f21249be04573d786b14dbb59
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T07:55:47.558043352Z","feature_name":"Data layer defect report Jira Cloud export","feature_path":"features/data-layer-defect-report-jira-cloud-export.feature","background_hash":"a66b61374833c911fe9b7f642b89848c0cf92074e7ef9e7ef4dc5e81f548a3b5","implementation_hash":"sha256:ee0fd8df1cf4bf69f5a30cb921217e333c233ce36961904852e5c8f658f5d108","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report Jira Cloud export

  Background:
    Given a completed defect report is previewed for Jira Cloud
    And Actual result contains invalid field /commerce/currency
    And Expected result replaces /commerce/currency with EUR

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
