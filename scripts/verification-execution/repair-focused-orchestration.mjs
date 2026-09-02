import {execFile} from "node:child_process";
import path from "node:path";

import {canonicalReliabilityRepairPlan,reliabilitySuccessionPlanProvider} from
  "./exact-slice-evidence-plan.mjs";
import {createArtifactBoundRepairContext,executeArtifactBoundRepairPlan} from
  "../verification-reliability-repair-execution.mjs";
import {loadVerificationPacks,planVerification,validateVerificationPacks,
  verificationTaskIdentity} from "../verification-packs.mjs";
import {validateVerificationCandidateClean,validateStrictVerificationToolchain,
  verificationDigest} from "../verification-evidence.mjs";
import {canonicalVerificationChangeSet} from "../verification-changes.mjs";
import {createTimeoutIncidentStore,deriveTaskCheckpointRepairProof,
  taskCheckpointRepairRequired,timeoutRepairCausalCategory,timeoutRepairDiagnosedBoundary,
  timeoutRepairFocusedExecutionTaskPlan,timeoutRepairFocusedTaskPlan} from
  "../verification-reliability-incidents.mjs";
import {bootstrapReviewIncidentProof,verificationRunIntents} from
  "../verification-run-intent.mjs";
import {resolveIncidentTaskSuccession,validateUnresolvedIncidentTaskSuccession,
  verificationTaskDigest} from "../verification-task-succession.mjs";
import {canonicalRepairTaskIdentities,createReceiptBoundRepairTaskIdentityProvider} from
  "../verification-pack-cardinality/reliability-adapter.mjs";
import {repositoryRoot} from "../verification-reliability-values.mjs";

export async function executeTimeoutRepairTaskPlan(executionTaskPlan,{
  registeredRuntimeTasks=new Map(),runner,regressionContext,
}) {
  for(const descriptor of executionTaskPlan){
    const registeredTask=registeredRuntimeTasks.get(descriptor.identity.key);
    const task={...structuredClone(descriptor.identity),
      ...(registeredTask?.temporaryPathClass
        ?{temporaryPathClass:registeredTask.temporaryPathClass}:{}),
      ...(descriptor.executionArgs?{executionArgs:[...descriptor.executionArgs]}:{}),
      ...(descriptor.executionLogicalTargetIds
        ?{executionLogicalTargetIds:[...descriptor.executionLogicalTargetIds]}:{}),
      ...(descriptor.roles.includes("causal-regression")?{executionEnvironment:{
        SWARMFORGE_TIMEOUT_REPAIR_REGRESSION:JSON.stringify(regressionContext),
      }}:{}),
    };
    await runner(`reliability repair ${descriptor.roles.join("+")} ${task.key}`,task);
  }
}

