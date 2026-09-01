import { execFile } from "node:child_process";

export const administrativeGitNoteLimitBytes = 64 * 1024 * 1024;

export const verificationAdministrationConditionNames = Object.freeze([
  "candidate-plan-authority",
  "git-note-resolution",
  "incident-state",
  "promotion-capabilities",
]);

function conditionMap(checks) {
  if (!Array.isArray(checks) || checks.length !== verificationAdministrationConditionNames.length) {
    throw new Error("Verification administration requires the exact condition set");
  }
  const byName = new Map(checks.map((check) => [check?.name, check]));
  if (byName.size !== checks.length || verificationAdministrationConditionNames.some((name) =>
    typeof byName.get(name)?.validate !== "function")) {
    throw new Error("Verification administration requires the exact condition set");
  }
  return byName;
}

export async function runVerificationAdministrationChecks({ phase, checks }) {
  if (!["prelaunch", "final-evidence"].includes(phase)) {
    throw new Error("Verification administration requires prelaunch or final-evidence phase");
  }
  const byName = conditionMap(checks);
  const results = {};
  for (const name of verificationAdministrationConditionNames) {
    try {
      results[name] = await byName.get(name).validate();
    } catch (error) {
      throw new Error(`Verification administration ${phase} failed at ${name}: ${error.message}`);
    }
  }
  return { version:1, phase,
    conditionNames:[...verificationAdministrationConditionNames], results };
}

export function parseAdministrativeGitNote(bytes, { label = "Git note" } = {}) {
  const content = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (content.length > administrativeGitNoteLimitBytes) {
    throw new Error(`${label} exceeds the supported 64 MiB bound`);
  }
  try { return JSON.parse(content.toString("utf8")); }
  catch { throw new Error(`${label} is not valid JSON`); }
}

export function readAdministrativeGitNote(repositoryRoot, ref, commit, {
  allowMissing = false,
} = {}) {
  return new Promise((resolve, reject) => {
    execFile("git", ["notes", `--ref=${ref}`, "show", commit], {
      cwd:repositoryRoot, encoding:"buffer", maxBuffer:administrativeGitNoteLimitBytes,
    }, (error, stdout, stderr) => {
      if (error) {
        const message = stderr.toString().trim() || error.message;
        if (allowMissing && /no note found|cannot read note data|bad object/iu.test(message)) {
          resolve(undefined);
          return;
        }
        reject(new Error(message));
        return;
      }
      try { resolve(parseAdministrativeGitNote(stdout, { label:`Git note ${ref} at ${commit}` })); }
      catch (parseError) { reject(parseError); }
    });
  });
}
