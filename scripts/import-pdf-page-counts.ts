import { PrismaClient } from '@prisma/client';
import { PDFDocument } from 'pdf-lib';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const prisma = new PrismaClient();
async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) throw new Error('Supply the private Drive download manifest path');
  const sources = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const results: { sourceId: string; error?: string; [key: string]: unknown }[] = existsSync('prisma/backups/pdf-page-counts.json') ? JSON.parse(readFileSync('prisma/backups/pdf-page-counts.json', 'utf8')).filter((r: { error?: string }) => !r.error) : [];
  for (const source of sources) {
    if (results.some(r => r.sourceId === source.id)) continue;
    try {
      if (!source.downloadUrl) throw new Error('No download available');
      const response = await fetch(source.downloadUrl, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error('Download failed');
      const bytes = new Uint8Array(await response.arrayBuffer());
      const document = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
      const pageCount = document.getPageCount();
      if (!pageCount) throw new Error('Empty PDF');
      const result = await prisma.content.updateMany({ where: { type: 'BOOK', mediaUrl: source.mediaUrl }, data: { pageCount } });
      if (result.count !== 1) throw new Error('Content mapping mismatch');
      results.push({ sourceId: source.id, title: source.title, mediaUrl: source.mediaUrl, pageCount, bytes: bytes.length });
      console.log('OK', source.title, pageCount);
    } catch (error) { results.push({ sourceId: source.id, title: source.title, error: error instanceof Error ? error.message : 'Failed' }); console.log('FAILED', source.title); }
    writeFileSync('prisma/backups/pdf-page-counts.json', JSON.stringify(results, null, 2));
  }
  console.log('Processed', results.length, 'Failed', results.filter(r => 'error' in r).length);
}
main().catch(() => { console.error('Import failed'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
