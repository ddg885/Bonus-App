import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const port = 4173;
const basePath = '/Bonus-App';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.csv': 'text/csv'
};

createServer(async (req, res) => {
  try {
    const incomingPath = req.url?.split('?')[0] || '/';
    const trimmedPath = incomingPath.startsWith(basePath)
      ? incomingPath.slice(basePath.length) || '/'
      : incomingPath;
    const rawPath = trimmedPath === '/' ? '/index.html' : trimmedPath;
    const filePath = join(process.cwd(), rawPath);
    const data = await readFile(filePath);
    res.setHeader('Content-Type', mime[extname(filePath)] || 'text/plain');
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}).listen(port, () => {
  console.log(`Dev server: http://localhost:${port}${basePath}/`);
});
