const digestPattern = /^[a-f0-9]{64}$/u;
const identityKeys = ["completedAt", "digest", "environmentClassId", "version"];

function validIdentity(entry) {
  return entry && !Array.isArray(entry) &&
    JSON.stringify(Object.keys(entry).sort()) === JSON.stringify(identityKeys) &&
    entry.version === 1 && digestPattern.test(entry.digest ?? "") &&
    digestPattern.test(entry.environmentClassId ?? "") &&
    Number.isFinite(Date.parse(entry.completedAt ?? "")) &&
    new Date(entry.completedAt).toISOString() === entry.completedAt;
}

export function validateTimingReceiptLossDispositions({
  dispositions = [], availableDigests = [],
} = {}) {
  if (!Array.isArray(dispositions) || dispositions.some((entry) => !validIdentity(entry)) ||
      new Set(dispositions.map(({ digest }) => digest)).size !== dispositions.length) {
    throw new Error("invalid timing receipt loss disposition identity");
  }
  const available = new Set(availableDigests);
  for (const { digest } of dispositions) {
    if (available.has(digest)) throw new Error(`lost timing receipt ${digest} is present`);
  }
  return dispositions.map((entry) => structuredClone(entry))
    .sort((left, right) => left.digest.localeCompare(right.digest));
}
