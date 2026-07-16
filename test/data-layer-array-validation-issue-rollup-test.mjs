import assert from "node:assert/strict";
import { applyArrayValidationRollups } from "../dist/data-layer-live-validation-presentation.js";

const empty={status:"No rules",symbolName:"neutral",treatment:"neutral",errors:0,warnings:0,passed:0};
const leaf=(path,name)=>({path:path.slice(1).replaceAll("/","."),technicalPath:path,name,valueLabel:"",missing:false,evaluations:[],summary:empty,aggregate:{errors:0,warnings:0},children:[],specificItems:[]});
const items=Array.from({length:10},(_,index)=>({ ...leaf(`/products/${index}`,`Item ${index+1}`),zeroBasedIndex:index,children:[leaf(`/products/${index}/type`,"type")] }));
const tree=[{...leaf("/products","products"),children:[{...leaf("/products/*","Every item"),matchedValueCount:10,children:[leaf("/products/*/type","type")]}],specificItems:items}];
const evaluations=Array.from({length:10},(_,index)=>({propertyPath:`/products/${index}/type`,templatePath:"/products/*/type",status:index===7?"error":"pass",message:"Allowed product type",expected:"physical,digital",actual:index===7?"service":"physical",rule:"Allowed product type",ruleVersion:1,severity:"error",schemaName:"Product",schemaVersion:1}));
const rolled=applyArrayValidationRollups(tree,evaluations);
const products=rolled[0],every=products.children[0],type=every.children[0];
assert.deepEqual({errors:products.rollup.errors,affected:products.rollup.affectedItemCount,total:products.rollup.totalItemCount},{errors:1,affected:1,total:10});
assert.deepEqual({errors:every.rollup.errors,affected:every.rollup.affectedItemCount},{errors:1,affected:1});
assert.match(type.summary.status,/9 passed and 1 error/);
assert.equal(type.rollup.ruleCount,1);
assert.deepEqual(products.affectedItems.map(({zeroBasedIndex})=>zeroBasedIndex),[7]);
assert.deepEqual(products.rollup.affectedPaths,["/products/7/type"]);

const repeated=applyArrayValidationRollups(tree,[{...evaluations[7],propertyPath:"/products/7/id",templatePath:"/products/*/id"},evaluations[7]]);
assert.deepEqual({errors:repeated[0].rollup.errors,affected:repeated[0].rollup.affectedItemCount},{errors:2,affected:1});

const nestedItems=Array.from({length:5},(_,index)=>({...leaf(`/orders/1/items/${index}`,`Item ${index+1}`),zeroBasedIndex:index,children:[leaf(`/orders/1/items/${index}/sku`,"sku")]}));
const nested=[{...leaf("/orders","orders"),specificItems:[{...leaf("/orders/1","Item 2"),zeroBasedIndex:1,children:[{...leaf("/orders/1/items","items"),specificItems:nestedItems}]}]}];
const nestedEvaluation={...evaluations[7],propertyPath:"/orders/1/items/4/sku",templatePath:"/orders/*/items/*/sku"};
const nestedRolled=applyArrayValidationRollups(nested,[nestedEvaluation]);
assert.deepEqual(nestedRolled[0].affectedItems.map(({zeroBasedIndex})=>zeroBasedIndex),[1]);
assert.deepEqual(nestedRolled[0].specificItems[0].children[0].affectedItems.map(({zeroBasedIndex})=>zeroBasedIndex),[4]);
console.log("array validation issue rollup tests passed");
