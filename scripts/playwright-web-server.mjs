import { spawn, spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");

const generatedConfig = spawnSync(
  process.execPath,
  [resolve(repositoryRoot, "scripts/generate-public-config.ts")],
  {
    cwd: repositoryRoot,
    env: process.env,
    stdio: "inherit",
    windowsHide: true
  }
);

if (generatedConfig.status !== 0) {
  process.exit(generatedConfig.status ?? 1);
}

const angularCli = resolve(repositoryRoot, "node_modules/@angular/cli/bin/ng.js");
const angularServer = spawn(
  process.execPath,
  [angularCli, "serve", "--host", "0.0.0.0", "--port", "4200", "--proxy-config", "proxy.conf.json"],
  {
    cwd: repositoryRoot,
    env: process.env,
    stdio: "inherit",
    windowsHide: true
  }
);
const pidFile = process.env["KAMRA_PLAYWRIGHT_WEB_SERVER_PID_FILE"];
const stopFile = process.env["KAMRA_PLAYWRIGHT_WEB_SERVER_STOP_FILE"];

if (pidFile && angularServer.pid !== undefined) {
  writeFileSync(pidFile, `${angularServer.pid}\n`, "utf8");
}

let stopping = false;

const stopAngularServer = () => {
  if (stopping || angularServer.pid === undefined) {
    return;
  }

  stopping = true;

  if (process.platform === "win32") {
    angularServer.kill();
    spawnSync("taskkill", ["/pid", String(angularServer.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true
    });
    return;
  }

  angularServer.kill("SIGTERM");
};

const clearPidFile = () => {
  if (!pidFile) {
    return;
  }

  rmSync(pidFile, { force: true });
  if (stopFile) {
    rmSync(stopFile, { force: true });
  }
};

if (stopFile) {
  const stopWatcher = setInterval(() => {
    if (existsSync(stopFile)) {
      stopAngularServer();
      clearInterval(stopWatcher);
    }
  }, 100);
  stopWatcher.unref();
}

process.once("SIGINT", stopAngularServer);
process.once("SIGTERM", stopAngularServer);

angularServer.once("error", () => {
  stopAngularServer();
  process.exit(1);
});

angularServer.once("exit", (code, signal) => {
  clearPidFile();
  process.exit(code ?? (signal === null ? 1 : 0));
});
