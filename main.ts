// main.ts — entry program for the news-image-20261121 bounty.
//
// Copies the pre-rendered front page (entry.png, shipped in this repo) to
// /output/entry.png. The image itself is a static 1024x1024 PNG rendered
// from the page layout in render/page.html; this program does no drawing,
// no network and no randomness, so two runs write identical bytes.
//
// Run: node main.ts  (Node >= 22, standard library only)
import { copyFileSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1_048_576; // competition cap: entry.png must be at most 1 MiB

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'entry.png');
const outDir = '/output';
const dst = join(outDir, 'entry.png');
const tmp = join(outDir, '.entry.png.tmp');

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

const original = readFileSync(src);
if (original.length > MAX_BYTES) {
  throw new Error(`entry.png is ${original.length} bytes, over the ${MAX_BYTES} byte cap`);
}

mkdirSync(outDir, { recursive: true });
// Write to a temp file first, then rename, so a failed run never leaves a
// partial entry.png behind.
copyFileSync(src, tmp);
renameSync(tmp, dst);

const written = readFileSync(dst);
if (original.length !== written.length || sha256(original) !== sha256(written)) {
  try { unlinkSync(dst); } catch { /* already gone */ }
  throw new Error('entry.png copy mismatch: output is not byte-identical to the source');
}

console.log(`wrote ${dst} (${statSync(dst).size} bytes, sha256 ${sha256(written).slice(0, 16)}...)`);
