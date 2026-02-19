import fs from "fs";
import path from "path";

if (fs.existsSync("node_modules/vite")) {
  const { build } = await import("vite");
  await build();
  console.log("Vite build completed.");
  process.exit(0);
}

const dist = "dist";
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.mkdirSync(path.join(dist, "src"), { recursive: true });

const html = fs.readFileSync("index.html", "utf8").replace('/src/main.js', './src/main.js');
const envAddress = process.env.VITE_PLATFORM_ADDRESS || "";
const html = fs
  .readFileSync("index.html", "utf8")
  .replace("__VITE_PLATFORM_ADDRESS__", envAddress);
fs.writeFileSync(path.join(dist, "index.html"), html);

for (const f of ["main.js", "platform.js", "irys.js", "metadata.js", "style.css"]) {
  fs.copyFileSync(path.join("src", f), path.join(dist, "src", f));
}

console.log("Fallback static build completed (vite not installed in current environment).");
