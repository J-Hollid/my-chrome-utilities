import assert from "node:assert/strict";

import {composedSchemaInheritanceStatus,composedSchemaTableColumns} from "../dist/data-layer-composed-schema-workspace-rows.js";
import {profileInheritanceEditorStartingPoint} from "../dist/data-layer-selective-profile-inheritance.js";

assert.equal(profileInheritanceEditorStartingPoint("everything"),"everything","Everything remains an explicit editor starting point");
assert.equal(profileInheritanceEditorStartingPoint("empty"),"empty","Start empty remains an explicit editor starting point");
assert.equal(profileInheritanceEditorStartingPoint("concepts"),"empty","legacy Choose concepts recipes reopen from Start empty");
assert.equal(profileInheritanceEditorStartingPoint("properties"),"empty","legacy Choose properties recipes reopen from Start empty");

assert.deepEqual(composedSchemaTableColumns.map(({label})=>label),["","Path","Concept","Type","Presence","Description","Allowed values","Example","Inheritance"],"composed effective-schema tables replace Source and State with one Inheritance column");
assert.equal(composedSchemaInheritanceStatus({inherited:{path:"/parent"},local:{path:"/parent"}}),"Inherited");
assert.equal(composedSchemaInheritanceStatus({local:{path:"/local",type:"string"}}),"Local");
assert.equal(composedSchemaInheritanceStatus({inherited:{path:"/mixed",type:"string"},local:{path:"/mixed",documentation:"Local"}}),"Mixed / overridden");

console.log("compact inheritance workspace tests passed");
