// Quick ASCII sanity check for fish shapes. Run from repo root:
// npx -y esbuild scripts/fish-ascii.mts --bundle --format=esm --outfile=scripts/.fish-ascii.mjs && node scripts/.fish-ascii.mjs
import {
  GRID_H,
  GRID_W,
  generateFish,
} from "../src/games/pond/sprite/generator";

const CHARS = [" ", "#", "o", "x", ".", "~", "W", "@", "*"];
for (let i = 0; i < 6; i++) {
  const seed = `ascii:${i}`;
  const { grid, dna } = generateFish(seed);
  console.log(
    `\n${seed} — ${dna.body}/${dna.tail}/${dna.dorsal}/${dna.pattern}`,
  );
  for (let y = 0; y < GRID_H; y++) {
    let row = "";
    for (let x = 0; x < GRID_W; x++) row += CHARS[grid[y * GRID_W + x]];
    console.log(row);
  }
}
