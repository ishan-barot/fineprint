import { writeFileSync } from "node:fs";
import { tokens } from "../src/tokens";

// turns the shared tokens into tailwind theme variables for the web app
const vars = Object.entries(tokens.color).map(([name, hex]) => `  --color-fp-${name}: ${hex};`).join("\n");
const css = `/* generated from packages/core/src/tokens.ts, edit that file instead */\n@theme {\n${vars}\n}\n`;
writeFileSync(new URL("../../../apps/web/app/tokens.css", import.meta.url), css);
console.log("wrote apps/web/app/tokens.css");