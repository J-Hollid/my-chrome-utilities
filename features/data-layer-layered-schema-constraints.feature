Feature: Data layer layered schema constraints

  Background:
    Given Shop project contains Shared Profile Sitewide, Event Purchase, Page Group Checkout, Page Shipping, and Flow Checkout journey
    And Alternative shipping is a Page instance containing a Purchase Event occurrence

  # Data layer layered schema constraints 001
  Scenario: Data layer layered schema constraints 001
    Given Saved Schema Library contains Sitewide schema revision 4 with nested properties, rules, documentation, and examples
    When the operator adopts Sitewide schema as Shared Profile Sitewide
    Then one project-owned Shared Profile preserves the saved schema source identity, source revision, and adoption provenance
    And the Saved Schema Library revision remains unchanged
    And Builder and side panel expose the same structured property tree, search, filtering, nested object and array authoring, scalar types, required and forbidden controls, allowed values, regular expressions, ranges, cardinality, conditional rules, reusable rules, documentation, examples, and revision comparison
    And structured edits from either surface update the same canonical Shared Profile draft
    And advanced JSON remains optional rather than required for complete authoring

  # Data layer layered schema constraints 002
  Scenario: Data layer layered schema constraints 002
    When the operator opens Schema constraints for Purchase, Checkout, Shipping, Alternative shipping, or its Purchase occurrence
    Then the editor identifies the selected contributor by human name and scope
    And it separates inherited constraints, local contributions, effective results, superseded expectations, and blocking conflicts
    And Add constraint searches inherited property paths before offering a new property
    And each contribution states its target events, condition, enforcement policy, and Used by relationships
    When the operator switches to the compiled Alternative shipping Purchase property tree
    Then one read-only property tree shows Shared Profile, Event, Page Group, Page, Flow Page-instance, and Event-occurrence provenance in specificity order

  # Data layer layered schema constraints 003
  Scenario Outline: Data layer layered schema constraints 003
    Given Sitewide contributes <base contribution>
    When Shipping contributes <specific contribution>
    Then effective compilation is <outcome>
    And the property result explains <explanation>

    Examples:
      | base contribution                 | specific contribution       | outcome | explanation                                      |
      | type string                       | type number                 | blocked | type cannot change                               |
      | allowed values 3a and 3b          | allowed value 3b            | ready   | allowed values narrow to 3b                      |
      | allowed values 3a and 3b          | allowed value 4             | blocked | 4 is outside the base allowed universe           |
      | required                          | optional                    | blocked | required cannot be silently relaxed              |
      | forbidden                         | permitted                   | blocked | a forbidden property cannot be re-enabled        |
      | string matching the base pattern  | a second compatible pattern | ready   | both patterns apply                               |
      | one conditional validation rule   | another conditional rule    | ready   | both conditions apply unless one names an override slot |

  # Data layer layered schema constraints 004
  Scenario: Data layer layered schema constraints 004
    Given Sitewide defines funnel_step as an optional string allowed to be 1, 2, 3a, or 3b
    And Checkout requires funnel_step and locks funnel_name to checkout
    And Shipping sets overridable expectation funnel_step to 3a
    When Alternative shipping replaces that expectation with 3b
    Then its effective schema requires funnel_step with fixed value 3b and funnel_name with fixed value checkout
    And provenance says Alternative shipping supersedes Shipping expectation 3a while inheriting Checkout and Sitewide invariants
    When Shipping changes expectation 3a from overridable to invariant
    Then Alternative shipping value 3b is blocked at funnel_step
    And the conflict links to Shipping and Alternative shipping without silently choosing by precedence

  # Data layer layered schema constraints 005
  Scenario: Data layer layered schema constraints 005
    Given Checkout contributes one constraint for all Events, one for context Events, one for interaction Events, and one for Purchase only
    And Shipping contributes one constraint for all Events on that Page
    And Alternative shipping contributes one constraint for every contained Event occurrence
    And its Purchase occurrence contributes one occurrence-only constraint
    When effective schemas are compiled for the Page context Event, Purchase, and an unrelated interaction Event
    Then each effective schema contains exactly the contributions whose named targets include it
    And the occurrence-only contribution appears only on Alternative shipping Purchase
    And every inclusion and exclusion has contributor and target-scope provenance

  # Data layer layered schema constraints 006
  Scenario: Data layer layered schema constraints 006
    Given Alternative shipping uses matcher-driven activation
    And its applicability is All of pathname matching /checkout/shipping, page_name equalling shipping, checkout_variant equalling alternative, and Event equalling Purchase
    When the operator tests a matching observation and three observations each differing in one matched property
    Then exactly the complete match selects Alternative shipping Purchase
    And each rejected observation identifies the failed human-name predicate
    And automatic evaluation uses applicability evidence rather than inferred Flow sequence
    When an equal-priority automatic candidate also matches the complete observation
    Then automatic selection is blocked as ambiguous and names both candidates
    When the operator gives one candidate explicit higher priority and retests
    Then that candidate wins and the other remains visible as a rejected match

  # Data layer layered schema constraints 007
  Scenario: Data layer layered schema constraints 007
    Given Alternative shipping is available only through explicit operator selection
    When the operator validates a Purchase observation and selects Alternative shipping Purchase by its Flow, Page, and Event names
    Then validation uses that compiled effective schema without evaluating automatic applicability
    And the result records manual selection, stable compiled target identity, effective schema revision, issues, and provenance
    And no automatic assignment winner is claimed

  # Data layer layered schema constraints 008
  Scenario: Data layer layered schema constraints 008
    Given Alternative shipping is marked as non-executable specification content
    When its effective schema and developer export are generated
    Then the schema compiles with complete property and provenance detail but is excluded from automatic and manual validation choices
    And the export states Alternative shipping branch, Shipping Page, Purchase Event, funnel_step equals 3b, inherited funnel_name equals checkout, and Documentation only not automatically validated
    And the export distinguishes inherited constraints, local differences, conditions, and activation
    And documentation-only status creates no runtime assignment or automatic ambiguity

  # Data layer layered schema constraints 009
  Scenario: Data layer layered schema constraints 009
    Given the operator selects a Page Group, Page frame, or Event occurrence on the Flow canvas
    When the contextual Inspector opens its Schema constraints summary
    Then it shows inherited, local, effective, conflict, and activation counts without replacing the canvas
    And one action opens the complete shared schema editor in the main workspace at that contributor
    And returning to the Flow restores the selected canvas item and viewport
    And consequential saves state the affected scopes, stale compiled targets, draft status, and one Undo action

  # Data layer layered schema constraints 010
  Scenario: Data layer layered schema constraints 010
    Given automatic applicability selects Alternative shipping Purchase for an observed Event
    And the selected target's compiled expected-value rule accepts only 3b at /funnel_step
    When otherwise valid Purchase observations contain funnel_step 3b and 3a
    Then the 3b observation has no funnel_step issue
    And the 3a observation reports path /funnel_step, code EXPECTED_VALUE, severity error, expected 3b, actual 3a, and Alternative shipping provenance
    And each result identifies the selected target and effective schema revision
    And per-Event validation makes no claim that an expected Flow sequence or occurrence was completed
