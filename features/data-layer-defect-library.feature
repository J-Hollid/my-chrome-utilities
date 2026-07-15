# mutation-stamp: sha256=89d3ae57ecc7ef83eda8651ec27d9ac198edf7cdb55127d9259509c69de4aa42
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T13:22:01.525027133Z","feature_name":"Data layer defect library","feature_path":"features/data-layer-defect-library.feature","background_hash":"9a0b104c88f4a64f75cfeda8331c5d7e7f29658482cdd9f10a83f0650abed334","implementation_hash":"sha256:917efd74c8fa40402fa73b9e533ffecafa97244939dd42d6040665b81ee946dc","scenarios":[{"index":0,"name":"Data layer defect library 001","scenario_hash":"081da38fd179b102d40847433607bff4bc72f8eee9e1ffe24f2ac6d93c58af0c","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:22:01.525027133Z"},{"index":7,"name":"Data layer defect library 008","scenario_hash":"a20ba5056438261324b4a0e081ddba46bc1524a3ea51ad65117fd106f2605d2a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:22:01.525027133Z"},{"index":9,"name":"Data layer defect library 010","scenario_hash":"1f7ae68a43848242d9ae4eb85982efbf0aa6dfc7d9c57c0e1f6b18b0c0e6eca0","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:22:01.525027133Z"},{"index":12,"name":"Data layer defect library 013","scenario_hash":"198d675508a8090eefa987f2d7c9a87333b4ef1fec03a5a149fb0177524f545c","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:22:01.525027133Z"},{"index":13,"name":"Data layer defect library 014","scenario_hash":"41e18e383def57c7ab1a3f432af82d7fac8390935a6f315445303ee22ffd9dea","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:22:01.525027133Z"},{"index":2,"name":"Data layer defect library 003","scenario_hash":"db0754e0530a08d6fac7ddba4a7afb6f23eb6a9391584d16f14b91c03f2cbdd4","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:21.694428893Z"},{"index":4,"name":"Data layer defect library 005","scenario_hash":"cc1f0d915f3ca6e6c09045bf550b13bb7b0251d2eddf0ed367b45076b5b6797b","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:21.694428893Z"}]}
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
    Then the Defect Library contains <saved_defect_count> saved defects for that report
    And every stored defect for that report has Saved status
    And the clipboard outcome is <clipboard_outcome>
    And the captured purchase event remains unchanged

    Examples:
      | report_action                     | saved_defect_count | clipboard_outcome       |
      | Copy for Jira Cloud               | 0                  | report copied           |
      | Save defect                       | 1                  | clipboard unchanged     |
      | Save defect and copy              | 1                  | report copied           |

  # Data layer defect library 002
  Scenario: Data layer defect library 002
    Given a saved defect contains selected validation issue /commerce/currency
    When the defect is stored
    Then it has a stable defect identity, Saved status, and created and updated times
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
    When the operator attempts to save it as another defect
    Then the existing defect is identified before saving
    And Open existing defect and Update existing defect are available
    And no duplicate issue mapping is created without explicit confirmation to Save separately
    And a separately saved defect has Saved status
    And multiple confirmed defects for one issue are exposed as separate links rather than selected arbitrarily

  # Data layer defect library 008
  Scenario Outline: Data layer defect library 008
    Given a saved <defect_type> defect is open from the Defects view
    And rich and plain-text clipboard writing are available
    When the operator edits its report details and notes
    Then report edits and notes persist independently
    And web links in notes are navigable without rendering note text as executable markup
    When the operator activates Recopy for Jira Cloud
    Then the clipboard contains rich HTML and plain-text representations of the current stored report details
    And rich HTML retains the Jira Cloud formatting shown by the saved report preview
    And internal notes are not added to the Jira report without an explicit report edit

    Examples:
      | defect_type      |
      | validation issue |
      | Missing event    |
      | Unexpected event |
      | Wrong event name |

  # Data layer defect library 009
  Scenario: Data layer defect library 009
    Given a saved defect has no linked saved session
    When the operator attaches the current testing session
    Then an immutable saved session is created and linked to the defect
    And the defect identifies whether the saved session contains a matching validation issue
    When the linked session is opened
    Then it opens in Saved session Live mode at a matching event
    And returning restores the same defect and previous Defects view position
    And deleting or losing the linked session does not delete the defect

  # Data layer defect library 010
  Scenario Outline: Data layer defect library 010
    Given a current issue matches a stored defect with status <current_status>
    When the operator opens the stored defect
    Then one state selector offers Saved, Reported, Resolved, and Archived
    And <current_status> is selected
    And one Update state button is available instead of individual state-transition buttons
    When the operator selects <selected_status> and activates Update state
    Then the stored defect has status <selected_status> without an intermediate state
    And the issue triage result is <triage_result>

    Examples:
      | current_status | selected_status | triage_result                    |
      | Reported       | Saved           | New                              |
      | Saved          | Reported        | Reported                         |
      | Saved          | Resolved        | Possible regression treated New |
      | Resolved       | Archived        | New                              |
      | Archived       | Reported        | Reported                         |

  # Data layer defect library 011
  Scenario: Data layer defect library 011
    Given validation-issue and missing-event defects have been saved with Saved status
    When the Defects view is displayed
    Then it follows Sessions and precedes Schemas in Data Layer secondary navigation
    And the list distinguishes validation issue and Missing event defect types
    And defects can be searched and filtered by status, type, event, schema, path, and note text
    And each defect offers Open, Edit, Recopy, state selection, Update state, linked-session, and deletion actions when applicable
    And deleting a defect requires confirmation and removes its active issue matches
    And a Missing event defect does not automatically match a captured event validation issue

  # Data layer defect library 012
  Scenario: Data layer defect library 012
    Given the Defect Library contains saved defects in different lifecycle states and linked saved-session identities
    When the side panel is closed and reopened
    Then the defect records, statuses, report edits, notes, match identities, and session links are restored
    And current and saved-session event feeds recompute defect-triage state from the restored records
    And captured events and immutable saved sessions are not mutated by that recomputation

  # Data layer defect library 013
  Scenario Outline: Data layer defect library 013
    Given a saved defect with Saved status matches a current validation issue
    When the operator adds Jira ticket <jira_ticket> to Internal notes
    And the operator selects <selected_status> and activates Update state
    Then Jira ticket <jira_ticket> is retained in Internal notes
    And the defect has <selected_status> status and an updated time
    And the matching validation issue is triaged as Reported
    And saving, copying, or editing a defect without Update state does not change its status

    Examples:
      | jira_ticket                        | selected_status |
      | https://jira.example/browse/DL-42  | Reported        |

  # Data layer defect library 014
  Scenario Outline: Data layer defect library 014
    Given a saved defect is open from the Defects view
    And clipboard availability is <clipboard_availability>
    When the operator activates Recopy for Jira Cloud
    Then the recopy outcome is <recopy_outcome>
    And recopy feedback is <feedback>
    And the saved defect remains available

    Examples:
      | clipboard_availability | recopy_outcome                           | feedback                         |
      | plain text only        | plain-text report copied                 | rich formatting was not copied  |
      | unavailable            | no clipboard representation was copied  | copy failure                     |

  # Data layer defect library 015
  Scenario: Data layer defect library 015
    Given a persisted defect from before Saved status was introduced has Reported status
    When the Defect Library is restored after the upgrade
    Then the defect retains Reported status
    And newly saved defects receive Saved status
