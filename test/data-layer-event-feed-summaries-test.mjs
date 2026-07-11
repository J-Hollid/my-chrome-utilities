import assert from "node:assert/strict";
import { eventPathname, pathnameVisits, resolveFeedSummaries, usableSummaryValue } from "../dist/data-layer-event-feed-summaries.js";
assert.equal(usableSummaryValue(0), true); assert.equal(usableSummaryValue(false), true); assert.equal(usableSummaryValue(""), false); assert.equal(usableSummaryValue([]), false);
assert.deepEqual(resolveFeedSummaries({ sourceId:"event-history", name:"pageview", payload:{page_name:"",page_type:"landing",page_category:"Home"} }).map(({label,value})=>[label,value]), [["Page Type","landing"],["Page Category","Home"]]);
assert.deepEqual(pathnameVisits([{pageUrl:"https://x.test/products?a"},{pageUrl:"https://x.test/checkout"},{pageUrl:"https://x.test/products?b"}]).map(({pathname,events})=>[pathname,events.length]), [["/products",1],["/checkout",1],["/products",1]]);
assert.equal(eventPathname("https://x.test/products?campaign=summer#top"), "/products");
assert.equal(eventPathname("not a URL"), "/");
assert.equal(eventPathname(undefined), "/");
