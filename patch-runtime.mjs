import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

// 1. Patch .vc-config.json runtime from nodejs24 to nodejs20
const configFile = ".vercel/output/functions/__server.func/.vc-config.json";

if (existsSync(configFile)) {
  let content = readFileSync(configFile, "utf8");
  content = content.replace(/nodejs24\.x/g, "nodejs20.x");
  writeFileSync(configFile, content);
  console.log("Patched runtime to nodejs20.x");
} else {
  console.log("No .vc-config.json found, skipping patch");
}

// 2. Fix __exportAll circular dependency issue in SSR chunks
// If a file uses __exportAll but doesn't define it, inject the polyfill
const EXPORT_ALL_POLYFILL = `var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) Object.defineProperty(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) Object.defineProperty(target, Symbol.toStringTag, { value: "Module" });
	return target;
};\n`;

function patchSSRChunks(dir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      patchSSRChunks(full);
    } else if (full.endsWith(".mjs")) {
      try {
        let content = readFileSync(full, "utf8");
        const usesExportAll = content.includes("__exportAll(") && !content.includes("var __exportAll");
        if (usesExportAll) {
          content = EXPORT_ALL_POLYFILL + content;
          writeFileSync(full, content);
          console.log(`Patched __exportAll in: ${full}`);
        }
      } catch {
        // skip binary or unreadable files
      }
    }
  }
}

const ssrDir = ".vercel/output/functions/__server.func/_ssr";
const libsDir = ".vercel/output/functions/__server.func/_libs";
patchSSRChunks(ssrDir);
patchSSRChunks(libsDir);
