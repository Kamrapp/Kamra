import { spawn } from "node:child_process";

const checks: Array<{ args: string[]; label: string }> = [
  { args: ["run", "test:integration"], label: "deterministic integration tests" },
  { args: ["run", "test"], label: "full test suite" },
  { args: ["run", "format:check"], label: "format check" },
  { args: ["run", "lint", "--", "--no-warn-ignored"], label: "lint" },
  { args: ["run", "typecheck"], label: "typecheck" },
  { args: ["run", "build:web"], label: "web build" },
  { args: ["run", "build:api"], label: "API build" }
];

for (const check of checks) {
  console.log(`\n=== ${check.label} ===`);
  const exitCode = await runNpm(check.args);
  if (exitCode !== 0) {
    throw new Error(`${check.label} failed with exit code ${exitCode}.`);
  }
}

console.log(
  "\nMVP preflight passed. Configured MongoDB smokes and browser evidence remain separate."
);

function runNpm(args: string[]): Promise<number> {
  const isWindows = process.platform === "win32";
  const executable = isWindows ? (process.env["ComSpec"] ?? "cmd.exe") : "npm";
  const commandArgs = isWindows ? ["/d", "/s", "/c", "npm", ...args] : args;
  return new Promise((resolve, reject) => {
    const child = spawn(executable, commandArgs, {
      env: process.env,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}
