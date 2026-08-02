# mutation-stamp: sha256=4d4991bf8ce429e1d01d155b3b6035df5434c46fa25e101c0943725c2b2ee95a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-02T00:01:08.818501773Z","feature_name":"Data layer project portability and upgrade runtime","feature_path":"features/data-layer-project-portability-and-upgrade-runtime.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"3f2001697c-architect-fixed","scenarios":[{"index":2,"name":"Data layer project portability and upgrade runtime 003","scenario_hash":"399547ea6a278a969397888d37636ba985e648e13de668eff4c265dceb6aef7a","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-02T00:01:08.818501773Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer project portability and upgrade runtime

  # Data layer project portability and upgrade runtime 001
  Scenario: Data layer project portability and upgrade runtime 001
    Given production project-retail is active with a Saved Draft based on Published revision 3 and contains metadata, canonical contributors, Pages, Page Groups, Events, Flows, occurrences, applicability, assignments, documentation settings, and adopted-schema lineage
    When actual Projects controls export Retail website
    Then one downloaded versioned bundle identifies project-retail, its Saved Draft, and base Published revision 3
    And parsed bundle data contains the complete canonical project graph with resolvable stable references
    And parsed assignment records contain contributor targets with no schemaDrafts collection or compiled-schema copy
    And it contains no unadopted library schema, permission, Live observation, compilation cache, interface state, or Undo history
    And storage hash, selected context, Saved Draft, and Published revision match their pre-export values

  # Data layer project portability and upgrade runtime 002
  Scenario: Data layer project portability and upgrade runtime 002
    Given production project-retail is active and a valid bundle also uses project-retail for linked Sitewide, Cart, Purchase, and Retail checkout records
    When actual controls choose that file through Import project
    Then the installed review renders format version, source name, Published revision, Saved Draft state, entity counts, reference integrity, migrations, unique target name Retail website copy, and Import as new project
    And canonical project storage is unchanged before confirmation
    When actual controls confirm Import as new project
    Then production stores inactive Retail website copy with new project and project-owned entity identities
    And serialized parent, membership, occurrence, assignment contributor target, and Flow references point to the remapped identities
    And external Saved Schema Library lineage still names its original source revision
    And production project-retail plus every prior library entry remains byte-identical
    When actual controls open the imported project
    Then it is the sole active identity and production compilation resolves its effective schemas and Flow graph without source-installation state

  # Data layer project portability and upgrade runtime 003
  Scenario Outline: Data layer project portability and upgrade runtime 003
    Given production project-retail is active before import
    When actual file controls select a bundle with <problem>
    Then the installed review renders <repair> at the exact bundle section
    And the Import as new project control is disabled
    And the repository snapshot equals its pre-import snapshot with the same counts and selection

    Examples:
      | problem                              | repair                                      |
      | malformed JSON                       | choose a readable project bundle             |
      | unsupported future format version    | use a supported version or migrate externally |
      | missing Page referenced by a Flow    | restore the missing Page and export again    |

  # Data layer project portability and upgrade runtime 004
  Scenario: Data layer project portability and upgrade runtime 004
    Given production storage has only singleton Legacy shop project project-legacy with metadata, storage generation 9, project graph, navigation, Undo history, and Purchase payload in schemaDrafts
    And serialized Retail Purchase assignment references that legacy schema draft
    When the installed project-library migration runs
    Then one atomic repository write creates one Legacy shop entry with unchanged project and entity identities
    And active-project persistence becomes project-legacy
    And every pre-upgrade content hash for metadata, Draft, graph, and navigation is conserved
    And production Shared Profiles contain Purchase payload with its canonical content, lineage, and identity
    And serialized Retail Purchase targets that Shared Profile with no schemaDrafts collection remaining
    And production project state contains no Undo or Redo while a recoverable backup retains their legacy bytes and checksum
    When the extension reloads twice
    Then repository bytes contain one unmigrated-again Legacy shop entry and the same active identity

  # Data layer project portability and upgrade runtime 005
  Scenario: Data layer project portability and upgrade runtime 005
    Given the actual extension starts with production Retail website active in its project library
    When installed project controls create Agency platform, edit metadata, switch to Retail website, and open its Project overview in Specification Studio
    And actual controls export Retail website, import it as a new inactive project, and open the imported project
    Then observed active-project history contains exactly one identity after every context change
    And serialized existing projects retain metadata, canonical graphs, Saved Drafts, and Published revisions
    And the imported graph uses remapped stable references with effective schema output equivalent to Retail website
    When the installed side panel and Specification Studio reload
    Then both render the imported project as active with no Retail website or Agency platform entity in their project-bound views

  # Data layer project portability and upgrade runtime 006
  Scenario: Data layer project portability and upgrade runtime 006
    Given production Retail website has Project revision 13, its schema manifest, and a newer Saved Draft
    When actual Projects controls export Retail website
    Then parsed bundle bytes contain the current Draft, base Project revision 13, current production project snapshot, schema manifest, and referenced current schema snapshots
    And each manifest entry contains one stable schema identity and selective production Schema revision
    And recursive key inspection finds no per-edit revision, canonical changes array, Draft token, field stamp, Undo, Redo, or older production snapshot
    And only the separately invoked repository recovery export contains all production-history records

  # Data layer project portability and upgrade runtime 007
  Scenario: Data layer project portability and upgrade runtime 007
    Given an older bundle contains Project revision 3 and one canonical schema with edit revision 2847 and 2847 change entries
    When actual controls choose that file through Import project
    Then rendered review identifies legacy edit-revision compaction while reporting unchanged current content and genuine publication lineage
    When actual controls confirm Import as new project
    Then repository inspection finds Project revision 3 and Schema revisions reconstructed only from distinct production fingerprints
    And current Draft hashes and every remapped stable reference match the staged result
    And active imported records and their ordinary re-export contain no edit revision or canonical changes array
    And hashes for the source and every pre-existing project remain unchanged
