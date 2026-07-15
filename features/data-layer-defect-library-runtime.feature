# mutation-stamp: sha256=d4188649a700f0b28ca20d4b60bfce1988d122b4243ef029c3ea617433ac6945
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T13:21:57.386444602Z","feature_name":"Data layer defect library runtime","feature_path":"features/data-layer-defect-library-runtime.feature","background_hash":"6d06ad4c8b4bd5d438dd3ff3212ca83ced1338fb4b89465453e320bcba2fa38d","implementation_hash":"sha256:19be5f41e5cbb8efa1259eb31f52068295e3eb5cb47b16aceda99cd6e9c66a75","scenarios":[{"index":0,"name":"Data layer defect library runtime 001","scenario_hash":"a4aa71e3bb8c27c87253b99ce4018d30ced0590e22d87921e1954381425ba318","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:21:57.386444602Z"},{"index":6,"name":"Data layer defect library runtime 007","scenario_hash":"940325baf0e86503a2a737aa8ab265de50208f9e4215d5bd3deb9c393bb31105","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:21:57.386444602Z"},{"index":8,"name":"Data layer defect library runtime 009","scenario_hash":"5497209c4689d71672b89eb9e1ec84c82fec8bd27ad9d9dcd7815540e3478128","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:21:57.386444602Z"},{"index":9,"name":"Data layer defect library runtime 010","scenario_hash":"3bb866c5543683f5a18780db49ab639cfd704dbb10971eb677985a5048c2a13e","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:21:57.386444602Z"},{"index":10,"name":"Data layer defect library runtime 011","scenario_hash":"be59f1c3dd0395211a06252282ca400dfc8ae036ad5f954f90c5a8c3ac61a708","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:21:57.386444602Z"},{"index":12,"name":"Data layer defect library runtime 013","scenario_hash":"615c1216d19fed206cbb70e853f108653577ebb47dd024eaab0a55a0078e739d","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:21:57.386444602Z"},{"index":1,"name":"Data layer defect library runtime 002","scenario_hash":"eaf71fe0f2aba29fa6ded1a502ed23865dfd81c47e0c406ed24d354495d31435","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:39.771822706Z"},{"index":3,"name":"Data layer defect library runtime 004","scenario_hash":"5c97e45089b1b8bb75fecace354495735b98c32691d49088fb3bf735cee90671","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:39.771822706Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer defect library runtime

  Background:
    Given the built extension side panel is running with production validation, defect reporting, saved sessions, and local persistence
    And production schema Checkout is assigned to purchase from event-history

  # Data layer defect library runtime 001
  Scenario Outline: Data layer defect library runtime 001
    Given the rendered defect builder has a completed report for purchase
    When the operator activates production action <report_action>
    Then production persistence contains <stored_count> defect records
    And every stored defect has Saved status
    And the production clipboard receives <copy_count> report representations

    Examples:
      | report_action                    | stored_count | copy_count |
      | Copy for Jira Cloud              | 0            | 1          |
      | Save defect                      | 1            | 0          |
      | Save defect and copy             | 1            | 1          |

  # Data layer defect library runtime 002
  Scenario Outline: Data layer defect library runtime 002
    Given a production reported-defect identity is event-history, purchase, Checkout, payload, /commerce/currency, and Known currencies revision 2
    When the production matcher receives an issue differing by <difference>
    Then the actual issue triage result is <triage_result>

    Examples:
      | difference              | triage_result    |
      | actual value            | Reported         |
      | page URL                | Reported         |
      | source id               | New              |
      | event name              | New              |
      | schema id               | New              |
      | validation target       | New              |
      | canonical path          | New              |
      | rule id                 | New              |
      | rule revision           | Review required  |

  # Data layer defect library runtime 003
  Scenario: Data layer defect library runtime 003
    Given production validation returns failures at /products/0/sku and /products/3/sku for rule target /products/*/sku
    And a reported defect stores the first failure
    When the production matcher evaluates the second failure
    Then it matches by template path /products/*/sku
    And production validation still renders both concrete issue paths independently

  # Data layer defect library runtime 004
  Scenario Outline: Data layer defect library runtime 004
    Given a production event has 2 validation issues and <reported_count> active defect matches
    When the rendered Live feed and event inspector process the event
    Then the feed displays <triage_state> without replacing its failing validation state
    And the inspector renders <reported_count> Reported issue links
    And it renders <new_count> New issues with defect-report actions

    Examples:
      | reported_count | new_count | triage_state          |
      | 0              | 2         | 2 new issues          |
      | 1              | 1         | 1 new and 1 reported  |
      | 2              | 0         | all 2 issues reported |

  # Data layer defect library runtime 005
  Scenario: Data layer defect library runtime 005
    Given production validation issue currency links to a stored defect
    And production rich and plain-text clipboard writing are available
    When the rendered issue link opens that defect
    And the operator edits report details, adds note Jira https://jira.example/browse/DL-42, and saves
    Then production persistence restores the edits and note after a side-panel reload
    And the note link is safe and navigable
    When the rendered Recopy for Jira Cloud control is activated
    Then production clipboard contains rich HTML and plain text for the same current stored report
    And rich HTML retains the Jira Cloud formatting shown by the saved report preview
    And returning restores the originating event, issue, feed filters, scroll, and focus

  # Data layer defect library runtime 006
  Scenario: Data layer defect library runtime 006
    Given a production reported defect is open during an active testing session containing its matching issue
    When the operator saves and attaches the current session
    Then production Saved Sessions contains one immutable session linked by stable identity
    And the Defect Library reports that the session contains a matching issue
    When the linked session is opened from the defect
    Then production Saved session Live mode opens the matching event without starting observation
    And later live capture cannot change the linked saved session

  # Data layer defect library runtime 007
  Scenario Outline: Data layer defect library runtime 007
    Given a production issue matches a persisted defect with status <defect_status>
    When the Live feed is rebuilt after validation or side-panel reload
    Then the actual issue triage result is <triage_result>
    And production matching creates <active_match_count> active matches

    Examples:
      | defect_status | triage_result                    | active_match_count |
      | Saved         | New                              | 0                  |
      | Reported      | Reported                         | 1                  |
      | Resolved      | Possible regression treated New | 0                  |
      | Archived      | New                              | 0                  |

  # Data layer defect library runtime 008
  Scenario: Data layer defect library runtime 008
    Given production validation-issue and Missing event reports are completed
    When each rendered report builder saves its report
    Then both records are restored in the rendered Defects view after reload
    And both records have Saved status
    And neither record participates in production event-issue matching before it is marked as reported
    And opening, editing, recopying, updating state, and confirmed deletion update production persistence without mutating captured evidence

  # Data layer defect library runtime 009
  Scenario Outline: Data layer defect library runtime 009
    Given a production defect with Saved status matches a current validation issue
    When the rendered defect editor saves Jira <jira_ticket> in Internal notes
    And the operator selects <selected_status> and activates Update state
    Then production persistence stores Jira <jira_ticket> in Internal notes with <selected_status> status
    And the rendered defect list displays <selected_status> for that defect
    And production validation triages the matching issue as Reported
    And a side-panel reload restores the note link, status, and active issue match

    Examples:
      | jira_ticket                        | selected_status |
      | https://jira.example/browse/DL-42  | Reported        |

  # Data layer defect library runtime 010
  Scenario Outline: Data layer defect library runtime 010
    Given a production saved defect is open with clipboard support <clipboard_support>
    When the rendered Recopy for Jira Cloud control is activated
    Then production clipboard behavior is <clipboard_behavior>
    And rendered feedback is <feedback>
    And the defect remains stored

    Examples:
      | clipboard_support | clipboard_behavior                       | feedback                         |
      | plain text only   | plain-text report copied                 | rich formatting was not copied  |
      | unavailable       | no clipboard representation was copied  | copy failure                     |

  # Data layer defect library runtime 011
  Scenario Outline: Data layer defect library runtime 011
    Given a production saved <defect_type> defect is open
    And production rich and plain-text clipboard writing are available
    When the rendered Recopy for Jira Cloud control is activated
    Then production clipboard contains rich HTML and plain text for the same current stored report
    And rich HTML retains the Jira Cloud formatting shown by the saved report preview

    Examples:
      | defect_type      |
      | validation issue |
      | Missing event    |
      | Unexpected event |
      | Wrong event name |

  # Data layer defect library runtime 012
  Scenario: Data layer defect library runtime 012
    Given production persistence contains a pre-upgrade defect with Reported status
    When the side panel restores the Defect Library after the upgrade
    Then the pre-upgrade defect retains Reported status
    And a newly saved defect receives Saved status

  # Data layer defect library runtime 013
  Scenario Outline: Data layer defect library runtime 013
    Given production persistence contains a defect with status <current_status>
    When the rendered defect editor opens that defect
    Then one rendered state selector offers Saved, Reported, Resolved, and Archived
    And the selector has <current_status> selected
    And one Update state button is rendered without individual state-transition buttons
    When the operator selects <selected_status> and activates Update state
    Then production persistence and the rendered defect list show <selected_status>
    And no intermediate state is persisted

    Examples:
      | current_status | selected_status |
      | Reported       | Saved           |
      | Saved          | Reported        |
      | Saved          | Resolved        |
      | Resolved       | Archived        |
      | Archived       | Reported        |