export async function runRepairFocusedOrchestration(id,{
  regressionKey,causalCategory,causalExplanation,baseCommit,evidenceTask,
  store=createTimeoutIncidentStore(),
  candidateIdentity=async()=>{
    const value=(...arguments_)=>new Promise((resolve,reject)=>execFile("git",arguments_,
      {cwd:repositoryRoot},(error,stdout,stderr)=>error
        ?reject(new Error(stderr.trim()||error.message)):resolve(stdout.trim())));
    return{commit:await value("rev-parse","HEAD^{commit}"),
      tree:await value("rev-parse","HEAD^{tree}"),
      branch:await value("rev-parse","--abbrev-ref","HEAD")};
  },
  artifactIdentity,canonicalPlan,
  strictToolchainValidator=()=>validateStrictVerificationToolchain({repositoryRoot}),
  candidateCleanValidator=()=>validateVerificationCandidateClean({repositoryRoot}),
  changeSetLoader=(base)=>canonicalVerificationChangeSet({base,repositoryRoot}),
  incidentChangedPathsLoader=(failedCommit)=>new Promise((resolve,reject)=>
    execFile("git",["diff","--name-only",`${failedCommit}..HEAD`],{cwd:repositoryRoot},
      (error,stdout,stderr)=>error?reject(new Error(stderr.trim()||error.message))
        :resolve(stdout.split(/\r?\n/u).filter(Boolean)))),
  verificationPacksLoader=loadVerificationPacks,
  verificationPacksValidator=validateVerificationPacks,
  receiptContextFactory,commandRunnerFactory,prepareTaskLaunchAuthorizations,resumeReceiptPath,
}={}) {
  timeoutRepairCausalCategory(causalCategory);
  if(typeof causalExplanation!=="string"||causalExplanation!==causalExplanation.trim()||
      causalExplanation.length<1||causalExplanation.length>500||
      /[\u0000-\u001f\u007f]/u.test(causalExplanation)){
    throw new Error("Reliability repair requires a bounded one-line causal explanation");
  }
  if(typeof regressionKey!=="string"||!regressionKey||!baseCommit||!evidenceTask){
    throw new Error("Reliability repair requires regression, approved base, and evidence task");
  }
  await strictToolchainValidator();
  await candidateCleanValidator();
  const incident=await store.read(id);
  const taskCheckpointProof=taskCheckpointRepairRequired(incident)
    ?await deriveTaskCheckpointRepairProof(incident):undefined;
  const [candidate,changeSet,packs,incidentChangedPaths]=await Promise.all([
    candidateIdentity(),changeSetLoader(baseCommit),verificationPacksLoader(),
    incidentChangedPathsLoader(incident.failure.lineage.commit),
  ]);
  await verificationPacksValidator(packs);
  const plan=await canonicalReliabilityRepairPlan(packs,{
    canonicalPlan,evidenceTask,changeSet,repositoryRoot,
  });
  const receiptBoundTaskIdentityProvider=createReceiptBoundRepairTaskIdentityProvider({
    packs,plan,incident,candidate,baseCommit,evidenceTask,changedPaths:incidentChangedPaths,
    verificationTaskIdentity,currentRegistryLoader:verificationPacksLoader,
    currentCandidateLoader:candidateIdentity,
    currentPlanLoader:(currentPacks)=>canonicalReliabilityRepairPlan(currentPacks,{
      canonicalPlan,evidenceTask,changeSet,repositoryRoot,
    }),
  });
  const canonicalPlanProvider=()=>plan;
  const canonicalIdentities=canonicalRepairTaskIdentities(packs,{
    planVerification:canonicalPlanProvider,verificationTaskIdentity,incident,
  });
  const unresolvedIncidents=await store.blocking({commit:candidate.commit});
  await validateUnresolvedIncidentTaskSuccession({incidents:unresolvedIncidents,
    currentIdentities:blockingIncident=>canonicalRepairTaskIdentities(packs,{
      planVerification:reliabilitySuccessionPlanProvider(blockingIncident,incident,
        {exactPlanProvider:canonicalPlanProvider,registryPlanner:planVerification}),
      verificationTaskIdentity,incident:blockingIncident,
    }),currentPacks:packs});
  const internalExecutionContract=incident.failure.failureClass==="execution-contract-failure"&&
    incident.failure.task.stage==="promotion";
  const taskSuccession=internalExecutionContract||canonicalIdentities.some((identity)=>
    verificationTaskDigest(identity)===verificationTaskDigest(incident.failure.task))
    ?undefined:await resolveIncidentTaskSuccession({incident,
      currentIdentities:canonicalIdentities,currentPacks:packs});
  const registeredRuntimeTasks=new Map(plan.tasks.map((task)=>[task.key,task]));
  const taskPlan=timeoutRepairFocusedTaskPlan(incident,incidentChangedPaths,regressionKey,
    canonicalIdentities,taskSuccession,taskCheckpointProof);
  const executionTaskPlan=timeoutRepairFocusedExecutionTaskPlan(taskPlan,canonicalIdentities);
  const receiptCandidate={role:process.env.SWARMFORGE_ROLE??null,branch:candidate.branch??null,
    commit:candidate.commit,tree:candidate.tree,baseCommit:changeSet.baseCommit,evidenceTask,
    changeSetDigest:verificationDigest(changeSet)};
  const receiptPlan={mode:"timeout-repair-focused",incidentId:id,causalCategory,
    causalExplanation,...(taskCheckpointProof?{taskCheckpointProof}:{}),
    ...(taskSuccession?{taskSuccession}:{}),taskPlan,executionTaskPlan};
  const context=await createArtifactBoundRepairContext({resumeReceiptPath,repositoryRoot,
    incidentId:id,candidate:receiptCandidate,plan:receiptPlan,
    runIntent:verificationRunIntents.repair,
    concurrency:incident.failure.environment.concurrency,
    observationConcurrency:incident.failure.environment.observationConcurrency,
    receiptContextFactory,
  });
  const runtimeExecutionTasks=executionTaskPlan.map((descriptor)=>({
    ...structuredClone(descriptor.identity),
    ...(registeredRuntimeTasks.get(descriptor.identity.key)?.temporaryPathClass
      ?{temporaryPathClass:registeredRuntimeTasks.get(descriptor.identity.key).temporaryPathClass}:{}),
  }));
  await context.write();
  console.error(`[verify:receipt] ${path.relative(repositoryRoot,context.receiptPath)}`);
  const regressionContext={version:1,incidentId:id,failureDigest:incident.failureDigest,
    diagnosedBoundary:timeoutRepairDiagnosedBoundary(incident,{taskCheckpointProof}),
    causalCategory,causalExplanation};
  await executeArtifactBoundRepairPlan(executionTaskPlan,{
    context,runtimeTasks:runtimeExecutionTasks,artifactIdentity,
    prepareLaunch:(receiptContext,tasks,{artifact})=>prepareTaskLaunchAuthorizations(
      receiptContext,tasks,"timeout-repair-focused",{
        candidate:receiptContext.receipt.candidate,artifact,
      }),
    runnerFactory:(receiptContext,launch)=>commandRunnerFactory(receiptContext,{
      ...launch,strictAcceptanceReceipt:false,incidentStore:store,
    }),
    executePlan:(descriptors,{runner})=>executeTimeoutRepairTaskPlan(descriptors,{
      registeredRuntimeTasks,runner,regressionContext,
    }),
  });
  context.receipt.completedAt=new Date().toISOString();
  await context.write();
  const repaired=await store.proposeRepair(id,{causalCategory,causalExplanation,regressionKey,
    regressionReceiptPath:context.receiptPath,focusedReceiptPath:context.receiptPath,
    receiptBoundTaskIdentityProvider,
    allowEligibleRevalidation:Boolean(await bootstrapReviewIncidentProof({
      root:repositoryRoot,incident,evidenceTask,
    }))});
  console.error(`[verify:reliability-repair-focused] ${id} ${repaired.repair.status}`);
  return{incident:repaired,receiptPath:context.receiptPath,taskPlan,executionTaskPlan};
}
