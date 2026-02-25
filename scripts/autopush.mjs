import chokidar from "chokidar";
import { spawnSync } from "node:child_process";

const WATCH_PATHS = ["."];
const IGNORE_PATTERNS = [
  "**/.git/**",
  "**/node_modules/**",
  "**/.next/**",
  "**/.vercel/**",
  ".env",
  ".env.*",
];

const DEBOUNCE_MS = 1800;
let timer = null;
let pushing = false;

function run(command, args) {
  return spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    shell: false,
  });
}

function runOrThrow(command, args) {
  const result = run(command, args);
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || `${command} failed`);
  }
  return result.stdout?.trim() ?? "";
}

function hasTrackedChanges() {
  const result = run("git", ["status", "--porcelain"]);
  if (result.status !== 0) return false;
  return Boolean(result.stdout?.trim());
}

function isInternalGitPath(path) {
  const normalized = path.replace(/\\/g, "/");
  return normalized.includes("/.git/") || normalized.endsWith("/.git");
}

function isIgnoredByGit(path) {
  const result = run("git", ["check-ignore", "-q", path]);
  return result.status === 0;
}

function stageAll() {
  runOrThrow("git", ["add", "-A"]);
}

function hasStagedChanges() {
  const result = run("git", ["diff", "--cached", "--quiet"]);
  // `git diff --quiet` exits with 1 when there are differences.
  return result.status === 1;
}

function commitAndPush() {
  if (pushing) return;
  if (!hasTrackedChanges()) return;

  pushing = true;

  try {
    stageAll();
    if (!hasStagedChanges()) return;

    const timestamp = new Date().toISOString().replace("T", " ").replace("Z", " UTC");
    const message = `chore(autopush): sync updates ${timestamp}`;

    runOrThrow("git", ["commit", "-m", message]);
    runOrThrow("git", ["push", "origin", "main"]);
    console.log(`[autopush] pushed: ${message}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[autopush] failed: ${msg}`);
  } finally {
    pushing = false;
  }
}

function queuePush() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(commitAndPush, DEBOUNCE_MS);
}

console.log("[autopush] watching: entire repo (respects .gitignore)");
console.log("[autopush] target branch: main");

const watcher = chokidar.watch(WATCH_PATHS, {
  ignored: IGNORE_PATTERNS,
  ignoreInitial: true,
});

watcher.on("all", (_event, path) => {
  if (isInternalGitPath(path)) return;
  if (isIgnoredByGit(path)) return;
  console.log(`[autopush] change detected: ${path}`);
  queuePush();
});

process.on("SIGINT", async () => {
  console.log("\n[autopush] stopping...");
  await watcher.close();
  process.exit(0);
});
