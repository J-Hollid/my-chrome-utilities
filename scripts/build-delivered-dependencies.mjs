import path from "node:path";

const safe=value=>typeof value==="string"&&value.length>0&&!path.posix.isAbsolute(value)&&path.posix.normalize(value)===value&&!value.startsWith("../")&&!value.includes("\\")&&!value.includes("\0");

export function validateBuildDeliveredDependencies(value){
  if(!Array.isArray(value))throw new Error("Build-delivered dependencies require an array");
  const destinations=new Set();
  for(const dependency of value){
    if(!dependency||Object.keys(dependency).sort().join(",")!=="destination,source"||!safe(dependency.source)||!safe(dependency.destination)||destinations.has(dependency.destination))throw new Error("Build-delivered dependencies require unique safe source and destination paths");
    destinations.add(dependency.destination);
  }
  return value;
}
