import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const output = path.join(root, "docs", "CODEMAP.md");

const ignore = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".husky",
  "pnpm-lock.yaml",
]);

const hidden = (name: string) => name.startsWith(".");

const shouldSkip = (name: string) => ignore.has(name) || hidden(name);

interface Entry {
  name: string;
  path: string;
  isDirectory: boolean;
  children: Entry[];
}

async function scan(dir: string): Promise<Entry[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result: Entry[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (shouldSkip(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(root, fullPath).replace(/\\/g, "/");

    const children: Entry[] = entry.isDirectory() ? await scan(fullPath) : [];

    result.push({
      name: entry.name,
      path: relative,
      isDirectory: entry.isDirectory(),
      children,
    });
  }

  return result;
}

function render(entries: Entry[], depth = 0): string[] {
  const lines: string[] = [];
  const indent = "  ".repeat(depth);

  for (const entry of entries) {
    if (entry.isDirectory) {
      lines.push(`${indent}- **\`${entry.path}/\`**`);
      if (entry.children.length) {
        lines.push(...render(entry.children, depth + 1));
      }
    } else {
      lines.push(`${indent}- \`${entry.name}\``);
    }
  }

  return lines;
}

async function main() {
  const tree = await scan(root);
  const rendered = render(tree);
  const now = new Date().toISOString();

  const content = `# CODEMAP

This file is a semantic mirror of the source tree. Each entry describes what a file or directory is responsible for. Run \`pnpm codemap\` to regenerate the skeleton after structural changes.

> Last updated: ${now}

${rendered.join("\n")}
`;

  await fs.writeFile(output, content, "utf-8");
  console.log(`CODEMAP written to ${output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
