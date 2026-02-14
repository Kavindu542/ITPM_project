const { execSync } = require("child_process");
const path = require("path");

const portArg = Number(process.argv[2]);
const envPort = Number(process.env.PORT);
const port =
  Number.isFinite(portArg) && portArg > 0
    ? portArg
    : Number.isFinite(envPort) && envPort > 0
      ? envPort
      : 5000;

const run = (command) => {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "pipe"] }).toString();
  } catch {
    return "";
  }
};

const findStaleNodemonPidsWindows = () => {
  const serverRoot = path.resolve(__dirname, "..").replace(/\\/g, "\\\\");
  const output = run(
    `wmic process where "name='node.exe' and commandline like '%nodemon%' and commandline like '%server.js%' and commandline like '%${serverRoot}%'" get ProcessId /value`,
  ).trim();

  if (!output) return [];

  const matches = output.match(/ProcessId=(\d+)/g) || [];
  return matches.map((line) => line.split("=")[1]).filter(Boolean);
};

const killPid = (pid) => {
  if (!pid) return false;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
};

const findPidsOnWindows = (targetPort) => {
  const output = run("netstat -ano -p tcp");
  if (!output) return [];

  const lines = output.split(/\r?\n/);
  const pids = new Set();

  for (const line of lines) {
    if (!line.includes("LISTENING")) continue;
    if (!line.includes(`:${targetPort}`)) continue;

    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid)) pids.add(pid);
  }

  return [...pids];
};

const findPidsOnUnix = (targetPort) => {
  const output = run(`lsof -ti tcp:${targetPort}`);
  if (!output) return [];

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+$/.test(line));
};

const portPids =
  process.platform === "win32" ? findPidsOnWindows(port) : findPidsOnUnix(port);

const staleNodemonPids =
  process.platform === "win32" ? findStaleNodemonPidsWindows() : [];

const pids = [...new Set([...portPids, ...staleNodemonPids])];

if (!pids.length) {
  process.exit(0);
}

let killed = 0;

for (const pid of pids) {
  if (killPid(pid)) killed += 1;
}

if (killed > 0) {
  // eslint-disable-next-line no-console
  console.log(`Freed port ${port} by stopping ${killed} process(es)`);
}
