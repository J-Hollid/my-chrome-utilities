# mutation-stamp: sha256=02cd63550917f7045f6ec0aa5fda3e1abf8fe716f7bc9ec9ed0456adab2e7339
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T19:58:00.126502274Z","feature_name":"Data layer array validation issue rollup runtime","feature_path":"features/data-layer-array-validation-issue-rollup-runtime.feature","background_hash":"81c52c81a405128e2e568403266bc59301e30ec27cb67addff1ac9ef8c23489e","implementation_hash":"86f8bc63b6d65822dd0babea23efed7dc11c6b4de0945cce26369e4b32e74aa1","scenarios":[{"index":1,"name":"Data layer array validation issue rollup runtime 002","scenario_hash":"8be67b0c78657ff238ba1d4c5fbc675bee5f2e38fb81fe339471a24188c1e19e","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-16T19:57:49.099697666Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer array validation issue rollup runtime

  Background:
    Given the built extension side panel is running with production schema validation and Live event presentation
    And a captured event has 10 products with a wildcard Allowed product type rule

  # Data layer array validation issue rollup runtime 001
  Scenario: Data layer array validation issue rollup runtime 001
    Given production validation reports /products/7/type against template path /products/*/type
    When the actual Live inspector property hierarchy is rendered
    Then products, Every item, and wildcard type render the same 1-error 1-affected-item roll-up
    And Affected items renders only Item 8 as affected
    And Item 8 exposes concrete /products/7/type and its rule details
    And the event-level result still contains exactly 1 error

  # Data layer array validation issue rollup runtime 002
  Scenario Outline: Data layer array validation issue rollup runtime 002
    Given the production array hierarchy is collapsed
    When the operator activates <rendered_control>
    Then the actual ancestor disclosures open through Item 8 type
    And browser focus reaches the concrete failing property row
    And no hidden or acceptance-only issue marker substitutes for the rendered path

    Examples:
      | rendered_control                    |
      | products aggregate status           |
      | Every item aggregate status         |
      | Event-level /products/7/type issue  |

  # Data layer array validation issue rollup runtime 003
  Scenario: Data layer array validation issue rollup runtime 003
    Given production validation reports errors across different and repeated product indexes
    When the actual Live inspector aggregates those results
    Then rendered issue counts and affected-item counts distinguish errors from affected indexes
    And each underlying validation issue contributes once to event totals
    And only concrete items with an error or warning appear under Affected items

  # Data layer array validation issue rollup runtime 004
  Scenario: Data layer array validation issue rollup runtime 004
    Given an affected item roll-up is displayed at 320 CSS px wide
    When array and affected-item summaries contain errors, warnings, counts, and indexes
    Then status text, hierarchy, and disclosure controls remain readable without horizontal scrolling
    And symbols and accessible names communicate the roll-up without relying on color
