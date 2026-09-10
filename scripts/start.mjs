#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = new URL(".", import.meta.url).pathname;
const root = resolve(__dirname, "..");

const mode = process.argv[2];
if (mode !== "dev" && mode !== "prod") {
  console.error("Usage: node scripts/start.mjs [dev|prod]");
  process.exit(1);
}

const composeFile = resolve(root, "docker", `docker-compose.${mode}.yml`);
const apiHealthUrl = `http://localhost:3001/api/health`;

function run(command, args) {
  console.log(`> ${command} ${args.join(" ")}`);
  execFileSync(command, args, { stdio: "inherit", cwd: root });
}

async function waitForHealth(url, attempts = 60, delayMs = 2000) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const body = await response.json();
        if (body.status === "ok") return;
      }
    } catch {
      // not ready yet
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`API did not become healthy at ${url}`);
}

function ensureEnv() {
  const envPath = resolve(root, ".env");
  const examplePath = resolve(root, ".env.example");
  if (existsSync(envPath)) return;
  if (!existsSync(examplePath)) {
    console.error(
      "Missing .env.example. Create a .env file with the required variables.",
    );
    process.exit(1);
  }
  console.log("Creating .env from .env.example");
  copyFileSync(examplePath, envPath);
}

(async () => {
  try {
    console.log(`\nStarting ${mode} environment...\n`);

    try {
      run("corepack", ["enable"]);
    } catch {
      console.log("corepack enable failed or already enabled, continuing");
    }

    ensureEnv();

    console.log("Installing dependencies...");
    run("corepack", ["pnpm", "install"]);

    console.log(`Building and starting the ${mode} Docker stack...`);
    run("docker", [
      "compose",
      "-f",
      composeFile,
      "--env-file",
      ".env",
      "up",
      "--build",
      "-d",
    ]);

    console.log("\nWaiting for the API to be healthy...");
    await waitForHealth(apiHealthUrl);
    console.log(" API is healthy\n");

    console.log("Running database migrations...");
    run("docker", [
      "compose",
      "-f",
      composeFile,
      "--env-file",
      ".env",
      "exec",
      "-T",
      "api",
      "pnpm",
      "--filter",
      "@product-reviews/api",
      "exec",
      "prisma",
      "migrate",
      "deploy",
    ]);

    console.log("Seeding data (skipped if data already exists)...");
    run("docker", [
      "compose",
      "-f",
      composeFile,
      "--env-file",
      ".env",
      "exec",
      "-T",
      "api",
      "pnpm",
      "--filter",
      "@product-reviews/api",
      "exec",
      "tsx",
      "prisma/seed.ts",
    ]);

    if (mode === "dev") {
      console.log("\nDev stack is ready. Streaming logs...");
      run("docker", [
        "compose",
        "-f",
        composeFile,
        "--env-file",
        ".env",
        "logs",
        "-f",
      ]);
    } else {
      console.log("\nProd stack is ready.");
      console.log(`  Web:        http://localhost:3000`);
      console.log(`  API:        http://localhost:3001`);
      console.log(`  Swagger UI: http://localhost:3001/api/docs`);
      console.log("\nUse 'corepack pnpm docker:down' to stop all services.");
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
