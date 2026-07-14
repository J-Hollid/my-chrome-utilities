# mutation-stamp: sha256=7bcbbb114cad175deb3ae169a077d9b7b8f883746408fe06c64b2be99d50d82f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T16:06:39.771822706Z","feature_name":"Data layer defect library runtime","feature_path":"features/data-layer-defect-library-runtime.feature","background_hash":"6d06ad4c8b4bd5d438dd3ff3212ca83ced1338fb4b89465453e320bcba2fa38d","implementation_hash":"sha256:19be5f41e5cbb8efa1259eb31f52068295e3eb5cb47b16aceda99cd6e9c66a75","scenarios":[{"index":0,"name":"Data layer defect library runtime 001","scenario_hash":"1fa49b02a412686dffb97774cfe8c809c9566598ed234741fdf5b73336b7d367","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:39.771822706Z"},{"index":1,"name":"Data layer defect library runtime 002","scenario_hash":"eaf71fe0f2aba29fa6ded1a502ed23865dfd81c47e0c406ed24d354495d31435","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:39.771822706Z"},{"index":3,"name":"Data layer defect library runtime 004","scenario_hash":"5c97e45089b1b8bb75fecace354495735b98c32691d49088fb3bf735cee90671","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:39.771822706Z"},{"index":6,"name":"Data layer defect library runtime 007","scenario_hash":"2786ec6f7a421c0cedac3a8bc23f63b071af99a6f8c224420f50530e7d9bc10e","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T16:06:39.771822706Z"}]}
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
    And the production clipboard receives <copy_count> report representations

    Examples:
      | report_action                    | stored_count | copy_count |
      | Copy for Jira Cloud              | 0            | 1          |
      | Save as reported defect          | 1            | 0          |
      | Save as reported defect and copy | 1            | 1          |

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
    Given production validation issue currency links to a stored reported defect
    When the rendered issue link opens that defect
    And the operator edits report details, adds note Jira https://jira.example/browse/DL-42, and saves
    Then production persistence restores the edits and note after a side-panel reload
    And the note link is safe and navigable
    When Recopy for Jira Cloud is activated
    Then the production clipboard representation contains the edited report details
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
      | Reported      | Reported                         | 1                  |
      | Resolved      | Possible regression treated New | 0                  |
      | Archived      | New                              | 0                  |

  # Data layer defect library runtime 008
  Scenario: Data layer defect library runtime 008
    Given production validation-issue and Missing event reports are completed
    When each rendered report builder saves its report as a reported defect
    Then both records are restored in the rendered Defects view after reload
    And only the validation-issue defect participates in production event-issue matching
    And opening, editing, recopying, resolving, reopening, archiving, and confirmed deletion update production persistence without mutating captured evidence
