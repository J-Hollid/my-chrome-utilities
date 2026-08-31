const digestPattern = /^[a-f0-9]{64}$/u;

const completedAt = (entry) => Date.parse(entry?.receipt?.completedAt ?? "");

export function validateRetiredCalibrationReceipts({
  calibration, declared, timingReceipts, cutoff,
}) {
  const retiredReceipts = calibration?.retiredReceipts ?? [];
  if (!Array.isArray(retiredReceipts) || retiredReceipts.some((entry) =>
    !digestPattern.test(entry?.digest ?? "") || !declared.includes(entry.digest) ||
    !digestPattern.test(entry.environmentClassId ?? "") ||
    !Number.isFinite(Date.parse(entry.completedAt ?? ""))) ||
    new Set(retiredReceipts.map(({ digest }) => digest)).size !== retiredReceipts.length) {
    throw new Error("Calibration snapshot contains an invalid compact retired receipt identity");
  }
  const retiredByDigest = new Map(retiredReceipts.map((entry) => [entry.digest, entry]));
  const entriesByDigest = new Map(timingReceipts.map((entry) => [entry.digest, entry]));
  for (const digest of declared) {
    const entry = entriesByDigest.get(digest);
    const compact = retiredByDigest.get(digest);
    if (!entry?.receipt && !compact) {
      throw new Error(`Calibration snapshot receipt ${digest} is missing`);
    }
    if (!entry?.receipt) {
      if (compact.environmentClassId !== calibration.environmentClassId ||
          Date.parse(compact.completedAt) > cutoff) {
        throw new Error(`Calibration snapshot compact receipt ${digest} has identity drift`);
      }
    } else if (compact && (compact.environmentClassId !== entry.environmentClassId ||
        Date.parse(compact.completedAt) !== completedAt(entry))) {
      throw new Error(`Calibration snapshot compact receipt ${digest} does not match raw evidence`);
    }
  }
  return { retiredByDigest, retiredReceipts };
}
