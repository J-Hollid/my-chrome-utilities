# mutation-stamp: sha256=c7734b99eaae4e10bd867be593bf776fc139d3ac43ab486261f6b49e2c19b1ef
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T16:06:21.694428893Z","feature_name":"Data layer defect library","feature_path":"features/data-layer-defect-library.feature","background_hash":"9a0b104c88f4a64f75cfeda8331c5d7e7f29658482cdd9f10a83f0650abed334","implementation_hash":"sha256:917efd74c8fa40402fa73b9e533ffecafa97244939dd42d6040665b81ee946dc","scenarios":[{"index":0,"name":"Data layer defect library 001","scenario_hash":"ab8f09c6cde6ec7cc1bd8d689148ab3a4b599b5e5e274d6414a1274ab8d9b470","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:21.694428893Z"},{"index":2,"name":"Data layer defect library 003","scenario_hash":"db0754e0530a08d6fac7ddba4a7afb6f23eb6a9391584d16f14b91c03f2cbdd4","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:21.694428893Z"},{"index":4,"name":"Data layer defect library 005","scenario_hash":"cc1f0d915f3ca6e6c09045bf550b13bb7b0251d2eddf0ed367b45076b5b6797b","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:21.694428893Z"},{"index":9,"name":"Data layer defect library 010","scenario_hash":"51b9c4f5b0c4b376d9cc10589dafcf5d0eb99fb4f1251295fecb3a5777f731af","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:21.694428893Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer defect library

  Background:
    Given a testing session contains captured events with schema validation results
    And the Data Layer Defects view is available

  # Data layer defect library 001
  Scenario Outline: Data layer defect library 001
    Given a completed defect report contains selected validation issues for purchase
    And no defect has been saved from that report
    When the operator activates <report_action>
    Then the Defect Library contains <saved_defect_count> reported defects for that report
    And the clipboard outcome is <clipboard_outcome>
    And the captured purchase event remains unchanged

    Examples:
      | report_action                     | saved_defect_count | clipboard_outcome       |
      | Copy for Jira Cloud               | 0                  | report copied           |
      | Save as reported defect           | 1                  | clipboard unchanged     |
      | Save as reported defect and copy  | 1                  | report copied           |

  # Data layer defect library 002
  Scenario: Data layer defect library 002
    Given a reported defect contains selected validation issue /commerce/currency
    When the defect is stored
    Then it has a stable defect identity, Reported status, and created and updated times
    And it retains the editable report, selected issue evidence, notes, and optional saved-session link
    And its issue match identity retains source id, event name, schema id, validation target, canonical affected path, rule id, and rule revision
    And display labels, actual value, expected text, capture time, page URL, and generated prose are retained as evidence but excluded from issue matching

  # Data layer defect library 003
  Scenario Outline: Data layer defect library 003
    Given reported purchase defect issue is identified by event-history, Checkout schema, payload, /commerce/currency, and Known currencies revision 2
    When a current validation issue differs by <difference>
    Then its reported-defect match result is <match_result>

    Examples:
      | difference                         | match_result                        |
      | nothing                            | Reported                            |
      | actual invalid value               | Reported                            |
      | page URL                           | Reported                            |
      | source display name                | Reported                            |
      | source id                          | New                                 |
      | event name                         | New                                 |
      | schema id                          | New                                 |
      | validation target                  | New                                 |
      | canonical affected path            | New                                 |
      | rule id                            | New                                 |
      | rule revision                      | Review required and treated as New  |

  # Data layer defect library 004
  Scenario: Data layer defect library 004
    Given a wildcard validation rule targets /products/*/sku
    And the reported defect was created from concrete issue /products/0/sku
    When another event fails the same rule at /products/3/sku
    Then both issues use /products/*/sku as their canonical affected path
    And the later issue matches the reported defect
    And each concrete failing property remains separately visible in event validation details

  # Data layer defect library 005
  Scenario Outline: Data layer defect library 005
    Given a validation event contains <issue_count> current issues
    And <reported_count> issues match active reported defects
    When the event is displayed in the Live feed
    Then its validation failure remains visible
    And its defect-triage state is <triage_state>
    And no reported issue suppresses an unmatched issue

    Examples:
      | issue_count | reported_count | triage_state              |
      | 2           | 0              | 2 new issues              |
      | 2           | 1              | 1 new and 1 reported      |
      | 2           | 2              | all 2 issues reported     |

  # Data layer defect library 006
  Scenario: Data layer defect library 006
    Given one event contains a reported currency issue and a new order_id issue
    When the operator opens its validation details
    Then currency has a Reported badge linked to its matching defect
    And order_id is identified as New with Create defect report available
    When the operator follows the currency defect link and returns
    Then the same event and issue are restored
    And Live feed scroll, filters, and keyboard focus are preserved

  # Data layer defect library 007
  Scenario: Data layer defect library 007
    Given a selected report issue already matches an active reported defect
    When the operator attempts to save it as another reported defect
    Then the existing defect is identified before saving
    And Open existing defect and Update existing defect are available
    And no duplicate issue mapping is created without explicit confirmation to Save separately
    And multiple confirmed defects for one issue are exposed as separate links rather than selected arbitrarily

  # Data layer defect library 008
  Scenario: Data layer defect library 008
    Given a reported defect is open from the Defects view
    When the operator edits its report details and notes
    Then report edits and notes persist independently
    And web links in notes are navigable without rendering note text as executable markup
    When the operator activates Recopy for Jira Cloud
    Then the clipboard uses the current stored report details
    And internal notes are not added to the Jira report without an explicit report edit

  # Data layer defect library 009
  Scenario: Data layer defect library 009
    Given a reported defect has no linked saved session
    When the operator attaches the current testing session
    Then an immutable saved session is created and linked to the defect
    And the defect identifies whether the saved session contains a matching validation issue
    When the linked session is opened
    Then it opens in Saved session Live mode at a matching event
    And returning restores the same defect and previous Defects view position
    And deleting or losing the linked session does not delete the defect

  # Data layer defect library 010
  Scenario Outline: Data layer defect library 010
    Given a current issue matches a stored defect with status <defect_status>
    When defect matching is applied
    Then the issue triage result is <triage_result>
    And the available lifecycle action is <lifecycle_action>

    Examples:
      | defect_status | triage_result                    | lifecycle_action |
      | Reported      | Reported                         | Resolve          |
      | Resolved      | Possible regression treated New | Reopen           |
      | Archived      | New                              | none             |

  # Data layer defect library 011
  Scenario: Data layer defect library 011
    Given validation-issue and missing-event defects have been saved
    When the Defects view is displayed
    Then it follows Sessions and precedes Schemas in Data Layer secondary navigation
    And the list distinguishes validation issue and Missing event defect types
    And defects can be searched and filtered by status, type, event, schema, path, and note text
    And each defect offers Open, Edit, Recopy, lifecycle, linked-session, and deletion actions when applicable
    And deleting a defect requires confirmation and removes its active issue matches
    And a Missing event defect does not automatically match a captured event validation issue

  # Data layer defect library 012
  Scenario: Data layer defect library 012
    Given the Defect Library contains reported defects and linked saved-session identities
    When the side panel is closed and reopened
    Then the defect records, statuses, report edits, notes, match identities, and session links are restored
    And current and saved-session event feeds recompute defect-triage state from the restored records
    And captured events and immutable saved sessions are not mutated by that recomputation
