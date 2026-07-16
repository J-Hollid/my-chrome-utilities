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
