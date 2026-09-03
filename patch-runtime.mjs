import { readFileSync, writeFileSync, existsSync } from "fs";

// 1. Patch .vc-config.json runtime from nodejs24 to nodejs20
const configFile = ".vercel/output/functions/__server.func/.vc-config.json";

if (existsSync(configFile)) {
  let content = readFileSync(configFile, "utf8");
  content = content.replace(/nodejs24\.x/g, "nodejs20.x");
  writeFileSync(configFile, content);
  console.log("Patched .vc-config.json runtime to nodejs20.x");
} else {
  console.log("No .vc-config.json found, skipping patch");
}

// 2. Patch nitro.json runtime from nodejs24 to nodejs20
const nitroFile = ".vercel/output/nitro.json";

if (existsSync(nitroFile)) {
  let content = readFileSync(nitroFile, "utf8");
  content = content.replace(/nodejs24\.x/g, "nodejs20.x");
  writeFileSync(nitroFile, content);
  console.log("Patched nitro.json runtime to nodejs20.x");
} else {
  console.log("No nitro.json found, skipping patch");
}
