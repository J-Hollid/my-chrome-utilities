# mutation-stamp: sha256=adde8d913229b0c5995f66c7f26d98a1b76d937e7cf219c1a7d51cc5dd2e4294
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T21:08:05.112729443Z","feature_name":"Data layer schema revision lifecycle","feature_path":"features/data-layer-schema-revision-lifecycle.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:01ee295ec3b75ffa40ea926ae5df4c325f94bab2156d201592ebdcc6e22449d0","scenarios":[{"index":4,"name":"Data layer schema revision lifecycle 005","scenario_hash":"552d114a8bf02b73e32d2fce897583dd8c26b73ef89e4e6437a9b89647b93cc0","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-13T21:08:05.112729443Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema revision lifecycle

  # Data layer schema revision lifecycle 001
  Scenario: Data layer schema revision lifecycle 001
    Given schema Product listing has stable identity schema-product-listing, current revision 3, and no working draft
    When the operator adds page_type from a captured event to Product listing
    Then 1 working draft is created from revision 3
    And page_type is stored as a pending draft change
    And revision 3 remains current
    And no new schema or revision is available for assignment

  # Data layer schema revision lifecycle 002
  Scenario: Data layer schema revision lifecycle 002
    Given the Product listing working draft is based on current revision 3 and contains a pending page_type rule
    When the operator adds page_name from another captured event
    And opens Product listing in the advanced schema editor
    Then the same working draft contains the pending page_type and page_name rules
    And the draft reports 2 pending changes
    And each accepted edit is saved to the working draft without publishing
    And no additional working draft or schema identity is created

  # Data layer schema revision lifecycle 003
  Scenario: Data layer schema revision lifecycle 003
    Given schema Product listing has stable identity schema-product-listing and current revision 3
    And its working draft contains valid pending changes
    When the operator requests Publish revision
    Then a review compares the draft with current revision 3
    And no revision changes before confirmation
    When the operator confirms Publish revision 4
    Then revision 4 becomes current for schema-product-listing
    And revision 3 moves into read-only history
    And pending assignment changes take effect against schema-product-listing
    And the working draft is cleared
    And exactly 1 Product listing schema remains available for assignment

  # Data layer schema revision lifecycle 004
  Scenario: Data layer schema revision lifecycle 004
    Given Product listing has current revision 4 and historical revisions 1, 2, and 3
    When the Revision history disclosure is opened
    Then one compact drop-down revision selector offers revisions 3, 2, and 1 in newest-first order
    And no complete revision list is displayed in the schema editor
    When the operator selects revision 2
    Then only revision 2 and its comparison with current revision 4 are displayed
    And Duplicate from revision and Restore this revision are available
    And Activate and Attach are unavailable
    And no historical revision appears as a separate schema in the Schema Library or schema pickers
    And viewing history cannot change the current revision or an assignment

  # Data layer schema revision lifecycle 005
  Scenario Outline: Data layer schema revision lifecycle 005
    Given assignment Product pages references schema-product-listing with version policy <version_policy>
    And Product listing current revision changes from 3 to 4
    When Product pages resolves its schema
    Then it uses <resolved_revision>
    And Product listing appears once in schema choices

    Examples:
      | version_policy | resolved_revision |
      | pinned to 3    | revision 3        |
      | follow latest  | revision 4        |

  # Data layer schema revision lifecycle 006
  Scenario: Data layer schema revision lifecycle 006
    Given Product listing current revision 3 has a working draft with 3 pending changes
    When the side panel reloads
    Then the same working draft is restored with 3 pending changes
    When the operator confirms Discard draft
    Then revision 3 remains current
    And Product listing has no working draft

  # Data layer schema revision lifecycle 007
  Scenario: Data layer schema revision lifecycle 007
    Given legacy storage contains Product listing revisions 1, 2, 3, and 4 as separately selectable schemas
    And assignments reference those stored revision identities
    When the Schema Library is migrated
    Then they become 1 schema with stable identity schema-product-listing
    And revision 4 is current and revisions 1, 2, and 3 are read-only history
    And each assignment retains its pinned or follow-latest behavior
    And Product listing appears once in schema choices

  # Data layer schema revision lifecycle 008
  Scenario: Data layer schema revision lifecycle 008
    Given a valid new-schema draft named Checkout has not been published
    When schema choices are displayed
    Then Checkout is unavailable for assignment
    When the operator confirms Publish revision 1 for Checkout
    Then Checkout becomes 1 assignable schema with current revision 1
    And no historical revision exists

  # Data layer schema revision lifecycle 009
  Scenario: Data layer schema revision lifecycle 009
    Given the operator adds page_type to a Product listing working draft based on current revision 3
    When the guided flow completes
    Then it offers Add property from this event, Review draft, and Publish revision
    When the operator chooses Add property from this event
    Then property selection resumes for the same Product listing working draft
    And the pending page_type change remains present

  # Data layer schema revision lifecycle 010
  Scenario: Data layer schema revision lifecycle 010
    Given Product listing revision 2 is selected in Revision history
    When the operator activates Duplicate from revision
    Then an unpublished new-schema draft opens with revision 2 rules, target, parent, and examples
    And its suggested name identifies Product listing revision 2 as its source
    And Product listing and its revision history remain unchanged
    And the duplicate is unavailable for assignment until it is published as revision 1 of a new schema

  # Data layer schema revision lifecycle 011
  Scenario: Data layer schema revision lifecycle 011
    Given Product listing has current revision 4 and no working draft
    And revision 2 is selected in Revision history
    When the operator activates Restore this revision
    Then a review compares revision 2 with current revision 4
    And it states that restoration will create a working draft and publication will create revision 5
    And no current revision or assignment changes before confirmation
    When the operator confirms restoration
    Then 1 Product listing working draft is created from revision 2
    And revision 4 remains current until the working draft is published
    And publishing the restored draft creates revision 5 rather than reactivating revision 2

  # Data layer schema revision lifecycle 012
  Scenario: Data layer schema revision lifecycle 012
    Given Product listing has current revision 4 and a working draft with 3 pending changes
    And revision 2 is selected in Revision history
    When the operator activates Restore this revision
    Then the review states that confirmation will replace the existing working draft
    And it identifies the 3 pending changes that would be discarded
    When the operator cancels restoration
    Then the existing working draft remains unchanged
    And revision 4 remains current
