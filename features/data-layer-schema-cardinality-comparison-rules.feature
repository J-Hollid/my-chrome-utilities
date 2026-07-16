# mutation-stamp: sha256=df1af220e92941b9db0ccf24c23f3de2761a47a81def1adc92e3a21cc0918989
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T18:47:32.734464016Z","feature_name":"Data layer schema cardinality comparison rules","feature_path":"features/data-layer-schema-cardinality-comparison-rules.feature","background_hash":"f647d33c22d8b2fd3d1af75cd7b79bab496e25c0077122ecf1f9024cd116ed27","implementation_hash":"bcbad62993b840cfcf466e2afac8c954580856b73a40464ba39716da42d7ef18","scenarios":[{"index":0,"name":"Data layer schema cardinality comparison rules 001","scenario_hash":"bd11d559a041464606480cc004b762111a577f47f5a217e75b3d422b5f805176","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-16T18:47:32.734464016Z"},{"index":3,"name":"Data layer schema cardinality comparison rules 004","scenario_hash":"7aa503fecf54ca701550714bdd9626b0273730feed52c780c2909c71ef2aa4a4","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-16T18:47:32.734464016Z"},{"index":4,"name":"Data layer schema cardinality comparison rules 005","scenario_hash":"dae900f9ebabf132372c6b6be063da472f2eaf98dbee8873e721260566327993","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-16T18:47:32.734464016Z"},{"index":1,"name":"Data layer schema cardinality comparison rules 002","scenario_hash":"33a2ad3570e2fedd4248e4088a0ca091fde0ad2b4ee921b6e46fcb536857d217","mutation_count":50,"result":{"Total":50,"Killed":50,"Survived":0,"Errors":0},"tested_at":"2026-07-16T18:43:56.670028930Z"},{"index":2,"name":"Data layer schema cardinality comparison rules 003","scenario_hash":"8cfd201df8172f02be589b1717ca34962fd6273734a00161cb7ddb5603865c09","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-16T18:43:56.670028930Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema cardinality comparison rules

  Background:
    Given a Payload schema working draft declares string property /title and array property /items

  # Data layer schema cardinality comparison rules 001
  Scenario Outline: Data layer schema cardinality comparison rules 001
    Given property <property_path> has type <property_type>
    When the operator configures <rule_type>
    Then Comparison offers >, >=, ==, <, and <=
    And Limit accepts a non-negative whole number
    And the rule compares <measured_value> with Limit

    Examples:
      | property_path | property_type | rule_type   | measured_value       |
      | /title        | string        | Text length | string character count |
      | /items        | array         | Item count  | array item count      |

  # Data layer schema cardinality comparison rules 002
  Scenario Outline: Data layer schema cardinality comparison rules 002
    Given a <rule_type> rule compares its measured value <comparison> 50
    When values with measured cardinalities 49, 50, and 51 are validated
    Then the cardinality 49 outcome is <below_limit_outcome>
    And the cardinality 50 outcome is <at_limit_outcome>
    And the cardinality 51 outcome is <above_limit_outcome>

    Examples:
      | rule_type   | comparison | below_limit_outcome | at_limit_outcome | above_limit_outcome |
      | Text length | >          | issue               | issue            | pass                |
      | Text length | >=         | issue               | pass             | pass                |
      | Text length | ==         | issue               | pass             | issue               |
      | Text length | <          | pass                | issue            | issue               |
      | Text length | <=         | pass                | pass             | issue               |
      | Item count  | >          | issue               | issue            | pass                |
      | Item count  | >=         | issue               | pass             | pass                |
      | Item count  | ==         | issue               | pass             | issue               |
      | Item count  | <          | pass                | issue            | issue               |
      | Item count  | <=         | pass                | pass             | issue               |

  # Data layer schema cardinality comparison rules 003
  Scenario Outline: Data layer schema cardinality comparison rules 003
    Given a cardinality rule has invalid configuration <invalid_configuration>
    When local rule validation runs
    Then the rule cannot be created
    And assistance states <assistance>

    Examples:
      | invalid_configuration | assistance                         |
      | no comparison         | Choose a comparison                |
      | no limit              | Enter a non-negative whole number  |
      | limit -1              | Enter a non-negative whole number  |
      | limit 1.5             | Enter a non-negative whole number  |

  # Data layer schema cardinality comparison rules 004
  Scenario Outline: Data layer schema cardinality comparison rules 004
    Given the operator creates <rule_type> with comparison <comparison> and limit <limit>
    When the schema draft is saved and reopened
    Then the attached rule retains comparison <comparison> and limit <limit>
    And its validation issue identifies <expected_constraint> and the measured actual value

    Examples:
      | rule_type   | comparison | limit | expected_constraint       |
      | Text length | <=         | 50    | text length at most 50    |
      | Item count  | >          | 2     | item count greater than 2 |

  # Data layer schema cardinality comparison rules 005
  Scenario Outline: Data layer schema cardinality comparison rules 005
    Given a saved legacy <rule_type> rule has limit <limit>
    When the rule is loaded into the comparison editor
    Then Comparison is <comparison>
    And Limit is <limit>
    And validation retains <legacy_behavior>

    Examples:
      | rule_type   | limit | comparison | legacy_behavior             |
      | Text length | 8     | ==         | exact length 8              |
      | Item count  | 1     | >=         | minimum item count 1        |
