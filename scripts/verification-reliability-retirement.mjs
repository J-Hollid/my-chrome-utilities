import { timeoutIncidentDigest } from "./verification-reliability-values.mjs";

function isAuditedLineageRetirement(incident) {
  return incident.closureAudit?.kind === "lineage-retired" &&
    incident.closureAudit.blocking === false &&
    incident.closureAudit.resolved === false;
}

export function applyAuditedLineageRetirement(incident, at) {
  if (incident.state !== "unresolved" || !isAuditedLineageRetirement(incident)) {
    throw new Error(`Reliability incident ${incident.id} has no audited lineage retirement`);
  }
  return {
    ...incident,
    state:"retired",
    transitions:[...incident.transitions, {
      type:"lineage-retirement-applied",
      at,
      auditDigest:timeoutIncidentDigest(incident.closureAudit),
    }],
  };
}

export function createLineageRetirementOperations({ list, update, verify, now }) {
  const candidates = async() => (await list()).filter((incident) =>
    incident.state === "unresolved" && isAuditedLineageRetirement(incident));

  const retire = (id) => update(id, async(incident) => {
    if (incident.state === "retired") return incident;
    if (incident.state !== "unresolved" || !isAuditedLineageRetirement(incident)) {
      throw new Error(`Reliability incident ${id} has no audited lineage retirement`);
    }
    await verify(incident);
    return applyAuditedLineageRetirement(incident, now());
  });

  return {
    retireAuditedLineage:retire,
    async retireAuditedLineages({ expectedCount } = {}) {
      const incidents = await candidates();
      if (!Number.isSafeInteger(expectedCount) || expectedCount < 1 ||
          incidents.length !== expectedCount) {
        throw new Error(`Expected ${expectedCount} audited lineage retirement(s), found ${incidents.length}`);
      }
      for (const incident of incidents) await verify(incident);
      const retired = [];
      for (const { id } of incidents) retired.push(await retire(id));
      return retired;
    },
  };
}
