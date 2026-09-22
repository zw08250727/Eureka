import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve("src/prototype");
let scripts = 0;
let links = 0;
async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) { await walk(file); continue; }
    if (!/\.(html|js|css)$/.test(item.name)) continue;
    const text = await readFile(file, "utf8");
    if (file.endsWith(".js")) { new vm.Script(text, { filename: file }); scripts++; }
    if (file.endsWith(".html")) {
      for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (/\bsrc\s*=|application\/ld\+json/.test(match[1])) continue;
        new vm.Script(match[2], { filename: file }); scripts++;
      }
    }
    // Includes assets referenced by dynamically generated markup and CSS.
    const refs = new Set([...text.matchAll(/(?:\.\.\/)?assets\/[\w/.-]+/g)].map(m => m[0]));
    if (file.endsWith(".html")) {
      for (const m of text.matchAll(/(?:src|href)=["']([^"']+\.html)(?:[?#][^"']*)?["']/g)) refs.add(m[1]);
    }
    for (const ref of refs) {
      const base = file.endsWith(".html") ? path.dirname(file) : file.includes("one-to-one-reference") ? path.join(root, "one-to-one-reference") : root;
      await access(path.resolve(base, ref)); links++;
    }
  }
}
await walk(root);
const appHtml = await readFile(path.join(root, "one-to-one-reference", "team-only-app.html"), "utf8");
const requiredMarkers = ["张伟‘s Space", "settings-popover", "AI 摘要语言", "转写时长", "data-settings-action=\"toggle-summary\""];
for (const marker of requiredMarkers) {
  if (!appHtml.includes(marker)) throw new Error(`Missing Eureka interaction marker: ${marker}`);
}
if (appHtml.includes('aria-label=\"邀请团队成员加入\"') && !appHtml.includes('document.querySelector(\"#enterprise-invite-card\")?.remove()')) {
  throw new Error("The invitation card must be removed from the team-only shell");
}
console.log(`Prototype check passed: ${scripts} scripts, ${links} local references`);
