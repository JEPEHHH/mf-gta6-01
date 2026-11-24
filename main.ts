// Entrypoint for Solara Bay (gta6-01), an original sun-soaked coastal open-world crime game.
// Runs on Node 22 with standard library only and zero network access.
// Copies static game/ and screenshots/ assets to MAKEFUN_OUTPUT_DIR (or /output)
// and generates a deterministic /output/dossier.json via vendor/makefun-game.ts.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function syncDirectory(src: string, dest: string): void {
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(dest, { recursive: true });
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
  }
}

export function packageSolaraBay(repoRoot: string, outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });
  syncDirectory(join(repoRoot, 'game'), join(outputDir, 'game'));
  syncDirectory(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

  const dossierBytes = buildDossier(outputDir, GATE_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
}

packageSolaraBay(REPO_ROOT, OUTPUT_DIR);
