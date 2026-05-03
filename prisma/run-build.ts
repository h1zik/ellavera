/**
 * Single process: normalize DATABASE_URL / DIRECT_URL, then generate, db push, next build.
 * (Separate `prebuild-env` scripts cannot export env into the next shell command on Netlify.)
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { ensurePrismaDatabaseEnv } from "../src/lib/database-url";

ensurePrismaDatabaseEnv();

function run(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "db", "push", "--skip-generate"]);
run("npx", ["next", "build"]);
