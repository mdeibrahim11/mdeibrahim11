if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { profile } from './data.ts';

const OUT = 'dist';
mkdirSync(OUT, { recursive: true });

if (!process.env.GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN not found in .env or environment.');
  process.exit(1);
}

console.log(`Generating snake animation for @${profile.handle}...`);
execSync(
  `npx -y generate-snake-animation@3 --github_user ${profile.handle} --output "${OUT}/snake.svg?color_snake=#F5F5F5&color_dots=#161616,#3d1002,#6e1c03,#ac2c04,#F53F06"`,
  { stdio: 'inherit', env: process.env }
);
console.log('Successfully generated dist/snake.svg!');
