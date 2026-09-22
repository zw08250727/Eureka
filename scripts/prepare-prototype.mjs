import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const source = path.resolve("src/prototype");
const target = path.resolve("public/prototype");
async function copyDirectory(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    if (entry.name === "tests") continue;
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDirectory(path.join(from, entry.name), dest);
    else await cp(path.join(from, entry.name), dest);
  }
}
await copyDirectory(source, target);
console.log("Prepared prototype assets in public/prototype");
