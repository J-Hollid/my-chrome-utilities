#!/usr/bin/env node
import {runCompactConservationCommand} from
  "./verification-registry/compact-conservation-command.mjs";

const mode=process.argv[2]??"refresh";
runCompactConservationCommand([mode]).then(({changed,recordCount})=>{
  console.log(JSON.stringify({compactConservation:{mode,changed,recordCount}}));
}).catch((error)=>{console.error(error.message);process.exitCode=1;});
