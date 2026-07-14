# mutation-stamp: sha256=9e985dea2164cdc74a0c678233a71fc2f9b48760735dbb4d866230cabfc1631d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T17:48:13.048360395Z","feature_name":"Data layer schema publication Live revalidation runtime","feature_path":"features/data-layer-schema-publication-live-revalidation-runtime.feature","background_hash":"9a3675664c6d95e0012f4a40651b3b70c9ec28db0190d34e6758b7f6b62ed73a","implementation_hash":"sha256:6f2b73ba1e05a9d7db2eca61cf026f1d45cbff73938ece195888f068f6e52e22","scenarios":[{"index":1,"name":"Data layer schema publication Live revalidation runtime 002","scenario_hash":"892a68bb3141b3d2518569e3d524abb14cc1d33b71268fb49e087261446e5c12","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-14T17:48:13.048360395Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema publication Live revalidation runtime

  Background:
    Given the built extension side panel is running with production Live capture, Schema Library, validation, query, and Defect Library modules
    And the current production Live session contains events captured before schema publication

  # Data layer schema publication Live revalidation runtime 001
  Scenario: Data layer schema publication Live revalidation runtime 001
    Given the rendered Live feed contains visible and query-hidden events validated by Product listing revision 3
    And the rendered schema editor has a working draft with changed rules
    When the operator confirms Publish revision 4 through the production revision review
    Then the production validator revalidates every current-session event against the post-publication library
    And rendered feed rows and event details identify Product listing revision 4 and its actual rule outcomes
    And production Live state contains the original event identities, captured values, order, and count

  # Data layer schema publication Live revalidation runtime 002
  Scenario Outline: Data layer schema publication Live revalidation runtime 002
    Given a production event resolves Product listing through <schema_selection>
    When Product listing revision 4 is published and production revalidation runs
    Then the event's actual resolved revision is <resolved_revision>

    Examples:
      | schema_selection                | resolved_revision            |
      | follow-latest assignment        | Product listing revision 4   |
      | assignment pinned to revision 3 | Product listing revision 3   |
      | manual Product listing override | Product listing revision 4   |
      | manual Checkout override        | Checkout current revision    |

  # Data layer schema publication Live revalidation runtime 003
  Scenario: Data layer schema publication Live revalidation runtime 003
    Given the open production event inspector has focus, scroll, and expanded property state
    And production query and defect matching depend on the event's current validation rules
    When rendered publication changes the event from Valid to 1 error under a revised rule
    Then production state, feed rendering, inspector rendering, query membership, and defect triage use the same new validation result
    And the inspector remains open on the same event with restorable interaction state
    And exactly one polite publication-revalidation completion message is rendered

  # Data layer schema publication Live revalidation runtime 004
  Scenario: Data layer schema publication Live revalidation runtime 004
    Given a production saved session and current Live session contain validation evidence from revision 3
    When revision 4 is published through rendered controls
    Then only current Live events are automatically revalidated in production state
    And the saved session's stored events and original validation details remain byte-for-byte unchanged
    And its rendered explicit Revalidate comparison remains available

  # Data layer schema publication Live revalidation runtime 005
  Scenario: Data layer schema publication Live revalidation runtime 005
    Given production capture is ready to append an event as revision 4 is published
    When the event is appended at the publication-to-revalidation boundary
    Then a deterministic runtime interleaving proves every pre-publication event is refreshed once
    And the appended event is automatically validated once with revision 4
    And production state contains no duplicate event or mixed-revision validation details
