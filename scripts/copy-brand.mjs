// Copies the official logos from assets/logos into public/brand at build time.
// The files are copied byte-for-byte: never redrawn, recoloured or resized.
import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "assets", "logos");
const dest = join(process.cwd(), "public", "brand");
mkdirSync(dest, { recursive: true });
for (const file of readdirSync(src)) cpSync(join(src, file), join(dest, file));
console.log(`brand: copied ${readdirSync(src).length} logos to public/brand`);
