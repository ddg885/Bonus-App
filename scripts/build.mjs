import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const dir of ['index.html', 'src', 'sample-data']) {
  await cp(join(process.cwd(), dir), join(dist, dir), { recursive: true });
}

console.log('Build complete: dist/');
