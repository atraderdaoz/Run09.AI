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

const html = fs.readFileSync("index.html", "utf8").replace('/src/main.js', '/Run09.AI/src/main.js');
fs.writeFileSync(path.join(dist, "index.html"), html);

for (const f of ["main.js", "platform.js", "irys.js", "metadata.js", "style.css"]) {
  fs.copyFileSync(path.join("src", f), path.join(dist, "src", f));
}

console.log("Fallback static build completed (vite not installed in current environment).");
