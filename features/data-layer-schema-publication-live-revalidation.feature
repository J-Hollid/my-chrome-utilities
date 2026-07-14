# mutation-stamp: sha256=ee0fe580ac09ccddfb7658b89fe066cb3b7a92bb485f83a08677f517f39206ca
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T17:47:56.270070303Z","feature_name":"Data layer schema publication Live revalidation","feature_path":"features/data-layer-schema-publication-live-revalidation.feature","background_hash":"3c1ce017d7d1fd5e98e37b2b93d939f47570bfffeb82878fea9b0a27a6636182","implementation_hash":"sha256:a4cfd6127ff238ecab0780a12d36fe898b533eae45fb9b71d0130b5632b4311c","scenarios":[{"index":1,"name":"Data layer schema publication Live revalidation 002","scenario_hash":"9d863c2f16a235538a2335c4146079b25a710d3601687b953e3c4277c647c772","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T17:47:56.270070303Z"},{"index":2,"name":"Data layer schema publication Live revalidation 003","scenario_hash":"3f967e00e90ecc14670f468d3057253df7631fabe56e7f48f3953a6675ba9ece","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T17:47:56.270070303Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema publication Live revalidation

  Background:
    Given a current Live testing session contains captured events
    And the Schema Library contains published schemas with assignments

  # Data layer schema publication Live revalidation 001
  Scenario: Data layer schema publication Live revalidation 001
    Given captured events were validated before a schema working draft was completed
    And a Live feed query currently hides some of those events
    When the operator confirms publication of the schema revision
    Then every event in the current testing session is revalidated against one coherent snapshot of the published Schema Library
    And events hidden by the current query are revalidated with visible events
    And no event must be captured or generated again to receive the new result
    And event identity, payload, raw input, capture time, page association, order, and count remain unchanged

  # Data layer schema publication Live revalidation 002
  Scenario Outline: Data layer schema publication Live revalidation 002
    Given page_view entered publication with <previous_result>
    And the working draft will <revision_change>
    When the revision is published
    Then its refreshed validation result is <published_result>
    And its feed row and event inspector show the published schema revision and its evaluated rules

    Examples:
      | previous_result | revision_change                         | published_result |
      | Valid           | add a failing Required rule             | 1 error          |
      | 1 error         | relax the failing Allowed values rule   | Valid            |
      | Valid           | add a failing warning-severity rule     | 1 warning        |

  # Data layer schema publication Live revalidation 003
  Scenario Outline: Data layer schema publication Live revalidation 003
    Given captured event page_view resolves Product listing through <schema_selection>
    And Product listing revision 4 is published
    When page_view is automatically revalidated
    Then it uses <resolved_schema>
    And its validation details identify <rule_evidence>

    Examples:
      | schema_selection                  | resolved_schema              | rule_evidence                    |
      | follow-latest assignment          | Product listing revision 4   | revision 4 rules                 |
      | assignment pinned to revision 3   | Product listing revision 3   | retained revision 3 rules        |
      | manual Product listing override   | Product listing revision 4   | revision 4 rules                 |
      | manual Checkout override          | Checkout current revision    | Checkout rules                   |

  # Data layer schema publication Live revalidation 004
  Scenario: Data layer schema publication Live revalidation 004
    Given captured page_view was Not checked because no assignment covered its page
    And the working draft adds a covering assignment
    When the revision is published
    Then page_view is assigned and validated without being recaptured
    When a later revision changes assignment priority so another schema wins
    Then page_view is revalidated with the newly selected schema
    And the previous assignment and schema evidence are replaced rather than combined with the new result

  # Data layer schema publication Live revalidation 005
  Scenario: Data layer schema publication Live revalidation 005
    Given an event inspector is open with property disclosures, scroll position, and keyboard focus
    And the Live feed has active validation and rule filters
    When schema publication changes event validation and rule results
    Then the feed rows, inspector summary, property results, assigned schema, rule revisions, query results, and defect-triage state refresh together
    And the open inspector remains on the same captured event
    And applicable disclosure, scroll, and focus state are restored
    And one polite status announces completion of publication revalidation without announcing every background event

  # Data layer schema publication Live revalidation 006
  Scenario: Data layer schema publication Live revalidation 006
    Given a reported defect matched a validation issue under rule revision 2
    And publishing the schema creates rule revision 3 for the same event and property
    When current events are revalidated
    Then Defect Library matching is recomputed from the new validation evidence
    And the revision-2 defect is Review required and the current issue is treated as New
    And no stale Reported state remains on the event

  # Data layer schema publication Live revalidation 007
  Scenario: Data layer schema publication Live revalidation 007
    Given an immutable saved session retains validation evidence from schema revision 3
    When schema revision 4 is published
    Then current Live events are automatically revalidated
    And the saved session's original validation results and captured evidence remain unchanged
    And revision 4 can be applied to the saved session only through its explicit validation comparison workflow

  # Data layer schema publication Live revalidation 008
  Scenario: Data layer schema publication Live revalidation 008
    Given one event was captured before publication and another is captured immediately after publication
    When publication revalidation and automatic capture validation complete
    Then each event is validated exactly once against the newly current schema revision for that handoff
    And neither event retains a partial mixture of old and new schema evidence
    And neither event is duplicated or omitted from the Live feed
