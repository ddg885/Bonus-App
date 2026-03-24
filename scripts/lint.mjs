import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(process.cwd(), 'src');
const issues = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full);
    if (e.isFile() && e.name.endsWith('.js')) {
      const t = await readFile(full, 'utf8');
      if (t.includes('TODO build later')) issues.push(full);
    }
  }
}

await walk(root);
if (issues.length) {
  console.error('Lint failed:', issues);
  process.exit(1);
}
console.log('Lint passed');
