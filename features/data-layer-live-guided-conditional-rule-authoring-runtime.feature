Feature: Data layer Live guided conditional rule authoring runtime

  Background:
    Given the built extension side panel is running with production Live inspection, guided validation, schema persistence, and conditional validation
    And actual captured event product_detail contains page_type product_detail and oOrder.aProducts as an empty array
    And the production Live event inspector is open on that event

  # Data layer Live guided conditional rule authoring runtime 001
  Scenario: Data layer Live guided conditional rule authoring runtime 001
    When the operator activates the actual Add validation action for /oOrder/aProducts
    And selects a compatible consequence requirement
    Then the production guided requirement stage contains Apply only when
    And enabling it renders condition property, trigger operator, comparison value, and condition-group controls
    And no Schema Library editor or schema property rule picker is opened

  # Data layer Live guided conditional rule authoring runtime 002
  Scenario: Data layer Live guided conditional rule authoring runtime 002
    Given production Apply only when is enabled for consequence /oOrder/aProducts/0 Required
    When the operator selects /page_type from the actual event
    Then production controls detect string and prefill product_detail from the current event
    And operator choices equal the shared string-compatible conditional operators
    And the rendered summary identifies /page_type as trigger and /oOrder/aProducts/0 as consequence

  # Data layer Live guided conditional rule authoring runtime 003
  Scenario: Data layer Live guided conditional rule authoring runtime 003
    Given destination Product event declares absent condition property /customer/type as string
    When the actual guided condition property control is inspected
    Then it contains current-event properties and /customer/type once by canonical path
    And selecting /customer/type offers string-compatible operators without inventing an observed value
    And an operator-entered comparison retains its string type

  # Data layer Live guided conditional rule authoring runtime 004
  Scenario: Data layer Live guided conditional rule authoring runtime 004
    Given production conditions are /page_type Equals product_detail and /currency Equals EUR
    When the operator switches between All and Any and edits either predicate
    Then the actual current-event preview refreshes after every change
    And its Passed, Failed, or Not applicable result uses the shared conditional evaluator
    And each predicate is evaluated at most once per preview

  # Data layer Live guided conditional rule authoring runtime 005
  Scenario: Data layer Live guided conditional rule authoring runtime 005
    Given the actual guided rule is When /page_type Equals product_detail, /oOrder/aProducts/0 must be present
    When Add validation saves it as a local rule to Product event
    Then production working-draft storage contains one attached rule with canonical consequence path /oOrder/aProducts/0
    And that attachment contains one condition group with typed /page_type comparison product_detail
    And production validation reports Failed for the current event and Not applicable for a category event

  # Data layer Live guided conditional rule authoring runtime 006
  Scenario: Data layer Live guided conditional rule authoring runtime 006
    Given the same valid guided conditional rule is marked Publish this rule for Rule Library reuse
    When the production save action completes
    Then one reusable rule and one schema attachment share the same stable identity and revision
    And both retain the complete condition group and consequence configuration
    And no additional unconditional or local consequence rule is created

  # Data layer Live guided conditional rule authoring runtime 007
  Scenario Outline: Data layer Live guided conditional rule authoring runtime 007
    Given production Apply only when has <invalid_configuration>
    When Continue or Add validation to draft is activated
    Then persistence call count is 0
    And the actual control identified by <invalid_control> displays local assistance and receives error association

    Examples:
      | invalid_configuration                | invalid_control       |
      | no predicates                        | condition group       |
      | Equals with no comparison value      | comparison value      |
      | malformed Matches pattern value      | comparison value      |
      | number-only operator on string path  | trigger operator      |

  # Data layer Live guided conditional rule authoring runtime 008
  Scenario: Data layer Live guided conditional rule authoring runtime 008
    Given a production guided condition has compatible entered values
    When actual Back navigation, target retargeting, destination changes, and rerendering occur
    Then compatible condition state is retained in the guided draft
    And incompatible schema paths are presented for review rather than silently removed
    And event-derived defaults do not overwrite fields marked as operator edited

  # Data layer Live guided conditional rule authoring runtime 009
  Scenario: Data layer Live guided conditional rule authoring runtime 009
    Given production Apply only when contains one entered predicate
    When the operator disables it
    Then a rendered confirmation identifies the predicate that will be discarded
    And canceling the confirmation retains the conditional draft
    And confirming returns to one unconditional consequence without residual condition data

  # Data layer Live guided conditional rule authoring runtime 010
  Scenario: Data layer Live guided conditional rule authoring runtime 010
    Given a production local and reusable guided conditional rule have been saved
    When the working draft is published, exported, imported, and reloaded
    Then production persistence retains both conditional identities exactly once
    And validation after reload uses the retained typed predicates and consequences
    And the reusable rule revision remains distinct from its pinned attachment

  # Data layer Live guided conditional rule authoring runtime 011
  Scenario: Data layer Live guided conditional rule authoring runtime 011
    Given the guided conditional controls are open at 320 CSS pixels wide
    When the operator completes, backs out of, and cancels the flow using keyboard controls
    Then every conditional control remains reachable without horizontal page scrolling
    And completion and cancellation restore the selected Live event, property expansion, inspector scroll, and originating focus
    And runtime coverage enters through the actual Live Add validation action and exercises production guided state, shared condition controls, preview, conversion, persistence, and validation rather than the advanced schema editor or source-string inspection
