import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default async function teardown() {
  const pidFile = join(tmpdir(), `kamra-playwright-web-server-${process.pid}.pid`);
  const stopFile = `${pidFile}.stop`;
  let pid;

  try {
    pid = Number.parseInt(readFileSync(pidFile, "utf8").trim(), 10);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  if (!Number.isInteger(pid) || pid <= 0) {
    rmSync(stopFile, { force: true });
    return;
  }

  writeFileSync(stopFile, "stop\n", "utf8");

  const deadline = Date.now() + 5_000;
  while (existsSync(pidFile) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (existsSync(pidFile) && process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true
    });
  } else if (existsSync(pidFile)) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (error) {
      if (error?.code !== "ESRCH") {
        throw error;
      }
    }
  }

  rmSync(pidFile, { force: true });
  rmSync(stopFile, { force: true });
}
