export function validatePackagePrerequisites(plan) {
  const builds=plan.tasks.filter(({key})=>key==="build:dist");
  const packages=plan.tasks.filter(({key})=>key==="package:extension");
  if (builds.length!==1||packages.length!==1) {
    throw new Error("Bootstrap requires one build and one package task");
  }
  const buildIndex=plan.tasks.indexOf(builds[0]);
  const packageIndex=plan.tasks.indexOf(packages[0]);
  if (buildIndex>=packageIndex) {
    throw new Error("Bootstrap build must run before package");
  }
  return {buildKey:builds[0].key,packageKey:packages[0].key};
}
