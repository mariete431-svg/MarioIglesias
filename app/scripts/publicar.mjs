// Copia la web construida (dist/) a la raíz del repositorio, que es lo que publica GitHub Pages.
// Cada página tiene su carpeta con una copia de index.html para que su dirección funcione directamente.
import { cpSync, copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(app, "dist");
const root = join(app, "..");
const BASE = "/MarioIglesias/";

const routes = ["cv", "tareas", "panel", "crear-cv", "admin"];
for (const route of routes) {
  mkdirSync(join(dist, route), { recursive: true });
  copyFileSync(join(dist, "index.html"), join(dist, route, "index.html"));
}
copyFileSync(join(dist, "index.html"), join(dist, "404.html"));

// Direcciones antiguas (.html) → páginas nuevas. admin.html conserva el enlace de recuperación de contraseña.
const redirects = { "cv.html": "cv/", "tareas.html": "tareas/", "dashboard.html": "panel/", "crear-cv.html": "crear-cv/", "admin.html": "admin/" };
for (const [file, target] of Object.entries(redirects)) {
  writeFileSync(join(dist, file), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Mario Iglesias</title>
<script>location.replace("${BASE}${target}" + location.search + location.hash);</script>
<meta http-equiv="refresh" content="0; url=${BASE}${target}"></head><body><a href="${BASE}${target}">Continuar</a></body></html>\n`);
}

rmSync(join(root, "assets"), { recursive: true, force: true });
cpSync(dist, root, { recursive: true });
console.log("Web copiada a la raíz del repositorio.");
