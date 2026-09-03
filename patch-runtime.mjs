import { readFileSync, writeFileSync, existsSync } from "fs";

const file = ".vercel/output/functions/__server.func/.vc-config.json";

if (existsSync(file)) {
  let content = readFileSync(file, "utf8");
  content = content.replace(/nodejs24\.x/g, "nodejs20.x");
  writeFileSync(file, content);
  console.log("Patched runtime to nodejs20.x");
} else {
  console.log("No .vc-config.json found, skipping patch");
}
